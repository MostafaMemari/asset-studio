import type {
  ExportFormat,
  ExportSettings,
  ImageFit,
  LayoutFit,
  LayoutMode,
  LayoutSettings,
  LabelPlacement,
  OutputSettings,
  ResolutionScale,
  TextAlign,
  TextCase,
  TileSettings,
  TypographySettings,
} from '@/types/settings'
import type { BlendMode, WatermarkAnchor, WatermarkLayer } from '@/types/watermark'

export const APP_NAME = 'Marigol Asset Studio'
export const STORAGE_KEY = 'marigol-asset-studio:document:v1'
export const PRESETS_KEY = 'marigol-asset-studio:presets:v1'
export const UI_KEY = 'marigol-asset-studio:ui:v1'

export const ACCEPTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'avif', 'tif', 'tiff']
export const ACCEPT_ATTRIBUTE = 'image/*'

/** Per-side ceiling of the Canvas API. Anything larger has to be downscaled. */
export const MAX_CANVAS_DIMENSION = 16384
/** Total pixel budget, kept well under the worst-case browser limits. */
export const MAX_CANVAS_PIXELS = 64_000_000
/** Backing store ceiling for the on-screen preview, which may scale down. */
export const MAX_PREVIEW_PIXELS = 4_200_000
export const MIN_OUTPUT_SIZE = 64
export const MAX_OUTPUT_SIZE = 12000
export const MAX_COLUMNS = 24

export const DEFAULT_OUTPUT: OutputSettings = {
  width: 1600,
  height: 1200,
  lockAspect: true,
  aspect: 4 / 3,
  backgroundColor: '#17171a',
  sizePresetId: null,
}

export const DEFAULT_LAYOUT: LayoutSettings = {
  mode: 'grid',
  columns: 4,
  gapX: 24,
  gapY: 24,
  padding: 56,
  fit: 'fill',
  tileAspect: 1,
  tileSizing: 'auto',
  tileSize: 320,
}

export const DEFAULT_TILES: TileSettings = {
  fit: 'cover',
  radius: 12,
  borderWidth: 0,
  borderColor: '#ffffff',
}

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  enabled: true,
  placement: 'below',
  fontFamily: 'Inter',
  fontSize: 20,
  fontWeight: 500,
  color: '#e8e8ec',
  align: 'left',
  textCase: 'none',
  showIndex: true,
  indexWidth: 2,
  template: '{index} {name}',
  stripExtension: true,
  shadow: true,
}

export const DEFAULT_EXPORT: ExportSettings = {
  format: 'png',
  quality: 0.92,
  scale: 1,
  fileNameTemplate: 'marigol-{preset}-{width}x{height}',
  batchFileNameTemplate: 'marigol-{preset}-{index}-{name}',
  batch: {
    includeCombined: true,
    perMaterial: true,
    columns: 1,
    asZip: true,
  },
}

export const DEFAULT_WATERMARK_LAYER: WatermarkLayer = {
  id: 'wm_default',
  name: 'Marigol',
  enabled: true,
  kind: 'text',
  mode: 'single',
  text: 'MARIGOL',
  fontFamily: 'Inter',
  fontSize: 44,
  fontWeight: 800,
  color: '#f5c518',
  letterSpacing: 2,
  assetId: null,
  comboGap: 18,
  opacity: 0.7,
  scale: 1,
  rotation: 0,
  blendMode: 'source-over',
  shadow: false,
  anchor: 'bottom-right',
  margin: 40,
  spacingX: 120,
  spacingY: 120,
  offsetX: 0,
  offsetY: 0,
}

export const LAYOUT_MODES: { value: LayoutMode; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'masonry', label: 'Masonry' },
]

export const LAYOUT_FITS: { value: LayoutFit; label: string; hint: string }[] = [
  { value: 'fill', label: 'Fill', hint: 'Scale the sheet to cover the canvas edge to edge' },
  { value: 'fit', label: 'Fit', hint: 'Shrink to fit inside the canvas, never enlarge' },
  { value: 'crop', label: 'Crop', hint: 'Scale to cover and clip the overflowing edges' },
]

export const IMAGE_FITS: { value: ImageFit; label: string }[] = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Stretch' },
]

