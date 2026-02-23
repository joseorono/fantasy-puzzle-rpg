import { useState, useEffect } from 'react';
import { isElectron } from '~/lib/electron-detector';

/**
 * Hook to detect if the app is running in Electron environment
 * Returns true if running in Electron, false otherwise
 * It's just a thin wrapper around electron-detector.ts
 */
export function useIsElectron(): boolean {
  const [isElectronEnv, setIsElectronEnv] = useState(false);

  useEffect(() => {
    // Use the existing sophisticated electron detection logic
    setIsElectronEnv(isElectron());
  }, []);

  return isElectronEnv;
}
