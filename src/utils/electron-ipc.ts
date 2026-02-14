// /**
//  * Electron IPC utility for safe communication between renderer and main process
//  */

// export const electronIPC = {
//   /**
//    * Check if running in Electron environment
//    */
//   isElectron(): boolean {
//     return typeof window !== 'undefined' && !!(window as any).electron;
//   },

//   /**
//    * Get the Electron API object
//    */
//   getAPI() {
//     if (!this.isElectron()) {
//       console.warn('Not running in Electron environment');
//       return null;
//     }
//     return (window as any).electron;
//   },

//   /**
//    * Save game data to file
//    */
//   async saveGame(filename: string, data: any): Promise<void> {
//     const api = this.getAPI();
//     if (!api) {
//       // Fallback to localStorage for web version
//       localStorage.setItem(`game_${filename}`, JSON.stringify(data));
//       return;
//     }

//     try {
//       const userDataPath = await api.app.getPath('userData');
//       const savePath = `${userDataPath}/saves/${filename}.json`;
//       await api.file.writeFile(savePath, JSON.stringify(data, null, 2));
//     } catch (error) {
//       console.error('Failed to save game:', error);
//       throw error;
//     }
//   },

//   /**
//    * Load game data from file
//    */
//   async loadGame(filename: string): Promise<any> {
//     const api = this.getAPI();
//     if (!api) {
//       // Fallback to localStorage for web version
//       const data = localStorage.getItem(`game_${filename}`);
//       return data ? JSON.parse(data) : null;
//     }

//     try {
//       const userDataPath = await api.app.getPath('userData');
//       const savePath = `${userDataPath}/saves/${filename}.json`;
//       const exists = await api.file.exists(savePath);
//       if (!exists) {
//         return null;
//       }
//       const data = await api.file.readFile(savePath);
//       return JSON.parse(data);
//     } catch (error) {
//       console.error('Failed to load game:', error);
//       throw error;
//     }
//   },

//   /**
//    * Delete game save file
//    */
//   async deleteGame(filename: string): Promise<void> {
//     const api = this.getAPI();
//     if (!api) {
//       // Fallback to localStorage for web version
//       localStorage.removeItem(`game_${filename}`);
//       return;
//     }

//     try {
//       const userDataPath = await api.app.getPath('userData');
//       const savePath = `${userDataPath}/saves/${filename}.json`;
//       await api.file.deleteFile(savePath);
//     } catch (error) {
//       console.error('Failed to delete game:', error);
//       throw error;
//     }
//   },

//   /**
//    * Get list of save files
//    */
//   async listSaves(): Promise<string[]> {
//     const api = this.getAPI();
//     if (!api) {
//       // Fallback to localStorage for web version
//       const saves: string[] = [];
//       for (let i = 0; i < localStorage.length; i++) {
//         const key = localStorage.key(i);
//         if (key?.startsWith('game_')) {
//           saves.push(key.replace('game_', ''));
//         }
//       }
//       return saves;
//     }

//     try {
//       const userDataPath = await api.app.getPath('userData');
//       const savesPath = `${userDataPath}/saves`;
//       const exists = await api.file.exists(savesPath);
//       if (!exists) {
//         return [];
//       }
//       // Note: This is a simplified implementation
//       // In a real app, you'd need to implement a directory listing IPC handler
//       return [];
//     } catch (error) {
//       console.error('Failed to list saves:', error);
//       return [];
//     }
//   },

//   /**
//    * Get app version
//    */
//   async getVersion(): Promise<string> {
//     const api = this.getAPI();
//     if (!api) {
//       return 'web-version';
//     }

//     try {
//       return await api.app.getVersion();
//     } catch (error) {
//       console.error('Failed to get version:', error);
//       return 'unknown';
//     }
//   },

//   /**
//    * Minimize window
//    */
//   async minimizeWindow(): Promise<void> {
//     const api = this.getAPI();
//     if (!api) return;

//     try {
//       await api.window.minimize();
//     } catch (error) {
//       console.error('Failed to minimize window:', error);
//     }
//   },

//   /**
//    * Maximize window
//    */
//   async maximizeWindow(): Promise<void> {
//     const api = this.getAPI();
//     if (!api) return;

//     try {
//       await api.window.maximize();
//     } catch (error) {
//       console.error('Failed to maximize window:', error);
//     }
//   },

//   /**
//    * Close window
//    */
//   async closeWindow(): Promise<void> {
//     const api = this.getAPI();
//     if (!api) return;

//     try {
//       await api.window.close();
//     } catch (error) {
//       console.error('Failed to close window:', error);
//     }
//   },
// };

