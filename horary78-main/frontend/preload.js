const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // App info
  platform: process.platform,
  isElectron: true,
  
  // Environment info
  isDev: process.env.NODE_ENV === 'development'
});

// Set global API base URL for the frontend
window.API_BASE_URL = 'http://127.0.0.1:5000';