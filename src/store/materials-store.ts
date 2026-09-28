import { create } from 'zustand'

import { createMaterialImage, isSupportedImage, revokeMaterial } from '@/core/image'
import type { MaterialImage, MaterialOverride, RejectedFile } from '@/types/assets'

export type IngestResult = {
  added: MaterialImage[]
  rejected: RejectedFile[]
}

type MaterialsState = {
  materials: MaterialImage[]
  rejected: RejectedFile[]
  overrides: Record<string, MaterialOverride>
  selectedId: string | null

  ingest: (files: FileList | File[] | null) => Promise<IngestResult>
  remove: (id: string) => void
  clear: () => void
  clearRejected: () => void
  move: (from: number, to: number) => void
  select: (id: string | null) => void

  setTitle: (id: string, title: string) => void
  setAdjustments: (id: string, patch: Partial<MaterialOverride['adjustments']>) => void
  resetImage: (id: string) => void
  resetAllImages: () => void
}

/**
 * Session-scoped asset state. Files live in memory as object URLs, so nothing
 * here is persisted: the document describes how to render, the materials
 * describe what to render.
 */
export const useMaterialsStore = create<MaterialsState>()((set) => ({
  materials: [],
  rejected: [],
  overrides: {},
  selectedId: null,

  ingest: async (files) => {
    if (!files) return { added: [], rejected: [] }

    const list = Array.from(files)
    const accepted = list.filter(isSupportedImage)
    const rejected: RejectedFile[] = list
      .filter((file) => !isSupportedImage(file))
      .map((file, index) => ({
        id: `rejected_${Date.now().toString(36)}_${index}`,
        name: file.name,
        reason: 'Unsupported image format',
      }))

    const results = await Promise.allSettled(accepted.map(createMaterialImage))
    const added: MaterialImage[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        added.push(result.value)
      } else {
        const file = accepted[index]
        if (file) {
          rejected.push({
            id: `rejected_${Date.now().toString(36)}_${added.length + rejected.length}`,
            name: file.name,
            reason: 'Could not decode image',
          })
        }
      }
    })

    if (added.length > 0) {
      set((state) => ({
        materials: [...state.materials, ...added],
        selectedId: state.selectedId ?? added[0]!.id,
      }))
    }
    if (rejected.length > 0) set((state) => ({ rejected: [...state.rejected, ...rejected] }))

    return { added, rejected }
  },

  remove: (id) =>
    set((state) => {
      const target = state.materials.find((material) => material.id === id)
      if (target) revokeMaterial(target)

      const overrides = { ...state.overrides }
      delete overrides[id]

      return {
        materials: state.materials.filter((material) => material.id !== id),
        overrides,
        selectedId: state.selectedId === id ? null : state.selectedId,
      }
    }),

  clear: () =>
    set((state) => {
      for (const material of state.materials) revokeMaterial(material)
      return { materials: [], overrides: {}, selectedId: null, rejected: [] }
    }),

  clearRejected: () => set({ rejected: [] }),

  move: (from, to) =>
    set((state) => {
      const items = [...state.materials]
      if (from === to || from < 0 || from >= items.length) return state
      const [moved] = items.splice(from, 1)
      if (!moved) return state
      items.splice(Math.max(0, Math.min(to, items.length)), 0, moved)
      return { materials: items }
    }),

  select: (id) => set({ selectedId: id }),

  setTitle: (id, title) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        [id]: { ...state.overrides[id], title },
      },
    })),

  setAdjustments: (id, patch) =>
    set((state) => {
      const current = state.overrides[id]?.adjustments ?? {}
      return {
        overrides: {
          ...state.overrides,
          [id]: { ...state.overrides[id], adjustments: { ...current, ...patch } },
        },
      }
    }),

  resetImage: (id) =>
    set((state) => {
      const overrides = { ...state.overrides }
      const current = overrides[id]
      if (!current) return state
      const next = { ...current }
      delete next.adjustments
      delete next.title
      if (Object.keys(next).length === 0) delete overrides[id]
      else overrides[id] = next
      return { overrides }
    }),

  resetAllImages: () => set({ overrides: {} }),
}))

const EMPTY_OVERRIDE: MaterialOverride = {}

export function selectedMaterial(state: MaterialsState): MaterialImage | null {
  return state.materials.find((material) => material.id === state.selectedId) ?? null
}

export function useSelectedMaterial(): MaterialImage | null {
  return useMaterialsStore((state) => selectedMaterial(state))
}

export function useOverride(id: string | null | undefined): MaterialOverride {
  const overrides = useMaterialsStore((state) => state.overrides)
  return id ? (overrides[id] ?? EMPTY_OVERRIDE) : EMPTY_OVERRIDE
}

export function useHasOverrides(): boolean {
  return useMaterialsStore((state) => Object.keys(state.overrides).length > 0)
}
