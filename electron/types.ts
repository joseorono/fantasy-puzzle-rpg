export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getPath: (name: string) => Promise<string>;
  };
  file: {
    readFile: (filePath: string) => Promise<string>;
    writeFile: (filePath: string, data: string) => Promise<void>;
    deleteFile: (filePath: string) => Promise<void>;
    exists: (filePath: string) => Promise<boolean>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
