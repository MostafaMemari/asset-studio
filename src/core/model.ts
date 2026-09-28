import { loadImageElement, baseName, fileExtension } from '@/core/image'
import { computeLayout, type CompositionLayout, type Rect } from '@/core/layout'
import { fontString, measureTracked } from '@/core/text'
import { applyTextCase, fillTemplate } from '@/core/text'
import { measureContext } from '@/core/measure'
import { DEFAULT_ADJUSTMENTS } from '@/types/assets'
import type { ImageAdjustments, MaterialImage, MaterialOverride, WatermarkAsset } from '@/types/assets'
import type { StudioDocument } from '@/types/preset'
import type { WatermarkLayer } from '@/types/watermark'

export type RenderItem = {
  id: string
  index: number
  /** Source URL to decode before drawing. */
  source: string
  naturalWidth: number
  naturalHeight: number
  adjust: ImageAdjustments
  label: string
  rect: Rect
  imageRect: Rect
  labelRect: Rect | null
}

export type WatermarkMark = {
  layer: WatermarkLayer
  asset: WatermarkAsset | null
  textWidth: number
  textHeight: number
  imageWidth: number
  imageHeight: number
  markWidth: number
  markHeight: number
}

export type RenderModel = {
  width: number
  height: number
  backgroundColor: string
  layout: CompositionLayout
  items: RenderItem[]
  tiles: StudioDocument['tiles']
  typography: StudioDocument['typography']
  watermarks: WatermarkMark[]
  watermarkEnabled: boolean
}

export type RenderInput = {
  document: StudioDocument
  materials: MaterialImage[]
  overrides: Record<string, MaterialOverride>
}

/** Label band height in unscaled output pixels. */
export function labelBandHeight(typography: StudioDocument['typography']): number {
  if (!typography.enabled || typography.placement === 'none') return 0
  if (typography.placement !== 'below') return 0
  return Math.round(typography.fontSize * 1.6)
}

export function buildLabel(
  typography: StudioDocument['typography'],
  material: MaterialImage,
  index: number,
  override: MaterialOverride | undefined
): string {
  if (typography.placement === 'none') return ''

  const custom = override?.title?.trim()
  const name = custom || material.name
  const stem = typography.stripExtension || custom ? baseName(name) : name

  const text = fillTemplate(typography.template || '{name}', {
    name: stem,
    ext: fileExtension(name),
    index: padNumber(index + 1, typography.indexWidth),
    width: material.width,
    height: material.height,
  })

  return applyTextCase(text, typography.textCase).trim()
}

function padNumber(value: number, width: number): string {
  if (width <= 0) return String(value)
  return String(value).padStart(width, '0')
}

/**
 * Resolves the document plus the material list into absolute, ready-to-draw
 * geometry. Both the live preview and the exporter call this, which is what
 * guarantees the exported file matches the preview exactly.
 */
export function buildRenderModel(input: RenderInput): RenderModel {
  const { document: doc, materials, overrides } = input
  const { output, layout: layoutSettings, typography } = doc

  const labelHeight = labelBandHeight(typography)
  const layout = computeLayout({
    width: output.width,
    height: output.height,
    padding: layoutSettings.padding,
    gapX: layoutSettings.gapX,
    gapY: layoutSettings.gapY,
    columns: layoutSettings.columns,
    mode: layoutSettings.mode,
    fit: layoutSettings.fit,
    tileAspect: layoutSettings.tileAspect,
    tileSizing: layoutSettings.tileSizing,
    tileSize: layoutSettings.tileSize,
    labelHeight,
    aspects: materials.map((material) => material.width / Math.max(1, material.height)),
  })

  const items: RenderItem[] = layout.items.map((item) => {
    const material = materials[item.index]
    const override = overrides[material?.id ?? '']
    return {
      id: material?.id ?? '',
      index: item.index,
      source: material?.url ?? '',
      naturalWidth: material?.width ?? 1,
      naturalHeight: material?.height ?? 1,
      adjust: { ...DEFAULT_ADJUSTMENTS, ...override?.adjustments },
      label: material ? buildLabel(typography, material, item.index, override) : '',
      rect: item.rect,
      imageRect: item.imageRect,
      labelRect: item.labelRect,
    }
  })

  return {
    width: output.width,
    height: output.height,
    backgroundColor: output.backgroundColor,
    layout,
    items,
    tiles: doc.tiles,
    typography,
    watermarks: resolveWatermarks(doc),
    watermarkEnabled: doc.watermark.enabled,
  }
}

function resolveWatermarks(doc: StudioDocument): WatermarkMark[] {
  if (!doc.watermark.enabled) return []

  const ctx = measureContext()
  return doc.watermark.layers
    .filter((layer) => layer.enabled)
    .map((layer) => {
      const asset = layer.assetId ? (doc.watermarkAssets[layer.assetId] ?? null) : null

      let textWidth = 0
      let textHeight = 0
      if (layer.kind !== 'image' && layer.text.trim().length > 0) {
        ctx.font = fontString(layer.fontFamily, layer.fontWeight, layer.fontSize)
        const metrics = ctx.measureText(layer.text)
        textWidth = measureTracked(ctx, layer.text, layer.letterSpacing)
        const ascent = metrics.actualBoundingBoxAscent
        const descent = metrics.actualBoundingBoxDescent
        textHeight = ascent > 0 || descent > 0 ? ascent + descent : layer.fontSize * 1.2
      }

      const imageWidth = asset?.width ?? 0
      const imageHeight = asset?.height ?? 0

      let markWidth = textWidth
      let markHeight = textHeight
      if (layer.kind === 'image') {
        markWidth = imageWidth
        markHeight = imageHeight
      } else if (layer.kind === 'combo' && asset) {
        markWidth = imageWidth + layer.comboGap + textWidth
        markHeight = Math.max(imageHeight, textHeight)
      }

      return { layer, asset, textWidth, textHeight, imageWidth, imageHeight, markWidth, markHeight }
    })
    .filter((mark) => mark.markWidth > 0 && mark.markHeight > 0)
}

/** Decodes every bitmap the model references, so the draw pass stays sync. */
export async function preloadModelImages(
  model: RenderModel
): Promise<{ items: (HTMLImageElement | null)[]; watermarks: (HTMLImageElement | null)[] }> {
  const itemUrls = model.items.map((item) => item.source)
  const watermarkUrls = model.watermarks.map((mark) => mark.asset?.dataUrl ?? '')

  const [itemResults, watermarkResults] = await Promise.all([
    Promise.all(itemUrls.map((url) => (url ? loadImageElement(url).catch(() => null) : null))),
    Promise.all(
      watermarkUrls.map((url) => (url ? loadImageElement(url).catch(() => null) : null))
    ),
  ])

  return { items: itemResults, watermarks: watermarkResults }
}
