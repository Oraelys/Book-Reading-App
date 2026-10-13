import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../shared/errors'
import type { AdminUser, AuthState } from '../../shared/types'
import type { AppConfig } from '../config'
import { log } from '../logger'
import { EncryptedSessionStorage } from './session-store'

type Listener = (state: AuthState) => void

const SIGNED_OUT: AuthState = { status: 'signed_out' }

/**
 * Owns the Supabase session. Tokens live only in this process: the renderer receives
 * `{ id, email, username, role }` and nothing else.
 *
 * The `profiles.role === 'admin'` check here is for UX gating only. The backend
 * (AdminContentGuard) independently enforces authorization on every admin request.
 */
export class AuthService {
  private readonly client: SupabaseClient
  private state: AuthState = SIGNED_OUT
  private readonly listeners = new Set<Listener>()

  constructor(config: AppConfig, storage: EncryptedSessionStorage) {
    this.client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })

    // Keep this callback synchronous: awaiting supabase calls inside it can deadlock the client.
    this.client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && this.state.status === 'signed_in') {
        log.debug('auth', 'session ended by supabase (refresh failed or signed out elsewhere)')
        this.setState(SIGNED_OUT)
      }
    })
  }

  getState(): AuthState {
    return this.state
  }

  onChange(cb: Listener): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private setState(next: AuthState): void {
    this.state = next
    for (const cb of this.listeners) cb(next)
  }

  /** Restore a persisted session at startup. Never throws; failure just means signed out. */
  async restore(): Promise<AuthState> {
    try {
      const { data } = await this.client.auth.getSession()
      if (!data.session) return this.state
      const user = await this.loadAdminUser(data.session.user.id, data.session.user.email ?? '')
      this.setState({ status: 'signed_in', user })
    } catch (e) {
      log.debug('auth', 'restore failed', e instanceof Error ? e.message : e)
      await this.client.auth.signOut({ scope: 'local' }).catch(() => undefined)
      this.setState(SIGNED_OUT)
    }
    return this.state
  }

  async signIn(email: string, password: string): Promise<AuthState> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      throw this.mapSignInError(error)
    }
    try {
      const user = await this.loadAdminUser(data.session.user.id, data.session.user.email ?? email)
      this.setState({ status: 'signed_in', user })
    } catch (e) {
      // Valid credentials but not an administrator: do not keep a session on this app.
      await this.client.auth.signOut({ scope: 'local' }).catch(() => undefined)
      this.setState(SIGNED_OUT)
      throw e
    }
    return this.state
  }

  async signOut(): Promise<AuthState> {
    // 'local' ends only this device's session; the user's phone sessions stay valid.
    await this.client.auth.signOut({ scope: 'local' }).catch((e: unknown) => {
      log.debug('auth', 'signOut error (ignored)', e instanceof Error ? e.message : e)
    })
    this.setState(SIGNED_OUT)
    return this.state
  }

  /** supabase-js refreshes automatically when the token is near expiry. */
  async getAccessToken(opts: { forceRefresh?: boolean } = {}): Promise<string> {
    if (opts.forceRefresh) {
      const { data, error } = await this.client.auth.refreshSession()
      if (error || !data.session) throw this.sessionExpired()
      return data.session.access_token
    }
    const { data, error } = await this.client.auth.getSession()
    if (error || !data.session) throw this.sessionExpired()
    return data.session.access_token
  }

  /** Called when the backend says the session is unusable (401 after refresh). */
  async expireSession(): Promise<void> {
    await this.client.auth.signOut({ scope: 'local' }).catch(() => undefined)
    this.setState(SIGNED_OUT)
  }

  /** Called after a 403: if the role was revoked, drop to the sign-in screen. */
  async revalidateRole(): Promise<void> {
    if (this.state.status !== 'signed_in') return
    try {
      await this.loadAdminUser(this.state.user.id, this.state.user.email)
    } catch (e) {
      if (e instanceof AppError && e.kind === 'forbidden') await this.expireSession()
    }
  }

  private sessionExpired(): AppError {
    return new AppError({ kind: 'unauthenticated', message: 'Your session has expired. Please sign in again.', status: 401 })
  }

  private async loadAdminUser(id: string, email: string): Promise<AdminUser> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, role, username, email')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      log.warn('auth', 'profile lookup failed', error.message)
      throw new AppError({ kind: 'server', message: 'Could not verify your administrator permissions. Try again.' })
    }
    if (!data || data.role !== 'admin') {
      throw new AppError({
        kind: 'forbidden',
        status: 403,
        message: 'This account is not an Inkwell administrator.'
      })
    }
    return {
      id,
      email: typeof data.email === 'string' && data.email ? data.email : email,
      username: typeof data.username === 'string' ? data.username : null,
      role: 'admin'
    }
  }

  private mapSignInError(error: { message: string; status?: number; code?: string; name?: string } | null): AppError {
    if (!error) return new AppError({ kind: 'unknown', message: 'Sign-in failed. Please try again.' })
    log.debug('auth', 'sign-in error', error.name, error.status, error.code)
    if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
      return new AppError({ kind: 'network', message: 'Cannot reach the sign-in service. Check your connection.' })
    }
    if (error.status === 429) {
      return new AppError({ kind: 'unknown', status: 429, message: 'Too many attempts. Wait a moment and try again.' })
    }
    if (error.code === 'email_not_confirmed') {
      return new AppError({ kind: 'unauthenticated', status: 400, message: 'Confirm your email address before signing in.' })
    }
    return new AppError({ kind: 'unauthenticated', status: 400, message: 'Incorrect email or password.' })
  }
}
