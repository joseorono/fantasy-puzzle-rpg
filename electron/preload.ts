import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name: string) => ipcRenderer.invoke('app:get-path', name),
  },
  file: {
    readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    writeFile: (filePath: string, data: string) => ipcRenderer.invoke('file:write', filePath, data),
    deleteFile: (filePath: string) => ipcRenderer.invoke('file:delete', filePath),
    exists: (filePath: string) => ipcRenderer.invoke('file:exists', filePath),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
});
