import { useCallback, useRef, useState } from 'react'
import { FolderOpen, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ACCEPT_ATTRIBUTE } from '@/core/constants'
import { cn } from '@/core/utils'
import { acceptedFilesLabel, useFileIngest } from '@/hooks/use-file-ingest'
import { useUiStore } from '@/store/ui-store'

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const ingest = useFileIngest()
  const notify = useUiStore((state) => state.notify)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setDragging] = useState(false)
  const [isBusy, setBusy] = useState(false)
  // Nested elements fire dragleave; a counter avoids flicker on re-entry.
  const dragDepth = useRef(0)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setBusy(true)
      try {
        const result = await ingest(files)
        if (result.added.length > 0) {
          notify(`${result.added.length} material${result.added.length === 1 ? '' : 's'} added`)
        }
        if (result.rejected.length > 0) {
          notify(`${result.rejected.length} file(s) skipped`, 'error')
        }
      } finally {
        setBusy(false)
      }
    },
    [ingest, notify]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      dragDepth.current = 0
      setDragging(false)
      void handleFiles(event.dataTransfer.files)
    },
    [handleFiles]
  )

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault()
        dragDepth.current += 1
        setDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        dragDepth.current -= 1
        if (dragDepth.current <= 0) setDragging(false)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center transition-colors',
        compact ? 'px-4 py-5' : 'px-6 py-10',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/40'
      )}
    >
      <div
        className={cn(
          'rounded-full bg-background p-2.5 shadow-sm ring-1 ring-border transition-transform',
          isDragging && 'scale-110'
        )}
      >
        {isBusy ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-5 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isDragging ? 'Drop to add materials' : 'Drag & drop texture images'}
        </p>
        {!compact ? (
          <p className="text-xs text-muted-foreground">
            {acceptedFilesLabel()} — or browse from disk. Everything stays on this machine.
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
      >
        <FolderOpen />
        Browse files
      </Button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={(event) => {
          void handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
