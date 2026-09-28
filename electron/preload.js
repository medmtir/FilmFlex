const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('filmflexDesktop', {
  isElectron: true,
  platform: process.platform,
  version: '1.0.0',
});
