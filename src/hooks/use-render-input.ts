import { useMemo } from 'react'

import type { RenderInput } from '@/core/model'
import { useDocumentStore } from '@/store/document-store'
import { useMaterialsStore } from '@/store/materials-store'

/**
 * The single input the renderer, the preview and every export path consume.
 * Assembled in one hook so no screen can accidentally build a different scene.
 */
export function useRenderInput(): RenderInput {
  const doc = useDocumentStore((state) => state.doc)
  const materials = useMaterialsStore((state) => state.materials)
  const overrides = useMaterialsStore((state) => state.overrides)

  return useMemo(() => ({ document: doc, materials, overrides }), [doc, materials, overrides])
}
