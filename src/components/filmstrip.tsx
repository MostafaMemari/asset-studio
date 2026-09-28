import { Images, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

import { MaterialCard } from '@/components/material-card'
import { Button } from '@/components/ui/button'
import { useDragOrder } from '@/hooks/use-drag-order'
import { useFileIngest } from '@/hooks/use-file-ingest'
import { useMaterialsStore } from '@/store/materials-store'

export function Filmstrip() {
  const materials = useMaterialsStore((state) => state.materials)
  const overrides = useMaterialsStore((state) => state.overrides)
  const selectedId = useMaterialsStore((state) => state.selectedId)
  const select = useMaterialsStore((state) => state.select)
  const remove = useMaterialsStore((state) => state.remove)
  const clear = useMaterialsStore((state) => state.clear)
  const resetImage = useMaterialsStore((state) => state.resetImage)
  const move = useMaterialsStore((state) => state.move)
  const ingest = useFileIngest()

  const { getItemProps } = useDragOrder(move)
  const items = useMemo(
    () =>
      materials.map((material, index) => ({
        material,
        index,
        drag: getItemProps(index),
      })),
    [getItemProps, materials]
  )

  return (
    // Height is driven by the card content rather than a fixed value: a card is
    // ~132px tall, and anything shorter silently clips the filename off.
    <div className="flex shrink-0 flex-col border-t bg-card/40">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <Images className="size-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Materials
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{materials.length}</span>
        <div className="ml-auto flex items-center gap-1">
          <AddFilesButton onFiles={(files) => void ingest(files)} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            disabled={materials.length === 0}
            onClick={clear}
          >
            <Trash2 />
            Clear
          </Button>
        </div>
      </div>

      {/* pb-4 reserves the horizontal scrollbar track so it never sits on the
          filename row; the ul keeps its own pt-2 for the hover action row. */}
      <div className="min-h-0 overflow-x-auto overflow-y-hidden px-3 pt-2 pb-4">
        {materials.length === 0 ? (
          <p className="py-3 text-xs text-muted-foreground">
            Uploaded materials appear here. Drag a card to reorder the sheet.
          </p>
        ) : (
          <ul className="flex items-start gap-2">
            {items.map(({ material, index, drag }) => (
              <MaterialCard
                key={material.id}
                material={material}
                index={index}
                total={materials.length}
                selected={material.id === selectedId}
                hasOverride={Boolean(overrides[material.id])}
                drag={drag}
                onSelect={() => select(material.id)}
                onRemove={() => remove(material.id)}
                onMove={(direction) => move(index, index + direction)}
                onReset={() => resetImage(material.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function AddFilesButton({ onFiles }: { onFiles: (files: FileList) => void }) {
  return (
    <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
      <Plus className="size-3.5" />
      Add
      <input
        type="file"
        multiple
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) onFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </label>
  )
}
