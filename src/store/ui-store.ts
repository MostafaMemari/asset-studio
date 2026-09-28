import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { UI_KEY } from '@/core/constants'
import { createId } from '@/core/utils'

export const SECTIONS = [
  { id: 'files', label: 'Files' },
  { id: 'layout', label: 'Layout' },
  { id: 'images', label: 'Images' },
  { id: 'type', label: 'Type' },
  { id: 'watermark', label: 'Watermark' },
  { id: 'output', label: 'Output' },
  { id: 'export', label: 'Export' },
  { id: 'presets', label: 'Presets' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']

export type Toast = {
  id: string
  message: string
  tone: 'info' | 'error'
}

/** Shared so every surface (top bar, export panel) shows the same progress. */
export type ExportPhase = {
  kind: 'single' | 'batch'
  done: number
  total: number
  label: string
} | null

type UiState = {
  section: SectionId
  zoom: 'fit' | 'actual'
  selectedLayerId: string | null
  inspectorOpen: boolean
  toasts: Toast[]
  exportPhase: ExportPhase

  setSection: (section: SectionId) => void
  setZoom: (zoom: 'fit' | 'actual') => void
  setSelectedLayerId: (id: string | null) => void
  toggleInspector: () => void
  setExportPhase: (phase: ExportPhase) => void
  notify: (message: string, tone?: 'info' | 'error') => void
  dismiss: (id: string) => void
}

/** Purely presentational state; persisted so a reload keeps the working view. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      section: 'layout',
      zoom: 'fit',
      selectedLayerId: null,
      inspectorOpen: true,
      toasts: [],
      exportPhase: null,

      setSection: (section) => set({ section }),
      setZoom: (zoom) => set({ zoom }),
      setSelectedLayerId: (selectedLayerId) => set({ selectedLayerId }),
      toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),
      setExportPhase: (exportPhase) => set({ exportPhase }),

      notify: (message, tone = 'info') =>
        set((state) => ({
          toasts: [...state.toasts, { id: createId('toast'), message, tone }].slice(-3),
        })),

      dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
    }),
    {
      name: UI_KEY,
      version: 1,
      partialize: (state) =>
        ({ section: state.section, zoom: state.zoom, inspectorOpen: state.inspectorOpen }) as UiState,
    }
  )
)
