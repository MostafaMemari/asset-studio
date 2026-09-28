import { Files, Image, LayoutGrid, Palette, Save, Settings2, Share2, Type } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/core/utils'
import { SECTIONS, useUiStore, type SectionId } from '@/store/ui-store'

const ICONS: Record<SectionId, typeof Files> = {
  files: Files,
  layout: LayoutGrid,
  images: Image,
  type: Type,
  watermark: Palette,
  output: Settings2,
  export: Share2,
  presets: Save,
}

export function SectionRail() {
  const section = useUiStore((state) => state.section)
  const setSection = useUiStore((state) => state.setSection)

  return (
    <nav
      aria-label="Editor sections"
      className="flex w-[74px] shrink-0 flex-col gap-0.5 border-r bg-card px-1.5 py-2"
    >
      {SECTIONS.map((entry, index) => {
        const Icon = ICONS[entry.id]
        const active = section === entry.id
        return (
          <Tooltip key={entry.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setSection(entry.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="size-4" />
                <span className="leading-none">{entry.label}</span>
                <span
                  className={cn(
                    'font-mono text-[9px]',
                    active ? 'text-primary-foreground/60' : 'text-muted-foreground/50'
                  )}
                >
                  {index + 1}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{entry.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
