/**
 * Error model shared by main and renderer.
 * Main converts every failure into a SerializedAppError; the renderer rethrows it as AppError.
 * Raw server bodies, stack traces and tokens are never placed in `message`.
 */
export type AppErrorKind =
  | 'network' //        could not reach the server at all
  | 'timeout' //        request exceeded the client-side time limit
  | 'unauthenticated' //401 – session missing/expired and could not be refreshed
  | 'forbidden' //      403 – not an administrator
  | 'not_found' //      404
  | 'validation' //     400/422 – request or publish validation failed
  | 'conflict' //       409
  | 'too_large' //      413
  | 'server' //         5xx
  | 'cancelled' //      user cancelled
  | 'unknown'

export interface ValidationIssue {
  field: string
  message: string
}

export interface SerializedAppError {
  kind: AppErrorKind
  /** Human-readable, safe to show to an administrator. */
  message: string
  status?: number
  /** Structured validation issues when the backend returned them (e.g. publish blocked). */
  issues?: ValidationIssue[]
  /**
   * True when the request was fully sent but no response arrived. The server may still have
   * completed the work (imports are synchronous on the backend), so callers must not claim failure.
   */
  outcomeUnknown?: boolean
}

export class AppError extends Error {
  readonly kind: AppErrorKind
  readonly status: number | undefined
  readonly issues: ValidationIssue[] | undefined
  readonly outcomeUnknown: boolean

  constructor(e: SerializedAppError) {
    super(e.message)
    this.name = 'AppError'
    this.kind = e.kind
    this.status = e.status
    this.issues = e.issues
    this.outcomeUnknown = e.outcomeUnknown ?? false
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: SerializedAppError }
