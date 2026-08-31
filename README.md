# Fantasy Puzzle RPG

A cozy fantasy Match-3 RPG battle system with pixel art aesthetics, built with React, TypeScript, and Vite.

## Features

- **Match-3 RPG Combat System**: Strategic puzzle battles with active hero skills, consumable item bar, party Guard meter, cascade combo scaling, wildcard bombs, and enemy stagger.
- **Party & Progression**: Four distinct classes (Warrior, Rogue, Mage, Healer) with class-specific HP scaling, derived stats (POW, VIT, SPD), and hold-to-allocate level-up screens.
- **Skill System**: Active skills (Ultimates) and passive skills across 4 tiers per class with Indigolay sprite sheets and resource unlock costs.
- **Town Hub & Crafting**: Item Shop (Buy/Sell), Blacksmith (Forge, Upgrade, Salvage with pity bad-luck protection), and Inn.
- **Dungeon System**: Multi-floor runs with authored and procedurally randomized encounters, room choices, and completion rewards.
- **Map & Exploration**: Interactive overworld node navigation, floor loot collection, and terrain-based footstep audio.
- **Pause Menu & Options**: Full keyboard-navigable menu overlay with Items, Equip, Skills, Stats, Save, Load, and Audio options.
- **Save / Load System**: 4 persistent slots (3 manual + 1 autosave) with Zod validation, disk save status indicator, and browser close guard.
- **Dialogue System**: JRPG visual-novel style dialogue scenes with typewriter text, portraits, and fast-forward controls.
- **Retro Aesthetic**: Pixel art styling with `@pixi/sound` audio, Press Start 2P font, and scanline/CRT visual effects.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests
npm run test-cli

# Build for production
npm run build
```

## Documentation

- [Save / Load System](./docs/SAVE_LOAD_SYSTEM.md) - Slot storage, Zod schema, and hooks
- [Combat System](./docs/COMBAT_SYSTEM.md) - Game mechanics, stagger, and balance
- [Battle Screen](./docs/BATTLE_SCREEN.md) - UI components and battle layout
- [RPG System](./docs/RPG_SYSTEM.md) - POW/VIT/SPD stats and derived math
- [Guard Meter](./docs/GUARD_METER_PLAN.md) - Gray orb defense mechanics
- [Dialogue System](./docs/DIALOGUE_SYSTEM.md) - Dialogue scene orchestrator
- [Routing Reference](./docs/ROUTING_QUICK_REFERENCE.md) - View navigation API
- [Store Architecture](./src/stores/STORE_DOCS.md) - Zustand slices and Jotai atoms
- [Systems Progress & TODO](./docs/SYSTEMS_TODO.md) - Current system implementation status
- [Audio Progress & TODO](./docs/SOUNDS_TODO.md) - SFX and music tracking

## Tech Stack

- **Framework**: React 19 with TypeScript (strict mode)
- **Build**: Vite 7
- **State**: Zustand (8 global store slices) + Jotai (combat, dungeon, and pause UI)
- **Styling**: Tailwind CSS 4 + custom pixel art CSS stylesheets
- **Audio**: @pixi/sound
- **UI Primitives**: Radix UI, Lucide React, class-variance-authority (cva)
- **Validation**: Zod
- **Testing**: Vitest
- **Compiler**: React Compiler (babel-plugin-react-compiler)

## React Compiler

The React Compiler is enabled on this project. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances. We might need to remove it later if the tradeoff is not worth it.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
