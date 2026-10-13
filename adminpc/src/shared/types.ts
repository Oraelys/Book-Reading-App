import type { ValidationIssue } from './errors'

/* ------------------------------ Auth ------------------------------ */

export interface AdminUser {
  id: string
  email: string
  username: string | null
  role: 'admin'
}

export type AuthState = { status: 'signed_out' } | { status: 'signed_in'; user: AdminUser }

/* ------------------------------ App ------------------------------- */

export interface AppInfo {
  name: string
  version: string
  environment: string
  /** Host only (no path, no credentials) – safe to display. */
  apiHost: string
  platform: string
}

/* ------------------------------ Books ----------------------------- */

export type ContentOrigin = 'author_created' | 'admin_imported'

/**
 * Normalised from GET /content/admin/imported[/:novelId].
 * Canonical aggregates are preferred (total_chapters, published_chapters, word_count);
 * legacy `total_words` is only a fallback because the endpoint currently returns it instead
 * of `word_count`. Fields the backend does not (yet) return are null, never guessed.
 */
export interface ImportedBook {
  id: string
  title: string
  authorName: string
  description: string | null
  category: string | null
  contentOrigin: ContentOrigin
  status: string
  isPublic: boolean
  /** null until the backend selects `visibility` on the admin endpoints. */
  visibility: string | null
  /** null until the backend selects `cover_image_url` on the admin endpoints. */
  coverImageUrl: string | null
  totalChapters: number
  publishedChapters: number
  /** total - published, floored at 0. Not authoritative; for display only. */
  draftChapters: number
  wordCount: number | null
  createdAt: string | null
  updatedAt: string | null
  publishedAt: string | null
}

/** Derived from backend fields only. "Ready" comes from validation, not from the row. */
export type BookLifecycle = 'draft' | 'published' | 'unpublished'

export interface ChapterSummary {
  id: string
  novelId: string
  chapterNumber: number
  title: string
  wordCount: number | null
  estimatedReadTime: number | null
  isPublished: boolean
  status: string
  publishedAt: string | null
  updatedAt: string | null
  createdAt: string | null
}

export interface ChapterDetail extends ChapterSummary {
  content: string
}

export interface ValidationResult {
  canPublish: boolean
  errors: ValidationIssue[]
}

export interface MutationOutcome {
  /** Message returned by the backend, if any. */
  message: string | null
}

/* ------------------------------ Files ----------------------------- */

export interface PickedFile {
  /** Opaque handle. The renderer never learns (or supplies) filesystem paths. */
  token: string
  name: string
  size: number
  extension: string
  /** data: URL preview for cover images; null for manuscripts. */
  previewDataUrl: string | null
  /** Non-blocking warning (e.g. extension/content mismatch). */
  warning: string | null
}

export const MANUSCRIPT_EXTENSIONS = ['txt', 'docx', 'epub'] as const
export const COVER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
/** Backend multer limit for each uploaded file. */
export const MAX_MANUSCRIPT_BYTES = 50 * 1024 * 1024
/**
 * MediaValidationService rejects covers over 10 MB *after* the novel row is created (then rolls
 * back), so the client enforces this up front instead of wasting a full upload.
 */
export const MAX_COVER_BYTES = 10 * 1024 * 1024

/* ------------------------------ Import ---------------------------- */

export interface ImportRequest {
  title: string
  authorName: string
  /** Optional Inkwell profile UUID for the credited author. Omit for external authors. */
  authorId?: string
  description?: string
  category?: string
  manuscriptToken: string
  coverToken: string
}

export type ImportPhase =
  | 'preparing'
  | 'uploading'
  | 'processing' // upload finished; waiting for the backend pipeline
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface ImportProgress {
  phase: ImportPhase
  sentBytes: number
  totalBytes: number
}

export interface ImportOutcome {
  novelId: string
  title: string | null
  chapterCount: number | null
  creditedAuthor: string | null
  creditedAuthorId: string | null
  fileType: string | null
  originalFileName: string | null
}

/* ------------------------------ System ---------------------------- */

/** GET / — the backend's public health check. Only these safe fields are surfaced. */
export interface HealthStatus {
  reachable: true
  httpStatus: number
  status: string | null
  service: string | null
  timestamp: string | null
  latencyMs: number
}

export type WindowAction = 'minimize' | 'maximize' | 'close'
