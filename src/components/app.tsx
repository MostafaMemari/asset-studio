import { Inspector } from '@/components/inspector'
import { SectionRail } from '@/components/section-rail'
import { Stage } from '@/components/stage'
import { StatusBar } from '@/components/status-bar'
import { ToastStack } from '@/components/toast-stack'
import { TopBar } from '@/components/top-bar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useGlobalDrop } from '@/hooks/use-global-drop'
import { useHotkeys } from '@/hooks/use-hotkeys'
import { useUiStore } from '@/store/ui-store'

export function App() {
  useHotkeys()
  useGlobalDrop()
  const inspectorOpen = useUiStore((state) => state.inspectorOpen)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <TopBar />

        <main className="flex min-h-0 flex-1">
          <SectionRail />
          {inspectorOpen ? <Inspector /> : null}
          <Stage />
        </main>

        <StatusBar />
        <ToastStack />
      </div>
    </TooltipProvider>
  )
}
