export type WatermarkKind = 'text' | 'image' | 'combo'

export type WatermarkMode = 'single' | 'tiled'

export type WatermarkAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type BlendMode = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'soft-light'

export type WatermarkLayer = {
  id: string
  name: string
  enabled: boolean
  kind: WatermarkKind
  mode: WatermarkMode

  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  letterSpacing: number

  assetId: string | null
  /** Gap between the image and the text in a combined mark. */
  comboGap: number

  opacity: number
  scale: number
  rotation: number
  blendMode: BlendMode
  shadow: boolean

  /** Single mode. */
  anchor: WatermarkAnchor
  margin: number

  /** Tiled mode. */
  spacingX: number
  spacingY: number
  offsetX: number
  offsetY: number
}

export type WatermarkSettings = {
  enabled: boolean
  layers: WatermarkLayer[]
}
