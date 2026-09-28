# Marigol Asset Studio

Offline preview-sheet generator for 3D material and texture libraries. Drop in a
folder of texture images, arrange them, style the sheet, watermark it, and export
PNG / JPG / WebP — including a batch of one preview per material, packed into a
ZIP.

No backend, no network calls, no telemetry. Images are read as local `blob:`
URLs and never leave the machine. The build output runs from `file://` or any
static path.

## Stack

React 19 · TypeScript (strict) · Vite 8 · Tailwind CSS v4 · shadcn/ui · Zustand 5
· Canvas 2D · Lucide

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Dev server with HMR                                 |
| `npm run build`     | Typecheck, then production build into `dist/`       |
| `npm run preview`   | Serve the production build                          |
| `npm run typecheck` | `tsc -b` with no emit                               |
| `npm run lint`      | oxlint                                              |
| `npm run smoke`     | End-to-end browser check (needs `npm run preview`)   |

The build uses a relative `base`, so `dist/` can be opened from any path or
sub-directory without a server.

## Features

**Materials** — multi-image drag & drop (anywhere in the window), drag to
reorder, per-image rotation, zoom, crop offset, horizontal flip, and custom
titles. Unsupported files are reported rather than silently dropped.

**Layout** — grid or masonry, configurable columns, horizontal/vertical gaps
(optionally linked), outer padding, tile sizing, tile aspect ratio, border
radius, image fit (cover / contain / stretch), background colour, and three
fit-to-canvas modes: *fill* spans the canvas, *fit* only shrinks, *crop* spans
and clips.

**Typography** — caption on/off, placement (band below, overlay top/bottom,
hidden), font family, weight, size, colour, alignment, letter case, index
numbering, and a filename template with `{name}`, `{ext}`, `{index}`,
`{width}`, `{height}`, `{date}`, `{time}` tokens.

**Watermarks** — any number of stacked layers, each text, image, or combined.
Full transform control (opacity, scale, rotation, blend mode, shadow), single
placement with a 3×3 anchor grid and margin, or a tiled pattern with horizontal
and vertical spacing plus offsets. The tiled lattice is laid out in the mark's
own rotated frame, so the pattern always reaches every corner of the output.

**Output & export** — width/height with optional aspect lock, 11 size presets
plus custom sizes, PNG / JPG / WebP, quality for JPG and WebP, and 1×–4×
high-resolution export clamped to the browser's canvas limits.

**Presets** — five built-in styles (Marigol Material, Square, Landscape, PBR,
Custom) plus user presets saved to `localStorage`. A preset captures canvas
size, grid, background, image styling, typography, watermarks and export
settings — never the material files themselves.

**Batch** — render the combined sheet and/or one preview per material, then
download everything as a single ZIP. The ZIP writer is built in
(`src/core/export/zip.ts`, store-only, since PNG/JPG/WebP are already
compressed), so there is no archive dependency.

## Architecture

The hard rule: **no Canvas drawing code in React components.** Components own
state and layout; `src/core` owns pixels.

```
src/
├─ types/          Settings, asset, watermark and preset contracts
├─ core/           Framework-free services
│  ├─ constants.ts   Defaults, option catalogues, limits
│  ├─ fonts.ts       Offline-safe font families, CSS font shorthand
│  ├─ image.ts       Decode cache, file → asset helpers
│  ├─ text.ts        Measured text, truncation, letter spacing, templates
│  ├─ measure.ts     Shared offscreen 2D context for measurement
│  ├─ layout.ts      Pure geometry: settings + aspects → absolute rects
│  ├─ model.ts       Document + materials → RenderModel (measured, decoded)
│  ├─ render/        The single paint path
│  │  ├─ engine.ts     createScene() → paintScene()
│  │  ├─ tile.ts       Tile framing, rotation, captions
│  │  ├─ watermark.ts  Single, combined and tiled marks
│  │  ├─ preview.ts    Backing-store sizing for the live canvas
│  │  └─ shapes.ts     Rounded rects, rotation maths
│  └─ export/        Encoding, file names, batch runner, ZIP
├─ presets/        Built-in presets, normalisation, persistence
├─ store/          Zustand state
│  ├─ document-store.ts   The document + undo/redo (persisted)
│  ├─ materials-store.ts  Session assets + per-image overrides
│  ├─ presets-store.ts    Built-in and user presets
│  └─ ui-store.ts         Panels, zoom, toasts, export progress
├─ hooks/          Store bridges: render input, ingest, export, hotkeys
└─ components/     React only: shell, inspector sections, ui primitives
```

### Preview/export parity

Both paths run the same two functions:

```
createScene(input)  →  { model, bitmaps }     settings resolved, images decoded
paintScene(ctx, …)  →  draws the model         the only drawing code that exists
```

The preview (`components/preview-canvas.tsx`) calls them with the device pixel
ratio as the scale; the exporter (`core/export/index.ts`) calls them with the
requested resolution scale. Nothing else differs, so the file on disk matches
the canvas — and the smoke test asserts it by comparing exported PNG dimensions
against the layout maths and by pixel-hashing the preview across edits.

The preview backing store is capped (`MAX_PREVIEW_PIXELS`) so a 12000 px
document still scrubs smoothly. Because only the uniform scale changes, the
preview stays geometrically identical to the export.

### State

- **Materials** are session-only: `File` objects become object URLs, revoked on
  removal. Reload clears them.
- **The document** (output, layout, tiles, typography, export, watermarks) is
  persisted to `localStorage` and normalised on load, so a corrupted or
  hand-edited entry degrades to defaults instead of crashing.
- **Per-image adjustments** stay with the session, never in a preset.
- **Undo/redo** snapshots the document. Consecutive edits to the same setting
  coalesce within 700 ms, so dragging a slider is one undo step rather than
  fifty.

### Layout maths

`computeLayout()` is pure: output size, padding, gaps, column count and the
natural aspect of each image in, absolute rectangles out. It never touches the
DOM. Fit modes resolve to a single uniform scale:

| Mode   | Scale                     | Effect                                  |
| ------ | ------------------------- | --------------------------------------- |
| `fit`  | `min(sx, sy)`, capped at 1 | Shrink to fit, never enlarge            |
| `fill` | `min(sx, sy)`             | Always spans the canvas on one axis     |
| `crop` | `max(sx, sy)`             | Spans both axes, overflow clipped       |

Masonry uses greedy shortest-column packing, so column bottoms stay level.

## Shortcuts

| Key                    | Action                        |
| ---------------------- | ----------------------------- |
| `Ctrl`/`⌘` + `Z`       | Undo                          |
| `Ctrl`/`⌘` + `Shift`+`Z` | Redo                        |
| `1` … `8`              | Switch inspector panel        |
| `[` / `]`              | Move the selected material    |
| `Delete`               | Remove the selected material  |
| `Escape`               | Clear the selection           |

## Verification

`npm run smoke` drives a real browser against the production build: it uploads
five generated PNGs plus a non-image, checks the rejected-file report, verifies
masonry, per-image rotation and custom titles repaint the canvas, asserts the
tiled watermark covers every row and column at zero spacing (including at 31°),
applies built-in presets, and then checks exported PNG/JPG/WebP headers and
pixel dimensions, 2× high-resolution output, and the batch ZIP entry count.
# asset-studio
