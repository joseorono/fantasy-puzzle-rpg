// Type definitions for Electron-specific globals

interface Window {
  process?: {
    type: string;
  };
}

// Extend the NodeJS.Process interface
declare namespace NodeJS {
  interface ProcessVersions {
    electron?: string;
  }
}
