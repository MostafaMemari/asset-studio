export type Point = { x: number; y: number }

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2))
  ctx.beginPath()
  if (r <= 0) {
    ctx.rect(x, y, width, height)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function degreesToRadians(degrees: number): number {
  return ((degrees % 360) + 360) % 360 === 0 ? 0 : (degrees * Math.PI) / 180
}

export function rotatePoint(point: Point, origin: Point, radians: number): Point {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

/** Bounding box of a w x h rectangle after rotating it by `radians`. */
export function rotatedBounds(
  width: number,
  height: number,
  radians: number
): { width: number; height: number } {
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  return { width: width * cos + height * sin, height: width * sin + height * cos }
}
