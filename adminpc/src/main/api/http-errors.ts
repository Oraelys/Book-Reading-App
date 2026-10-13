import type { SerializedAppError, ValidationIssue } from '../../shared/errors'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Backend `message` may be a string or (class-validator) an array of strings. */
function backendMessage(body: unknown): string | null {
  if (typeof body === 'string' && body.trim()) return body.trim()
  if (!isObject(body)) return null
  const m = body.message
  if (typeof m === 'string' && m.trim()) return m.trim()
  if (Array.isArray(m)) {
    const parts = m.filter((x): x is string => typeof x === 'string')
    if (parts.length) return parts.join(' ')
  }
  return null
}

/** publishStory throws BadRequest(validation) → body is `{ canPublish:false, errors:[{field,message}] }`. */
function extractIssues(body: unknown): ValidationIssue[] | undefined {
  if (!isObject(body) || !Array.isArray(body.errors)) return undefined
  const issues: ValidationIssue[] = []
  for (const e of body.errors) {
    if (typeof e === 'string') issues.push({ field: '', message: e })
    else if (isObject(e) && typeof e.message === 'string') {
      issues.push({ field: typeof e.field === 'string' ? e.field : '', message: e.message })
    }
  }
  return issues.length ? issues : undefined
}

/**
 * Turn an HTTP failure into a safe, human-readable error.
 * 5xx bodies are never shown (the backend already masks them, and they can contain internals).
 * 4xx messages authored by the backend's own exceptions are shown.
 */
export function mapHttpError(status: number, body: unknown): SerializedAppError {
  const msg = backendMessage(body)
  switch (true) {
    case status === 401:
      return { kind: 'unauthenticated', status, message: 'Your session has expired. Please sign in again.' }
    case status === 403:
      return { kind: 'forbidden', status, message: 'You do not have administrator permission for this action.' }
    case status === 404:
      return { kind: 'not_found', status, message: msg ?? 'The requested item was not found.' }
    case status === 409:
      return { kind: 'conflict', status, message: msg ?? 'This conflicts with the current state. Refresh and try again.' }
    case status === 413:
      return { kind: 'too_large', status, message: 'The file is too large for the server to accept.' }
    case status === 400 || status === 422: {
      const issues = extractIssues(body)
      return {
        kind: 'validation',
        status,
        message: issues ? 'The book failed validation.' : (msg ?? 'The request was rejected as invalid.'),
        ...(issues ? { issues } : {})
      }
    }
    case status >= 500:
      return { kind: 'server', status, message: 'The server hit an error. Try again, and check the backend logs if it persists.' }
    default:
      return { kind: 'unknown', status, message: msg ?? `Unexpected response (${status}).` }
  }
}

export const NETWORK_ERROR: SerializedAppError = {
  kind: 'network',
  message: 'Cannot reach the Inkwell server. Check your connection and the configured API URL.'
}

export const TIMEOUT_ERROR: SerializedAppError = {
  kind: 'timeout',
  message: 'The server took too long to respond. If it was idle it may still be waking up — try again in a moment.'
}
