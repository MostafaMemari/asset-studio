import {
  ChevronDown,
  Download,
  Loader2,
  PackageOpen,
  PanelLeftOpen,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { APP_NAME } from '@/core/constants'
import { useExportActions } from '@/hooks/use-export-actions'
import { useDocumentHistory } from '@/store/document-store'
import { useMaterialsStore } from '@/store/materials-store'
import { describePreset, useAllPresets, usePresetsStore } from '@/store/presets-store'
import { useUiStore } from '@/store/ui-store'

export function TopBar() {
  const { canUndo, canRedo, undo, redo, resetToDefaults } = useDocumentHistory()
  const { isBusy, phase, exportOne, exportBatch } = useExportActions()
  const count = useMaterialsStore((state) => state.materials.length)
  const toggleInspector = useUiStore((state) => state.toggleInspector)
  const inspectorOpen = useUiStore((state) => state.inspectorOpen)

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3">
      <div className="flex items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <PackageOpen className="size-4" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold">{APP_NAME}</h1>
          <p className="text-[11px] text-muted-foreground">
            Offline material preview generator
          </p>
        </div>
      </div>

      <div className="ml-2 flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={undo}
              disabled={!canUndo || isBusy}
              aria-label="Undo"
            >
              <Undo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={redo}
              disabled={!canRedo || isBusy}
              aria-label="Redo"
            >
              <Redo2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={resetToDefaults}
              disabled={isBusy}
              aria-label="Reset all settings"
            >
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset settings</TooltipContent>
        </Tooltip>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <PresetSwitcher />

        {!inspectorOpen ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleInspector}
                aria-label="Show inspector"
              >
                <PanelLeftOpen />
                Inspector
              </Button>
            </TooltipTrigger>
            <TooltipContent>Show inspector panel</TooltipContent>
          </Tooltip>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void exportBatch()}
          disabled={count === 0 || isBusy}
        >
          {phase?.kind === 'batch' ? <Loader2 className="animate-spin" /> : <PackageOpen />}
          Batch
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={() => void exportOne()}
          disabled={count === 0 || isBusy}
        >
          {phase?.kind === 'single' || (isBusy && phase?.kind === 'batch') ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          Export
        </Button>
      </div>
    </header>
  )
}

function PresetSwitcher() {
  const presets = useAllPresets()
  const activeId = usePresetsStore((state) => state.activeId)
  const apply = usePresetsStore((state) => state.apply)
  const saveCurrent = usePresetsStore((state) => state.saveCurrent)
  const notify = useUiStore((state) => state.notify)
  const [name, setName] = useState('')

  const active = presets.find((preset) => preset.id === activeId)

  return (
    <Menu
      trigger={({ open, toggle }) => (
        <Button type="button" size="sm" variant="outline" onClick={toggle}>
          <Save />
          {active ? active.name : 'No preset'}
          <ChevronDown className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </Button>
      )}
    >
      {(close) => (
        <div className="w-72">
          <MenuLabel>Built-in</MenuLabel>
          {presets
            .filter((preset) => preset.group === 'builtin')
            .map((preset) => (
              <MenuItem
                key={preset.id}
                active={preset.id === activeId}
                icon={<Save />}
                onSelect={() => {
                  apply(preset)
                  close()
                }}
              >
                {preset.name}
                <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                  {describePreset(preset)}
                </span>
              </MenuItem>
            ))}

          {presets.some((preset) => preset.group === 'user') ? (
            <>
              <MenuSeparator />
              <MenuLabel>Saved</MenuLabel>
              {presets
                .filter((preset) => preset.group === 'user')
                .map((preset) => (
                  <MenuItem
                    key={preset.id}
                    active={preset.id === activeId}
                    icon={<Save />}
                    onSelect={() => {
                      apply(preset)
                      close()
                    }}
                  >
                    {preset.name}
                  </MenuItem>
                ))}
            </>
          ) : null}

          <MenuSeparator />
          <div className="flex gap-1.5 p-1">
            <Input
              value={name}
              placeholder="Save current as…"
              className="h-7 text-xs"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                const preset = saveCurrent(name)
                setName('')
                notify(`Saved preset "${preset.name}"`)
                close()
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7"
              disabled={name.trim().length === 0}
              onClick={() => {
                const preset = saveCurrent(name)
                setName('')
                notify(`Saved preset "${preset.name}"`)
                close()
              }}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </Menu>
  )
}
