var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
import { contextBridge, ipcRenderer } from "electron";
var require_preload = __commonJS({
  "preload.cjs"() {
    contextBridge.exposeInMainWorld("electron", {
      platform: process.platform,
      isElectron: true,
      app: {
        getVersion: () => ipcRenderer.invoke("app:get-version"),
        getPath: (name) => ipcRenderer.invoke("app:get-path", name)
      },
      file: {
        readFile: (filePath) => ipcRenderer.invoke("file:read", filePath),
        writeFile: (filePath, data) => ipcRenderer.invoke("file:write", filePath, data),
        deleteFile: (filePath) => ipcRenderer.invoke("file:delete", filePath),
        exists: (filePath) => ipcRenderer.invoke("file:exists", filePath)
      },
      window: {
        minimize: () => ipcRenderer.invoke("window:minimize"),
        maximize: () => ipcRenderer.invoke("window:maximize"),
        close: () => ipcRenderer.invoke("window:close")
      }
    });
  }
});
export default require_preload();
