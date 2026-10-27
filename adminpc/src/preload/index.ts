import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC, type InkwellBridge, type Unsubscribe } from '../shared/ipc'
import type { AuthState, ImportProgress } from '../shared/types'
import type { AdminDashboardOverview } from '../shared/admin-types';

/**
 * The only thing the renderer can reach. `ipcRenderer` itself is never exposed, and there is no
 * generic "send/invoke by channel name" – each entry is a fixed channel with fixed arguments.
 * Payload validation happens again in the main process; this layer is just plumbing.
 */
function subscribe<T>(channel: string, cb: (value: T) => void): Unsubscribe {
  const listener = (_e: IpcRendererEvent, value: T): void => cb(value)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const bridge: InkwellBridge = {
  admin: {
  dashboardOverview: () =>
    ipcRenderer.invoke(IPC.adminDashboardOverview),
},
  app: { info: () => ipcRenderer.invoke(IPC.appInfo) },
  system: { health: () => ipcRenderer.invoke(IPC.systemHealth) },
  window: { control: (action) => ipcRenderer.invoke(IPC.windowControl, action) },
  auth: {
    getState: () => ipcRenderer.invoke(IPC.authGetState),
    signIn: (email, password) => ipcRenderer.invoke(IPC.authSignIn, email, password),
    signOut: () => ipcRenderer.invoke(IPC.authSignOut),
    onChanged: (cb) => subscribe<AuthState>(IPC.authChanged, cb)
  },
  books: {
    list: () => ipcRenderer.invoke(IPC.booksList),
    get: (novelId) => ipcRenderer.invoke(IPC.booksGet, novelId),
    chapters: (novelId) => ipcRenderer.invoke(IPC.booksChapters, novelId),
    chapter: (novelId, chapterNumber) => ipcRenderer.invoke(IPC.booksChapter, novelId, chapterNumber),
    validate: (novelId) => ipcRenderer.invoke(IPC.booksValidate, novelId),
    publish: (novelId) => ipcRenderer.invoke(IPC.booksPublish, novelId),
    unpublish: (novelId) => ipcRenderer.invoke(IPC.booksUnpublish, novelId)
  },
  chapters: {
    publish: (novelId, chapterId) => ipcRenderer.invoke(IPC.chaptersPublish, novelId, chapterId),
    unpublish: (novelId, chapterId) => ipcRenderer.invoke(IPC.chaptersUnpublish, novelId, chapterId)
  },
  files: {
    pickManuscript: () => ipcRenderer.invoke(IPC.filesPickManuscript),
    pickCover: () => ipcRenderer.invoke(IPC.filesPickCover)
  },
  imports: {
    start: (request) => ipcRenderer.invoke(IPC.importStart, request),
    cancel: () => ipcRenderer.invoke(IPC.importCancel),
    onProgress: (cb) => subscribe<ImportProgress>(IPC.importProgress, cb)
  }
}

contextBridge.exposeInMainWorld('inkwell', bridge)
