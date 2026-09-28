import { clamp } from '@/core/utils'
import { drawTrackedText, fontString, truncateToWidth } from '@/core/text'
import type { RenderItem } from '@/core/model'
import type { TileSettings, TypographySettings } from '@/types/settings'
import { degreesToRadians, rotatedBounds, roundRectPath } from '@/core/render/shapes'

/**
 * Draws one material inside its tile: fit mode, zoom, pan, flip and rotation.
 * The rotation is compensated by measuring the fit against the rotated bounding
 * box, so a "cover" image still covers the tile corners at any angle.
 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  item: RenderItem,
  bitmap: CanvasImageSource,
  tiles: TileSettings
): void {
  const rect = item.imageRect
  if (rect.width <= 0 || rect.height <= 0) return

  const rotation = degreesToRadians(item.adjust.rotation)
  const radius = clamp(tiles.radius, 0, Math.min(rect.width, rect.height) / 2)
  const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }

  ctx.save()
  roundRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius)
  ctx.clip()

  if (rotation !== 0 || item.adjust.flipX) {
    ctx.translate(center.x, center.y)
    ctx.rotate(rotation)
    if (item.adjust.flipX) ctx.scale(-1, 1)
    ctx.translate(-center.x, -center.y)
  }

  const iw = Math.max(1, item.naturalWidth)
  const ih = Math.max(1, item.naturalHeight)
  const zoom = Math.max(0.02, item.adjust.zoom)

  let ratioX: number
  let ratioY: number
  if (tiles.fit === 'fill') {
    ratioX = rect.width / iw
    ratioY = rect.height / ih
  } else {
    const frame =
      tiles.fit === 'cover'
        ? rotatedBounds(rect.width, rect.height, rotation)
        : { width: rect.width, height: rect.height }
    const ratio =
      tiles.fit === 'cover'
        ? Math.max(frame.width / iw, frame.height / ih)
        : Math.min(rect.width / iw, rect.height / ih)
    ratioX = ratio
    ratioY = ratio
  }

  ratioX *= zoom
  ratioY *= zoom

  const drawWidth = iw * ratioX
  const drawHeight = ih * ratioY
  const panX = item.adjust.offsetX * (drawWidth - rect.width) / 2
  const panY = item.adjust.offsetY * (drawHeight - rect.height) / 2

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    bitmap,
    rect.x + (rect.width - drawWidth) / 2 + panX,
    rect.y + (rect.height - drawHeight) / 2 + panY,
    drawWidth,
    drawHeight
  )
  ctx.restore()

  if (tiles.borderWidth > 0) {
    ctx.save()
    roundRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius)
    ctx.strokeStyle = tiles.borderColor
    ctx.lineWidth = tiles.borderWidth
    ctx.stroke()
    ctx.restore()
  }
}

/** Draws the filename / index band, either under the tile or overlaid on it. */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  item: RenderItem,
  typography: TypographySettings
): void {
  if (!typography.enabled || typography.placement === 'none') return
  if (!item.label) return

  const fontSize = Math.max(6, typography.fontSize)
  ctx.save()
  ctx.font = fontString(typography.fontFamily, typography.fontWeight, fontSize)

  const isBelow = typography.placement === 'below'
  const rect = isBelow ? (item.labelRect ?? item.rect) : item.imageRect
  const paddingX = Math.max(2, fontSize * 0.35)

  const align = typography.align
  const x =
    align === 'center'
      ? rect.x + rect.width / 2
      : align === 'right'
        ? rect.x + rect.width - paddingX
        : rect.x + paddingX
  const available = Math.max(0, rect.width - paddingX * 2)
  const text = truncateToWidth(ctx, item.label, available, 0)

  let y: number
  if (isBelow) {
    y = rect.y + rect.height / 2
    ctx.textBaseline = 'middle'
  } else if (typography.placement === 'overlay-top') {
    y = rect.y + fontSize * 0.45
    ctx.textBaseline = 'top'
    drawScrim(ctx, rect, fontSize * 2.6, 'top')
  } else {
    y = rect.y + rect.height - fontSize * 0.45
    ctx.textBaseline = 'bottom'
    drawScrim(ctx, rect, fontSize * 2.6, 'bottom')
  }

  ctx.fillStyle = typography.color
  if (typography.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = fontSize * 0.28
    ctx.shadowOffsetY = fontSize * 0.06
  }

  drawTrackedText(ctx, text, x, y, align, 0)
  ctx.restore()
}

function drawScrim(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  band: number,
  side: 'top' | 'bottom'
): void {
  const gradient =
    side === 'top'
      ? ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + band)
      : ctx.createLinearGradient(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - band)

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.62)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(rect.x, rect.y, rect.width, band)
  ctx.restore()
}
