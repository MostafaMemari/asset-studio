import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { cn } from '@/core/utils'

type SectionProps = {
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  actions?: ReactNode
}

/** Disclosure group used to keep the inspector dense but scannable. */
export function Section({
  title,
  description,
  children,
  defaultOpen = true,
  className,
  actions,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={cn('border-b border-border/70 last:border-b-0', className)}>
      <div className="flex items-center gap-1 px-1 py-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-accent/50"
        >
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              open ? '' : '-rotate-90'
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {title}
            </span>
            {description && open ? (
              <span className="block truncate text-[11px] text-muted-foreground/80">{description}</span>
            ) : null}
          </span>
        </button>
        {actions}
      </div>
      {open ? <div className="space-y-3.5 px-1 pt-1 pb-4">{children}</div> : null}
    </section>
  )
}
