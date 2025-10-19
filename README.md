# Fantasy Puzzle RPG

A cozy fantasy Match-3 RPG battle system with pixel art aesthetics, built with React, TypeScript, and Vite.

## 🎮 Features

- **Match-3 Combat System**: Strategic puzzle-based battles with real-time combat
- **Party Management**: Four unique character classes (Warrior, Rogue, Mage, Healer)
- **Enemy Encounters**: Timed enemy attacks with visual feedback
- **Pixel Art Aesthetic**: Retro-inspired UI with modern React components
- **Type-Safe**: Full TypeScript implementation with comprehensive type system
- **State Management**: Reactive state with Jotai atoms

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation

- [Battle Screen](./docs/BATTLE_SCREEN.md) - UI components and layout
- [Combat System](./docs/COMBAT_SYSTEM.md) - Game mechanics and balance

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Jotai** for state management
- **Lucide React** for icons
- **React Compiler** for optimized rendering

## 📁 Project Structure

```
src/
├── components/       # React components
│   ├── battle/      # Battle-specific components
│   └── ui/          # Reusable UI components
├── stores/          # Jotai state management
├── types/           # TypeScript type definitions
├── constants/       # Game configuration
├── views/           # Page-level components
└── lib/             # Utility functions
```

## 🎯 Type System

The project uses a well-organized type system:

- **`rpg-elements.ts`**: Core RPG types (CharacterData, EnemyData, OrbType)
- **`battle.ts`**: Battle-specific types (BattleState, Orb, Match)
- **`components.ts`**: Component prop types

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
