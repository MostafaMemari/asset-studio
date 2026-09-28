import { ChevronDown } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/core/utils'

type SelectProps = React.ComponentProps<'select'> & {
  options: readonly { value: string; label: string }[]
}

/**
 * Native select with a styled shell: it keeps full keyboard support, screen
 * reader semantics and OS rendering, which matters for a tool used all day.
 */
function Select({ className, options, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          'h-8 w-full appearance-none truncate rounded-md border border-input bg-background py-1 pr-7 pl-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
