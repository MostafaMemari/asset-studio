import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { createScene } from '@/core/render/engine'
import { renderPreview } from '@/core/render/preview'
import { cn } from '@/core/utils'
import { useRenderInput } from '@/hooks/use-render-input'
import { useDocumentStore } from '@/store/document-store'
import { useUiStore } from '@/store/ui-store'

/**
 * Owns nothing but the canvas element: all drawing is delegated to the render
 * service, which is the same code path the exporter uses.
 */
export function PreviewCanvas() {
  const input = useRenderInput()
  const output = useDocumentStore((state) => state.doc.output)
  const zoom = useUiStore((state) => state.zoom)

  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [isRendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setFrameSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const isEmpty = input.materials.length === 0

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return

    let cancelled = false
    setRendering(true)

    // One frame of slack coalesces bursts of slider input into a single render.
    const handle = requestAnimationFrame(() => {
      createScene(input)
        .then((scene) => {
          if (cancelled) return
          return renderPreview(
            { canvas, width: output.width, height: output.height, dpr: window.devicePixelRatio || 1 },
            scene
          )
        })
        .then(() => {
          if (cancelled) return
          setError(null)
        })
        .catch((cause: unknown) => {
          if (cancelled) return
          setError(cause instanceof Error ? cause.message : 'Preview render failed')
        })
        .finally(() => {
          if (!cancelled) setRendering(false)
        })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(handle)
    }
  }, [input, isEmpty, output.height, output.width])

  // Fit against both axes so a portrait or square canvas is never clipped.
  const aspect = output.height / Math.max(1, output.width)
  const availableWidth = Math.max(0, frameSize.width - 32)
  const availableHeight = Math.max(0, frameSize.height - 32)
  const fitWidth = Math.min(availableWidth, availableHeight / Math.max(0.01, aspect))
  const fitScale = output.width > 0 ? fitWidth / output.width : 1
  const cssWidth = zoom === 'fit' ? Math.max(120, fitWidth) : output.width
  const cssHeight = cssWidth * aspect

  return (
    <div
      ref={frameRef}
      className={cn(
        'stage-backdrop relative min-h-0 flex-1 overflow-auto p-4',
        isEmpty && 'grid place-items-center'
      )}
    >
      {error ? (
        <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </div>
      ) : null}

      {isRendering && !isEmpty ? (
        <div className="absolute top-4 right-6 z-10 flex items-center gap-1.5 rounded-md border bg-popover/90 px-2 py-1 text-[11px] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          rendering
        </div>
      ) : null}

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center',
            zoom === 'fit' ? 'h-full' : 'min-h-full'
          )}
        >
          <canvas
            ref={canvasRef}
            aria-label="Preview canvas"
            className="bg-card shadow-2xl ring-1 ring-black/20"
            style={{
              width: `${cssWidth}px`,
              height: `${cssHeight}px`,
              // In actual-size mode the canvas is allowed to exceed the frame and
              // scroll, which is the whole point of a 1:1 view.
              flexShrink: 0,
            }}
          />
        </div>
      )}

      {!isEmpty ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {output.width} × {output.height}
          {zoom === 'fit' && fitScale < 1 ? ` · ${Math.round(fitScale * 100)}%` : ''}
        </p>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="max-w-sm space-y-2 text-center">
      <p className="text-sm font-medium">No materials yet</p>
      <p className="text-xs text-muted-foreground">
        Drop texture images anywhere in the app, or open the Files panel to browse. The sheet renders
        instantly and every setting applies live.
      </p>
    </div>
  )
}
