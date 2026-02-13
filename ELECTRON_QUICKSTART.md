# Electron Quick Start Guide

## Installation Complete ✅

Your Fantasy Puzzle RPG is now ready to run as a desktop application!

## Quick Commands

### Run in Development
```bash
npm run dev:electron
```
- Starts Vite dev server on http://localhost:5173
- Launches Electron app pointing to dev server
- Opens DevTools for debugging
- Hot reload enabled

### Build for Production
```bash
npm run build:electron
```
- Compiles React app to `dist/renderer`
- Compiles Electron main process to `dist/main`
- Ready for packaging

### Create Installers
```bash
npm run package:electron
```
- Creates platform-specific installers
- Windows: `.exe` and `.msi` files
- macOS: `.dmg` file
- Linux: `.AppImage` and `.deb` files

## What's Included

### Electron Features
- ✅ Secure IPC communication between React and Electron
- ✅ File system access for game saves
- ✅ Window controls (minimize, maximize, close)
- ✅ App version management
- ✅ Cross-platform support (Windows, macOS, Linux)

### Security
- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Preload script for safe API exposure
- ✅ Restricted file access to user data directory

### Fallback Support
- ✅ Web version still works (uses localStorage)
- ✅ Graceful degradation if Electron APIs unavailable
- ✅ Same codebase for desktop and web

## Using Electron APIs in Your Code

### Save Game Data
```typescript
import { electronIPC } from '~/utils/electron-ipc';

// Save game
await electronIPC.saveGame('autosave', {
  playerLevel: 10,
  inventory: [...],
  position: { x: 100, y: 200 }
});
```

### Load Game Data
```typescript
// Load game
const gameData = await electronIPC.loadGame('autosave');
if (gameData) {
  // Restore game state
}
```

### Check Environment
```typescript
if (electronIPC.isElectron()) {
  // Running in Electron - use desktop features
} else {
  // Running in web browser - use web features
}
```

### Window Controls
```typescript
// Minimize window
await electronIPC.minimizeWindow();

// Maximize/restore window
await electronIPC.maximizeWindow();

// Close window
await electronIPC.closeWindow();
```

## File Locations

Game saves are stored in platform-specific user data directories:

- **Windows**: `C:\Users\{username}\AppData\Roaming\Fantasy Puzzle RPG\saves\`
- **macOS**: `~/Library/Application Support/Fantasy Puzzle RPG/saves/`
- **Linux**: `~/.config/Fantasy Puzzle RPG/saves/`

## Troubleshooting

### Dev server not connecting
1. Make sure Vite dev server is running on http://localhost:5173
2. Check that port 5173 is not blocked by firewall
3. Restart the dev server: `npm run dev`

### Build fails
1. Clear dist directory: `rm -rf dist`
2. Rebuild: `npm run build:electron`
3. Check Node.js version (should be 16+)

### Preload script not loading
1. Ensure `electron/preload.ts` exists
2. Check that build outputs `dist/main/preload.js`
3. Verify path in `electron/main.ts` is correct

## Next Steps

1. **Test Development**: Run `npm run dev:electron` and verify the app launches
2. **Test IPC**: Use DevTools to test file operations
3. **Integrate Save/Load**: Update PauseMenuSave and PauseMenuLoad components
4. **Package App**: Run `npm run package:electron` to create installers
5. **Distribute**: Share installers with users

## Documentation

- **ELECTRON_SETUP.md** - Detailed setup and configuration
- **ELECTRON_IMPLEMENTATION_SUMMARY.md** - Complete implementation details
- **electron/types.ts** - TypeScript type definitions for IPC API

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review ELECTRON_SETUP.md for detailed configuration
3. Check Electron documentation: https://www.electronjs.org/docs
4. Check Vite documentation: https://vitejs.dev/

---

**Status**: ✅ Ready for development and testing
