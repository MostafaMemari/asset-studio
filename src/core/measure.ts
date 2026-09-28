let context: CanvasRenderingContext2D | null = null

/**
 * Shared offscreen 2D context used purely for text measurement. Measuring never
 * touches the DOM, so a single context can be reused for the whole app.
 */
export function measureContext(): CanvasRenderingContext2D {
  if (!context) {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 8
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    context = ctx
  }
  return context
}
