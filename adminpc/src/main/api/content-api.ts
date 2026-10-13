import type {
  ChapterDetail,
  ChapterSummary,
  ContentOrigin,
  ImportedBook,
  MutationOutcome,
  ValidationResult
} from '../../shared/types'
import { AppError } from '../../shared/errors'
import type { ApiClient } from './api-client'
import { log } from '../logger'

type Raw = Record<string, unknown>

const isRaw = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

function unexpected(what: string): AppError {
  log.warn('content', `unexpected response shape: ${what}`)
  return new AppError({ kind: 'unknown', message: 'The server returned data this app does not understand.' })
}

/** Backend selects: id,title,author_name,description,category,status,is_public,content_origin,
 *  total_chapters,published_chapters,total_words,created_at,updated_at,published_at
 *  (+ cover_image_url, word_count, visibility once the suggested backend patch is applied). */
export function toBook(raw: unknown): ImportedBook {
  if (!isRaw(raw) || typeof raw.id !== 'string') throw unexpected('novel')
  const total = num(raw.total_chapters) ?? 0
  const published = num(raw.published_chapters) ?? 0
  const origin: ContentOrigin = raw.content_origin === 'author_created' ? 'author_created' : 'admin_imported'
  return {
    id: raw.id,
    title: str(raw.title) ?? 'Untitled',
    authorName: str(raw.author_name) ?? '',
    description: str(raw.description),
    category: str(raw.category),
    contentOrigin: origin,
    status: str(raw.status) ?? 'draft',
    isPublic: raw.is_public === true,
    visibility: str(raw.visibility),
    coverImageUrl: str(raw.cover_image_url),
    totalChapters: total,
    publishedChapters: published,
    draftChapters: Math.max(total - published, 0),
    // Canonical `word_count` wins; legacy `total_words` is only a fallback.
    wordCount: num(raw.word_count) ?? num(raw.total_words),
    createdAt: str(raw.created_at),
    updatedAt: str(raw.updated_at),
    publishedAt: str(raw.published_at)
  }
}

function toChapterSummary(raw: unknown): ChapterSummary {
  if (!isRaw(raw) || typeof raw.id !== 'string' || typeof raw.chapter_number !== 'number') throw unexpected('chapter')
  return {
    id: raw.id,
    novelId: str(raw.novel_id) ?? '',
    chapterNumber: raw.chapter_number,
    title: str(raw.title) ?? `Chapter ${raw.chapter_number}`,
    wordCount: num(raw.word_count),
    estimatedReadTime: num(raw.estimated_read_time),
    isPublished: raw.is_published === true || raw.status === 'published',
    status: str(raw.status) ?? 'draft',
    publishedAt: str(raw.published_at),
    updatedAt: str(raw.updated_at),
    createdAt: str(raw.created_at)
  }
}

function toOutcome(raw: unknown): MutationOutcome {
  return { message: isRaw(raw) ? str(raw.message) : null }
}

const seg = encodeURIComponent

/**
 * Typed wrappers over the real admin routes in ContentController (all behind AdminContentGuard):
 *   GET  /content/admin/imported
 *   GET  /content/admin/imported/:novelId
 *   GET  /content/admin/imported/:novelId/chapters
 *   GET  /content/admin/imported/:novelId/chapters/:chapterNumber
 *   GET  /content/admin/imported/:novelId/validate        (GET, as the backend defines it)
 *   POST /content/admin/imported/:novelId/publish|unpublish
 *   POST /content/admin/imported/:novelId/chapters/:chapterId/publish|unpublish
 * Ids are validated as GUIDs at the IPC boundary before they reach these methods.
 */
export class ContentApi {
  constructor(private readonly api: ApiClient) {}

  async listBooks(): Promise<ImportedBook[]> {
    const body = await this.api.request({ method: 'GET', path: '/content/admin/imported' })
    if (!Array.isArray(body)) throw unexpected('imported list')
    return body.map(toBook)
  }

  async getBook(novelId: string): Promise<ImportedBook> {
    return toBook(await this.api.request({ method: 'GET', path: `/content/admin/imported/${seg(novelId)}` }))
  }

  /** The backend list includes full chapter `content` for every chapter; strip it here so
   *  the renderer only receives lightweight summaries. Content is fetched per chapter on demand. */
  async listChapters(novelId: string): Promise<ChapterSummary[]> {
    const body = await this.api.request({
      method: 'GET',
      path: `/content/admin/imported/${seg(novelId)}/chapters`,
      timeoutMs: 90_000
    })
    if (!Array.isArray(body)) throw unexpected('chapter list')
    return body.map(toChapterSummary).sort((a, b) => a.chapterNumber - b.chapterNumber)
  }

  async getChapter(novelId: string, chapterNumber: number): Promise<ChapterDetail> {
    const raw = await this.api.request({
      method: 'GET',
      path: `/content/admin/imported/${seg(novelId)}/chapters/${chapterNumber}`
    })
    const summary = toChapterSummary(raw)
    return { ...summary, content: isRaw(raw) ? (str(raw.content) ?? '') : '' }
  }

  async validate(novelId: string): Promise<ValidationResult> {
    const raw = await this.api.request({
      method: 'GET',
      path: `/content/admin/imported/${seg(novelId)}/validate`,
      timeoutMs: 90_000
    })
    if (!isRaw(raw) || typeof raw.canPublish !== 'boolean' || !Array.isArray(raw.errors)) throw unexpected('validation')
    return {
      canPublish: raw.canPublish,
      // Backend returns [{ field, message }]; the API spec shows plain strings. Accept both.
      errors: raw.errors.flatMap((e) =>
        typeof e === 'string'
          ? [{ field: '', message: e }]
          : isRaw(e) && typeof e.message === 'string'
            ? [{ field: str(e.field) ?? '', message: e.message }]
            : []
      )
    }
  }

  async publishBook(novelId: string): Promise<MutationOutcome> {
    return toOutcome(await this.api.request({ method: 'POST', path: `/content/admin/imported/${seg(novelId)}/publish` }))
  }

  async unpublishBook(novelId: string): Promise<MutationOutcome> {
    return toOutcome(await this.api.request({ method: 'POST', path: `/content/admin/imported/${seg(novelId)}/unpublish` }))
  }

  async publishChapter(novelId: string, chapterId: string): Promise<MutationOutcome> {
    return toOutcome(
      await this.api.request({
        method: 'POST',
        path: `/content/admin/imported/${seg(novelId)}/chapters/${seg(chapterId)}/publish`
      })
    )
  }

  async unpublishChapter(novelId: string, chapterId: string): Promise<MutationOutcome> {
    return toOutcome(
      await this.api.request({
        method: 'POST',
        path: `/content/admin/imported/${seg(novelId)}/chapters/${seg(chapterId)}/unpublish`
      })
    )
  }
}
