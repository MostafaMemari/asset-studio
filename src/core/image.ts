import { ACCEPTED_EXTENSIONS } from '@/core/constants'
import { createId } from '@/core/utils'
import type { MaterialImage, WatermarkAsset } from '@/types/assets'

export function fileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function baseName(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

export function isSupportedImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return ACCEPTED_EXTENSIONS.includes(fileExtension(file.name))
}

/**
 * Decoded bitmap cache keyed by source URL. Keeps preview scrubbing cheap: the
 * same blob is never decoded twice, no matter how often the scene re-renders.
 */
const bitmapCache = new Map<string, Promise<HTMLImageElement>>()

export function loadImageElement(url: string): Promise<HTMLImageElement> {
  const cached = bitmapCache.get(url)
  if (cached) return cached

  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = url
  })

  bitmapCache.set(url, pending)
  pending.catch(() => bitmapCache.delete(url))
  return pending
}

export function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return loadImageElement(url).then((img) => ({
    width: img.naturalWidth,
    height: img.naturalHeight,
  }))
}

export async function createMaterialImage(file: File): Promise<MaterialImage> {
  const url = URL.createObjectURL(file)
  try {
    const { width, height } = await readImageSize(url)
    return { id: createId('mat'), file, url, name: file.name, width, height }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

export function revokeMaterial(material: MaterialImage): void {
  URL.revokeObjectURL(material.url)
  bitmapCache.delete(material.url)
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Watermark logos are re-encoded small so a preset with an embedded mark still
 * fits comfortably in localStorage.
 */
export async function createWatermarkAsset(
  file: File,
  maxEdge = 1024
): Promise<WatermarkAsset> {
  const original = await readFileAsDataUrl(file)
  const img = await loadImageElement(original)
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
  const dataUrl = scale < 1 ? await downscale(img, scale, file.type) : original

  const width = scale < 1 ? Math.round(img.naturalWidth * scale) : img.naturalWidth
  const height = scale < 1 ? Math.round(img.naturalHeight * scale) : img.naturalHeight

  return { id: createId('wm'), name: file.name, dataUrl, width, height }
}

function downscale(
  img: HTMLImageElement,
  scale: number,
  mimeType: string
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))

  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve('')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvasToDataUrl(canvas, mimeType)
}

function canvasToDataUrl(canvas: HTMLCanvasElement, mimeType: string): Promise<string> {
  return new Promise((resolve) => {
    // Browsers silently fall back to PNG for unsupported types.
    const source = mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png'
    resolve(canvas.toDataURL(source, 0.92))
  })
}
