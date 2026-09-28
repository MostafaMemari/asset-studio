import { canvasToBlob, resolveExportScale } from '@/core/export/canvas'
import { buildFileName, exportExtension } from '@/core/export/filename'
import { createScene, paintScene } from '@/core/render/engine'
import type { RenderInput } from '@/core/model'

export type ExportResult = {
  blob: Blob
  filename: string
  width: number
  height: number
  /** True when the canvas limits forced a smaller scale than requested. */
  clamped: boolean
}

export type BatchProgress = {
  done: number
  total: number
  label: string
}

/**
 * Renders the current document through the shared paint path and encodes it.
 * This is the only place that turns a scene into a downloadable file.
 */
export async function exportComposition(
  input: RenderInput,
  presetName: string
): Promise<ExportResult> {
  const { document: doc } = input
  const { width, height, scale, clamped } = resolveExportScale(
    doc.output.width,
    doc.output.height,
    doc.exportSettings.scale
  )

  const scene = await createScene(input)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  paintScene(ctx, scene, scale)

  const blob = await canvasToBlob(canvas, doc.exportSettings.format, doc.exportSettings.quality)
  const filename = buildFileName(doc.exportSettings.fileNameTemplate, {
    format: doc.exportSettings.format,
    outputWidth: width,
    outputHeight: height,
    presetName,
    materials: input.materials,
    index: 0,
  })

  return { blob, filename, width, height, clamped }
}

/**
 * Renders the combined sheet and/or one sheet per material. Every job reuses the
 * same pipeline, so batch output is identical to a manual export.
 */
export async function runBatchExport(
  input: RenderInput,
  presetName: string,
  onProgress?: (progress: BatchProgress) => void
): Promise<ExportResult[]> {
  const { batchFileNameTemplate } = input.document.exportSettings
  const jobs = buildJobs(input)

  const results: ExportResult[] = []
  const usedNames = new Set<string>()

  for (const [index, job] of jobs.entries()) {
    const result = await exportComposition(job.input, presetName)
    result.filename = job.perMaterial
      ? buildFileName(batchFileNameTemplate, {
          format: input.document.exportSettings.format,
          outputWidth: result.width,
          outputHeight: result.height,
          presetName,
          materials: job.input.materials,
          index: job.materialIndex,
        })
      : result.filename
    result.filename = uniqueName(result.filename, usedNames)

    results.push(result)
    onProgress?.({ done: index + 1, total: jobs.length, label: result.filename })
    await yieldToBrowser()
  }

  return results
}

type BatchJob = { input: RenderInput; perMaterial: boolean; materialIndex: number }

function buildJobs(input: RenderInput): BatchJob[] {
  const { batch } = input.document.exportSettings
  const jobs: BatchJob[] = []

  if (batch.includeCombined && input.materials.length > 0) {
    jobs.push({ input, perMaterial: false, materialIndex: 0 })
  }

  if (batch.perMaterial) {
    const columns = Math.max(1, Math.round(batch.columns) || 1)
    input.materials.forEach((material, index) => {
      jobs.push({
        input: singleMaterialInput(input, material, columns),
        perMaterial: true,
        materialIndex: index,
      })
    })
  }

  return jobs
}

function singleMaterialInput(
  input: RenderInput,
  material: RenderInput['materials'][number],
  columns: number
): RenderInput {
  return {
    ...input,
    materials: [material],
    document: {
      ...input.document,
      layout: { ...input.document.layout, columns },
    },
  }
}

function uniqueName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const extension = dot > 0 ? name.slice(dot) : ''

  let counter = 2
  let candidate = `${stem}-${counter}${extension}`
  while (used.has(candidate)) {
    counter += 1
    candidate = `${stem}-${counter}${extension}`
  }
  used.add(candidate)
  return candidate
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export { exportExtension }
export type { RenderInput }
