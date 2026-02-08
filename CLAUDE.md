# Fantasy Puzzle RPG - Project Rules

## Project Overview

A fantasy match-3 puzzle RPG browser game built with React, TypeScript, and Vite. Players battle enemies by making match-3 combos on a puzzle board, manage a party of characters with RPG stats (POW/VIT/SPD), explore maps, collect loot, and visit towns. Features JRPG-style dialogue, level-up progression, and an inventory/item system.

## Tech Stack

- **Framework**: React 19 with TypeScript (strict mode)
- **Build**: Vite 7
- **State**: Zustand (global game state with slices) + Jotai (battle/combat state only)
- **Styling**: Tailwind CSS 4 + tailwindcss-animate
- **Audio**: @pixi/sound
- **UI Primitives**: Radix UI (slider, tooltip), Lucide React (icons), class-variance-authority (cva)
- **Validation**: Zod
- **Testing**: Vitest + @vitest/ui
- **Font**: Press Start 2P (pixel/retro aesthetic)
- **Compiler**: React Compiler (babel-plugin-react-compiler)

## Path Aliases

- `~/` maps to `./src/` (e.g., `import { cn } from '~/lib/utils'`)
- `@/` maps to `./public/` (e.g., `import sound from '@/assets/audio/click.mp3'`)

## File & Naming Conventions

- **Component files**: `kebab-case.tsx` (e.g., `battle-item-bar.tsx`)
- **Utility/service files**: `kebab-case.ts` (e.g., `sound-service.ts`)
- **Type files**: `kebab-case.ts` in `src/types/` or co-located as `*.types.ts` in slices
- **Component names**: PascalCase (e.g., `BattleItemBar`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ENEMY_DEFINITIONS`, `MAP_NODES`)
- **Variables/functions**: camelCase
- **Directories**: lowercase with dashes (e.g., `components/level-up-screen`)
- **Test files**: co-located as `*.test.ts` in `src/lib/`

## Directory Structure

```
src/
  components/       # React components organized by feature
    battle/         # Battle/combat UI components
    dialogue/       # JRPG-style dialogue system
    effects/        # Visual effects
    level-up-screen/# Level-up UI
    licenses/       # License display
    map/            # Map/exploration components
    marquee/        # Scrolling text marquee
    town/           # Town hub components
    ui/             # Base UI primitives
      8bit/         # Pixel art styled UI components
  constants/        # Game data definitions
    dialogue/       # Dialogue scripts and scenes
      scenes/       # Individual dialogue scenes
    enemies/        # Enemy stat definitions
      world-00/     # Enemies by world
    flavor-text/    # Flavor text and welcome messages
    maps/           # Map node definitions and loot tables
      map-00/       # First map data
  hooks/            # Custom React hooks
  lib/              # Pure business logic, utilities, and tests
  services/         # Singleton service classes (sound, assets, loader)
  stores/           # State management
    slices/         # Zustand store slices (party, resources, inventory, router, map-progress, floor-loot-progress)
  styles/           # CSS stylesheets (pixel art, animations, dialogue)
  types/            # TypeScript type definitions
  views/            # Top-level view/screen components (battle, level-up, town, debug, etc.)
```

## Code Style & Formatting

- **Prettier** handles formatting: configured via `.prettierrc`
- **Tailwind class sorting** enforced via `prettier-plugin-tailwindcss`
- **ESLint** with React hooks and TypeScript plugins
- Always use `===` / `!==`
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Avoid enums; use maps instead
- Use `cn()` from `~/lib/utils` for conditional class merging (clsx + tailwind-merge)

## React Patterns

- Functional components only, using the `function` keyword
- Define props with interfaces, not prop-types
- Props are destructured in function parameters
- Follow the Rules of Hooks — call hooks only at the top level
- Extract reusable logic into custom hooks
- **Do NOT memoize** with `React.memo`, `useCallback`, or `useMemo` — we use the React Compiler
- Favor composition (render props, children) over inheritance
- Use refs only for direct DOM access
- Use guard clauses (early returns) for error handling

## Styling

- Use Tailwind for simple things, but for pixel art and complex styles use CSS in `src/styles/` and import in `index.css`
- Component variant styling uses `class-variance-authority` (cva)
- Use existing UI primitives from `src/components/ui/` rather than building from scratch

## State Management

- **Zustand** is the primary global store (`src/stores/game-store.ts`) with slices for: party, resources, inventory, router, map-progress, floor-loot-progress
- **Jotai** is used exclusively for battle/combat state (`src/stores/battle-atoms.ts`) — in combat code, only use Jotai except for initial state setup
- Do not introduce new state management libraries; use Zustand, Jotai, or `useState`
- No prop drilling unless necessary **AND** optimal

## Routing

- Custom view-based router implemented in the Zustand store (`router` slice)
- Navigate with actions: `goToTownHub()`, `goToBattle()`, `goToMap()`, `goToStore()`, `goToInn()`, `goToDialogue()`, `goToBattleRewards()`, `goToInventory()`, `goToDebug()`, `goBack()`, `goBackTo()`
- Access via `useRouterActions()`, `useCurrentView()`, `useViewData()` from `~/stores/game-store`
- See `docs/ROUTING_QUICK_REFERENCE.md` for full API

## Game Data

- Enemy definitions live in `src/constants/enemies/`
- Map and loot table data in `src/constants/maps/`
- Dialogue scenes in `src/constants/dialogue/scenes/`
- RPG stats: POW (damage), VIT (max HP), SPD (cooldowns) — see `docs/RPG_SYSTEM.md`
- Combat system details in `docs/COMBAT_SYSTEM.md`

## Services

- Services are singleton classes located in `src/services/`
- `SoundService` — audio playback
- `AssetsService` — asset loading
- `LoaderService` — game loading
- Audio must go through the existing SoundService pattern

## Testing

- Tests live in `src/lib/*.test.ts`
- Use Vitest for unit tests
- Run tests: `npm run test` (UI) or `npm run test-cli` (verbose CLI)
- Filter tests: `npm run test-filter <pattern>`

## Build & Scripts

- `npm run dev` — Development server (http://localhost:5173)
- `npm run dev-expose-host` — Dev server exposed to network
- `npm run build` — Production build (`tsc -b && vite build`)
- `npm run lint` — ESLint check
- `npm run prettier-format` — Format all source files
- `npm run test-cli` — Run tests in CLI
- `npm run coverage` — Run tests with coverage

## Important Notes

- The project uses ES modules (`"type": "module"` in package.json)
- TypeScript strict mode is enabled; do not weaken it
- Do not introduce new state management libraries
- Do not handle version control — we'll commit and push changes ourselves
- The `main` branch is the primary branch
- Documentation for game systems lives in `docs/`
