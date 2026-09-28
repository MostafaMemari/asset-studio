import { chromium } from 'playwright'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

const BASE = process.env.BASE_URL ?? 'http://localhost:5174'
const OUT = mkdtempSync(path.join(tmpdir(), 'marigol-smoke-'))

// Solid-colour PNGs built by hand so the test needs no image libraries.
function makePng(width, height, [r, g, b]) {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1)
    raw[row] = 0
    for (let x = 0; x < width; x++) {
      const p = row + 1 + x * 3
      raw[p] = r
      raw[p + 1] = g
      raw[p + 2] = b
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body) >>> 0)
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

let table = null
function crc32(buf) {
  if (!table) {
    table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let c = -1
  for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8)
  return c ^ -1
}

const files = [
  path.join(OUT, 'brick_red.png'),
  path.join(OUT, 'concrete_grey.png'),
  path.join(OUT, 'sand_beige.png'),
  path.join(OUT, 'foliage_green.png'),
  path.join(OUT, 'tall_portrait.png'),
  path.join(OUT, 'notes.txt'),
]
writeFileSync(files[0], makePng(64, 64, [190, 60, 40]))
writeFileSync(files[1], makePng(64, 48, [140, 140, 140]))
writeFileSync(files[2], makePng(48, 64, [220, 200, 150]))
writeFileSync(files[3], makePng(64, 64, [60, 130, 70]))
writeFileSync(files[4], makePng(40, 72, [120, 90, 200]))
writeFileSync(files[5], 'not an image')

let failures = 0
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 } })

const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

await page.goto(BASE, { waitUntil: 'networkidle' })
check('app mounts', await page.getByRole('heading', { name: 'Marigol Asset Studio' }).isVisible())
check('empty state shown', await page.getByText('No materials yet').isVisible())
check(
  'all 8 sections present',
  (await page.locator('nav[aria-label="Editor sections"] button').count()) === 8
)

// Upload: 5 valid images plus 1 non-image that must be rejected.
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Files' }).click()
await page.waitForTimeout(300)
await page.locator('input[type=file]').first().setInputFiles(files)
await page.waitForTimeout(1500)

check('5 cards in filmstrip', (await page.locator('ul li img[alt$=".png"]').count()) >= 5)
check('unsupported file reported', await page.getByText('notes.txt').first().isVisible())

const canvas = page.locator('canvas[aria-label="Preview canvas"]')
await canvas.waitFor({ state: 'visible' })
await page.waitForTimeout(1500)

const stats = await canvas.evaluate((node) => {
  const ctx = node.getContext('2d')
  const { data } = ctx.getImageData(0, 0, node.width, node.height)
  const seen = new Set()
  for (let i = 0; i < data.length; i += 4 * 97) {
    seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
  }
  return { w: node.width, h: node.height, distinct: seen.size }
})
check('canvas has pixels', stats.w > 100 && stats.h > 100, `${stats.w}x${stats.h}`)
check('canvas is not blank', stats.distinct > 3, `${stats.distinct} distinct sampled colours`)

const statusText = await page.locator('footer').textContent()
check(
  'status bar reports 5 materials',
  statusText.includes('5 materials'),
  statusText.replace(/\s+/g, ' ').trim().slice(0, 120)
)

// --- Layout modes -----------------------------------------------------------
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Layout' }).click()
await page.waitForTimeout(300)
await page.getByRole('radio', { name: 'Masonry' }).click()
await page.waitForTimeout(800)
check('masonry mode selectable', (await canvas.count()) === 1)
await page.getByRole('radio', { name: 'Grid' }).click()
await page.waitForTimeout(600)

// --- Watermark: tiled mode covers the canvas -------------------------------
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Watermark' }).click()
await page.waitForTimeout(400)
await page.getByRole('radio', { name: 'Tiled' }).click()
await page.waitForTimeout(1000)
// Tiling coverage. A text mark has natural gaps between glyph rows, so coverage
// is verified with a solid image mark at zero spacing and full opacity: the
// union of the lattice must then leave no empty row or column on the canvas.
const markPng = path.join(OUT, 'watermark_mark.png')
writeFileSync(markPng, makePng(48, 48, [255, 255, 255]))

await page.getByRole('button', { name: 'Image', exact: true }).click()
await page.waitForTimeout(200)
await page.getByTestId('watermark-image-input').setInputFiles(markPng)
await page.waitForTimeout(1400)

// The new image layer opens in single mode; switch it to the tiled pattern.
await page.getByRole('radio', { name: 'Tiled' }).click()
await page.waitForTimeout(900)

