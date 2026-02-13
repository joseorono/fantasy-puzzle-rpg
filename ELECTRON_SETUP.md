# Electron Setup for Fantasy Puzzle RPG

This document describes the Electron desktop application setup for Fantasy Puzzle RPG.

## Development

To run the app in development mode with hot reload:

```bash
npm run dev:electron
```

This will:
1. Start the Vite dev server on http://localhost:5173
2. Launch Electron pointing to the dev server
3. Enable DevTools for debugging

## Building

To build the app for distribution:

```bash
npm run build:electron
```

This will:
1. Build the React app to `dist/renderer`
2. Build the Electron main process to `dist/main`

## Packaging

To create installers for your platform:

```bash
npm run package:electron
```

This will create platform-specific installers in the `dist` directory:
- **Windows**: `.exe` and `.msi` installers
- **macOS**: `.dmg` installer
- **Linux**: `.AppImage` and `.deb` installers

## Project Structure

```
electron/
├── main.ts          # Electron main process
├── preload.ts       # Security bridge for IPC
└── types.ts         # TypeScript types for IPC

src/
├── (existing React code)
└── (can use window.electron for IPC)

dist/
├── main/            # Compiled main process
└── renderer/        # Built React app
```

## IPC Communication

The preload script exposes the following APIs to React components:

### App API
```typescript
window.electron.app.getVersion()
window.electron.app.getPath(name)
```

### File API
```typescript
window.electron.file.readFile(filePath)
window.electron.file.writeFile(filePath, data)
window.electron.file.deleteFile(filePath)
window.electron.file.exists(filePath)
```

### Window API
```typescript
window.electron.window.minimize()
window.electron.window.maximize()
window.electron.window.close()
```

## Save Game Integration

Game saves are stored in the user's data directory:
- **Windows**: `C:\Users\{user}\AppData\Roaming\Fantasy Puzzle RPG\`
- **macOS**: `~/Library/Application Support/Fantasy Puzzle RPG/`
- **Linux**: `~/.config/Fantasy Puzzle RPG/`

To save game data:
```typescript
const savePath = await window.electron.app.getPath('userData');
const gameDataPath = path.join(savePath, 'saves', 'game.json');
await window.electron.file.writeFile(gameDataPath, JSON.stringify(gameData));
```

## Security Considerations

- **Context Isolation**: Enabled to prevent direct access to Node.js APIs
- **Preload Script**: Acts as a secure bridge between main and renderer processes
- **IPC Channels**: Only explicitly defined channels are available to the renderer
- **No Node Integration**: Disabled to prevent security vulnerabilities

## Troubleshooting

### Dev server not connecting
Make sure the dev server is running on http://localhost:5173 before launching Electron.

### Build errors
Clear the `dist` directory and rebuild:
```bash
rm -rf dist
npm run build:electron
```

### Preload script not found
Ensure `electron/preload.ts` is compiled to `dist/main/preload.js` during the build process.
