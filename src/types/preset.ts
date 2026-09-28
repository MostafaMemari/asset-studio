import type { WatermarkAsset } from '@/types/assets'
import type {
  ExportSettings,
  LayoutSettings,
  OutputSettings,
  TileSettings,
  TypographySettings,
} from '@/types/settings'
import type { WatermarkSettings } from '@/types/watermark'

/**
 * Everything a preset captures. Material files are deliberately excluded:
 * presets describe how to render, not what to render.
 */
export type StudioDocument = {
  output: OutputSettings
  layout: LayoutSettings
  tiles: TileSettings
  typography: TypographySettings
  exportSettings: ExportSettings
  watermark: WatermarkSettings
  watermarkAssets: Record<string, WatermarkAsset>
}

export type Preset = {
  id: string
  name: string
  group: 'builtin' | 'user'
  createdAt: number
  document: StudioDocument
}
