import { Loader2 } from 'lucide-react'

import { resolveExportScale } from '@/core/export/canvas'
import { useDocumentStore } from '@/store/document-store'
import { useMaterialsStore } from '@/store/materials-store'
import { useUiStore } from '@/store/ui-store'

export function StatusBar() {
  const doc = useDocumentStore((state) => state.doc)
  const lastAction = useDocumentStore((state) => state.lastAction)
  const count = useMaterialsStore((state) => state.materials.length)
  const phase = useUiStore((state) => state.exportPhase)

  const resolved = resolveExportScale(
    doc.output.width,
    doc.output.height,
    doc.exportSettings.scale
  )
  const megapixels = (resolved.width * resolved.height) / 1_000_000

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t bg-card px-3 font-mono text-[11px] text-muted-foreground">
      <span>
        {doc.output.width}×{doc.output.height}
      </span>
      <span className="text-muted-foreground/40">|</span>
      <span>
        {resolved.width}×{resolved.height} px · {megapixels.toFixed(1)} MP
      </span>
      <span className="text-muted-foreground/40">|</span>
      <span>
        {doc.layout.mode} · {doc.layout.columns} col
      </span>
      <span className="text-muted-foreground/40">|</span>
      <span>
        {count} material{count === 1 ? '' : 's'}
      </span>
      <span className="text-muted-foreground/40">|</span>
      <span className="uppercase">{doc.exportSettings.format}</span>
      {doc.exportSettings.quality < 1 && doc.exportSettings.format !== 'png' ? (
        <span>q{Math.round(doc.exportSettings.quality * 100)}</span>
      ) : null}
      <span className="text-muted-foreground/40">|</span>
      <span>{doc.exportSettings.scale}×</span>

      <span className="ml-auto flex items-center gap-2">
        {phase ? (
          <span className="flex items-center gap-1.5 text-foreground">
            <Loader2 className="size-3 animate-spin" />
            {phase.kind === 'batch' ? `${phase.done}/${phase.total}` : 'rendering'} {phase.label}
          </span>
        ) : lastAction ? (
          <span>last change: {lastAction}</span>
        ) : (
          <span>ready</span>
        )}
      </span>
    </footer>
  )
}
