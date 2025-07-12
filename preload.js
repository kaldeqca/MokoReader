// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  refreshLibrary: () => ipcRenderer.invoke('refresh-library'),
  // --- NEW: Add this function ---
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path')
});