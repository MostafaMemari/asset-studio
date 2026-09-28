import { MAX_PREVIEW_PIXELS } from '@/core/constants'
import { clamp } from '@/core/utils'
import { paintScene } from '@/core/render/engine'

export type PreviewTarget = {
  canvas: HTMLCanvasElement
  /** CSS size of the canvas box; the backing store follows the device ratio. */
  width: number
  height: number
  dpr: number
  maxPixels?: number
}

/**
 * Backing-store size for the live preview. It is capped so a 12000 x 12000
 * document still scrubs smoothly; because only the uniform scale differs, the
 * preview stays geometrically identical to the export.
 */
export function previewBackingSize(
  documentWidth: number,
  documentHeight: number,
  dpr: number,
  maxPixels = MAX_PREVIEW_PIXELS
): { width: number; height: number; scale: number } {
  const ratio = clamp(dpr, 1, 2)
  let width = Math.max(1, Math.round(documentWidth * ratio))
  let height = Math.max(1, Math.round(documentHeight * ratio))

  const pixels = width * height
  if (pixels > maxPixels) {
    const shrink = Math.sqrt(maxPixels / pixels)
    width = Math.max(1, Math.round(width * shrink))
    height = Math.max(1, Math.round(height * shrink))
  }

  return { width, height, scale: width / Math.max(1, documentWidth) }
}

export async function renderPreview(
  target: PreviewTarget,
  scene: Parameters<typeof paintScene>[1]
): Promise<void> {
  const { canvas, dpr } = target
  const { width, height, scale } = previewBackingSize(
    scene.model.width,
    scene.model.height,
    dpr,
    target.maxPixels
  )

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  paintScene(ctx, scene, scale)
}
