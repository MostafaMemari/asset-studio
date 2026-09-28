import { MAX_COLUMNS } from '@/core/constants'
import { clamp, round } from '@/core/utils'
import type { LayoutFit, LayoutMode, TileSizing } from '@/types/settings'

export type Rect = { x: number; y: number; width: number; height: number }

export type LayoutItem = {
  index: number
  column: number
  row: number
  /** Full cell, label band included. */
  rect: Rect
  imageRect: Rect
  labelRect: Rect | null
}

export type CompositionLayout = {
  mode: LayoutMode
  columns: number
  rows: number
  /** Uniform multiplier applied to every laid-out dimension. */
  scale: number
  offset: { x: number; y: number }
  contentBox: Rect
  blockBox: Rect
  labelHeight: number
  items: LayoutItem[]
}

export type LayoutParams = {
  width: number
  height: number
  padding: number
  gapX: number
  gapY: number
  columns: number
  mode: LayoutMode
  fit: LayoutFit
  tileAspect: number
  tileSizing: TileSizing
  tileSize: number
  labelHeight: number
  /** Natural width / height per item, in list order. */
  aspects: number[]
}

const MIN_CELL = 8

/**
 * Pure geometry: turns the document settings plus the natural image shapes
 * into absolute rectangles in output space. No canvas access, no React, so the
 * layout is trivially testable and identical for preview and export.
 */
export function computeLayout(params: LayoutParams): CompositionLayout {
  const width = Math.max(1, params.width)
  const height = Math.max(1, params.height)
  const padding = clamp(Math.round(params.padding), 0, Math.floor(Math.min(width, height) * 0.45))
  const contentBox: Rect = {
    x: padding,
    y: padding,
    width: Math.max(1, width - padding * 2),
    height: Math.max(1, height - padding * 2),
  }

  const count = params.aspects.length
  const columns = clamp(
    Math.round(params.columns) || 1,
    1,
    Math.min(MAX_COLUMNS, Math.max(1, count || 1))
  )
  const gapX = Math.max(0, Math.round(params.gapX))
  const gapY = Math.max(0, Math.round(params.gapY))
  const labelHeight = Math.max(0, Math.round(params.labelHeight))

  const cellWidth = resolveCellWidth(params, contentBox.width, columns, gapX)
  const placement =
    params.mode === 'masonry'
      ? placeMasonry({ count, columns, cellWidth, gapY, labelHeight, aspects: params.aspects })
      : placeGrid({
          count,
          columns,
          cellWidth,
          gapX,
          gapY,
          labelHeight,
          tileAspect: params.tileAspect,
        })

  const blockBox: Rect = {
    x: 0,
    y: 0,
    width: Math.max(1, placement.blockWidth),
    height: Math.max(1, placement.blockHeight),
  }

  const scale = resolveFitScale(params.fit, contentBox, blockBox)
  const offset = {
    x: contentBox.x + (contentBox.width - blockBox.width * scale) / 2,
    y: contentBox.y + (contentBox.height - blockBox.height * scale) / 2,
  }

  const items = placement.cells.map((cell) => {
    const rect = scaleRect(cell.rect, scale, offset)
    const imageRect = scaleRect(cell.imageRect, scale, offset)
    const labelRect = cell.labelRect ? scaleRect(cell.labelRect, scale, offset) : null
    return { ...cell, rect, imageRect, labelRect }
  })

  return {
    mode: params.mode,
    columns,
    rows: placement.rows,
    scale,
    offset,
    contentBox,
    blockBox,
    labelHeight: labelHeight * scale,
    items,
  }
}

function resolveCellWidth(
  params: LayoutParams,
  contentWidth: number,
  columns: number,
  gapX: number
): number {
  if (params.tileSizing === 'fixed') {
    return Math.max(MIN_CELL, Math.round(params.tileSize))
  }
  return Math.max(MIN_CELL, (contentWidth - gapX * (columns - 1)) / columns)
}

type Placement = { cells: LayoutItem[]; rows: number; blockWidth: number; blockHeight: number }

