import * as React from 'react'

import { ColorField, ColorSwatches } from '@/components/color-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/core/utils'

type FieldProps = {
  label: string
  htmlFor?: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Field({ label, htmlFor, hint, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-[13px]">
            {label}
          </Label>
        ) : (
          <span className="text-[13px] leading-none font-medium">{label}</span>
        )}
        {hint ? <span className="font-mono text-[11px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

type SliderFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  disabled?: boolean
  onValueChange: (value: number) => void
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled,
  onValueChange,
}: SliderFieldProps) {
  return (
    <Field label={label} hint={`${round(value, step)}${unit}`}>
      <Slider
        thumbLabel={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([next]) => {
          if (next !== undefined && next !== value) onValueChange(next)
        }}
      />
    </Field>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  suffix?: string
  disabled?: boolean
  onValueChange: (value: number) => void
  coalesceKey?: string
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  disabled,
  onValueChange,
}: NumberFieldProps) {
  const id = React.useId()

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={
        suffix ? (
          <span className="flex items-center gap-1">
            <input
              type="number"
              value={round(value, step)}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (Number.isFinite(next)) onValueChange(next)
              }}
              className="h-5 w-14 rounded border border-input bg-background px-1 text-right font-mono text-[11px] outline-none focus-visible:ring-[2px] focus-visible:ring-ring/50"
            />
            <span className="text-[10px]">{suffix}</span>
          </span>
        ) : undefined
      }
    >
      <Slider
        thumbLabel={label}
        value={[value]}
        min={min ?? 0}
        max={max ?? 100}
        step={step}
        disabled={disabled}
        onValueChange={([next]) => {
          if (next !== undefined && next !== value) onValueChange(next)
        }}
      />
    </Field>
  )
}

type TextFieldProps = {
  label: string
  value: string
  placeholder?: string
  hint?: React.ReactNode
  mono?: boolean
  onValueChange: (value: string) => void
}

export function TextField({
  label,
  value,
  placeholder,
  hint,
  mono,
  onValueChange,
}: TextFieldProps) {
  const id = React.useId()
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(mono && 'font-mono text-xs')}
      />
    </Field>
  )
}

type SelectFieldProps = {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  hint?: React.ReactNode
  onValueChange: (value: string) => void
}

export function SelectField({ label, value, options, hint, onValueChange }: SelectFieldProps) {
  const id = React.useId()
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Select
        id={id}
        value={value}
        options={options}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </Field>
  )
}

type SegmentedOption<T extends string> = { value: T; label: string }

type SegmentedFieldProps<T extends string> = {
  label: string
  value: T
  /** Extra keys are allowed so option lists can carry their own hints. */
  options: readonly (SegmentedOption<T> & Record<string, unknown>)[]
  hint?: React.ReactNode
  disabled?: boolean
  onValueChange: (value: T) => void
  className?: string
}

export function SegmentedField<T extends string>({
  label,
  value,
  options,
  hint,
  disabled,
  onValueChange,
  className,
}: SegmentedFieldProps<T>) {
  return (
    <Field label={label} hint={hint} className={className}>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onValueChange(next as T)
        }}
        variant="outline"
        className="w-full"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={disabled}
            className="text-xs"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}

type SwitchRowProps = {
  label: string
  description?: string
  htmlFor?: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function SwitchRow({
  label,
  description,
  htmlFor,
  checked,
  disabled,
  onCheckedChange,
  className,
}: SwitchRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-0.5', className)}>
      <div className="min-w-0 space-y-0.5">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-[13px]">
            {label}
          </Label>
        ) : (
          <span className="text-[13px] leading-none font-medium">{label}</span>
        )}
        {description ? <p className="text-[11px] text-muted-foreground">{description}</p> : null}
      </div>
      <Switch
        id={htmlFor}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
      />
    </div>
  )
}

type ColorRowProps = {
  label: string
  value: string
  swatches?: readonly { label: string; value: string }[]
  onValueChange: (value: string) => void
}

export function ColorRow({ label, value, swatches, onValueChange }: ColorRowProps) {
  return (
    <div className="space-y-2">
      <ColorField label={label} value={value} onChange={onValueChange} />
      {swatches ? <ColorSwatches colors={swatches} value={value} onChange={onValueChange} /> : null}
    </div>
  )
}

function round(value: number, step: number): number {
  const decimals = step >= 1 ? 0 : String(step).split('.')[1]?.length ?? 2
  return Number(value.toFixed(decimals))
}
