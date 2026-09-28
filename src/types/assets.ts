export type MaterialImage = {
  id: string
  file: File
  /** Object URL for the source file. Valid for the session only. */
  url: string
  name: string
  width: number
  height: number
}

export type RejectedFile = {
  id: string
  name: string
  reason: string
}

/** Per-image transform applied on top of the global tile settings. */
export type ImageAdjustments = {
  rotation: number
  /** 1 = the fit mode decides the framing. >1 crops in, <1 adds margin. */
  zoom: number
  /** Pan inside the tile, in fractions of the overflow. */
  offsetX: number
  offsetY: number
  flipX: boolean
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  rotation: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  flipX: false,
}

/** Optional per-material deviations from the document settings. */
export type MaterialOverride = {
  title?: string
  adjustments?: Partial<ImageAdjustments>
}

export type WatermarkAsset = {
  id: string
  name: string
  /** Data URL so the asset survives a reload and preset round-trips. */
  dataUrl: string
  width: number
  height: number
}
