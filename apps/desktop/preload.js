'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Generic IPC
  send: (channel, data) => {
    const allowed = ['app:ready', 'log:info', 'log:error'];
    if (allowed.includes(channel)) ipcRenderer.send(channel, data);
  },
  on: (channel, callback) => {
    const allowed = ['update:available', 'update:downloaded', 'notification'];
    if (allowed.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },
});
