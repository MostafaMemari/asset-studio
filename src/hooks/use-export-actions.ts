import { useCallback } from 'react'

import { downloadBlob, downloadZip } from '@/core/export/download'
import { exportComposition, runBatchExport, type BatchProgress } from '@/core/export'
import { useRenderInput } from '@/hooks/use-render-input'
import { BUILTIN_PRESETS } from '@/presets/builtin'
import { usePresetsStore } from '@/store/presets-store'
import { useUiStore, type ExportPhase } from '@/store/ui-store'

export function useExportActions() {
  const input = useRenderInput()
  const notify = useUiStore((state) => state.notify)
  const phase = useUiStore((state) => state.exportPhase)
  const setPhase = useUiStore((state) => state.setExportPhase)
  const activeId = usePresetsStore((state) => state.activeId)
  const userPresets = usePresetsStore((state) => state.userPresets)

  const presetName = useCallback(() => {
    const found =
      BUILTIN_PRESETS.find((preset) => preset.id === activeId) ??
      userPresets.find((preset) => preset.id === activeId)
    return found ? slug(found.name) : 'preview'
  }, [activeId, userPresets])

  const exportOne = useCallback(async () => {
    if (input.materials.length === 0) return
    setPhase({ kind: 'single', done: 0, total: 1, label: 'Rendering sheet' })
    try {
      const result = await exportComposition(input, presetName())
      downloadBlob(result.blob, result.filename)
      notify(
        result.clamped
          ? `${result.filename} · ${result.width}×${result.height} (canvas size limit)`
          : `${result.filename} · ${result.width}×${result.height}`
      )
    } catch (error) {
      notify(message(error, 'Export failed'), 'error')
    } finally {
      setPhase(null)
    }
  }, [input, notify, presetName, setPhase])

  const exportBatch = useCallback(async () => {
    if (input.materials.length === 0) return
    setPhase({ kind: 'batch', done: 0, total: input.materials.length, label: 'Starting batch' })

    try {
      const results = await runBatchExport(input, presetName(), (progress: BatchProgress) =>
        setPhase({ kind: 'batch', ...progress })
      )
      if (results.length === 0) {
        notify('Nothing to export: turn on a batch mode first', 'error')
        return
      }

      if (input.document.exportSettings.batch.asZip) {
        await downloadZip(
          results.map((result) => ({ name: result.filename, blob: result.blob })),
          `${presetName()}-previews`
        )
        notify(`${results.length} previews packed into a ZIP`)
      } else {
        results.forEach((result, index) => {
          setTimeout(() => downloadBlob(result.blob, result.filename), index * 250)
        })
        notify(`${results.length} previews queued for download`)
      }
    } catch (error) {
      notify(message(error, 'Batch export failed'), 'error')
    } finally {
      setPhase(null)
    }
  }, [input, notify, presetName, setPhase])

  const isBusy = phase !== null
  return { phase: phase as ExportPhase, isBusy, exportOne, exportBatch }
}

function message(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
