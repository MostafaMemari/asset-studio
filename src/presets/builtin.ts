import { DEFAULT_EXPORT, DEFAULT_LAYOUT, DEFAULT_OUTPUT, DEFAULT_TILES, DEFAULT_TYPOGRAPHY } from '@/core/constants'
import { DEFAULT_WATERMARK_LAYER } from '@/core/constants'
import { createId } from '@/core/utils'
import type {
  BatchSettings,
  ExportSettings,
  LayoutSettings,
  OutputSettings,
  TileSettings,
  TypographySettings,
} from '@/types/settings'
import type { StudioDocument, Preset } from '@/types/preset'
import type { WatermarkLayer } from '@/types/watermark'

type DocumentOverrides = {
  output?: Partial<OutputSettings>
  layout?: Partial<LayoutSettings>
  tiles?: Partial<TileSettings>
  typography?: Partial<TypographySettings>
  exportSettings?: Partial<Omit<ExportSettings, 'batch'>> & { batch?: Partial<BatchSettings> }
  watermark?: { enabled?: boolean; layers?: WatermarkLayer[] }
  watermarkAssets?: StudioDocument['watermarkAssets']
}

function buildDocument(overrides: DocumentOverrides = {}): StudioDocument {
  return {
    output: { ...DEFAULT_OUTPUT, ...overrides.output },
    layout: { ...DEFAULT_LAYOUT, ...overrides.layout },
    tiles: { ...DEFAULT_TILES, ...overrides.tiles },
    typography: { ...DEFAULT_TYPOGRAPHY, ...overrides.typography },
    exportSettings: {
      ...DEFAULT_EXPORT,
      ...overrides.exportSettings,
      batch: { ...DEFAULT_EXPORT.batch, ...overrides.exportSettings?.batch },
    },
    watermark: {
      enabled: overrides.watermark?.enabled ?? true,
      layers: overrides.watermark?.layers ?? [buildLayer()],
    },
    watermarkAssets: overrides.watermarkAssets ?? {},
  }
}

function buildLayer(overrides: Partial<WatermarkLayer> = {}): WatermarkLayer {
  return { ...DEFAULT_WATERMARK_LAYER, id: createId('wm'), ...overrides }
}

const MARIGOL_GOLD = '#c8912b'
const STUDIO_BLACK = '#17171a'
const WARM_WHITE = '#f6f3ec'

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'builtin-material',
    name: 'Marigol Material',
    group: 'builtin',
    createdAt: 0,
    document: buildDocument({
      output: { width: 1600, height: 1200, backgroundColor: WARM_WHITE, sizePresetId: 'landscape-1600' },
      layout: { columns: 3, gapX: 28, gapY: 28, padding: 64, fit: 'fill', tileAspect: 1, tileSizing: 'auto' },
      tiles: { fit: 'cover', radius: 10, borderWidth: 0 },
      typography: {
        enabled: true,
        placement: 'below',
        color: '#1b1b1f',
        fontSize: 22,
        fontWeight: 500,
        align: 'left',
        shadow: false,
        template: '{index}  {name}',
        indexWidth: 2,
      },
      exportSettings: { format: 'png', scale: 1, fileNameTemplate: 'marigol-material-{width}x{height}' },
      watermark: {
        layers: [
          buildLayer({
            name: 'Signature',
            kind: 'text',
            mode: 'single',
            text: 'MARIGOL',
            color: MARIGOL_GOLD,
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: 3,
            opacity: 0.9,
            anchor: 'bottom-right',
            margin: 36,
          }),
        ],
      },
    }),
  },
  {
    id: 'builtin-square',
    name: 'Marigol Square',
    group: 'builtin',
    createdAt: 0,
    document: buildDocument({
      output: { width: 1080, height: 1080, backgroundColor: STUDIO_BLACK, sizePresetId: 'social-square' },
      layout: { columns: 3, gapX: 18, gapY: 18, padding: 42, fit: 'fill', tileAspect: 1 },
      tiles: { fit: 'cover', radius: 14 },
      typography: {
        placement: 'below',
        color: '#e9e9ef',
        fontSize: 19,
        template: '{index} {name}',
        showIndex: true,
        shadow: true,
      },
      exportSettings: { format: 'png', fileNameTemplate: 'marigol-square-{width}x{height}' },
      watermark: {
        layers: [
          buildLayer({
            name: 'Signature',
            anchor: 'bottom-right',
            margin: 34,
            opacity: 0.65,
            fontSize: 34,
            letterSpacing: 4,
          }),
        ],
      },
    }),
  },
  {
    id: 'builtin-landscape',
    name: 'Marigol Landscape',
    group: 'builtin',
    createdAt: 0,
    document: buildDocument({
      output: { width: 1920, height: 1080, backgroundColor: '#101013', sizePresetId: 'hd' },
      layout: { columns: 4, gapX: 20, gapY: 20, padding: 48, fit: 'fill', tileAspect: 16 / 9 },
      tiles: { fit: 'cover', radius: 8 },
      typography: {
        placement: 'overlay-bottom',
        color: '#ffffff',
        fontSize: 20,
        template: '{name}',
        showIndex: false,
        shadow: true,
      },
      exportSettings: { format: 'jpeg', quality: 0.94, fileNameTemplate: 'marigol-landscape-{width}x{height}' },
      watermark: {
        layers: [
          buildLayer({
            name: 'Signature',
            anchor: 'top-right',
            margin: 30,
            opacity: 0.7,
            fontSize: 30,
            letterSpacing: 5,
          }),
        ],
      },
    }),
  },
  {
    id: 'builtin-pbr',
    name: 'Marigol PBR',
    group: 'builtin',
    createdAt: 0,
    document: buildDocument({
      output: { width: 2048, height: 2048, backgroundColor: '#4a5568', sizePresetId: 'square-2048' },
      layout: { mode: 'grid', columns: 2, gapX: 40, gapY: 40, padding: 80, fit: 'fill', tileAspect: 1 },
      tiles: { fit: 'cover', radius: 0, borderWidth: 0 },
      typography: {
        placement: 'below',
        color: '#f2f4f8',
        fontSize: 26,
        fontWeight: 600,
        template: '{index}  {name}',
        indexWidth: 2,
        shadow: false,
      },
      exportSettings: { format: 'png', fileNameTemplate: 'marigol-pbr-{width}x{height}' },
      watermark: {
        layers: [
          buildLayer({
            name: 'Tiled proof',
            mode: 'tiled',
            text: 'MARIGOL PREVIEW',
            color: '#ffffff',
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 2,
            rotation: -32,
            opacity: 0.14,
            spacingX: 90,
            spacingY: 70,
            offsetX: 0,
            offsetY: 0,
          }),
        ],
      },
    }),
  },
  {
    id: 'builtin-custom',
    name: 'Custom',
    group: 'builtin',
    createdAt: 0,
    document: buildDocument(),
  },
]

export const BUILTIN_PRESET_IDS = BUILTIN_PRESETS.map((preset) => preset.id)
