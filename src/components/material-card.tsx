import { ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DragItemProps } from '@/hooks/use-drag-order'
import { cn } from '@/core/utils'
import type { MaterialImage } from '@/types/assets'

type MaterialCardProps = {
  material: MaterialImage
  index: number
  total: number
  selected: boolean
  hasOverride: boolean
  drag: DragItemProps
  onSelect: () => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
  onReset: () => void
}

export function MaterialCard({
  material,
  index,
  total,
  selected,
  hasOverride,
  drag,
  onSelect,
  onRemove,
  onMove,
  onReset,
}: MaterialCardProps) {
  return (
    <li
      {...drag}
      onClick={onSelect}
      className={cn(
        'group relative w-28 shrink-0 cursor-pointer select-none rounded-lg border bg-card p-1.5 transition-colors',
        drag.isDragging && 'opacity-40',
        drag.isDropTarget && 'border-primary ring-2 ring-primary/40',
        !drag.isDropTarget && (selected ? 'border-primary' : 'border-border hover:border-muted-foreground/40')
      )}
    >
      <div className="checkerboard relative aspect-square overflow-hidden rounded-md border">
        <img
          src={material.url}
          alt={material.name}
          draggable={false}
          className="pointer-events-none size-full object-cover"
        />
        <span className="absolute top-1 left-1 rounded bg-background/85 px-1 font-mono text-[10px] text-muted-foreground">
          {String(index + 1).padStart(2, '0')}
        </span>
        {hasOverride ? (
          <span className="absolute right-1 bottom-1 size-1.5 rounded-full bg-primary" title="Adjusted" />
        ) : null}
      </div>

      <p className="mt-1.5 truncate text-[11px] leading-tight" title={material.name}>
        {material.name}
      </p>

      <div
        className={cn(
          'absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100',
          selected && 'opacity-100'
        )}
      >
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          className="size-6"
          disabled={index === 0}
          aria-label={`Move ${material.name} earlier`}
          onClick={(event) => {
            event.stopPropagation()
            onMove(-1)
          }}
        >
          <ChevronLeft className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          className="size-6"
          disabled={index === total - 1}
          aria-label={`Move ${material.name} later`}
          onClick={(event) => {
            event.stopPropagation()
            onMove(1)
          }}
        >
          <ChevronRight className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          className="size-6"
          aria-label={`Reset ${material.name} adjustments`}
          onClick={(event) => {
            event.stopPropagation()
            onReset()
          }}
        >
          <RotateCcw className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          className="size-6"
          aria-label={`Remove ${material.name}`}
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {hasOverride ? (
        <Badge className="absolute top-1.5 right-1.5 bg-background/85 text-[9px]">adj</Badge>
      ) : null}
    </li>
  )
}
