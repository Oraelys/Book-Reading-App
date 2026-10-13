import { net } from 'electron'
import { AppError } from '../../shared/errors'
import type { AuthService } from '../auth/auth-service'
import type { AppConfig } from '../config'
import { log } from '../logger'
import { mapHttpError, NETWORK_ERROR, TIMEOUT_ERROR } from './http-errors'

export interface RequestOptions {
  method: 'GET' | 'POST'
  /** Path beginning with "/". Built by ContentApi from validated ids only. */
  path: string
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 45_000

/**
 * Authenticated JSON client for the NestJS backend.
 *
 * Uses Electron's `net` (Chromium network stack) so system proxy settings and OS certificate
 * stores apply, and runs in the main process so the backend's lack of CORS is irrelevant.
 * The bearer token is attached here and never leaves this process.
 */
export class ApiClient {
  constructor(
    private readonly config: AppConfig,
    private readonly auth: AuthService
  ) {}

  get baseUrl(): string {
    return this.config.apiUrl
  }

  async request(opts: RequestOptions): Promise<unknown> {
    let token = await this.auth.getAccessToken()
    let res = await this.send(token, opts)

    if (res.status === 401) {
      // Token may have expired between getSession() and the call: refresh once and retry.
      token = await this.auth.getAccessToken({ forceRefresh: true })
      res = await this.send(token, opts)
      if (res.status === 401) {
        await this.auth.expireSession()
        throw new AppError(mapHttpError(401, res.body))
      }
    }

    if (!res.ok) {
      log.debug('api', opts.method, opts.path, '->', res.status, res.body)
      if (res.status === 403) void this.auth.revalidateRole()
      throw new AppError(mapHttpError(res.status, res.body))
    }
    return res.body
  }

  private async send(
    token: string,
    opts: RequestOptions
  ): Promise<{ ok: boolean; status: number; body: unknown }> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    try {
      const response = await net.fetch(`${this.config.apiUrl}${opts.path}`, {
        method: opts.method,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: controller.signal
      })
      // Read as text first: error bodies are not always JSON.
      const text = await response.text()
      let body: unknown = null
      if (text) {
        try {
          body = JSON.parse(text)
        } catch {
          body = text
        }
      }
      return { ok: response.ok, status: response.status, body }
    } catch (e) {
      if (controller.signal.aborted) throw new AppError(TIMEOUT_ERROR)
      log.debug('api', 'network failure', opts.method, opts.path, e instanceof Error ? e.message : e)
      throw new AppError(NETWORK_ERROR)
    } finally {
      clearTimeout(timer)
    }
  }
}
