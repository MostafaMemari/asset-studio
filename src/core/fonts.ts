/**
 * Font families that resolve without any network access, so canvas text always
 * renders identically offline. Users can still type any locally installed
 * family name into the font field.
 */
export const FONT_FAMILIES: { value: string; label: string }[] = [
  { value: 'Inter', label: 'Inter / UI sans' },
  { value: 'Segoe UI', label: 'Segoe UI' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Palatino Linotype', label: 'Palatino' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Brush Script MT', label: 'Brush Script' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'sans-serif', label: 'Generic sans' },
  { value: 'serif', label: 'Generic serif' },
  { value: 'monospace', label: 'Generic mono' },
]

export const FONT_WEIGHTS: { value: number; label: string }[] = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extrabold' },
  { value: 900, label: 'Black' },
]

const GENERIC_FAMILIES = new Set(['system-ui', 'sans-serif', 'serif', 'monospace', 'cursive'])

/** Quotes families that contain spaces so the CSS font shorthand stays valid. */
export function fontFamilyName(family: string): string {
  const value = family.trim() || 'Inter'
  if (GENERIC_FAMILIES.has(value.toLowerCase())) return value
  return value.includes(' ') ? `"${value}"` : value
}

export function fontString(family: string, weight: number, size: number): string {
  return `${weight} ${Math.max(1, Math.round(size))}px ${fontFamilyName(family)}`
}

/** Resolves lazily loaded webfonts before the first text pass. */
export async function ensureFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.ready
  } catch {
    /* Font loading is best-effort; system fonts never need it. */
  }
}
