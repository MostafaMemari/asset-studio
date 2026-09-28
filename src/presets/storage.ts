import {
  BLEND_MODES,
  DEFAULT_EXPORT,
  DEFAULT_LAYOUT,
  DEFAULT_OUTPUT,
  DEFAULT_TILES,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_WATERMARK_LAYER,
  EXPORT_FORMATS,
  IMAGE_FITS,
  LABEL_PLACEMENTS,
  LAYOUT_FITS,
  LAYOUT_MODES,
  MAX_COLUMNS,
  MAX_OUTPUT_SIZE,
  MIN_OUTPUT_SIZE,
  PRESETS_KEY,
  RESOLUTION_SCALES,
  TEXT_ALIGNS,
  TEXT_CASES,
  WATERMARK_ANCHORS,
} from '@/core/constants'
import { createId } from '@/core/utils'
import type { WatermarkAsset } from '@/types/assets'
import type { WatermarkLayer } from '@/types/watermark'
import type { Preset, StudioDocument } from '@/types/preset'
import type { ResolutionScale } from '@/types/settings'

/** Copies a value only when it matches the shape of the shipped default. */
function coerce<T extends object>(defaults: T, value: unknown): T {
  const result = { ...defaults }
  if (!value || typeof value !== 'object') return result

  const source = value as Record<string, unknown>
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const incoming = source[key as string]
    if (incoming === undefined || incoming === null) continue
    if (typeof incoming === typeof defaults[key]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- homogeneous per-key type
      ;(result as any)[key] = incoming
    }
  }
  return result
}

function oneOf<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

const MODE_VALUES = LAYOUT_MODES.map((entry) => entry.value)
const FIT_VALUES = LAYOUT_FITS.map((entry) => entry.value)
const IMAGE_FIT_VALUES = IMAGE_FITS.map((entry) => entry.value)
const FORMAT_VALUES = EXPORT_FORMATS.map((entry) => entry.value)
const SCALE_VALUES = RESOLUTION_SCALES.map((entry) => entry.value)

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeDocument(value: unknown): StudioDocument {
  const raw = (value ?? {}) as Record<string, unknown>

  const output = coerce(DEFAULT_OUTPUT, raw.output)
  output.width = Math.round(clampNumber(output.width, MIN_OUTPUT_SIZE, MAX_OUTPUT_SIZE))
  output.height = Math.round(clampNumber(output.height, MIN_OUTPUT_SIZE, MAX_OUTPUT_SIZE))
  output.lockAspect = Boolean(output.lockAspect)

  const layout = coerce(DEFAULT_LAYOUT, raw.layout)
  layout.columns = Math.round(clampNumber(layout.columns, 1, MAX_COLUMNS))
  layout.gapX = clampNumber(layout.gapX, 0, 2000)
  layout.gapY = clampNumber(layout.gapY, 0, 2000)
  layout.padding = clampNumber(layout.padding, 0, 2000)
  layout.tileSize = clampNumber(layout.tileSize, 8, MAX_OUTPUT_SIZE)
  layout.tileAspect = clampNumber(layout.tileAspect, 0.05, 10)
  layout.mode = oneOf(MODE_VALUES, layout.mode, DEFAULT_LAYOUT.mode)
  layout.fit = oneOf(FIT_VALUES, layout.fit, DEFAULT_LAYOUT.fit)
  layout.tileSizing = oneOf(['auto', 'fixed'] as const, layout.tileSizing, DEFAULT_LAYOUT.tileSizing)

  const tiles = coerce(DEFAULT_TILES, raw.tiles)
  tiles.radius = clampNumber(tiles.radius, 0, 2000)
  tiles.borderWidth = clampNumber(tiles.borderWidth, 0, 200)
  tiles.fit = oneOf(IMAGE_FIT_VALUES, tiles.fit, DEFAULT_TILES.fit)

  const typography = coerce(DEFAULT_TYPOGRAPHY, raw.typography)
  typography.fontSize = clampNumber(typography.fontSize, 6, 400)
  typography.fontWeight = Math.round(clampNumber(typography.fontWeight, 100, 900))
  typography.indexWidth = Math.round(clampNumber(typography.indexWidth, 0, 6))
  typography.placement = oneOf(
    LABEL_PLACEMENTS.map((entry) => entry.value),
    typography.placement,
    DEFAULT_TYPOGRAPHY.placement
  )
  typography.align = oneOf(TEXT_ALIGNS.map((entry) => entry.value), typography.align, DEFAULT_TYPOGRAPHY.align)
  typography.textCase = oneOf(TEXT_CASES.map((entry) => entry.value), typography.textCase, DEFAULT_TYPOGRAPHY.textCase)

  const exportRaw = (raw.exportSettings ?? {}) as Record<string, unknown>
  const exportSettings = coerce(DEFAULT_EXPORT, exportRaw)
  exportSettings.format = oneOf(FORMAT_VALUES, exportSettings.format, DEFAULT_EXPORT.format)
  exportSettings.quality = clampNumber(exportSettings.quality, 0.1, 1)
  exportSettings.scale = (SCALE_VALUES.find((value) => value === Number(exportSettings.scale)) ??
    DEFAULT_EXPORT.scale) as ResolutionScale
  exportSettings.batch = coerce(DEFAULT_EXPORT.batch, exportRaw.batch)
  exportSettings.batch.columns = Math.round(
    clampNumber(exportSettings.batch.columns, 1, MAX_COLUMNS)
  )

  const watermarkRaw = (raw.watermark ?? {}) as Record<string, unknown>
  const layers = Array.isArray(watermarkRaw.layers)
    ? watermarkRaw.layers.map(normalizeLayer).filter((layer): layer is WatermarkLayer => layer !== null)
    : []

  return {
    output,
    layout,
    tiles,
    typography,
    exportSettings,
    watermark: { enabled: Boolean(watermarkRaw.enabled), layers },
    watermarkAssets: normalizeAssets(raw.watermarkAssets),
  }
}