export const LABEL_PLACEMENTS: { value: LabelPlacement; label: string; hint: string }[] = [
  { value: 'below', label: 'Below', hint: 'Own band under the tile' },
  { value: 'overlay-top', label: 'Top', hint: 'Overlaid on the tile, top edge' },
  { value: 'overlay-bottom', label: 'Bottom', hint: 'Overlaid on the tile, bottom edge' },
  { value: 'none', label: 'Off', hint: 'No caption at all' },
]

export const TEXT_CASES: { value: TextCase; label: string }[] = [
  { value: 'none', label: 'As is' },
  { value: 'lower', label: 'lowercase' },
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'title', label: 'Title Case' },
]

export const TEXT_ALIGNS: { value: TextAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

export const WATERMARK_ANCHORS: { value: WatermarkAnchor; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'middle-left', label: 'Middle left' },
  { value: 'center', label: 'Center' },
  { value: 'middle-right', label: 'Middle right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
]

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft light' },
]

export const EXPORT_FORMATS: {
  value: ExportFormat
  label: string
  extension: string
  hint: string
}[] = [
  { value: 'png', label: 'PNG', extension: 'png', hint: 'Lossless, keeps transparency' },
  { value: 'jpeg', label: 'JPG', extension: 'jpg', hint: 'Smallest files, no alpha' },
  { value: 'webp', label: 'WebP', extension: 'webp', hint: 'Modern, smaller than JPG' },
]

export const RESOLUTION_SCALES: { value: ResolutionScale; label: string }[] = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
]

export const FORMAT_MIME: Record<ExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export const OUTPUT_SIZE_PRESETS: {
  id: string
  label: string
  group: string
  width: number
  height: number
}[] = [
  { id: 'square-1024', label: 'Square 1024', group: 'Material sheets', width: 1024, height: 1024 },
  { id: 'square-2048', label: 'Square 2048', group: 'Material sheets', width: 2048, height: 2048 },
  { id: 'landscape-1600', label: 'Landscape 1600', group: 'Material sheets', width: 1600, height: 1200 },
  { id: 'social-square', label: 'Social square', group: 'Social', width: 1080, height: 1080 },
  { id: 'social-portrait', label: 'Social portrait', group: 'Social', width: 1080, height: 1350 },
  { id: 'social-story', label: 'Story', group: 'Social', width: 1080, height: 1920 },
  { id: 'hd', label: 'Full HD', group: 'Screen', width: 1920, height: 1080 },
  { id: 'qhd', label: 'QHD', group: 'Screen', width: 2560, height: 1440 },
  { id: 'uhd', label: '4K UHD', group: 'Screen', width: 3840, height: 2160 },
  { id: 'a4-150', label: 'A4 @150dpi', group: 'Print', width: 1240, height: 1754 },
  { id: 'a4-300', label: 'A4 @300dpi', group: 'Print', width: 2480, height: 3508 },
]

export const ASPECT_PRESETS: { value: number; label: string }[] = [
  { value: 1, label: '1:1' },
  { value: 4 / 3, label: '4:3' },
  { value: 3 / 2, label: '3:2' },
  { value: 16 / 9, label: '16:9' },
  { value: 2 / 3, label: '2:3' },
  { value: 9 / 16, label: '9:16' },
]

export const BACKGROUND_SWATCHES: { label: string; value: string }[] = [
  { label: 'Studio black', value: '#17171a' },
  { label: 'Charcoal', value: '#2b2b30' },
  { label: 'Slate', value: '#4a5568' },
  { label: 'Warm white', value: '#f6f3ec' },
  { label: 'Paper', value: '#e8e2d6' },
  { label: 'Sand', value: '#c8b79c' },
  { label: 'Marigol gold', value: '#c8912b' },
  { label: 'Foliage', value: '#3f5d45' },
]

export const FILENAME_TOKENS: { token: string; hint: string }[] = [
  { token: '{name}', hint: 'file name' },
  { token: '{ext}', hint: 'file extension' },
  { token: '{index}', hint: 'padded index' },
  { token: '{width}', hint: 'output width' },
  { token: '{height}', hint: 'output height' },
  { token: '{date}', hint: 'YYYY-MM-DD' },
  { token: '{time}', hint: 'HH-MM-SS' },
]

export const DEFAULT_LABEL_TEMPLATE = '{index} {name}'
