import { Maximize2, Scan } from 'lucide-react'

import { Filmstrip } from '@/components/filmstrip'
import { PreviewCanvas } from '@/components/preview-canvas'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUiStore } from '@/store/ui-store'

export function Stage() {
  const zoom = useUiStore((state) => state.zoom)
  const setZoom = useUiStore((state) => state.setZoom)

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-muted/25">
      <div className="flex shrink-0 items-center gap-2 border-b bg-card px-3 py-1.5">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Preview
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">live canvas</span>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant={zoom === 'fit' ? 'secondary' : 'ghost'}
                aria-label="Fit preview to window"
                aria-pressed={zoom === 'fit'}
                onClick={() => setZoom('fit')}
              >
                <Scan />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to window</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant={zoom === 'actual' ? 'secondary' : 'ghost'}
                aria-label="Show preview at actual size"
                aria-pressed={zoom === 'actual'}
                onClick={() => setZoom('actual')}
              >
                <Maximize2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Actual size</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <PreviewCanvas />
      <Filmstrip />
    </section>
  )
}
