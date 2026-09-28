import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DEFAULT_EXPORT, DEFAULT_LAYOUT, DEFAULT_OUTPUT, DEFAULT_TILES, DEFAULT_TYPOGRAPHY, DEFAULT_WATERMARK_LAYER, STORAGE_KEY } from '@/core/constants'
import { createId } from '@/core/utils'
import { normalizeDocument } from '@/presets/storage'
import type { WatermarkAsset } from '@/types/assets'
import type {
  ExportSettings,
  LayoutSettings,
  OutputSettings,
  TileSettings,
  TypographySettings,
} from '@/types/settings'
import type { StudioDocument } from '@/types/preset'
import type { WatermarkLayer, WatermarkSettings } from '@/types/watermark'

const HISTORY_LIMIT = 80
const COALESCE_MS = 700

type Patch<T> = Partial<T> | ((current: T) => Partial<T>)

type DocumentState = {
  doc: StudioDocument
  past: StudioDocument[]
  future: StudioDocument[]
  /** Name of the most recent change, surfaced in the status bar. */
  lastAction: string | null

  update: (label: string, mutate: (doc: StudioDocument) => StudioDocument, coalesceKey?: string) => void
  replace: (doc: StudioDocument, label: string) => void

  setOutput: (patch: Patch<OutputSettings>, coalesceKey?: string) => void
  setLayout: (patch: Patch<LayoutSettings>, coalesceKey?: string) => void
  setTiles: (patch: Patch<TileSettings>, coalesceKey?: string) => void
  setTypography: (patch: Patch<TypographySettings>, coalesceKey?: string) => void
  setExportSettings: (patch: Patch<ExportSettings>, coalesceKey?: string) => void

  setWatermarkEnabled: (enabled: boolean) => void
  addWatermarkLayer: (layer?: Partial<WatermarkLayer>) => string
  updateWatermarkLayer: (id: string, patch: Patch<WatermarkLayer>, coalesceKey?: string) => void
  removeWatermarkLayer: (id: string) => void
  duplicateWatermarkLayer: (id: string) => void
  moveWatermarkLayer: (id: string, direction: -1 | 1) => void
  addWatermarkAsset: (asset: WatermarkAsset) => void
  removeWatermarkAsset: (id: string) => void

  undo: () => void
  redo: () => void
  resetToDefaults: () => void
}

function resolvePatch<T>(current: T, patch: Patch<T>): Partial<T> {
  return typeof patch === 'function' ? patch(current) : patch
}

function createDefaultDocument(): StudioDocument {
  return normalizeDocument({
    output: DEFAULT_OUTPUT,
    layout: DEFAULT_LAYOUT,
    tiles: DEFAULT_TILES,
    typography: DEFAULT_TYPOGRAPHY,
    exportSettings: DEFAULT_EXPORT,
    watermark: { enabled: true, layers: [createWatermarkLayer()] },
  })
}

export function createWatermarkLayer(overrides: Partial<WatermarkLayer> = {}): WatermarkLayer {
  return { ...DEFAULT_WATERMARK_LAYER, id: createId('wm'), ...overrides }
}

/**
 * Single source of truth for every non-asset setting. Slices stay independent
 * (each setter touches one branch, so subscribers only re-render for the panel
 * they own) while undo/redo can snapshot the whole document cheaply.
 */
