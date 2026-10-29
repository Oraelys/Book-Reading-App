import { AppError, type Result } from '../../../shared/errors'
import type { ImportRequest, WindowAction } from '../../../shared/types'
import type {
  AdminDashboardOverview,
  AdminUserRole,
  AdminUsersResponse,
} from '../../../shared/admin-types';

async function unwrap<T>(pending: Promise<Result<T>>): Promise<T> {
  const result = await pending
  if (result.ok) return result.data
  throw new AppError(result.error)
}

/** Promise-based wrapper over `window.inkwell` that throws AppError instead of returning Result. */
export const api = {
admin: {
  dashboardOverview: (): Promise<AdminDashboardOverview> =>
    unwrap(window.inkwell.admin.dashboardOverview()),

  listUsers: (
    search: string,
    role: AdminUserRole | 'all',
  ): Promise<AdminUsersResponse> =>
    unwrap(window.inkwell.admin.listUsers(search, role)),
},
  appInfo: () => unwrap(window.inkwell.app.info()),
  health: () => unwrap(window.inkwell.system.health()),
  windowControl: (action: WindowAction) => unwrap(window.inkwell.window.control(action)),

  auth: {
    getState: () => unwrap(window.inkwell.auth.getState()),
    signIn: (email: string, password: string) => unwrap(window.inkwell.auth.signIn(email, password)),
    signOut: () => unwrap(window.inkwell.auth.signOut())
  },

  books: {
    list: () => unwrap(window.inkwell.books.list()),
    get: (id: string) => unwrap(window.inkwell.books.get(id)),
    chapters: (id: string) => unwrap(window.inkwell.books.chapters(id)),
    chapter: (id: string, n: number) => unwrap(window.inkwell.books.chapter(id, n)),
    validate: (id: string) => unwrap(window.inkwell.books.validate(id)),
    publish: (id: string) => unwrap(window.inkwell.books.publish(id)),
    unpublish: (id: string) => unwrap(window.inkwell.books.unpublish(id))
  },

  chapters: {
    publish: (novelId: string, chapterId: string) => unwrap(window.inkwell.chapters.publish(novelId, chapterId)),
    unpublish: (novelId: string, chapterId: string) => unwrap(window.inkwell.chapters.unpublish(novelId, chapterId))
  },

  files: {
    pickManuscript: () => unwrap(window.inkwell.files.pickManuscript()),
    pickCover: () => unwrap(window.inkwell.files.pickCover())
  },

  imports: {
    start: (req: ImportRequest) => unwrap(window.inkwell.imports.start(req)),
    cancel: () => unwrap(window.inkwell.imports.cancel())
  }
}
