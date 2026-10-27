import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'node:path'
import { ApiClient } from './api/api-client'
import { ContentApi } from './api/content-api'
import { ImportService } from './api/import-service'
import { SystemApi } from './api/system-api'
import { AuthService } from './auth/auth-service'
import { EncryptedSessionStorage } from './auth/session-store'
import { ConfigError, loadConfig } from './config'
import { FilePicker } from './files/file-picker'
import { FileRegistry } from './files/file-registry'
import { registerIpc } from './ipc/register'
import { log } from './logger'
import { installSecurity } from './security'
import { AdminApi } from './api/admin-api';


let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#d3d3d6',
    title: 'Inkwell Admin',
    frame: false, // custom window chrome (see WindowControls in the renderer)
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // DevTools are a development convenience only.
      devTools: !app.isPackaged
    }
  })

  win.once('ready-to-show', () => win.show())
  win.on('closed', () => {
    mainWindow = null
  })

  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (!app.isPackaged && devUrl) void win.loadURL(devUrl)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
  return win
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    installSecurity()

    let services: Parameters<typeof registerIpc>[0]
    try {
      const config = loadConfig()
      const auth = new AuthService(config, new EncryptedSessionStorage())
      const api = new ApiClient(config, auth)
      const registry = new FileRegistry()
      services = {
        config,
        auth,
        admin: new AdminApi(api),
        content: new ContentApi(api),
        imports: new ImportService(config, auth, registry),
        picker: new FilePicker(registry, () => mainWindow),
        system: new SystemApi(config)
      }
      await auth.restore()
    } catch (e) {
      const message = e instanceof ConfigError ? e.message : 'Unexpected startup failure.'
      log.error('startup', e)
      dialog.showErrorBox('Inkwell Admin cannot start', message)
      app.quit()
      return
    }

    registerIpc(services)
    mainWindow = createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
