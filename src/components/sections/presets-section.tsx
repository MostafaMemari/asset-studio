import { Check, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { LAYOUT_MODES } from '@/core/constants'
import { cn } from '@/core/utils'
import { useUiStore } from '@/store/ui-store'
import { describePreset, useAllPresets, usePresetsStore } from '@/store/presets-store'
import type { Preset } from '@/types/preset'

export function PresetsSection() {
  const presets = useAllPresets()
  const activeId = usePresetsStore((state) => state.activeId)
  const apply = usePresetsStore((state) => state.apply)
  const saveCurrent = usePresetsStore((state) => state.saveCurrent)
  const removeUser = usePresetsStore((state) => state.removeUser)
  const notify = useUiStore((state) => state.notify)
  const [name, setName] = useState('')

  const builtins = presets.filter((preset) => preset.group === 'builtin')
  const users = presets.filter((preset) => preset.group === 'user')

  const save = () => {
    const preset = saveCurrent(name)
    setName('')
    notify(`Saved "${preset.name}"`)
  }

  return (
    <div className="space-y-4">
      <Section title="Built-in presets" description="Shipped with the studio">
        <ul className="space-y-1.5">
          {builtins.map((preset) => (
            <PresetRow
              key={preset.id}
              preset={preset}
              active={preset.id === activeId}
              onApply={() => {
                apply(preset)
                notify(`Applied ${preset.name}`)
              }}
            />
          ))}
        </ul>
      </Section>

      <Section title="Saved presets" description={`${users.length} stored locally`}>
        <div className="flex gap-1.5">
          <Input
            value={name}
            placeholder="Preset name"
            className="h-8 text-xs"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && name.trim()) save()
            }}
          />
          <Button type="button" size="sm" disabled={name.trim().length === 0} onClick={save}>
            <Save />
            Save
          </Button>
        </div>

        {users.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Nothing saved yet. A preset stores canvas size, grid, background, image styling,
            typography, watermarks and export settings.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {users.map((preset) => (
              <PresetRow
                key={preset.id}
                preset={preset}
                active={preset.id === activeId}
                onApply={() => {
                  apply(preset)
                  notify(`Applied ${preset.name}`)
                }}
                onDelete={() => {
                  removeUser(preset.id)
                  notify(`Deleted ${preset.name}`)
                }}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

type PresetRowProps = {
  preset: Preset
  active: boolean
  onApply: () => void
  onDelete?: () => void
}

function PresetRow({ preset, active, onApply, onDelete }: PresetRowProps) {
  const mode = preset.document.layout.mode
  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors',
        active ? 'border-primary bg-accent/40' : 'border-border/70 hover:border-muted-foreground/40'
      )}
    >
      <button type="button" onClick={onApply} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          {active ? <Check className="size-3 shrink-0 text-primary" /> : null}
          <span className="truncate text-[13px] font-medium">{preset.name}</span>
        </span>
        <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
          {describePreset(preset)} · {LAYOUT_MODES.find((entry) => entry.value === mode)?.label}
        </span>
      </button>
      <Badge tone={active ? 'accent' : 'outline'}>
        {preset.document.watermark.enabled
          ? `${preset.document.watermark.layers.length} wm`
          : 'no wm'}
      </Badge>
      {onDelete ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="size-6 text-destructive"
          aria-label={`Delete preset ${preset.name}`}
          onClick={onDelete}
        >
          <Trash2 className="size-3" />
        </Button>
      ) : null}
    </li>
  )
}
