import type { Result } from './errors'
import type {
  AppInfo,
  AuthState,
  ChapterDetail,
  ChapterSummary,
  ImportOutcome,
  HealthStatus,
  ImportProgress,
  ImportRequest,
  ImportedBook,
  MutationOutcome,
  PickedFile,
  ValidationResult,
  WindowAction
} from './types'

/** Every IPC channel that exists. Anything not listed here is not reachable from the renderer. */
export const IPC = {
  appInfo: 'app:info',
  authGetState: 'auth:get-state',
  authSignIn: 'auth:sign-in',
  authSignOut: 'auth:sign-out',
  authChanged: 'auth:changed', // main -> renderer event
  booksList: 'books:list',
  booksGet: 'books:get',
  booksChapters: 'books:chapters',
  booksChapter: 'books:chapter',
  booksValidate: 'books:validate',
  booksPublish: 'books:publish',
  booksUnpublish: 'books:unpublish',
  chaptersPublish: 'chapters:publish',
  chaptersUnpublish: 'chapters:unpublish',
  filesPickManuscript: 'files:pick-manuscript',
  filesPickCover: 'files:pick-cover',
  importStart: 'import:start',
  importCancel: 'import:cancel',
  importProgress: 'import:progress', // main -> renderer event
  systemHealth: 'system:health',
  windowControl: 'window:control'
} as const

export type Unsubscribe = () => void

/**
 * The complete surface exposed to the renderer as `window.inkwell`.
 * Note there is no generic "request(path)" – the renderer can only invoke named operations.
 */
export interface InkwellBridge {
  app: { info(): Promise<Result<AppInfo>> }
  system: { health(): Promise<Result<HealthStatus>> }
  window: { control(action: WindowAction): Promise<Result<null>> }
  auth: {
    getState(): Promise<Result<AuthState>>
    signIn(email: string, password: string): Promise<Result<AuthState>>
    signOut(): Promise<Result<AuthState>>
    onChanged(cb: (state: AuthState) => void): Unsubscribe
  }
  books: {
    list(): Promise<Result<ImportedBook[]>>
    get(novelId: string): Promise<Result<ImportedBook>>
    chapters(novelId: string): Promise<Result<ChapterSummary[]>>
    chapter(novelId: string, chapterNumber: number): Promise<Result<ChapterDetail>>
    validate(novelId: string): Promise<Result<ValidationResult>>
    publish(novelId: string): Promise<Result<MutationOutcome>>
    unpublish(novelId: string): Promise<Result<MutationOutcome>>
  }
  chapters: {
    publish(novelId: string, chapterId: string): Promise<Result<MutationOutcome>>
    unpublish(novelId: string, chapterId: string): Promise<Result<MutationOutcome>>
  }
  files: {
    pickManuscript(): Promise<Result<PickedFile | null>>
    pickCover(): Promise<Result<PickedFile | null>>
  }
  imports: {
    start(request: ImportRequest): Promise<Result<ImportOutcome>>
    cancel(): Promise<Result<null>>
    onProgress(cb: (progress: ImportProgress) => void): Unsubscribe
  }
}
