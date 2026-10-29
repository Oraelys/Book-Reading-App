import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { z, ZodError } from 'zod'
import { AppError, type Result, type SerializedAppError } from '../../shared/errors'
import { IPC } from '../../shared/ipc'
import type { AppInfo, ImportProgress } from '../../shared/types'
import type { ContentApi } from '../api/content-api'
import type { ImportService } from '../api/import-service'
import type { SystemApi } from '../api/system-api'
import type { AuthService } from '../auth/auth-service'
import type { AppConfig } from '../config'
import type { FilePicker } from '../files/file-picker'
import { log } from '../logger'
import { isTrustedUrl } from '../security'
import type { AdminApi } from '../api/admin-api';
import type {
  AdminDashboardOverview,
  AdminUserRole,
  AdminUsersResponse,
} from '../../shared/admin-types';

export interface Services {
  admin: AdminApi;
  config: AppConfig
  auth: AuthService
  content: ContentApi
  imports: ImportService
  picker: FilePicker
  system: SystemApi
}

const id = z.guid()
const chapterNumber = z.number().int().min(0).max(100_000)

const signInArgs = z.tuple([z.string().trim().min(3).max(320), z.string().min(1).max(1024)])
const noArgs = z.tuple([])
const windowArgs = z.tuple([z.enum(['minimize', 'maximize', 'close'])])
const idArgs = z.tuple([id])
const chapterArgs = z.tuple([id, chapterNumber])
const chapterActionArgs = z.tuple([id, id])
const importArgs = z.tuple([
  z
    .object({
      title: z.string().trim().min(1).max(300),
      authorName: z.string().trim().min(1).max(200),
      // Optional Inkwell author profile id; the backend verifies it exists.
      authorId: z.union([z.guid(), z.literal('')]).optional(),
      description: z.string().max(10_000).optional(),
      category: z.string().trim().max(100).optional(),
      manuscriptToken: z.guid(),
      coverToken: z.guid()
    })
    .strict()
])
const userRoleArgs = z.tuple([
  z.string().trim().max(100),
  z.enum(['all', 'reader', 'author', 'admin']),
]);

function serialize(e: unknown, channel: string): SerializedAppError {
  if (e instanceof AppError) {
    return {
      kind: e.kind,
      message: e.message,
      ...(e.status !== undefined ? { status: e.status } : {}),
      ...(e.issues ? { issues: e.issues } : {}),
      ...(e.outcomeUnknown ? { outcomeUnknown: true } : {})
    }
  }
  if (e instanceof ZodError) {
    log.debug('ipc', `${channel} rejected invalid payload`, e.issues)
    return { kind: 'validation', message: 'The request was invalid.' }
  }
  log.error('ipc', `${channel} failed`, e instanceof Error ? e.stack : e)
  return { kind: 'unknown', message: 'Something went wrong. Please try again.' }
}

type Handler<A extends unknown[], T> = (event: IpcMainInvokeEvent, ...args: A) => Promise<T> | T

function handle<A extends unknown[], T>(channel: string, schema: z.ZodType<A>, fn: Handler<A, T>): void {
  ipcMain.handle(channel, async (event, ...raw: unknown[]): Promise<Result<T>> => {
    // Reject calls from anything other than our own renderer document.
    if (!isTrustedUrl(event.senderFrame?.url)) {
      log.warn('ipc', `blocked ${channel} from untrusted sender`)
      return { ok: false, error: { kind: 'forbidden', message: 'Request blocked.' } }
    }
    try {
      const args = schema.parse(raw)
      return { ok: true, data: await fn(event, ...args) }
    } catch (e) {
      return { ok: false, error: serialize(e, channel) }
    }
  })
}

export function registerIpc({ config, auth, content, imports, picker, system, admin }: Services): void {
  handle(
  IPC.adminDashboardOverview,
  noArgs,
  (): Promise<AdminDashboardOverview> => admin.dashboardOverview(),
);
handle(
  IPC.adminUsersList,
  userRoleArgs,
  (
    _event,
    search,
    role,
  ): Promise<AdminUsersResponse> =>
    admin.listUsers(search, role as AdminUserRole | 'all'),
);

  handle(IPC.appInfo, noArgs, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    environment: config.environment,
    apiHost: new URL(config.apiUrl).host,
    platform: process.platform
  }))

  handle(IPC.systemHealth, noArgs, () => system.health())

  /* ---- custom window chrome (the window is frameless) ---- */
  handle(IPC.windowControl, windowArgs, (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    if (action === 'minimize') win.minimize()
    else if (action === 'maximize') (win.isMaximized() ? win.unmaximize() : win.maximize())
    else win.close()
    return null
  })

  /* ---- auth ---- */
  handle(IPC.authGetState, noArgs, () => auth.getState())
  handle(IPC.authSignIn, signInArgs, (_e, email, password) => auth.signIn(email, password))
  handle(IPC.authSignOut, noArgs, () => auth.signOut())
  auth.onChange((state) => {
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.authChanged, state)
  })

  /* ---- books (admin-guarded routes on the backend) ---- */
  handle(IPC.booksList, noArgs, () => content.listBooks())
  handle(IPC.booksGet, idArgs, (_e, novelId) => content.getBook(novelId))
  handle(IPC.booksChapters, idArgs, (_e, novelId) => content.listChapters(novelId))
  handle(IPC.booksChapter, chapterArgs, (_e, novelId, n) => content.getChapter(novelId, n))
  handle(IPC.booksValidate, idArgs, (_e, novelId) => content.validate(novelId))
  handle(IPC.booksPublish, idArgs, (_e, novelId) => content.publishBook(novelId))
  handle(IPC.booksUnpublish, idArgs, (_e, novelId) => content.unpublishBook(novelId))
  handle(IPC.chaptersPublish, chapterActionArgs, (_e, novelId, chapterId) => content.publishChapter(novelId, chapterId))
  handle(IPC.chaptersUnpublish, chapterActionArgs, (_e, novelId, chapterId) => content.unpublishChapter(novelId, chapterId))

  /* ---- files & import ---- */
  handle(IPC.filesPickManuscript, noArgs, () => picker.pickManuscript())
  handle(IPC.filesPickCover, noArgs, () => picker.pickCover())
  handle(IPC.importStart, importArgs, (event, request) => {
    const { authorId, ...rest } = request
    const emit = (p: ImportProgress): void => {
      if (!event.sender.isDestroyed()) event.sender.send(IPC.importProgress, p)
    }
    return imports.start({ ...rest, ...(authorId ? { authorId } : {}) }, emit)
  })
  handle(IPC.importCancel, noArgs, () => {
    if (!imports.cancel()) {
      throw new AppError({
        kind: 'conflict',
        message: 'The upload has already finished and the server is processing the book, so it can no longer be cancelled.'
      })
    }
    return null
  })
}
