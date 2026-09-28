import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/core/utils'

type MenuProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'
  className?: string
}

/** Lightweight popover menu: click to toggle, Escape or outside click to close. */
export function Menu({ trigger, children, align = 'start', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <div aria-haspopup="menu" aria-expanded={open} aria-controls={open ? labelId : undefined}>
        {trigger({ open, toggle: () => setOpen((value) => !value) })}
      </div>
      {open ? (
        <div
          id={labelId}
          role="menu"
          className={cn(
            'absolute top-[calc(100%+6px)] z-50 min-w-56 rounded-lg border bg-popover p-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  )
}

type MenuItemProps = {
  children: ReactNode
  onSelect?: () => void
  active?: boolean
  danger?: boolean
  icon?: ReactNode
  disabled?: boolean
  className?: string
}

export function MenuItem({
  children,
  onSelect,
  active,
  danger,
  icon,
  disabled,
  className,
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors',
        'hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
        danger && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
        active && 'bg-accent/60 font-medium',
        className
      )}
    >
      {icon ? <span className="text-muted-foreground [&_svg:not([class*=size-])]:size-3.5">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </p>
  )
}
