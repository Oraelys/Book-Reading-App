import { app, session } from 'electron'
import { fileURLToPath } from 'node:url'
import { join, normalize } from 'node:path'

const rendererIndex = (): string => normalize(join(__dirname, '../renderer/index.html'))

/** True only for this app's own renderer document (dev server in development, packaged file otherwise). */
export function isTrustedUrl(raw: string | undefined | null): boolean {
  if (!raw) return false
  try {
    const url = new URL(raw)
    const dev = process.env.ELECTRON_RENDERER_URL
    if (!app.isPackaged && dev) return url.origin === new URL(dev).origin
    return url.protocol === 'file:' && normalize(fileURLToPath(url)) === rendererIndex()
  } catch {
    return false
  }
}

/**
 * Process-wide hardening. Content-Security-Policy itself is injected into index.html at build time
 * (see electron.vite.config.ts) so it applies to file:// loads, where response headers do not.
 */
export function installSecurity(): void {
  // The app needs no camera, mic, geolocation, notifications, etc.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
  session.defaultSession.setPermissionCheckHandler(() => false)

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
      if (!isTrustedUrl(url)) event.preventDefault()
    })
    contents.on('will-attach-webview', (event) => event.preventDefault())
    // No popups and no external browser hand-off: nothing in this app needs to open new windows.
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  })
}
