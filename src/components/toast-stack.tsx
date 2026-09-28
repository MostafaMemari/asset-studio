import { useEffect } from 'react'
import { CircleCheck, CircleX } from 'lucide-react'

import { cn } from '@/core/utils'
import { useUiStore } from '@/store/ui-store'

export function ToastStack() {
  const toasts = useUiStore((state) => state.toasts)
  const dismiss = useUiStore((state) => state.dismiss)

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((toast) =>
      setTimeout(() => dismiss(toast.id), toast.tone === 'error' ? 6000 : 3200)
    )
    return () => timers.forEach(clearTimeout)
  }, [dismiss, toasts])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-16 right-4 z-50 flex w-72 flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={cn(
            'pointer-events-auto flex items-start gap-2 rounded-lg border bg-popover px-3 py-2 text-left text-[13px] shadow-lg',
            toast.tone === 'error' ? 'border-destructive/50 text-destructive' : 'text-foreground'
          )}
        >
          {toast.tone === 'error' ? (
            <CircleX className="mt-px size-4 shrink-0" />
          ) : (
            <CircleCheck className="mt-px size-4 shrink-0 text-primary" />
          )}
          <span className="min-w-0 flex-1">{toast.message}</span>
        </button>
      ))}
    </div>
  )
}