export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => {
      let lastCoalesceKey: string | null = null
      let lastChangeAt = 0

      const commit = (
        label: string,
        next: StudioDocument,
        coalesceKey?: string
      ) => {
        const state = get()
        const now = Date.now()
        const coalesce =
          coalesceKey !== undefined &&
          coalesceKey === lastCoalesceKey &&
          now - lastChangeAt < COALESCE_MS

        lastCoalesceKey = coalesceKey ?? null
        lastChangeAt = now

        set({
          doc: next,
          past: coalesce ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
          future: [],
          lastAction: label,
        })
      }

      return {
        doc: createDefaultDocument(),
        past: [],
        future: [],
        lastAction: null,

        update: (label, mutate, coalesceKey) => commit(label, mutate(get().doc), coalesceKey),

        replace: (doc, label) => commit(label, normalizeDocument(doc)),

        setOutput: (patch, coalesceKey) => {
          const current = get().doc.output
          const next = { ...current, ...resolvePatch(current, patch) }
          if (next.lockAspect) {
            next.aspect = current.aspect || current.width / Math.max(1, current.height)
            if (next.width !== current.width) next.height = Math.round(next.width / next.aspect)
            else if (next.height !== current.height) next.width = Math.round(next.height * next.aspect)
            next.aspect = next.width / Math.max(1, next.height)
          }
          get().update('Output', (doc) => ({ ...doc, output: next }), coalesceKey)
        },

        setLayout: (patch, coalesceKey) => {
          const current = get().doc.layout
          const next = { ...current, ...resolvePatch(current, patch) }
          get().update('Layout', (doc) => ({ ...doc, layout: next }), coalesceKey)
        },

        setTiles: (patch, coalesceKey) => {
          const current = get().doc.tiles
          const next = { ...current, ...resolvePatch(current, patch) }
          get().update('Tiles', (doc) => ({ ...doc, tiles: next }), coalesceKey)
        },

        setTypography: (patch, coalesceKey) => {
          const current = get().doc.typography
          const next = { ...current, ...resolvePatch(current, patch) }
          get().update('Typography', (doc) => ({ ...doc, typography: next }), coalesceKey)
        },

        setExportSettings: (patch, coalesceKey) => {
          const current = get().doc.exportSettings
          const next = { ...current, ...resolvePatch(current, patch) }
          get().update('Export', (doc) => ({ ...doc, exportSettings: next }), coalesceKey)
        },

        setWatermarkEnabled: (enabled) =>
          get().update('Watermark', (doc) => ({
            ...doc,
            watermark: { ...doc.watermark, enabled },
          })),

        addWatermarkLayer: (layer) => {
          const id = createId('wm')
          get().update('Watermark', (doc) => ({
            ...doc,
            watermark: { ...doc.watermark, layers: [...doc.watermark.layers, createWatermarkLayer({ id, ...layer })] },
          }))
          return id
        },

        updateWatermarkLayer: (id, patch, coalesceKey) => {
          get().update('Watermark', (doc) => {
            const layers = doc.watermark.layers.map((layer) =>
              layer.id === id ? { ...layer, ...resolvePatch(layer, patch) } : layer
            )
            return { ...doc, watermark: { ...doc.watermark, layers } }
          }, coalesceKey)
        },

        removeWatermarkLayer: (id) =>
          get().update('Watermark', (doc) => ({
            ...doc,
            watermark: {
              ...doc.watermark,
              layers: doc.watermark.layers.filter((layer) => layer.id !== id),
            },
          })),

        duplicateWatermarkLayer: (id) =>
          get().update('Watermark', (doc) => {
            const index = doc.watermark.layers.findIndex((layer) => layer.id === id)
            if (index < 0) return doc
            const source = doc.watermark.layers[index]!
            const copy = createWatermarkLayer({ ...source, id: createId('wm'), name: `${source.name} copy` })
            const layers = [...doc.watermark.layers]
            layers.splice(index + 1, 0, copy)
            return { ...doc, watermark: { ...doc.watermark, layers } }
          }),

        moveWatermarkLayer: (id, direction) =>
          get().update('Watermark', (doc) => {
            const index = doc.watermark.layers.findIndex((layer) => layer.id === id)
            const target = index + direction
            if (index < 0 || target < 0 || target >= doc.watermark.layers.length) return doc
            const layers = [...doc.watermark.layers]
            const [moved] = layers.splice(index, 1)
            if (!moved) return doc
            layers.splice(target, 0, moved)
            return { ...doc, watermark: { ...doc.watermark, layers } }
          }),

        addWatermarkAsset: (asset) =>
          get().update('Watermark assets', (doc) => ({
            ...doc,
            watermarkAssets: { ...doc.watermarkAssets, [asset.id]: asset },
          })),

        removeWatermarkAsset: (id) =>
          get().update('Watermark assets', (doc) => {
            const assets = { ...doc.watermarkAssets }
            delete assets[id]
            const layers = doc.watermark.layers.map((layer) =>
              layer.assetId === id ? { ...layer, assetId: null, kind: layer.kind === 'image' ? 'text' : layer.kind } : layer
            )
            return { ...doc, watermarkAssets: assets, watermark: { ...doc.watermark, layers } }
          }),

        undo: () => {
          const { past, doc, future } = get()
          const previous = past[past.length - 1]
          if (!previous) return
          lastCoalesceKey = null
          set({ doc: previous, past: past.slice(0, -1), future: [doc, ...future].slice(0, HISTORY_LIMIT) })
        },

        redo: () => {
          const { past, doc, future } = get()
          const next = future[0]
          if (!next) return
          lastCoalesceKey = null
          set({ doc: next, past: [...past, doc].slice(-HISTORY_LIMIT), future: future.slice(1) })
        },

        resetToDefaults: () => get().replace(createDefaultDocument(), 'Reset'),
      }
    },
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({ doc: state.doc }) as DocumentState,
        merge: (persisted, current) => {
          const saved = (persisted as { doc?: unknown } | undefined)?.doc
          return { ...current, doc: saved ? normalizeDocument(saved) : current.doc, past: [], future: [] }
        },
    }
  )
)

