/**
 * Detects whether the app is running inside the Electron shell.
 * Reads the flag published by the preload bridge; the user-agent check is a
 * fallback for the case where the bridge failed to load.
 */
export const isElectron = (): boolean => {
  if (typeof window === 'undefined') return false;

  if (window.electron?.isElectron === true) return true;

  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
};

/**
 * The Electron runtime version, or null when running in a browser.
 * Comes from the preload bridge — `process` does not exist in a sandboxed renderer.
 */
export const getElectronVersion = (): string | null => {
  return window.electron?.electronVersion ?? null;
};
