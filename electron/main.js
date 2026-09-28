const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#121212',
    title: 'FilmFlex VIP - Application Officielle',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // =========================================================================
  // MAGIC 0-ADS / POPUP SHIELD:
  // Blocks 100% of popup ads, ad redirect attempts, and unwanted new windows!
  // =========================================================================
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('[FilmFlex AdShield] Blocked popup ad window to:', url);
    // Deny any external popup or ad window
    return { action: 'deny' };
  });

  // Load production URL or local development server
  const startUrl = process.env.ELECTRON_START_URL || 'https://filmflex-seven.vercel.app';
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
