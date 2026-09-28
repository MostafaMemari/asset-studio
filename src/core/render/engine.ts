import { ensureFontsReady } from '@/core/fonts'
import { buildRenderModel, preloadModelImages } from '@/core/model'
import type { RenderInput, RenderModel } from '@/core/model'
import { drawLabel, drawTile } from '@/core/render/tile'
import { drawWatermark } from '@/core/render/watermark'

export type Scene = {
  model: RenderModel
  itemBitmaps: (HTMLImageElement | null)[]
  watermarkBitmaps: (HTMLImageElement | null)[]
}

/** Resolves settings + materials into a fully measured, fully decoded scene. */
export async function createScene(input: RenderInput): Promise<Scene> {
  await ensureFontsReady()
  const model = buildRenderModel(input)
  const { items, watermarks } = await preloadModelImages(model)
  return { model, itemBitmaps: items, watermarkBitmaps: watermarks }
}

/**
 * The one and only draw path. The editor preview, the single export and every
 * batch entry call this with the same model, so a change in scale is the only
 * difference between what is on screen and what lands on disk.
 */
export function paintScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  scale = 1
): void {
  const { model } = scene

  ctx.save()
  ctx.scale(scale, scale)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.fillStyle = model.backgroundColor
  ctx.fillRect(-1, -1, model.width + 2, model.height + 2)

  for (const item of model.items) {
    const bitmap = scene.itemBitmaps[item.index]
    if (bitmap) drawTile(ctx, item, bitmap, model.tiles)
    drawLabel(ctx, item, model.typography)
  }

  if (model.watermarkEnabled) {
    for (const [index, mark] of model.watermarks.entries()) {
      drawWatermark(ctx, mark, scene.watermarkBitmaps[index] ?? null, {
        width: model.width,
        height: model.height,
      })
    }
  }

  ctx.restore()
}

export async function renderComposition(
  ctx: CanvasRenderingContext2D,
  input: RenderInput,
  scale = 1
): Promise<Scene> {
  const scene = await createScene(input)
  paintScene(ctx, scene, scale)
  return scene
}
