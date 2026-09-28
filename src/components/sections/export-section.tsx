import { Download, FileArchive, Loader2, PackageOpen } from 'lucide-react'

import { NumberField, SwitchRow, TextField } from '@/components/fields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { EXPORT_FORMATS, MAX_COLUMNS } from '@/core/constants'
import { resolveExportScale } from '@/core/export/canvas'
import { useExportActions } from '@/hooks/use-export-actions'
import { useExportSettings, useOutputSettings } from '@/store/document-store'
import { useMaterialsStore } from '@/store/materials-store'

export function ExportSection() {
  const { exportSettings, setExportSettings } = useExportSettings()
  const { output } = useOutputSettings()
  const count = useMaterialsStore((state) => state.materials.length)
  const { phase, isBusy, exportOne, exportBatch } = useExportActions()

  const { batch } = exportSettings
  const resolved = resolveExportScale(output.width, output.height, exportSettings.scale)
  const formatLabel =
    EXPORT_FORMATS.find((entry) => entry.value === exportSettings.format)?.label ?? 'PNG'
  const qualityLabel =
    exportSettings.format === 'png'
      ? 'lossless'
      : `q${Math.round(exportSettings.quality * 100)}`

  const plannedFiles =
    (batch.includeCombined ? 1 : 0) + (batch.perMaterial ? count : 0)

  const setBatch = (patch: Partial<typeof batch>) =>
    setExportSettings({ batch: { ...batch, ...patch } }, 'export.batch')

  return (
    <div className="space-y-4">
      <Section title="Current sheet" description="Everything on the canvas">
        <div className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-2.5">
          <div className="flex items-center gap-1.5">
            <Badge tone="accent">{formatLabel}</Badge>
            <Badge tone="outline">{qualityLabel}</Badge>
            <Badge tone="outline">{exportSettings.scale}×</Badge>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            {resolved.width} × {resolved.height} px · {((resolved.width * resolved.height) / 1_000_000).toFixed(1)} MP
          </p>
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={count === 0 || isBusy}
            onClick={() => void exportOne()}
          >
            {phase?.kind === 'single' ? <Loader2 className="animate-spin" /> : <Download />}
            Export sheet
          </Button>
        </div>
      </Section>

      <Section title="Batch export" description="One preview per material">
        <SwitchRow
          label="Combined sheet"
          description="All materials on one canvas"
          checked={batch.includeCombined}
          onCheckedChange={(includeCombined) => setBatch({ includeCombined })}
        />
        <SwitchRow
          label="One preview per material"
          description="Reuses the same layout and watermarks"
          checked={batch.perMaterial}
          onCheckedChange={(perMaterial) => setBatch({ perMaterial })}
        />
        {batch.perMaterial ? (
          <NumberField
            label="Columns per preview"
            value={batch.columns}
            min={1}
            max={MAX_COLUMNS}
            onValueChange={(columns) => setBatch({ columns })}
          />
        ) : null}
        <SwitchRow
          label="Package as ZIP"
          description="Single download with every preview"
          checked={batch.asZip}
          onCheckedChange={(asZip) => setBatch({ asZip })}
        />
        <TextField
          label="Batch file name"
          value={exportSettings.batchFileNameTemplate}
          mono
          onValueChange={(batchFileNameTemplate) =>
            setExportSettings({ batchFileNameTemplate }, 'export.batchName')
          }
        />

        <div className="space-y-2 rounded-md border border-border/70 p-2.5">
          <p className="font-mono text-[11px] text-muted-foreground">
            {plannedFiles === 0
              ? 'Enable a batch mode to generate files'
              : `${plannedFiles} file${plannedFiles === 1 ? '' : 's'} · ${count} material${count === 1 ? '' : 's'}`}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={count === 0 || isBusy || plannedFiles === 0}
            onClick={() => void exportBatch()}
          >
            {phase?.kind === 'batch' ? (
              <>
                <Loader2 className="animate-spin" />
                {phase.done}/{phase.total}
              </>
            ) : batch.asZip ? (
              <FileArchive />
            ) : (
              <PackageOpen />
            )}
            {batch.asZip ? 'Download ZIP' : 'Download all'}
          </Button>
          {phase?.kind === 'batch' ? (
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${Math.round((phase.done / Math.max(1, phase.total)) * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Notes" defaultOpen={false}>
        <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
          <li>Exports use the same renderer as the preview, so files match the canvas exactly.</li>
          <li>Filenames are sanitised for Windows, macOS and Linux.</li>
          <li>Duplicate names are numbered automatically inside a ZIP.</li>
          <li>Everything renders locally; nothing is uploaded.</li>
        </ul>
      </Section>
    </div>
  )
}
