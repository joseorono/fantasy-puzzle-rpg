# Plan: Map Occlusion Layers (character z-order fix)

## Problem

The character sprite "mounts" (renders on top of) walls and objects in the
apprentice-forge map. It looks correct in the other maps, but wrong in the forge.

## Root cause

The character is a DOM element with `zIndex: 10`, always rendered **above** the
entire map canvas. In the forge, walls, statues, and objects are drawn on the
same canvas, and the character walks on the floor (`road` layer) but visually
overlaps them.

This does not happen in `map-00` / `map-01` because there the trees and
mountains sit on **non-walkable** tiles (the `road` layer is empty underneath
them), so the character never gets behind an object. In the forge, the `road`
layer has tiles in the corridors while `walls` and `statues` are drawn in
higher layers of the same canvas. The character walks the corridor correctly,
but because its DOM element is always on top, it covers the walls.

Walkability itself is **correct** — the `road` layer only has tiles in the
corridors, not under walls. The issue is purely visual render order.

## Solution: two canvases (background + foreground)

Split the rendering into two canvases:

1. **Background canvas** (`canvasRef`): draws `lava`, `details`, `road` — layers
   that render **below** the character.
2. **Foreground canvas** (`fgCanvasRef`): draws `walls`, `statues`,
   `chests, barrils and doors` — layers that render **above** the character.
3. DOM order: background canvas → character sprite → foreground canvas. Walls
   and objects then correctly occlude the character.

## Changes

### 1. `src/types/tilemap.ts`

Add `occlusionLayers?: string[]` to `TiledMapConfig`:

```ts
export interface TiledMapConfig {
  // ... existing fields ...
  /** Layers drawn above the character sprite. Used for walls and tall objects. */
  occlusionLayers?: string[];
}
```

### 2. `src/components/map/tile-map.tsx`

- Add a `fgCanvasRef` for the foreground canvas.
- Extract the layer-drawing loop into a reusable helper that takes a canvas
  context and a list of layer names.
- In the drawing effect, draw background layers on the main canvas and
  foreground (occlusion) layers on the foreground canvas.
- Position the foreground canvas exactly over the background canvas using the
  same `scale`, `offsetX`, `offsetY` from `useCanvasMetrics`, with
  `transform: scale(...)` and `transformOrigin: 'top left'`.
- Set `pointerEvents: 'none'` on the foreground canvas so it never blocks clicks.

### 3. `src/constants/maps/map-00-apprentice-forge/config.ts`

```ts
occlusionLayers: ['walls', 'statues'],
```

## Why this works

- The character stays a DOM element (efficient; no full-canvas redraw per frame).
- Walls and statues draw once on the foreground canvas, exactly like before but
  on a separate canvas.
- The foreground canvas scales and positions identically to the background
  canvas, so the two stay pixel-perfect aligned.
- Existing maps without `occlusionLayers` are unchanged.
