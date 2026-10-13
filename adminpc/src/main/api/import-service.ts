import { net } from 'electron'
import { AppError, type SerializedAppError } from '../../shared/errors'
import type { ImportOutcome, ImportProgress, ImportRequest } from '../../shared/types'
import type { AuthService } from '../auth/auth-service'
import type { AppConfig } from '../config'
import type { FileRegistry, RegisteredFile } from '../files/file-registry'
import { log } from '../logger'
import { mapHttpError, NETWORK_ERROR } from './http-errors'
import { FileChangedError, MultipartBody, type Part } from './multipart'

/**
 * Upper bound for the server-side pipeline once the upload has finished. The backend import is
 * synchronous (POST /content/admin/import responds only after parse → chapter split → store).
 */
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000
const PROGRESS_INTERVAL_MS = 100

const OUTCOME_UNKNOWN: SerializedAppError = {
  kind: 'network',
  outcomeUnknown: true,
  message:
    'The upload finished but the connection dropped before the server replied. The book may still have been ' +
    'imported — check Imported Books before trying again, to avoid creating a duplicate.'
}

const PROCESSING_TIMEOUT: SerializedAppError = {
  kind: 'timeout',
  outcomeUnknown: true,
  message:
    'The server is taking unusually long to process this book. It may still finish — check Imported Books ' +
    'before trying again, to avoid creating a duplicate.'
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

export class ImportService {
  private active: { cancel: () => boolean } | null = null

  constructor(
    private readonly config: AppConfig,
    private readonly auth: AuthService,
    private readonly files: FileRegistry
  ) {}

  /** Returns false when the upload has already finished (the server can no longer be stopped). */
  cancel(): boolean {
    return this.active?.cancel() ?? false
  }

  get isRunning(): boolean {
    return this.active !== null
  }

  async start(req: ImportRequest, emit: (p: ImportProgress) => void): Promise<ImportOutcome> {
    if (this.active) {
      throw new AppError({ kind: 'conflict', message: 'An import is already in progress.' })
    }

    emit({ phase: 'preparing', sentBytes: 0, totalBytes: 0 })

    const manuscript = this.files.get(req.manuscriptToken, 'manuscript')
    const cover = this.files.get(req.coverToken, 'cover')
    if (!manuscript || !cover) {
      throw new AppError({
        kind: 'validation',
        message: 'A selected file is no longer available. Please choose the manuscript and cover again.'
      })
    }

    const body = new MultipartBody(this.buildParts(req, manuscript, cover))
    const token = await this.auth.getAccessToken()

    try {
      const outcome = await this.upload(token, body, emit)
      this.files.release(req.manuscriptToken, req.coverToken)
      emit({ phase: 'completed', sentBytes: body.contentLength, totalBytes: body.contentLength })
      return outcome
    } catch (e) {
      const err = e instanceof AppError ? e : new AppError({ kind: 'unknown', message: 'The import failed unexpectedly.' })
      emit({
        phase: err.kind === 'cancelled' ? 'cancelled' : 'failed',
        sentBytes: 0,
        totalBytes: body.contentLength
      })
      throw err
    } finally {
      this.active = null
    }
  }

  private buildParts(req: ImportRequest, manuscript: RegisteredFile, cover: RegisteredFile): Part[] {
    const parts: Part[] = [
      { kind: 'field', name: 'title', value: req.title.trim() },
      { kind: 'field', name: 'authorName', value: req.authorName.trim() }
    ]
    // Optional fields are omitted entirely when blank (backend treats missing as null).
    if (req.authorId?.trim()) parts.push({ kind: 'field', name: 'authorId', value: req.authorId.trim() })
    if (req.description?.trim()) parts.push({ kind: 'field', name: 'description', value: req.description.trim() })
    if (req.category?.trim()) parts.push({ kind: 'field', name: 'category', value: req.category.trim() })
    parts.push(
      {
        kind: 'file',
        name: 'file',
        filename: manuscript.name,
        contentType: manuscript.contentType,
        path: manuscript.path,
        size: manuscript.size
      },
      {
        kind: 'file',
        name: 'cover',
        filename: cover.name,
        contentType: cover.contentType,
        path: cover.path,
        size: cover.size
      }
    )
    return parts
  }

  private upload(token: string, body: MultipartBody, emit: (p: ImportProgress) => void): Promise<ImportOutcome> {
    return new Promise<ImportOutcome>((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url: `${this.config.apiUrl}/content/admin/import`,
        redirect: 'error' // never replay an Authorization header to a redirect target
      })
      request.setHeader('Authorization', `Bearer ${token}`)
      request.setHeader('Content-Type', body.contentType)
      request.setHeader('Accept', 'application/json')
      // Stream in chunks instead of buffering a 50 MB body in memory.
      request.chunkedEncoding = true

      let settled = false
      let responded = false
      let uploadComplete = false
      let userCancelled = false
      let processingTimer: NodeJS.Timeout | undefined
      let release!: () => void
      const closed = new Promise<void>((r) => (release = r))
      const responseChunks: Buffer[] = []

      const settle = (fn: () => void): void => {
        if (settled) return
        settled = true
        clearTimeout(processingTimer)
        release()
        fn()
      }
      const fail = (error: SerializedAppError): void => settle(() => reject(new AppError(error)))

      this.active = {
        cancel: () => {
          if (uploadComplete || settled) return false
          userCancelled = true
          request.abort()
          return true
        }
      }

      request.on('response', (response) => {
        responded = true
        response.on('data', (c: Buffer) => responseChunks.push(c))
        response.on('error', () => fail(uploadComplete ? OUTCOME_UNKNOWN : NETWORK_ERROR))
        response.on('end', () => {
          const text = Buffer.concat(responseChunks).toString('utf8')
          let parsed: unknown = text
          try {
            parsed = text ? JSON.parse(text) : null
          } catch {
            /* keep raw text */
          }
          const status = response.statusCode
          log.debug('import', 'response', status, parsed)
          if (status >= 200 && status < 300) {
            const outcome = this.toOutcome(parsed)
            if (outcome) settle(() => resolve(outcome))
            else fail({ kind: 'unknown', outcomeUnknown: true, message: 'The server replied, but not in the expected format. Check Imported Books before trying again.' })
          } else {
            fail(mapHttpError(status, parsed))
          }
        })
      })

      request.on('error', (err) => {
        log.debug('import', 'request error', err.message)
        // Before the upload finished the backend never had a complete body, so nothing was created.
        fail(uploadComplete ? OUTCOME_UNKNOWN : NETWORK_ERROR)
      })
      request.on('abort', () => {
        fail(userCancelled ? { kind: 'cancelled', message: 'Import cancelled. Nothing was created.' } : NETWORK_ERROR)
      })

      void (async () => {
        const iterator = body.stream()[Symbol.asyncIterator]()
        let sent = 0
        let lastEmit = 0
        try {
          emit({ phase: 'uploading', sentBytes: 0, totalBytes: body.contentLength })
          for (;;) {
            const next = await Promise.race([iterator.next(), closed.then(() => null)])
            if (next === null || next.done || settled || responded) break
            const chunk = next.value
            await Promise.race([
              new Promise<void>((r) => request.write(chunk, 'utf8', () => r())),
              closed
            ])
            if (settled) break
            sent += chunk.length
            const now = Date.now()
            if (now - lastEmit >= PROGRESS_INTERVAL_MS) {
              lastEmit = now
              emit({ phase: 'uploading', sentBytes: sent, totalBytes: body.contentLength })
            }
          }
          if (settled) return
          if (!responded) {
            uploadComplete = true
            request.end()
            emit({ phase: 'processing', sentBytes: body.contentLength, totalBytes: body.contentLength })
            processingTimer = setTimeout(() => {
              request.abort()
              fail(PROCESSING_TIMEOUT)
            }, PROCESSING_TIMEOUT_MS)
          }
        } catch (e) {
          if (e instanceof FileChangedError) {
            request.abort()
            fail({ kind: 'validation', message: `${e.message} Select the file again and retry.` })
          } else {
            log.warn('import', 'streaming failed', e instanceof Error ? e.message : e)
            request.abort()
            fail({ kind: 'unknown', message: 'Could not read a selected file. Select it again and retry.' })
          }
        } finally {
          await iterator.return?.(undefined).catch(() => undefined)
        }
      })()
    })
  }

  /** Backend returns { ...pipelineResult, novelId, importedBy, originalFileName, fileType,
   *  creditedAuthor, creditedAuthorId, coverImageUrl, coverMediaId }. Only display fields are kept. */
  private toOutcome(raw: unknown): ImportOutcome | null {
    if (typeof raw !== 'object' || raw === null) return null
    const r = raw as Record<string, unknown>
    const novelId = str(r.novelId)
    if (!novelId) return null
    return {
      novelId,
      title: str(r.title),
      chapterCount: typeof r.chapterCount === 'number' ? r.chapterCount : null,
      creditedAuthor: str(r.creditedAuthor),
      creditedAuthorId: str(r.creditedAuthorId),
      fileType: str(r.fileType),
      originalFileName: str(r.originalFileName)
    }
  }
}
