export type LayoutMode = 'grid' | 'masonry'

/** How the laid-out block fills the output canvas. */
export type LayoutFit = 'fill' | 'fit' | 'crop'

export type TileSizing = 'auto' | 'fixed'

/** How an image is framed inside its tile. */
export type ImageFit = 'cover' | 'contain' | 'fill'

export type LabelPlacement = 'below' | 'overlay-top' | 'overlay-bottom' | 'none'

export type TextAlign = 'left' | 'center' | 'right'

export type TextCase = 'none' | 'lower' | 'upper' | 'title'

export type ExportFormat = 'png' | 'jpeg' | 'webp'

/** Multiplier applied to the output size for high-resolution export. */
export type ResolutionScale = 1 | 2 | 3 | 4

export type OutputSettings = {
  width: number
  height: number
  lockAspect: boolean
  /** Captured when the lock is enabled; drives the linked axis. */
  aspect: number
  backgroundColor: string
  /** Identifier of the size preset the current size came from, if any. */
  sizePresetId: string | null
}

export type LayoutSettings = {
  mode: LayoutMode
  columns: number
  gapX: number
  gapY: number
  padding: number
  fit: LayoutFit
  /** Tile width / height used by the grid. Masonry derives height per image. */
  tileAspect: number
  tileSizing: TileSizing
  tileSize: number
}

export type TileSettings = {
  fit: ImageFit
  radius: number
  borderWidth: number
  borderColor: string
}

export type TypographySettings = {
  enabled: boolean
  placement: LabelPlacement
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  align: TextAlign
  textCase: TextCase
  showIndex: boolean
  /** Zero-padded index width, 0 for no padding. */
  indexWidth: number
  /** Filename template, see FILENAME_TOKENS. */
  template: string
  stripExtension: boolean
  shadow: boolean
}

export type BatchSettings = {
  /** Also render the sheet with every material on it. */
  includeCombined: boolean
  /** Render one sheet per uploaded material. */
  perMaterial: boolean
  /** Column count used for the per-material sheets. */
  columns: number
  asZip: boolean
}

export type ExportSettings = {
  format: ExportFormat
  quality: number
  scale: ResolutionScale
  fileNameTemplate: string
  batchFileNameTemplate: string
  batch: BatchSettings
}
