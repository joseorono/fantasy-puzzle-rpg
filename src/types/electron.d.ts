// The preload bridge, as seen from the renderer. `window.electron` is optional
// because the same bundle also ships to the browser, where nothing exposes it.
// The contract itself lives with the preload script that publishes it.
import type { ElectronAPI } from '../../electron/types';

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
