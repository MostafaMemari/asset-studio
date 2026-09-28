import { PanelLeftClose } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ExportSection } from '@/components/sections/export-section'
import { FilesSection } from '@/components/sections/files-section'
import { ImagesSection } from '@/components/sections/images-section'
import { LayoutSection } from '@/components/sections/layout-section'
import { OutputSection } from '@/components/sections/output-section'
import { PresetsSection } from '@/components/sections/presets-section'
import { TypeSection } from '@/components/sections/type-section'
import { WatermarkSection } from '@/components/sections/watermark-section'
import { useUiStore } from '@/store/ui-store'

export function Inspector() {
  const section = useUiStore((state) => state.section)
  const toggleInspector = useUiStore((state) => state.toggleInspector)

  return (
    <aside className="flex w-[336px] shrink-0 flex-col border-r bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {section}
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={toggleInspector}
              aria-label="Hide inspector"
            >
              <PanelLeftClose />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hide inspector panel</TooltipContent>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {section === 'files' ? <FilesSection /> : null}
        {section === 'layout' ? <LayoutSection /> : null}
        {section === 'images' ? <ImagesSection /> : null}
        {section === 'type' ? <TypeSection /> : null}
        {section === 'watermark' ? <WatermarkSection /> : null}
        {section === 'output' ? <OutputSection /> : null}
        {section === 'export' ? <ExportSection /> : null}
        {section === 'presets' ? <PresetsSection /> : null}
      </div>
    </aside>
  )
}
