import { useCallback, useState } from 'react'

export type DragItemProps = {
  isDragging: boolean
  isDropTarget: boolean
  onDragStart: (event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent) => void
  onDragEnd: () => void
}

/**
 * Pointer-driven reorder state for a flat list of siblings. The consumer only
 * supplies the commit callback; all transient drag state stays in here.
 */
export function useDragOrder(onMove: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const reset = useCallback(() => {
    setDragIndex(null)
    setOverIndex(null)
  }, [])

  const getItemProps = useCallback(
    (index: number): DragItemProps => ({
      isDragging: dragIndex === index,
      isDropTarget: overIndex === index && dragIndex !== index,
      onDragStart: (event) => {
        event.dataTransfer.effectAllowed = 'move'
        // Firefox refuses to begin a drag without payload.
        event.dataTransfer.setData('text/plain', String(index))
        setDragIndex(index)
      },
      onDragOver: (event) => {
        if (dragIndex === null || dragIndex === index) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setOverIndex(index)
      },
      onDragLeave: () => setOverIndex((current) => (current === index ? null : current)),
      onDrop: (event) => {
        event.preventDefault()
        if (dragIndex !== null && dragIndex !== index) onMove(dragIndex, index)
        reset()
      },
      onDragEnd: reset,
    }),
    [dragIndex, overIndex, onMove, reset]
  )

  return { dragIndex, getItemProps }
}
