import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Grid3x3,
  GripVertical,
  ImagePlus,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { ColorRow, NumberField, SegmentedField, SelectField, SliderField, SwitchRow, TextField } from '@/components/fields'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { BLEND_MODES, WATERMARK_ANCHORS } from '@/core/constants'
import { FONT_FAMILIES, FONT_WEIGHTS } from '@/core/fonts'
import { createWatermarkAsset } from '@/core/image'
import { cn } from '@/core/utils'
import { useUiStore } from '@/store/ui-store'
import { useWatermarkAssets, useWatermarkSettings } from '@/store/document-store'
import type {
  BlendMode,
  WatermarkAnchor,
  WatermarkKind,
  WatermarkLayer,
} from '@/types/watermark'

const KIND_LABELS: Record<WatermarkKind, string> = {
  text: 'Text',
  image: 'Image',
  combo: 'Text + image',
}

const ANCHOR_GRID: WatermarkAnchor[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

export function WatermarkSection() {
  const { watermark, setWatermarkEnabled, addWatermarkLayer, removeWatermarkLayer, duplicateWatermarkLayer, moveWatermarkLayer, updateWatermarkLayer } =
    useWatermarkSettings()
  const { assets, addWatermarkAsset, removeWatermarkAsset } = useWatermarkAssets()
  const notify = useUiStore((state) => state.notify)
  const selectedLayerId = useUiStore((state) => state.selectedLayerId)
  const setSelectedLayerId = useUiStore((state) => state.setSelectedLayerId)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [pendingKind, setPendingKind] = useState<WatermarkKind>('image')

  const activeId = selectedLayerId ?? watermark.layers[0]?.id ?? null
  const active = watermark.layers.find((layer) => layer.id === activeId) ?? null

  const onUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    try {
      const asset = await createWatermarkAsset(file)
      addWatermarkAsset(asset)
      const id = addWatermarkLayer({
        kind: pendingKind,
        name: asset.name.replace(/\.[^.]+$/, ''),
        assetId: asset.id,
        mode: 'single',
      })
      setSelectedLayerId(id)
      notify(`Watermark image added`)
    } catch {
      notify('Could not read that image', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <Section title="Watermarks" description={`${watermark.layers.length} layer(s)`}>
        <SwitchRow
          label="Enable watermarks"
          description="Drawn above tiles and captions"
          checked={watermark.enabled}
          onCheckedChange={setWatermarkEnabled}
        />

        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setSelectedLayerId(addWatermarkLayer({ kind: 'text' }))}
          >
            <Plus />
            Text
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setPendingKind('image')
              uploadRef.current?.click()
            }}
          >
            <ImagePlus />
            Image
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setPendingKind('combo')
              uploadRef.current?.click()
            }}
          >
            <Layers />
            Text + image
          </Button>
        </div>

        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          data-testid="watermark-image-input"
          aria-label="Upload watermark image"
          className="sr-only"
          onChange={(event) => {
            void onUpload(event.target.files)
            event.target.value = ''
          }}
        />
      </Section>

      <Section title="Layers" defaultOpen={true}>
        {watermark.layers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No watermark layers yet.</p>
        ) : (
          <ul className="space-y-1">
            {watermark.layers.map((layer, index) => {
              const open = layer.id === activeId
              return (
                <li key={layer.id}>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-1.5 py-1.5',
                      open ? 'border-primary bg-accent/40' : 'border-border/70'
                    )}
                  >
                    <GripVertical className="size-3 shrink-0 text-muted-foreground/60" />
                    <button
                      type="button"
                      onClick={() => setSelectedLayerId(open ? null : layer.id)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    >
                      <ChevronDown
                        className={cn('size-3 shrink-0 text-muted-foreground', open ? '' : '-rotate-90')}
                      />
                      <span className="truncate text-[12px] font-medium">{layer.name}</span>
                    </button>
                    <Badge>{KIND_LABELS[layer.kind]}</Badge>
                    <Badge tone="outline">{layer.mode}</Badge>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="size-6"
                      aria-label={layer.enabled ? `Hide ${layer.name}` : `Show ${layer.name}`}
                      aria-pressed={layer.enabled}
                      onClick={() => updateWatermarkLayer(layer.id, { enabled: !layer.enabled })}
                    >
                      {layer.enabled ? <Eye /> : <EyeOff />}
                    </Button>
                  </div>

                  {open ? (
                    <div className="mt-1 space-y-1 rounded-b-md border-x border-b border-border/70 px-1 pb-1">
                      <div className="flex gap-1 pt-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="size-6"
                          aria-label="Move layer up"
                          disabled={index === 0}
                          onClick={() => moveWatermarkLayer(layer.id, -1)}
                        >
                          <ChevronDown className="rotate-180" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="size-6"
                          aria-label="Move layer down"
                          disabled={index === watermark.layers.length - 1}
                          onClick={() => moveWatermarkLayer(layer.id, 1)}
                        >
                          <ChevronDown />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="size-6"
                          aria-label="Duplicate layer"
                          onClick={() => {
                            duplicateWatermarkLayer(layer.id)
                            notify('Layer duplicated')
                          }}
                        >
                          <Copy />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="ml-auto size-6 text-destructive"
                          aria-label="Delete layer"
                          onClick={() => {
                            removeWatermarkLayer(layer.id)
                            setSelectedLayerId(null)
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      <TextField
                        label="Layer name"
                        value={layer.name}
                        onValueChange={(name) => updateWatermarkLayer(layer.id, { name }, 'wm.name')}
                      />

                      <SegmentedField
                        label="Type"
                        value={layer.kind}
                        options={[
                          { value: 'text', label: 'Text' },
                          { value: 'image', label: 'Image' },
                          { value: 'combo', label: 'Both' },
                        ]}
                        onValueChange={(kind) => updateWatermarkLayer(layer.id, { kind })}
                      />

                      <SegmentedField
                        label="Mode"
                        value={layer.mode}
                        options={[
                          { value: 'single', label: 'Single' },
                          { value: 'tiled', label: 'Tiled' },
                        ]}
                        onValueChange={(mode) => updateWatermarkLayer(layer.id, { mode })}
                      />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      {active ? (
        <LayerEditor
          layer={active}
          update={(patch, key) => updateWatermarkLayer(active.id, patch, key)}
        />
      ) : null}

      {Object.keys(assets).length > 0 ? (
        <Section title="Image library" defaultOpen={false}>
          <ul className="grid grid-cols-3 gap-2">
            {Object.values(assets).map((asset) => (
              <li key={asset.id} className="group relative">
                <img
                  src={asset.dataUrl}
                  alt={asset.name}
                  className="checkerboard aspect-square w-full rounded-md border object-contain p-1"
                />
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{asset.name}</p>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="destructive"
                  className="absolute top-1 right-1 size-5 opacity-0 group-hover:opacity-100"
                  aria-label={`Delete ${asset.name}`}
                  onClick={() => removeWatermarkAsset(asset.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  )
}

type LayerEditorProps = {
  layer: WatermarkLayer
  update: (patch: Partial<WatermarkLayer>, coalesceKey?: string) => void
}

function LayerEditor({ layer, update }: LayerEditorProps) {
  const { assets } = useWatermarkAssets()
  const asset = layer.assetId ? assets[layer.assetId] : undefined
  const fontOptions = FONT_FAMILIES.some((family) => family.value === layer.fontFamily)
    ? FONT_FAMILIES
    : [{ value: layer.fontFamily, label: layer.fontFamily }, ...FONT_FAMILIES]

  return (
    <>
      <Section title="Content" description={KIND_LABELS[layer.kind]}>
        {layer.kind !== 'image' ? (
          <>
            <TextField
              label="Text"
              value={layer.text}
              mono
              onValueChange={(text) => update({ text }, 'wm.text')}
            />
            <SelectField
              label="Font"
              value={layer.fontFamily}
              options={fontOptions.map((family) => ({ value: family.value, label: family.label }))}
              onValueChange={(fontFamily) => update({ fontFamily })}
            />
            <SelectField
              label="Weight"
              value={String(layer.fontWeight)}
              options={FONT_WEIGHTS.map((weight) => ({ value: String(weight.value), label: weight.label }))}
              onValueChange={(value) => update({ fontWeight: Number(value) })}
            />
            <NumberField
              label="Font size"
              value={layer.fontSize}
              min={6}
              max={400}
              suffix="px"
              onValueChange={(fontSize) => update({ fontSize }, 'wm.fontSize')}
            />
            <ColorRow label="Colour" value={layer.color} onValueChange={(color) => update({ color })} />
            <SliderField
              label="Letter spacing"
              value={layer.letterSpacing}
              min={-20}
              max={80}
              step={0.5}
              onValueChange={(letterSpacing) => update({ letterSpacing }, 'wm.tracking')}
            />
          </>
        ) : null}

        {layer.kind !== 'text' ? (
          <div className="space-y-2">
            <span className="text-[13px] leading-none font-medium">Image</span>
            {asset ? (
              <div className="flex items-center gap-2 rounded-md border p-1.5">
                <img
                  src={asset.dataUrl}
                  alt={asset.name}
                  className="checkerboard size-10 rounded border object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px]">{asset.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {asset.width}×{asset.height}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                No image selected. Add one from the Watermarks panel above.
              </p>
            )}
            {layer.kind === 'combo' ? (
              <NumberField
                label="Image / text gap"
                value={layer.comboGap}
                min={0}
                max={200}
                suffix="px"
                onValueChange={(comboGap) => update({ comboGap }, 'wm.comboGap')}
              />
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section title="Transform" description="Live on the canvas">
        <SliderField
          label="Opacity"
          value={layer.opacity}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(opacity) => update({ opacity }, 'wm.opacity')}
        />
        <SliderField
          label="Scale"
          value={layer.scale}
          min={0.05}
          max={4}
          step={0.01}
          unit="×"
          onValueChange={(scale) => update({ scale }, 'wm.scale')}
        />
        <SliderField
          label="Rotation"
          value={layer.rotation}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onValueChange={(rotation) => update({ rotation }, 'wm.rotation')}
        />
        <SelectField
          label="Blend mode"
          value={layer.blendMode}
          options={BLEND_MODES.map((entry) => ({ value: entry.value, label: entry.label }))}
          hint={
            layer.blendMode === 'multiply' || layer.blendMode === 'screen'
              ? 'applies across the sheet'
              : undefined
          }
          onValueChange={(value) => update({ blendMode: value as BlendMode })}
        />
        <SwitchRow
          label="Drop shadow"
          checked={layer.shadow}
          onCheckedChange={(shadow) => update({ shadow })}
        />
      </Section>

      {layer.mode === 'single' ? (
        <Section title="Placement">
          <div className="space-y-2">
            <span className="text-[13px] leading-none font-medium">Position</span>
            <div className="grid w-fit grid-cols-3 gap-1 rounded-md border bg-muted/30 p-1">
              {ANCHOR_GRID.map((anchor) => (
                <button
                  key={anchor}
                  type="button"
                  aria-label={WATERMARK_ANCHORS.find((entry) => entry.value === anchor)?.label}
                  aria-pressed={layer.anchor === anchor}
                  onClick={() => update({ anchor })}
                  className={cn(
                    'size-6 rounded-sm border transition-colors',
                    layer.anchor === anchor
                      ? 'border-primary bg-primary'
                      : 'border-border bg-background hover:border-muted-foreground/50'
                  )}
                />
              ))}
            </div>
          </div>
          <SliderField
            label="Margin"
            value={layer.margin}
            min={0}
            max={600}
            unit=" px"
            onValueChange={(margin) => update({ margin }, 'wm.margin')}
          />
        </Section>
      ) : (
        <Section title="Tiling" description="Pattern always covers the full canvas">
          <SliderField
            label="Horizontal spacing"
            value={layer.spacingX}
            min={0}
            max={1200}
            unit=" px"
            onValueChange={(spacingX) => update({ spacingX }, 'wm.spacingX')}
          />
          <SliderField
            label="Vertical spacing"
            value={layer.spacingY}
            min={0}
            max={1200}
            unit=" px"
            onValueChange={(spacingY) => update({ spacingY }, 'wm.spacingY')}
          />
          <SliderField
            label="Offset X"
            value={layer.offsetX}
            min={-2000}
            max={2000}
            unit=" px"
            onValueChange={(offsetX) => update({ offsetX }, 'wm.offsetX')}
          />
          <SliderField
            label="Offset Y"
            value={layer.offsetY}
            min={-2000}
            max={2000}
            unit=" px"
            onValueChange={(offsetY) => update({ offsetY }, 'wm.offsetY')}
          />
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Grid3x3 className="mt-px size-3 shrink-0" />
            The grid is laid out in the mark&apos;s own rotated frame, so the pattern reaches every
            corner of the output at any angle.
          </p>
        </Section>
      )}
    </>
  )
}
