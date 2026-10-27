
import { net } from 'electron'
import { AppError } from '../../shared/errors'
import type { AuthService } from '../auth/auth-service'
import type { AppConfig } from '../config'
import { log } from '../logger'
import { mapHttpError, NETWORK_ERROR, TIMEOUT_ERROR } from './http-errors'

export interface RequestOptions {
  method: 'GET' | 'POST'
  /** Path beginning with "/". Built by API wrappers from validated IDs only. */
  path: string
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 45_000

/**
 * Authenticated JSON client for the NestJS backend.
 *
 * Tokens remain in the Electron main process. Redirects are rejected so that an
 * incorrectly configured API URL cannot silently redirect an authenticated
 * request to another origin and lose its Authorization header.
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

    log.debug(
      'api',
      opts.method,
      opts.path,
      'HTTP',
      res.status,
      'authorization attached: yes'
    )

    if (res.status === 401) {
      log.debug('api', opts.method, opts.path, 'received 401; refreshing session once')

      token = await this.auth.getAccessToken({ forceRefresh: true })
      res = await this.send(token, opts)

      log.debug(
        'api',
        opts.method,
        opts.path,
        'retry HTTP',
        res.status,
        'authorization attached: yes'
      )

      if (res.status === 401) {
        await this.auth.expireSession()
        throw new AppError(mapHttpError(401, res.body))
      }
    }

    if (!res.ok) {
      log.debug('api', opts.method, opts.path, '->', res.status, res.body)

      if (res.status === 403) {
        void this.auth.revalidateRole()
      }

      throw new AppError(mapHttpError(res.status, res.body))
    }

    return res.body
  }

  private async send(
    token: string,
    opts: RequestOptions
  ): Promise<{ ok: boolean; status: number; body: unknown }> {
    const controller = new AbortController()
    const timer = setTimeout(
      () => controller.abort(),
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
    )

    try {
      const response = await net.fetch(
        `${this.config.apiUrl}${opts.path}`,
        {
          method: opts.method,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          },
          redirect: 'error',
          signal: controller.signal
        }
      )

      const text = await response.text()
      let body: unknown = null

      if (text) {
        try {
          body = JSON.parse(text)
        } catch {
          body = text
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        body
      }
    } catch (e) {
      if (controller.signal.aborted) {
        throw new AppError(TIMEOUT_ERROR)
      }

      log.debug(
        'api',
        'request failed',
        opts.method,
        opts.path,
        'API host:',
        new URL(this.config.apiUrl).host,
        e instanceof Error ? e.message : e
      )

      throw new AppError(NETWORK_ERROR)
    } finally {
      clearTimeout(timer)
    }
  }
}
