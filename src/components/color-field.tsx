import { useId } from 'react'

import { cn } from '@/core/utils'

type ColorFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ColorField({ label, value, onChange, className }: ColorFieldProps) {
  const fallbackId = useId()
  const id = `color-${fallbackId}`

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <label htmlFor={id} className="text-[13px] leading-none font-medium select-none">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground uppercase">{value}</span>
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-9 cursor-pointer rounded-md border bg-transparent p-1"
          style={{ colorScheme: 'light' }}
        />
      </div>
    </div>
  )
}

type SwatchesProps = {
  colors: readonly { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ColorSwatches({ colors, value, onChange, className }: SwatchesProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {colors.map((color) => (
        <button
          key={color.value}
          type="button"
          title={color.label}
          aria-label={color.label}
          aria-pressed={value === color.value}
          onClick={() => onChange(color.value)}
          style={{ backgroundColor: color.value }}
          className={cn(
            'size-6 rounded-md border transition-transform hover:scale-110',
            value === color.value && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
          )}
        />
      ))}
    </div>
  )
}
