'use strict';

const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, shell, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let tray = null;

// ─── App Config ─────────────────────────────────────────────────────────────
const APP_URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'build/index.html')}`;
const WINDOW_WIDTH = 1400;
const WINDOW_HEIGHT = 900;
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 640;

// ─── Single instance lock ────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Create Window ───────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: 'AIOS Platform',
    backgroundColor: '#0a0a0a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    show: false,
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ─── Tray ─────────────────────────────────────────────────────────────────────
function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('AIOS Platform');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open AIOS', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { type: 'separator' },
    { label: 'Check for Updates', click: () => autoUpdater.checkForUpdates() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { if (mainWindow) mainWindow.show(); });
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{ label: app.name, submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ]}] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Window', accelerator: 'CmdOrCtrl+N', click: createWindow },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        ...(isMac ? [{ role: 'selectAll' }] : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://docs.aios.app') },
        { label: 'Report an Issue', click: () => shell.openExternal('https://github.com/your-org/aios/issues') },
        { type: 'separator' },
        { label: 'Check for Updates', click: () => autoUpdater.checkForUpdates() },
        { label: 'About AIOS', click: () => dialog.showMessageBox(mainWindow, {
          title: 'About AIOS',
          message: 'AIOS Platform',
          detail: `Version ${app.getVersion()}\nElectron ${process.versions.electron}\nNode ${process.versions.node}`,
          type: 'info',
        })},
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Auto Updater ────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({ type: 'info', title: 'Update Available', message: 'A new version is being downloaded.' });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Restart', 'Later'],
      title: 'Update Ready',
      message: 'Install and restart now?',
    }).then(result => {
      if (result.response === 0) autoUpdater.quitAndInstall();
    });
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:platform', () => process.platform);
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());

// ─── App lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  buildMenu();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { app.isQuitting = true; });