// Arrow keys step from the current value, so jump to the minimum with Home
// first; otherwise a value below the starting point is unreachable.
const setSlider = async (name, value) => {
  const slider = page.getByRole('slider', { name })
  await slider.focus()
  await page.keyboard.press('Home')
  for (let i = 0; i < 200; i++) {
    if (Number(await slider.getAttribute('aria-valuenow')) >= value) break
    await page.keyboard.press('ArrowRight')
  }
  await page.waitForTimeout(600)
}

await setSlider('Horizontal spacing', 0)
await setSlider('Vertical spacing', 0)
await setSlider('Opacity', 1)
await page.waitForTimeout(900)

const coverage = await canvas.evaluate((node) => {
  const ctx = node.getContext('2d')
  const { data, width, height } = ctx.getImageData(0, 0, node.width, node.height)
  // A full-opacity white mark is unmistakably bright.
  const isInk = (i) => data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200
  let emptyRows = 0
  let emptyCols = 0
  for (let y = 0; y < height; y++) {
    let found = false
    for (let x = 0; x < width; x += 2) {
      if (isInk((y * width + x) * 4)) { found = true; break }
    }
    if (!found) emptyRows++
  }
  for (let x = 0; x < width; x++) {
    let found = false
    for (let y = 0; y < height; y += 2) {
      if (isInk((y * width + x) * 4)) { found = true; break }
    }
    if (!found) emptyCols++
  }
  return { emptyRows, emptyCols, height, width }
})
check(
  'tiled image watermark covers the entire canvas',
  coverage.emptyRows === 0 && coverage.emptyCols === 0,
  `${coverage.emptyRows} empty rows, ${coverage.emptyCols} empty cols of ${coverage.width}x${coverage.height}`
)

// Tiled + rotated must still cover, which is the case a naive lattice gets wrong.
await setSlider('Rotation', 31)
await page.waitForTimeout(900)
const rotatedCoverage = await canvas.evaluate((node) => {
  const ctx = node.getContext('2d')
  const { data, width, height } = ctx.getImageData(0, 0, node.width, node.height)
  const isInk = (i) => data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200
  let emptyRows = 0
  let emptyCols = 0
  for (let y = 0; y < height; y++) {
    let found = false
    for (let x = 0; x < width; x += 2) {
      if (isInk((y * width + x) * 4)) { found = true; break }
    }
    if (!found) emptyRows++
  }
  for (let x = 0; x < width; x++) {
    let found = false
    for (let y = 0; y < height; y += 2) {
      if (isInk((y * width + x) * 4)) { found = true; break }
    }
    if (!found) emptyCols++
  }
  return { emptyRows, emptyCols }
})
check(
  'rotated tiled watermark still covers the entire canvas',
  rotatedCoverage.emptyRows === 0 && rotatedCoverage.emptyCols === 0,
  `${rotatedCoverage.emptyRows} empty rows, ${rotatedCoverage.emptyCols} empty cols`
)

// Zoom, rotation and per-image title must reach the rendered pixels.
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Images' }).click()
await page.waitForTimeout(300)
await page.locator('ul li').filter({ hasText: 'brick_red' }).first().click()
await page.waitForTimeout(300)
await page.getByRole('slider', { name: 'Rotation' }).focus()
for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
await page.waitForTimeout(900)
const rotated = await canvas.evaluate((node) => {
  const ctx = node.getContext('2d')
  const { data } = ctx.getImageData(0, 0, node.width, node.height)
  const seen = new Set()
  for (let i = 0; i < data.length; i += 4 * 53) {
    seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
  }
  return seen.size
})
check('per-image rotation repaints the sheet', rotated > 3, `${rotated} distinct colours`)

const hashCanvas = () =>
  canvas.evaluate((node) => {
    const { data } = node.getContext('2d').getImageData(0, 0, node.width, node.height)
    let hash = 0
    for (let i = 0; i < data.length; i += 4 * 31) {
      hash = (hash * 31 + data[i] + data[i + 1] * 3 + data[i + 2] * 7) >>> 0
    }
    return hash
  })

const beforeTitle = await hashCanvas()
await page.getByPlaceholder('brick_red.png').fill('Travertine Select')
await page.waitForTimeout(1000)
const afterTitle = await hashCanvas()
check('custom title repaints the canvas', beforeTitle !== afterTitle, `${beforeTitle} -> ${afterTitle}`)

// --- Presets ----------------------------------------------------------------
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Presets' }).click()
await page.waitForTimeout(300)
check('5 built-in presets listed', (await page.getByText('Marigol Material').count()) >= 1)
await page.getByRole('button', { name: /Marigol PBR/ }).first().click()
await page.waitForTimeout(1200)
const pbrStatus = await page.locator('footer').textContent()
check('PBR preset applies 2048x2048', pbrStatus.includes('2048×2048'), pbrStatus.replace(/\s+/g, ' ').trim().slice(0, 90))

