import { HardDrive, Keyboard, Trash2 } from 'lucide-react'

import { RejectedFiles } from '@/components/rejected-files'
import { UploadZone } from '@/components/upload-zone'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { useMaterialsStore } from '@/store/materials-store'

export function FilesSection() {
  const materials = useMaterialsStore((state) => state.materials)
  const clear = useMaterialsStore((state) => state.clear)

  const totalBytes = materials.reduce((sum, material) => sum + material.file.size, 0)

  return (
    <div className="space-y-4">
      <Section title="Upload" description="Drop textures anywhere in the window">
        <UploadZone compact />
      </Section>

      <RejectedFiles />

      <Section
        title="Library"
        description={
          materials.length === 0
            ? 'No materials loaded'
            : `${materials.length} files · ${formatBytes(totalBytes)}`
        }
        actions={
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Remove all materials"
            disabled={materials.length === 0}
            onClick={clear}
          >
            <Trash2 />
          </Button>
        }
      >
        {materials.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nothing loaded yet. PNG, JPG, WebP, TIFF, BMP and AVIF are supported.
          </p>
        ) : (
          <ul className="space-y-1">
            {materials.map((material, index) => (
              <li
                key={material.id}
                className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1"
              >
                <span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px]" title={material.name}>
                  {material.name}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {material.width}×{material.height}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Shortcuts" defaultOpen={false}>
        <dl className="space-y-1.5 text-[11px]">
          {[
            ['Ctrl / ⌘ + Z', 'Undo'],
            ['Ctrl / ⌘ + Shift + Z', 'Redo'],
            ['[  /  ]', 'Move selected material'],
            ['Delete', 'Remove selected material'],
            ['1 … 8', 'Switch panel'],
          ].map(([keys, action]) => (
            <div key={keys} className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 font-mono text-muted-foreground">
                <Keyboard className="size-3" />
                {keys}
              </dt>
              <dd className="text-muted-foreground">{action}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 font-mono text-muted-foreground">
              <HardDrive className="size-3" />
              Local only
            </dt>
            <dd className="text-muted-foreground">No uploads, no network</dd>
          </div>
        </dl>
      </Section>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
