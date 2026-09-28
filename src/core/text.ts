import { fontString } from '@/core/fonts'
import type { TextCase } from '@/types/settings'

export type TemplateToken = Record<string, string | number>

export function applyTextCase(text: string, textCase: TextCase): string {
  switch (textCase) {
    case 'lower':
      return text.toLowerCase()
    case 'upper':
      return text.toUpperCase()
    case 'title':
      return text.replace(/\w\S*/g, (word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    default:
      return text
  }
}

export function fillTemplate(template: string, tokens: TemplateToken): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = tokens[key]
    return value === undefined || value === '' ? match : String(value)
  })
}

/** Width of a string once letter spacing is added between every glyph. */
export function measureTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking = 0
): number {
  if (text.length === 0) return 0
  if (tracking === 0) return ctx.measureText(text).width

  let total = 0
  for (const char of text) total += ctx.measureText(char).width
  return total + tracking * (text.length - 1)
}

export function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  tracking = 0
): string {
  if (maxWidth <= 0) return ''
  if (measureTracked(ctx, text, tracking) <= maxWidth) return text

  let result = text
  while (result.length > 1 && measureTracked(ctx, `${result}…`, tracking) > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}…`
}

export type TrackedAlign = 'left' | 'center' | 'right'

export function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: TrackedAlign = 'left',
  tracking = 0
): void {
  if (text.length === 0) return
  const total = measureTracked(ctx, text, tracking)

  let cursor = x
  if (align === 'center') cursor = x - total / 2
  else if (align === 'right') cursor = x - total

  if (tracking === 0) {
    ctx.fillText(text, cursor, y)
    return
  }

  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + tracking
  }
}

export function textAlignFor(align: 'left' | 'center' | 'right'): CanvasTextAlign {
  return align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
}

export { fontString }
