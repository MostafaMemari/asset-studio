import { EXPORT_FORMATS } from '@/core/constants'
import { fillTemplate } from '@/core/text'
import { baseName, fileExtension } from '@/core/image'
import type { MaterialImage } from '@/types/assets'
import type { ExportFormat } from '@/types/settings'

export type FileNameContext = {
  format: ExportFormat
  outputWidth: number
  outputHeight: number
  presetName: string
  materials: MaterialImage[]
  index: number
}

export function exportExtension(format: ExportFormat): string {
  return EXPORT_FORMATS.find((entry) => entry.value === format)?.extension ?? 'png'
}

function timestamp(): { date: string; time: string } {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`,
  }
}

/** Shared by the single export, the batch runner and the ZIP packer. */
export function buildFileName(template: string, context: FileNameContext): string {
  const material = context.materials[context.index]
  const { date, time } = timestamp()
  const materialName = material ? baseName(material.name) : 'sheet'
  const extension = material ? fileExtension(material.name) : ''

  const raw = fillTemplate(template || 'marigol-sheet', {
    name: materialName,
    ext: extension,
    index: String(context.index + 1).padStart(3, '0'),
    count: String(context.materials.length).padStart(3, '0'),
    preset: context.presetName,
    width: context.outputWidth,
    height: context.outputHeight,
    format: exportExtension(context.format),
    date,
    time,
  })

  const safe = raw
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120)

  return `${safe || 'marigol-sheet'}.${exportExtension(context.format)}`
}
