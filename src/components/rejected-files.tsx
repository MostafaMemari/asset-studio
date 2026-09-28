import { TriangleAlert, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useMaterialsStore } from '@/store/materials-store'

export function RejectedFiles() {
  const rejected = useMaterialsStore((state) => state.rejected)
  const clearRejected = useMaterialsStore((state) => state.clearRejected)

  if (rejected.length === 0) return null

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
      <div className="flex items-center gap-2">
        <TriangleAlert className="size-4 shrink-0 text-destructive" />
        <p className="flex-1 text-[13px] font-medium">
          {rejected.length} file{rejected.length === 1 ? '' : 's'} skipped
        </p>
        <Button type="button" size="icon-sm" variant="ghost" onClick={clearRejected} aria-label="Dismiss">
          <X />
        </Button>
      </div>
      <ul className="mt-2 space-y-0.5">
        {rejected.map((file) => (
          <li key={file.id} className="truncate font-mono text-[11px] text-muted-foreground">
            {file.name} — {file.reason}
          </li>
        ))}
      </ul>
    </div>
  )
}
