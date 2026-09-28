import { create } from 'zustand'

import { createId } from '@/core/utils'
import { BUILTIN_PRESETS } from '@/presets/builtin'
import { cloneDocument, loadUserPresets, saveUserPresets } from '@/presets/storage'
import { useDocumentStore } from '@/store/document-store'
import type { Preset } from '@/types/preset'

type PresetsState = {
  userPresets: Preset[]
  activeId: string | null

  all: () => Preset[]
  apply: (preset: Preset) => void
  saveCurrent: (name: string) => Preset
  removeUser: (id: string) => void
  renameUser: (id: string, name: string) => void
  setActiveId: (id: string | null) => void
}

function persist(presets: Preset[]): void {
  saveUserPresets(presets)
}

export const usePresetsStore = create<PresetsState>()((set, get) => ({
  userPresets: loadUserPresets(),
  activeId: null,

  all: () => [...BUILTIN_PRESETS, ...get().userPresets],

  apply: (preset) => {
    useDocumentStore.getState().replace(preset.document, `Preset · ${preset.name}`)
    set({ activeId: preset.id })
  },

  saveCurrent: (name) => {
    const preset: Preset = {
      id: createId('preset'),
      name: name.trim() || 'Untitled preset',
      group: 'user',
      createdAt: Date.now(),
      document: cloneDocument(useDocumentStore.getState().doc),
    }

    const userPresets = [preset, ...get().userPresets].slice(0, 40)
    persist(userPresets)
    set({ userPresets, activeId: preset.id })
    return preset
  },

  removeUser: (id) => {
    const userPresets = get().userPresets.filter((preset) => preset.id !== id)
    persist(userPresets)
    set({ userPresets, activeId: get().activeId === id ? null : get().activeId })
  },

  renameUser: (id, name) => {
    const userPresets = get().userPresets.map((preset) =>
      preset.id === id ? { ...preset, name: name.trim() || preset.name } : preset
    )
    persist(userPresets)
    set({ userPresets })
  },

  setActiveId: (id) => set({ activeId: id }),
}))

export function useAllPresets(): Preset[] {
  const userPresets = usePresetsStore((state) => state.userPresets)
  return [...BUILTIN_PRESETS, ...userPresets]
}

export function describePreset(preset: Preset): string {
  const { output, layout, exportSettings } = preset.document
  return `${output.width}×${output.height} · ${layout.columns} col · ${exportSettings.format.toUpperCase()}`
}
