import { useEffect, useRef } from 'react'

import { useFileIngest } from '@/hooks/use-file-ingest'
import { useUiStore } from '@/store/ui-store'

/** Lets users drop files anywhere in the window, not only on the drop zone. */
export function useGlobalDrop(): void {
  const ingest = useFileIngest()
  const notify = useUiStore((state) => state.notify)
  const depth = useRef(0)

  useEffect(() => {
    const onEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return
      depth.current += 1
    }
    const onLeave = () => {
      depth.current = Math.max(0, depth.current - 1)
    }
    const onOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }
    const onDrop = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return
      event.preventDefault()
      depth.current = 0
      const files = event.dataTransfer.files
      if (files.length === 0) return
      void ingest(files).then((result) => {
        if (result.added.length > 0) {
          notify(`Added ${result.added.length} material${result.added.length === 1 ? '' : 's'}`)
        } else if (result.rejected.length > 0) {
          notify(`${result.rejected.length} file(s) skipped`, 'error')
        }
      })
    }

    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [ingest, notify])
}