function placeGrid(input: {
  count: number
  columns: number
  cellWidth: number
  gapX: number
  gapY: number
  labelHeight: number
  tileAspect: number
}): Placement {
  const { count, columns, cellWidth, gapX, gapY, labelHeight } = input
  const rows = count === 0 ? 0 : Math.max(1, Math.ceil(count / columns))
  const imageHeight = Math.max(
    MIN_CELL,
    cellWidth / Math.max(0.05, input.tileAspect)
  )
  const cellHeight = imageHeight + labelHeight

  const cells: LayoutItem[] = []
  for (let index = 0; index < count; index += 1) {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = column * (cellWidth + gapX)
    const y = row * (cellHeight + gapY)

    cells.push({
      index,
      column,
      row,
      rect: { x, y, width: cellWidth, height: cellHeight },
      imageRect: { x, y, width: cellWidth, height: imageHeight },
      labelRect:
        labelHeight > 0
          ? { x, y: y + imageHeight, width: cellWidth, height: labelHeight }
          : null,
    })
  }

  return {
    cells,
    rows,
    blockWidth: columns * cellWidth + gapX * Math.max(0, columns - 1),
    blockHeight: rows === 0 ? 0 : rows * cellHeight + gapY * Math.max(0, rows - 1),
  }
}

function placeMasonry(input: {
  count: number
  columns: number
  cellWidth: number
  gapY: number
  labelHeight: number
  aspects: number[]
}): Placement {
  const { count, columns, cellWidth, gapY, labelHeight, aspects } = input
  const columnHeights = new Array<number>(columns).fill(0)
  const cells: LayoutItem[] = []

  // Greedy shortest-column packing keeps the column bottoms nearly level.
  for (let index = 0; index < count; index += 1) {
    let column = 0
    for (let candidate = 1; candidate < columns; candidate += 1) {
      if (columnHeights[candidate]! < columnHeights[column]! - 0.5) column = candidate
    }

    const aspect = Math.max(0.05, aspects[index] ?? 1)
    const imageHeight = Math.max(MIN_CELL, cellWidth / aspect)
    const height = imageHeight + labelHeight
    const y = columnHeights[column]!

    cells.push({
      index,
      column,
      row: 0,
      rect: { x: column * cellWidth, y, width: cellWidth, height },
      imageRect: { x: column * cellWidth, y, width: cellWidth, height: imageHeight },
      labelRect:
        labelHeight > 0
          ? {
              x: column * cellWidth,
              y: y + imageHeight,
              width: cellWidth,
              height: labelHeight,
            }
          : null,
    })

    columnHeights[column] = y + height + gapY
  }

  const tallest = columnHeights.length > 0 ? Math.max(...columnHeights) : 0
  const rows = Math.max(1, Math.ceil(count / columns))

  return {
    cells,
    rows,
    blockWidth: columns * cellWidth,
    blockHeight: count === 0 ? 0 : Math.max(0, tallest - gapY),
  }
}

/**
 * `fit` never enlarges, `fill` grows the block until it spans the canvas on one
 * axis, `crop` grows it until it spans both and lets the rest be clipped.
 */
function resolveFitScale(fit: LayoutFit, contentBox: Rect, blockBox: Rect): number {
  const scaleX = contentBox.width / blockBox.width
  const scaleY = contentBox.height / blockBox.height
  const min = Math.min(scaleX, scaleY)
  const max = Math.max(scaleX, scaleY)

  if (fit === 'crop') return round(max > 0 ? max : 1, 5)
  if (fit === 'fit') return round(min > 0 ? Math.min(min, 1) : 1, 5)
  return round(min > 0 ? min : 1, 5)
}

function scaleRect(rect: Rect, scale: number, offset: { x: number; y: number }): Rect {
  return {
    x: round(rect.x * scale + offset.x, 2),
    y: round(rect.y * scale + offset.y, 2),
    width: round(rect.width * scale, 2),
    height: round(rect.height * scale, 2),
  }
}
