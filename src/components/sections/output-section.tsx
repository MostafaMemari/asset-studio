import { Lock, LockOpen } from 'lucide-react'

import { NumberField, SegmentedField, SliderField, SwitchRow, TextField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { EXPORT_FORMATS, FILENAME_TOKENS, MAX_OUTPUT_SIZE, MIN_OUTPUT_SIZE, OUTPUT_SIZE_PRESETS, RESOLUTION_SCALES } from '@/core/constants'
import { resolveExportScale } from '@/core/export/canvas'
import { useDocumentStore, useExportSettings, useOutputSettings } from '@/store/document-store'

export function OutputSection() {
  const { output, setOutput } = useOutputSettings()
  const { exportSettings, setExportSettings } = useExportSettings()
  const lastAction = useDocumentStore((state) => state.lastAction)

  const resolved = resolveExportScale(output.width, output.height, exportSettings.scale)
  const qualityApplies = exportSettings.format !== 'png'

  const groups = OUTPUT_SIZE_PRESETS.reduce<Record<string, typeof OUTPUT_SIZE_PRESETS>>((accumulator, preset) => {
    accumulator[preset.group] = [...(accumulator[preset.group] ?? []), preset]
    return accumulator
  }, {})

  return (
    <div className="space-y-4">
      <Section title="Canvas size" description={`${output.width} × ${output.height} px`}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Width"
            value={output.width}
            min={MIN_OUTPUT_SIZE}
            max={MAX_OUTPUT_SIZE}
            suffix="px"
            onValueChange={(width) => setOutput({ width }, 'output.width')}
          />
          <NumberField
            label="Height"
            value={output.height}
            min={MIN_OUTPUT_SIZE}
            max={MAX_OUTPUT_SIZE}
            suffix="px"
            onValueChange={(height) => setOutput({ height }, 'output.height')}
          />
        </div>

        <SwitchRow
          label="Lock aspect ratio"
          description={output.lockAspect ? `${output.aspect.toFixed(3)} : 1` : 'Free sizing'}
          checked={output.lockAspect}
          onCheckedChange={(lockAspect) =>
            setOutput({ lockAspect, aspect: output.width / Math.max(1, output.height) })
          }
        />

        <div className="flex flex-wrap gap-1.5">
          {OUTPUT_SIZE_PRESETS.slice(0, 6).map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={output.sizePresetId === preset.id ? 'secondary' : 'outline'}
              className="h-7 text-[11px]"
              onClick={() =>
                setOutput({
                  width: preset.width,
                  height: preset.height,
                  aspect: preset.width / preset.height,
                  sizePresetId: preset.id,
                })
              }
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="space-y-1.5">
          {Object.entries(groups).map(([group, presets]) => (
            <div key={group} className="space-y-1">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant={output.sizePresetId === preset.id ? 'secondary' : 'ghost'}
                    className="h-6 px-1.5 font-mono text-[10px]"
                    onClick={() =>
                      setOutput({
                        width: preset.width,
                        height: preset.height,
                        aspect: preset.width / preset.height,
                        sizePresetId: preset.id,
                      })
                    }
                  >
                    {preset.width}×{preset.height}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Resolution">
        <SegmentedField
          label="High resolution"
          value={String(exportSettings.scale) as '1' | '2' | '3' | '4'}
          options={RESOLUTION_SCALES.map((scale) => ({ value: String(scale.value), label: scale.label }))}
          hint={`${resolved.width}×${resolved.height}`}
          onValueChange={(value) => setExportSettings({ scale: Number(value) as 1 | 2 | 3 | 4 })}
        />
        <p className="text-[11px] text-muted-foreground">
          {resolved.clamped
            ? `Limited to ${resolved.width}×${resolved.height} by the browser canvas limit.`
            : `Final file: ${resolved.width} × ${resolved.height} px (${((resolved.width * resolved.height) / 1_000_000).toFixed(1)} MP).`}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {output.lockAspect ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
          {output.lockAspect ? 'Width and height stay linked' : 'Width and height are independent'}
        </div>
      </Section>

      <Section title="Format" description={EXPORT_FORMATS.find((f) => f.value === exportSettings.format)?.hint}>
        <SegmentedField
          label="File format"
          value={exportSettings.format}
          options={EXPORT_FORMATS.map((format) => ({ value: format.value, label: format.label }))}
          onValueChange={(format) => setExportSettings({ format })}
        />
        {qualityApplies ? (
          <SliderField
            label="Quality"
            value={exportSettings.quality}
            min={0.3}
            max={1}
            step={0.01}
            unit={` (${Math.round(exportSettings.quality * 100)}%)`}
            onValueChange={(quality) => setExportSettings({ quality }, 'export.quality')}
          />
        ) : (
          <p className="text-[11px] text-muted-foreground">PNG is lossless, so quality does not apply.</p>
        )}
      </Section>

      <Section title="File name" description={exportSettings.fileNameTemplate}>
        <TextField
          label="Sheet template"
          value={exportSettings.fileNameTemplate}
          mono
          onValueChange={(fileNameTemplate) => setExportSettings({ fileNameTemplate }, 'export.name')}
        />
        <div className="flex flex-wrap gap-1">
          {FILENAME_TOKENS.map((token) => (
            <button
              key={token.token}
              type="button"
              title={token.hint}
              onClick={() =>
                setExportSettings({
                  fileNameTemplate: `${exportSettings.fileNameTemplate}${token.token}`,
                })
              }
              className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {token.token}
            </button>
          ))}
        </div>
      </Section>

      {lastAction ? (
        <p className="px-1 text-[11px] text-muted-foreground">Last change: {lastAction}</p>
      ) : null}
    </div>
  )
}