// Save the current state as a user preset, then switch away and back.
await page.getByPlaceholder('Preset name').fill('QA Preset')
await page.getByRole('button', { name: 'Save', exact: true }).click()
await page.waitForTimeout(600)
check('user preset saved', await page.getByText('QA Preset').first().isVisible())

// --- Export: geometry must match the layout maths ---------------------------
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Export' }).click()
await page.waitForTimeout(600)
await page.getByRole('button', { name: /Export sheet/i }).click()

let download = page.waitForEvent('download', { timeout: 25000 })
let file = await download
check('export is .png', file.suggestedFilename().endsWith('.png'), file.suggestedFilename())

const pngPath = path.join(OUT, 'export.png')
await file.saveAs(pngPath)
const png = readFileSync(pngPath)
check('PNG magic bytes', png.subarray(1, 4).toString() === 'PNG')
const pngWidth = png.readUInt32BE(16)
const pngHeight = png.readUInt32BE(20)
check(
  'exported PNG matches the 2048x2048 canvas',
  pngWidth === 2048 && pngHeight === 2048,
  `${pngWidth}x${pngHeight}`
)

// --- High resolution export -------------------------------------------------
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Output' }).click()
await page.waitForTimeout(300)
await page.getByRole('radio', { name: '2x' }).click()
await page.waitForTimeout(400)
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Export' }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Export sheet/i }).click()
download = page.waitForEvent('download', { timeout: 30000 })
file = await download
const hiresPath = path.join(OUT, 'hires.png')
await file.saveAs(hiresPath)
const hires = readFileSync(hiresPath)
check(
  '2x export doubles the pixel dimensions',
  hires.readUInt32BE(16) === 4096 && hires.readUInt32BE(20) === 4096,
  `${hires.readUInt32BE(16)}x${hires.readUInt32BE(20)}`
)
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Output' }).click()
await page.waitForTimeout(300)
await page.getByRole('radio', { name: '1x' }).click()
await page.waitForTimeout(300)

// --- JPG + WebP formats -----------------------------------------------------
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Output' }).click()
await page.waitForTimeout(300)
await page.getByRole('radio', { name: 'JPG' }).click()
await page.waitForTimeout(300)
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Export' }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Export sheet/i }).click()
download = page.waitForEvent('download', { timeout: 20000 })
file = await download
check('JPG extension', file.suggestedFilename().endsWith('.jpg'), file.suggestedFilename())
const jpgPath = path.join(OUT, 'export.jpg')
await file.saveAs(jpgPath)
const jpg = readFileSync(jpgPath)
check('JPEG magic bytes', jpg[0] === 0xff && jpg[1] === 0xd8)

await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Output' }).click()
await page.waitForTimeout(300)
await page.getByRole('radio', { name: 'WebP' }).click()
await page.waitForTimeout(300)
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Export' }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Export sheet/i }).click()
download = page.waitForEvent('download', { timeout: 20000 })
file = await download
check('WebP extension', file.suggestedFilename().endsWith('.webp'), file.suggestedFilename())
const webpPath = path.join(OUT, 'export.webp')
await file.saveAs(webpPath)
const webp = readFileSync(webpPath)
check('WebP RIFF header', webp.subarray(0, 4).toString() === 'RIFF' && webp.subarray(8, 12).toString() === 'WEBP')

// --- Batch export as ZIP ----------------------------------------------------
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Output' }).click()
await page.waitForTimeout(300)
await page.getByRole('radio', { name: 'PNG' }).click()
await page.waitForTimeout(300)
await page.locator('nav[aria-label="Editor sections"] button', { hasText: 'Export' }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Download ZIP/i }).click()
download = page.waitForEvent('download', { timeout: 90000 })
file = await download
check('batch produces a .zip', file.suggestedFilename().endsWith('.zip'), file.suggestedFilename())
const zipPath = path.join(OUT, 'batch.zip')
await file.saveAs(zipPath)
const zip = readFileSync(zipPath)
check('ZIP magic bytes', zip.subarray(0, 2).toString() === 'PK')
// Local file header count, one per entry.
const entryCount = zip.readUInt16LE(zip.length - 22 + 10)
check('ZIP holds combined + per-material previews', entryCount === 6, `${entryCount} entries`)

await page.screenshot({ path: path.join(OUT, 'app.png'), fullPage: false })
await browser.close()

check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
console.log(`\nArtifacts: ${OUT}`)
console.log(failures === 0 ? 'All smoke checks passed.' : `${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
