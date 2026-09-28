import { useState } from 'react'

import { ColorRow, NumberField, SegmentedField, SelectField, SliderField, SwitchRow } from '@/components/fields'
import { Section } from '@/components/ui/section'
import { ASPECT_PRESETS, BACKGROUND_SWATCHES, LAYOUT_FITS, LAYOUT_MODES, MAX_COLUMNS } from '@/core/constants'
import { useLayoutSettings, useOutputSettings } from '@/store/document-store'

const ASPECT_OPTIONS = [
  ...ASPECT_PRESETS.map((preset) => ({
    value: String(preset.value),
    label: `${preset.label} (${preset.value.toFixed(2)})`,
  })),
  { value: 'custom', label: 'Custom ratio' },
]

export function LayoutSection() {
  const { layout, setLayout } = useLayoutSettings()
  const { output, setOutput } = useOutputSettings()
  const [linkGaps, setLinkGaps] = useState(true)

  const fitHint = LAYOUT_FITS.find((entry) => entry.value === layout.fit)?.hint

  return (
    <div className="space-y-4">
      <Section title="Composition" description={`${layout.mode} layout`}>
        <SegmentedField
          label="Layout"
          value={layout.mode}
          options={LAYOUT_MODES}
          onValueChange={(value) => setLayout({ mode: value })}
        />

        <NumberField
          label="Columns"
          value={layout.columns}
          min={1}
          max={MAX_COLUMNS}
          onValueChange={(columns) => setLayout({ columns }, 'layout.columns')}
        />

        {layout.mode === 'masonry' ? (
          <p className="text-[11px] text-muted-foreground">
            Masonry keeps every image at its own aspect ratio and packs the shortest column first.
          </p>
        ) : null}
      </Section>

      <Section title="Spacing">
        <SliderField
          label="Gap (horizontal)"
          value={layout.gapX}
          min={0}
          max={200}
          unit=" px"
          onValueChange={(gapX) => setLayout({ gapX, gapY: linkGaps ? gapX : layout.gapY }, 'layout.gapX')}
        />
        <SliderField
          label="Gap (vertical)"
          value={layout.gapY}
          min={0}
          max={200}
          unit=" px"
          onValueChange={(gapY) => setLayout({ gapY, gapX: linkGaps ? gapY : layout.gapX }, 'layout.gapY')}
        />
        <SwitchRow
          label="Link gaps"
          description="Keep both gaps equal"
          checked={linkGaps}
          onCheckedChange={setLinkGaps}
        />
        <SliderField
          label="Outer padding"
          value={layout.padding}
          min={0}
          max={400}
          unit=" px"
          onValueChange={(padding) => setLayout({ padding }, 'layout.padding')}
        />
      </Section>

      <Section title="Tiles" description="Sizing of a single cell">
        <SegmentedField
          label="Tile sizing"
          value={layout.tileSizing}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'fixed', label: 'Fixed' },
          ]}
          hint={layout.tileSizing === 'auto' ? 'derived from canvas' : `${layout.tileSize} px`}
          onValueChange={(value) => setLayout({ tileSizing: value })}
        />

        {layout.tileSizing === 'fixed' ? (
          <SliderField
            label="Tile size"
            value={layout.tileSize}
            min={64}
            max={2400}
            step={2}
            unit=" px"
            onValueChange={(tileSize) => setLayout({ tileSize }, 'layout.tileSize')}
          />
        ) : null}

        {layout.mode === 'grid' ? (
          <SelectField
            label="Tile aspect ratio"
            value={
              ASPECT_PRESETS.some((preset) => Math.abs(preset.value - layout.tileAspect) < 0.001)
                ? String(layout.tileAspect)
                : 'custom'
            }
            options={ASPECT_OPTIONS}
            onValueChange={(value) => {
              if (value !== 'custom') setLayout({ tileAspect: Number(value) })
            }}
          />
        ) : null}

        {layout.mode === 'grid' && !ASPECT_PRESETS.some((p) => Math.abs(p.value - layout.tileAspect) < 0.001) ? (
          <SliderField
            label="Custom aspect"
            value={layout.tileAspect}
            min={0.2}
            max={4}
            step={0.01}
            onValueChange={(tileAspect) => setLayout({ tileAspect }, 'layout.tileAspect')}
          />
        ) : null}
      </Section>

      <Section title="Fit to canvas" description={fitHint}>
        <SegmentedField
          label="Fit"
          value={layout.fit}
          options={LAYOUT_FITS}
          onValueChange={(value) => setLayout({ fit: value })}
        />
        <p className="text-[11px] text-muted-foreground">
          {layout.fit === 'crop'
            ? 'Tiles are scaled up until the sheet covers the canvas; the overflow is clipped.'
            : layout.fit === 'fit'
              ? 'The sheet is only ever shrunk, so tiles never get blurry.'
              : 'The sheet is scaled so it always spans the full canvas.'}
        </p>
      </Section>

      <Section title="Background">
        <ColorRow
          label="Canvas colour"
          value={output.backgroundColor}
          swatches={BACKGROUND_SWATCHES}
          onValueChange={(backgroundColor) => setOutput({ backgroundColor }, 'output.background')}
        />
        <p className="text-[11px] text-muted-foreground">
          JPEG has no alpha channel, so this colour is also the JPG matte.
        </p>
      </Section>
    </div>
  )
}
