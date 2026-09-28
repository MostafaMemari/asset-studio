import { createZip, type ZipEntry } from '@/core/export/zip'

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // The download keeps reading the blob for a moment; release it on a later tick.
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function downloadZip(
  files: { name: string; blob: Blob }[],
  zipName: string
): Promise<void> {
  const entries: ZipEntry[] = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      data: new Uint8Array(await file.blob.arrayBuffer()),
    }))
  )
  downloadBlob(createZip(entries), zipName.endsWith('.zip') ? zipName : `${zipName}.zip`)
}
