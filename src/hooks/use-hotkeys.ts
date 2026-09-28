import { useEffect } from 'react'

import { useDocumentHistory } from '@/store/document-store'
import { useMaterialsStore } from '@/store/materials-store'
import { useUiStore, type SectionId } from '@/store/ui-store'

/** Studio-wide shortcuts. Ignored while a text field has focus. */
export function useHotkeys(): void {
  const { undo, redo, canUndo, canRedo } = useDocumentHistory()
  const remove = useMaterialsStore((state) => state.remove)
  const selectedId = useMaterialsStore((state) => state.selectedId)
  const select = useMaterialsStore((state) => state.select)
  const materials = useMaterialsStore((state) => state.materials)
  const setSection = useUiStore((state) => state.setSection)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true
      if (isTyping) return

      const meta = event.ctrlKey || event.metaKey
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          if (canRedo) redo()
        } else if (canUndo) {
          undo()
        }
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault()
        remove(selectedId)
        return
      }

      if (event.key === 'Escape') select(null)

      if (event.key === '[' && selectedId) {
        const index = materials.findIndex((material) => material.id === selectedId)
        if (index > 0) useMaterialsStore.getState().move(index, index - 1)
      }
      if (event.key === ']' && selectedId) {
        const index = materials.findIndex((material) => material.id === selectedId)
        if (index >= 0 && index < materials.length - 1) {
          useMaterialsStore.getState().move(index, index + 1)
        }
      }

      const sectionKeys: Record<string, SectionId> = {
        '1': 'files',
        '2': 'layout',
        '3': 'images',
        '4': 'type',
        '5': 'watermark',
        '6': 'output',
        '7': 'export',
        '8': 'presets',
      }
      const section = sectionKeys[event.key]
      if (section) setSection(section)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canRedo, canUndo, materials, redo, remove, select, selectedId, setSection, undo])
}
