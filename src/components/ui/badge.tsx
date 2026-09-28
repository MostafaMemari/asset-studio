import type * as React from 'react'

import { cn } from '@/core/utils'

export function Badge({
  className,
  tone = 'muted',
  ...props
}: React.ComponentProps<'span'> & {
  tone?: 'muted' | 'accent' | 'outline' | 'danger'
}) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase',
        tone === 'muted' && 'bg-muted text-muted-foreground',
        tone === 'accent' && 'bg-primary/10 text-primary',
        tone === 'outline' && 'border border-border text-muted-foreground',
        tone === 'danger' && 'bg-destructive/10 text-destructive',
        className
      )}
      {...props}
    />
  )
}
