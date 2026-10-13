import { net } from 'electron'
import { AppError } from '../../shared/errors'
import type { HealthStatus } from '../../shared/types'
import type { AppConfig } from '../config'
import { NETWORK_ERROR, TIMEOUT_ERROR } from './http-errors'

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null)

/**
 * GET / — the backend's unauthenticated health check ({ status, service, timestamp }).
 * Only those fields are passed on; anything else in the body is dropped.
 */
export class SystemApi {
  constructor(private readonly config: AppConfig) {}

  async health(): Promise<HealthStatus> {
    const controller = new AbortController()
    // Generous: a sleeping Render instance can take a while to wake.
    const timer = setTimeout(() => controller.abort(), 60_000)
    const started = Date.now()
    try {
      const res = await net.fetch(`${this.config.apiUrl}/`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      })
      const latencyMs = Date.now() - started
      let body: Record<string, unknown> = {}
      try {
        const parsed: unknown = JSON.parse(await res.text())
        if (typeof parsed === 'object' && parsed !== null) body = parsed as Record<string, unknown>
      } catch {
        /* non-JSON body: report reachability only */
      }
      if (!res.ok) {
        throw new AppError({ kind: 'server', status: res.status, message: `The backend answered with HTTP ${res.status}.` })
      }
      return {
        reachable: true,
        httpStatus: res.status,
        status: str(body.status),
        service: str(body.service),
        timestamp: str(body.timestamp),
        latencyMs
      }
    } catch (e) {
      if (e instanceof AppError) throw e
      throw new AppError(controller.signal.aborted ? TIMEOUT_ERROR : NETWORK_ERROR)
    } finally {
      clearTimeout(timer)
    }
  }
}