function normalizeLayer(value: unknown): WatermarkLayer | null {
  if (!value || typeof value !== 'object') return null
  const layer = coerce(DEFAULT_WATERMARK_LAYER, value)

  return {
    ...layer,
    id: typeof layer.id === 'string' && layer.id ? layer.id : createId('wm'),
    name: layer.name || 'Watermark',
    kind: layer.kind === 'image' || layer.kind === 'combo' ? layer.kind : 'text',
    mode: layer.mode === 'tiled' ? 'tiled' : 'single',
    anchor: oneOf(
      WATERMARK_ANCHORS.map((entry) => entry.value),
      layer.anchor,
      DEFAULT_WATERMARK_LAYER.anchor
    ),
    blendMode: oneOf(
      BLEND_MODES.map((entry) => entry.value),
      layer.blendMode,
      DEFAULT_WATERMARK_LAYER.blendMode
    ),
    opacity: clampNumber(layer.opacity, 0, 1),
    scale: clampNumber(layer.scale, 0.05, 10),
    rotation: ((layer.rotation % 360) + 360) % 360,
    fontSize: clampNumber(layer.fontSize, 6, 800),
    fontWeight: Math.round(clampNumber(layer.fontWeight, 100, 900)),
    letterSpacing: clampNumber(layer.letterSpacing, -50, 200),
    margin: clampNumber(layer.margin, 0, 4000),
    spacingX: clampNumber(layer.spacingX, 0, 4000),
    spacingY: clampNumber(layer.spacingY, 0, 4000),
    offsetX: clampNumber(layer.offsetX, -4000, 4000),
    offsetY: clampNumber(layer.offsetY, -4000, 4000),
    comboGap: clampNumber(layer.comboGap, 0, 1000),
  }
}

function normalizeAssets(value: unknown): Record<string, WatermarkAsset> {
  if (!value || typeof value !== 'object') return {}
  const source = value as Record<string, unknown>
  const assets: Record<string, WatermarkAsset> = {}

  for (const [key, raw] of Object.entries(source)) {
    if (!raw || typeof raw !== 'object') continue
    const asset = raw as Partial<WatermarkAsset>
    if (typeof asset.dataUrl !== 'string' || !asset.dataUrl.startsWith('data:image')) continue
    assets[key] = {
      id: key,
      name: typeof asset.name === 'string' ? asset.name : 'watermark',
      dataUrl: asset.dataUrl,
      width: Number(asset.width) || 1,
      height: Number(asset.height) || 1,
    }
  }
  return assets
}

export function cloneDocument(document: StudioDocument): StudioDocument {
  return normalizeDocument(JSON.parse(JSON.stringify(document)) as unknown)
}

export function loadUserPresets(): Preset[] {
  if (typeof localStorage === 'undefined') return []

  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : createId('preset'),
        name: typeof item.name === 'string' && item.name.trim() ? item.name : 'Untitled preset',
        group: 'user' as const,
        createdAt: Number(item.createdAt) || Date.now(),
        document: normalizeDocument(item.document),
      }))
      .slice(0, 60)
  } catch {
    return []
  }
}

export function saveUserPresets(presets: Preset[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
  } catch {
    // Quota exceeded: drop the oldest user presets and retry once.
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, 5)))
    } catch {
      /* Persisting presets is best effort. */
    }
  }
}