export function useOutputSettings() {
  const output = useDocumentStore((state) => state.doc.output)
  const setOutput = useDocumentStore((state) => state.setOutput)
  return { output, setOutput }
}

export function useLayoutSettings() {
  const layout = useDocumentStore((state) => state.doc.layout)
  const setLayout = useDocumentStore((state) => state.setLayout)
  return { layout, setLayout }
}

export function useTileSettings() {
  const tiles = useDocumentStore((state) => state.doc.tiles)
  const setTiles = useDocumentStore((state) => state.setTiles)
  return { tiles, setTiles }
}

export function useTypographySettings() {
  const typography = useDocumentStore((state) => state.doc.typography)
  const setTypography = useDocumentStore((state) => state.setTypography)
  return { typography, setTypography }
}

export function useExportSettings() {
  const exportSettings = useDocumentStore((state) => state.doc.exportSettings)
  const setExportSettings = useDocumentStore((state) => state.setExportSettings)
  return { exportSettings, setExportSettings }
}

export function useWatermarkSettings(): {
  watermark: WatermarkSettings
  setWatermarkEnabled: DocumentState['setWatermarkEnabled']
  addWatermarkLayer: DocumentState['addWatermarkLayer']
  updateWatermarkLayer: DocumentState['updateWatermarkLayer']
  removeWatermarkLayer: DocumentState['removeWatermarkLayer']
  duplicateWatermarkLayer: DocumentState['duplicateWatermarkLayer']
  moveWatermarkLayer: DocumentState['moveWatermarkLayer']
} {
  const watermark = useDocumentStore((state) => state.doc.watermark)
  const setWatermarkEnabled = useDocumentStore((state) => state.setWatermarkEnabled)
  const addWatermarkLayer = useDocumentStore((state) => state.addWatermarkLayer)
  const updateWatermarkLayer = useDocumentStore((state) => state.updateWatermarkLayer)
  const removeWatermarkLayer = useDocumentStore((state) => state.removeWatermarkLayer)
  const duplicateWatermarkLayer = useDocumentStore((state) => state.duplicateWatermarkLayer)
  const moveWatermarkLayer = useDocumentStore((state) => state.moveWatermarkLayer)

  return {
    watermark,
    setWatermarkEnabled,
    addWatermarkLayer,
    updateWatermarkLayer,
    removeWatermarkLayer,
    duplicateWatermarkLayer,
    moveWatermarkLayer,
  }
}

export function useWatermarkAssets() {
  const assets = useDocumentStore((state) => state.doc.watermarkAssets)
  const addWatermarkAsset = useDocumentStore((state) => state.addWatermarkAsset)
  const removeWatermarkAsset = useDocumentStore((state) => state.removeWatermarkAsset)
  return { assets, addWatermarkAsset, removeWatermarkAsset }
}

export function useDocumentHistory() {
  const canUndo = useDocumentStore((state) => state.past.length > 0)
  const canRedo = useDocumentStore((state) => state.future.length > 0)
  const undo = useDocumentStore((state) => state.undo)
  const redo = useDocumentStore((state) => state.redo)
  const resetToDefaults = useDocumentStore((state) => state.resetToDefaults)
  return { canUndo, canRedo, undo, redo, resetToDefaults }
}
