import { MAX_CANVAS_DIMENSION, MAX_CANVAS_PIXELS } from '@/core/constants'
import { FORMAT_MIME } from '@/core/constants'
import type { ExportFormat } from '@/types/settings'

export type ExportScaleResult = {
  scale: number
  width: number
  height: number
  clamped: boolean
}

/**
 * Clamps the requested high-resolution multiplier to what the browser can
 * actually allocate, and reports back when the request was reduced.
 */
export function resolveExportScale(
  documentWidth: number,
  documentHeight: number,
  requested: number
): ExportScaleResult {
  const width = Math.max(1, documentWidth)
  const height = Math.max(1, documentHeight)
  const wanted = Math.max(0.1, requested)

  const dimensionLimit = Math.min(
    MAX_CANVAS_DIMENSION / width,
    MAX_CANVAS_DIMENSION / height
  )
  const pixelLimit = Math.sqrt(MAX_CANVAS_PIXELS / (width * height))
  const scale = Math.min(wanted, dimensionLimit, pixelLimit)

  return {
    scale,
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    clamped: scale < wanted - 0.0001,
  }
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      FORMAT_MIME[format],
      format === 'png' ? undefined : quality
    )
  })
}
