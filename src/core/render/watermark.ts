import { clamp } from '@/core/utils'
import { drawTrackedText, fontString } from '@/core/text'
import { degreesToRadians, rotatePoint } from '@/core/render/shapes'
import type { WatermarkMark } from '@/core/model'
import type { WatermarkAnchor } from '@/types/watermark'

/** Hard ceiling on drawn marks so a tiny spacing can never hang the tab. */
const MAX_TILED_MARKS = 8000

export type WatermarkSurface = {
  width: number
  height: number
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  mark: WatermarkMark,
  bitmap: CanvasImageSource | null,
  surface: WatermarkSurface
): void {
  const { layer } = mark
  const scale = Math.max(0.01, layer.scale)
  const width = mark.markWidth * scale
  const height = mark.markHeight * scale
  if (width <= 0 || height <= 0) return

  ctx.save()
  ctx.globalAlpha = clamp(layer.opacity, 0, 1)
  ctx.globalCompositeOperation = layer.blendMode

  if (layer.mode === 'tiled') {
    drawTiled(ctx, mark, bitmap, surface, width, height, scale)
  } else {
    drawSingle(ctx, mark, bitmap, surface, width, height, scale)
  }

  ctx.restore()
}

function drawSingle(
  ctx: CanvasRenderingContext2D,
  mark: WatermarkMark,
  bitmap: CanvasImageSource | null,
  surface: WatermarkSurface,
  width: number,
  height: number,
  scale: number
): void {
  const { layer } = mark
  const margin = Math.max(0, layer.margin)
  const x = clampAxis(anchorX(layer.anchor, surface.width, width, margin), surface.width - width)
  const y = clampAxis(anchorY(layer.anchor, surface.height, height, margin), surface.height - height)

  ctx.save()
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate(degreesToRadians(layer.rotation))
  ctx.translate(-width / 2, -height / 2)
  drawMark(ctx, mark, bitmap, scale, 0, 0)
  ctx.restore()
}

/**
 * Tiled marks are laid out in the mark's own rotated frame: the canvas is
 * rotated back, covered by a lattice that spans its full bounding box, then the
 * frame is restored. Because the lattice always spans the whole bounding box of
 * the canvas, the pattern can never leave an uncovered strip.
 */
function drawTiled(
  ctx: CanvasRenderingContext2D,
  mark: WatermarkMark,
  bitmap: CanvasImageSource | null,
  surface: WatermarkSurface,
  width: number,
  height: number,
  scale: number
): void {
  const { layer } = mark
  const radians = degreesToRadians(layer.rotation)
  const center = { x: surface.width / 2, y: surface.height / 2 }

  const corners = [
    { x: 0, y: 0 },
    { x: surface.width, y: 0 },
    { x: surface.width, y: surface.height },
    { x: 0, y: surface.height },
  ].map((point) => rotatePoint(point, center, -radians))

  const spanX = Math.max(...corners.map((point) => point.x)) - Math.min(...corners.map((point) => point.x))
  const spanY = Math.max(...corners.map((point) => point.y)) - Math.min(...corners.map((point) => point.y))

  let stepX = Math.max(1, width + Math.max(0, layer.spacingX))
  let stepY = Math.max(1, height + Math.max(0, layer.spacingY))

  const countFor = () =>
    Math.max(1, Math.ceil(spanX / stepX) + 3) * Math.max(1, Math.ceil(spanY / stepY) + 3)

  const overflow = countFor() / MAX_TILED_MARKS
  if (overflow > 1) {
    const bump = Math.sqrt(overflow)
    stepX *= bump
    stepY *= bump
  }

  const offsetX = positiveModulo(layer.offsetX, stepX)
  const offsetY = positiveModulo(layer.offsetY, stepY)

  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.rotate(radians)
  ctx.translate(-center.x, -center.y)

  const startX = center.x - spanX / 2 - width / 2 - stepX + offsetX
  const startY = center.y - spanY / 2 - height / 2 - stepY + offsetY
  const endX = center.x + spanX / 2 + width / 2 + stepX + offsetX
  const endY = center.y + spanY / 2 + height / 2 + stepY + offsetY

  for (let y = startY; y <= endY; y += stepY) {
    for (let x = startX; x <= endX; x += stepX) {
      drawMark(ctx, mark, bitmap, scale, x, y)
    }
  }

  ctx.restore()
}

/** Paints the mark with its top-left corner at (x, y). */
function drawMark(
  ctx: CanvasRenderingContext2D,
  mark: WatermarkMark,
  bitmap: CanvasImageSource | null,
  scale: number,
  x: number,
  y: number
): void {
  const { layer } = mark
  const imageWidth = mark.imageWidth * scale
  const imageHeight = mark.imageHeight * scale
  const hasImage = layer.kind !== 'text' && mark.asset !== null && bitmap !== null

  if (layer.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
    ctx.shadowBlur = Math.max(2, mark.markHeight * scale * 0.08)
    ctx.shadowOffsetY = Math.max(1, mark.markHeight * scale * 0.03)
  }

  if (hasImage && bitmap) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, x, y, imageWidth, imageHeight)
  }

  if (layer.kind !== 'image' && mark.textWidth > 0) {
    const textX =
      hasImage && layer.kind === 'combo' ? x + imageWidth + layer.comboGap * scale : x
    const textY = y + mark.markHeight * scale * 0.5

    ctx.font = fontString(
      layer.fontFamily,
      layer.fontWeight,
      mark.layer.fontSize * scale
    )
    ctx.fillStyle = layer.color
    ctx.textBaseline = 'middle'
    drawTrackedText(ctx, layer.text, textX, textY, 'left', layer.letterSpacing * scale)
  }

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

function anchorX(anchor: WatermarkAnchor, surface: number, width: number, margin: number): number {
  if (anchor.endsWith('left')) return margin
  if (anchor.endsWith('right')) return surface - width - margin
  return (surface - width) / 2
}

function anchorY(anchor: WatermarkAnchor, surface: number, height: number, margin: number): number {
  if (anchor.startsWith('top')) return margin
  if (anchor.startsWith('bottom')) return surface - height - margin
  return (surface - height) / 2
}

/** Keeps an oversized mark anchored so it stays at least partly visible. */
function clampAxis(value: number, available: number): number {
  if (available <= 0) return value / 2
  return clamp(value, 0, available)
}

function positiveModulo(value: number, modulo: number): number {
  if (modulo <= 0) return 0
  return ((value % modulo) + modulo) % modulo
}
