import { FlipHorizontal2, ImageOff, RotateCcw, RotateCw } from 'lucide-react'

import { ColorRow, SegmentedField, SliderField, TextField } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { IMAGE_FITS } from '@/core/constants'
import { DEFAULT_ADJUSTMENTS } from '@/types/assets'
import { useSelectedMaterial, useMaterialsStore, useOverride } from '@/store/materials-store'
import { useTileSettings } from '@/store/document-store'

export function ImagesSection() {
  const { tiles, setTiles } = useTileSettings()
  const material = useSelectedMaterial()
  const override = useOverride(material?.id)
  const setTitle = useMaterialsStore((state) => state.setTitle)
  const setAdjustments = useMaterialsStore((state) => state.setAdjustments)
  const resetImage = useMaterialsStore((state) => state.resetImage)
  const select = useMaterialsStore((state) => state.select)

  const adjust = { ...DEFAULT_ADJUSTMENTS, ...override.adjustments }
  const customTitle = override.title ?? ''

  return (
    <div className="space-y-4">
      <Section title="Tile appearance" description="Applied to every material">
        <SegmentedField
          label="Image fit"
          value={tiles.fit}
          options={IMAGE_FITS}
          hint={
            tiles.fit === 'cover'
              ? 'fills the tile, crops overflow'
              : tiles.fit === 'contain'
                ? 'fits inside the tile'
                : 'stretches to the tile'
          }
          onValueChange={(fit) => setTiles({ fit })}
        />
        <SliderField
          label="Border radius"
          value={tiles.radius}
          min={0}
          max={200}
          unit=" px"
          onValueChange={(radius) => setTiles({ radius }, 'tiles.radius')}
        />
        <SliderField
          label="Border width"
          value={tiles.borderWidth}
          min={0}
          max={40}
          unit=" px"
          onValueChange={(borderWidth) => setTiles({ borderWidth }, 'tiles.borderWidth')}
        />
        {tiles.borderWidth > 0 ? (
          <ColorRow
            label="Border colour"
            value={tiles.borderColor}
            onValueChange={(borderColor) => setTiles({ borderColor })}
          />
        ) : null}
      </Section>

      {material ? (
        <Section
          title="Selected image"
          description={material.name}
          actions={
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Reset selected image"
              onClick={() => resetImage(material.id)}
            >
              <RotateCcw />
            </Button>
          }
        >
          <div className="flex items-center gap-2.5 rounded-md border border-border/60 p-2">
            <div className="checkerboard size-12 shrink-0 overflow-hidden rounded border">
              <img src={material.url} alt={material.name} className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium">{material.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {material.width}×{material.height} · {formatBytes(material.file.size)}
              </p>
            </div>
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => select(null)}>
              Clear
            </Button>
          </div>

          <TextField
            label="Custom title"
            value={customTitle}
            placeholder={material.name}
            hint={customTitle ? 'override' : 'using file name'}
            onValueChange={(title) => setTitle(material.id, title)}
          />

          <SliderField
            label="Rotation"
            value={adjust.rotation}
            min={-180}
            max={180}
            step={0.5}
            unit="°"
            onValueChange={(rotation) => setAdjustments(material.id, { rotation })}
          />
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-xs"
              onClick={() => setAdjustments(material.id, { rotation: normalize(adjust.rotation - 90) })}
            >
              <RotateCw />
              −90°
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 flex-1 text-xs"
              onClick={() => setAdjustments(material.id, { rotation: normalize(adjust.rotation + 90) })}
            >
              <RotateCw />
              +90°
            </Button>
            <Button
              type="button"
              size="sm"
              variant={adjust.flipX ? 'secondary' : 'outline'}
              className="h-7 flex-1 text-xs"
              aria-pressed={adjust.flipX}
              onClick={() => setAdjustments(material.id, { flipX: !adjust.flipX })}
            >
              <FlipHorizontal2 />
              Flip
            </Button>
          </div>

          <SliderField
            label="Zoom"
            value={adjust.zoom}
            min={0.2}
            max={4}
            step={0.01}
            unit="×"
            onValueChange={(zoom) => setAdjustments(material.id, { zoom })}
          />
          <SliderField
            label="Crop offset X"
            value={adjust.offsetX}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={(offsetX) => setAdjustments(material.id, { offsetX })}
          />
          <SliderField
            label="Crop offset Y"
            value={adjust.offsetY}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={(offsetY) => setAdjustments(material.id, { offsetY })}
          />
          <p className="text-[11px] text-muted-foreground">
            Zoom and offsets only matter when the image is larger than its tile.
          </p>
        </Section>
      ) : (
        <Section title="Selected image" defaultOpen={false}>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageOff className="size-3.5" />
            Pick a card in the filmstrip to rotate, crop or rename a single material.
          </p>
        </Section>
      )}

      <p className="text-[11px] text-muted-foreground">
        Per-image adjustments belong to the session, not to a preset: a preset describes how the
        sheet is built, never which files it contains.
      </p>
    </div>
  )
}

function normalize(value: number): number {
  const wrapped = ((value % 360) + 360) % 360
  return wrapped > 180 ? wrapped - 360 : wrapped
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
