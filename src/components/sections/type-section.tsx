import { FONT_FAMILIES, FONT_WEIGHTS } from '@/core/fonts'
import { FILENAME_TOKENS, LABEL_PLACEMENTS, TEXT_ALIGNS, TEXT_CASES } from '@/core/constants'
import {
  ColorRow,
  NumberField,
  SegmentedField,
  SelectField,
  SwitchRow,
  TextField,
} from '@/components/fields'
import { Section } from '@/components/ui/section'
import type { TextCase } from '@/types/settings'
import { useTypographySettings } from '@/store/document-store'

const ALIGN_OPTIONS = TEXT_ALIGNS.map((entry) => ({ value: entry.value, label: entry.label }))

export function TypeSection() {
  const { typography, setTypography } = useTypographySettings()

  const fontOptions = FONT_FAMILIES.some((family) => family.value === typography.fontFamily)
    ? FONT_FAMILIES
    : [{ value: typography.fontFamily, label: typography.fontFamily }, ...FONT_FAMILIES]

  return (
    <div className="space-y-4">
      <Section title="Captions" description={typography.enabled ? 'Visible on the sheet' : 'Hidden'}>
        <SwitchRow
          label="Show filenames"
          description="Caption band under or over each tile"
          checked={typography.enabled}
          onCheckedChange={(enabled) => setTypography({ enabled })}
        />
        <SegmentedField
          label="Placement"
          value={typography.placement}
          options={LABEL_PLACEMENTS}
          disabled={!typography.enabled}
          onValueChange={(placement) => setTypography({ placement })}
        />
        <p className="text-[11px] text-muted-foreground">
          {LABEL_PLACEMENTS.find((entry) => entry.value === typography.placement)?.hint}
        </p>
        <SegmentedField
          label="Alignment"
          value={typography.align}
          options={ALIGN_OPTIONS}
          disabled={!typography.enabled}
          onValueChange={(align) => setTypography({ align })}
        />
      </Section>

      <Section title="Typography">
        <SelectField
          label="Font family"
          value={typography.fontFamily}
          options={fontOptions.map((family) => ({ value: family.value, label: family.label }))}
          onValueChange={(fontFamily) => setTypography({ fontFamily })}
        />
        <SelectField
          label="Font weight"
          value={String(typography.fontWeight)}
          options={FONT_WEIGHTS.map((weight) => ({ value: String(weight.value), label: weight.label }))}
          onValueChange={(value) => setTypography({ fontWeight: Number(value) })}
        />
        <NumberField
          label="Font size"
          value={typography.fontSize}
          min={6}
          max={200}
          suffix="px"
          onValueChange={(fontSize) => setTypography({ fontSize }, 'typo.fontSize')}
        />
        <ColorRow
          label="Text colour"
          value={typography.color}
          onValueChange={(color) => setTypography({ color })}
        />
        <SelectField
          label="Letter case"
          value={typography.textCase}
          options={TEXT_CASES.map((entry) => ({
            value: entry.value,
            label: entry.label,
          }))}
          onValueChange={(value) => setTypography({ textCase: value as TextCase })}
        />
        <SwitchRow
          label="Text shadow"
          description="Keeps captions readable on light maps"
          checked={typography.shadow}
          onCheckedChange={(shadow) => setTypography({ shadow })}
        />
      </Section>

      <Section title="Filename formatting" description={typography.template}>
        <TextField
          label="Template"
          value={typography.template}
          mono
          placeholder="{index} {name}"
          onValueChange={(template) => setTypography({ template }, 'typo.template')}
        />
        <div className="flex flex-wrap gap-1">
          {FILENAME_TOKENS.map((token) => (
            <button
              key={token.token}
              type="button"
              title={token.hint}
              onClick={() => setTypography({ template: `${typography.template}${token.token}` })}
              className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {token.token}
            </button>
          ))}
        </div>
        <SwitchRow
          label="Hide index"
          checked={!typography.showIndex}
          onCheckedChange={(hide) => setTypography({ showIndex: !hide })}
        />
        {typography.showIndex ? (
          <NumberField
            label="Index padding"
            value={typography.indexWidth}
            min={0}
            max={4}
            suffix="digits"
            onValueChange={(indexWidth) => setTypography({ indexWidth }, 'typo.indexWidth')}
          />
        ) : null}
        <SwitchRow
          label="Strip file extension"
          checked={typography.stripExtension}
          onCheckedChange={(stripExtension) => setTypography({ stripExtension })}
        />
      </Section>
    </div>
  )
}
