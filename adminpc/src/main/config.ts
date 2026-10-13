/**
 * Runtime configuration, read from MAIN_VITE_* variables (see .env.example).
 * Only the main process reads this. Nothing here is forwarded to the renderer except `apiHost`.
 */
export interface AppConfig {
  apiUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
  environment: string
}

export class ConfigError extends Error {}

function requireUrl(name: string, value: string | undefined): URL {
  if (!value?.trim()) throw new ConfigError(`${name} is not set. Copy .env.example to .env.<mode> and fill it in.`)
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new ConfigError(`${name} is not a valid URL.`)
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new ConfigError(`${name} must use https (http is only allowed for localhost).`)
  }
  return url
}

/**
 * The desktop app must only ever hold the PUBLIC anon/publishable key. If a privileged key is
 * configured by mistake it would be bundled into distributable JavaScript, so refuse to start.
 */
function assertNotPrivilegedKey(key: string): void {
  if (key.startsWith('sb_secret_')) {
    throw new ConfigError('MAIN_VITE_SUPABASE_ANON_KEY is a Supabase SECRET key. Use the public anon key only.')
  }
  const parts = key.split('.')
  if (parts.length === 3 && parts[1]) {
    try {
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { role?: unknown }
      if (claims.role === 'service_role') {
        throw new ConfigError('MAIN_VITE_SUPABASE_ANON_KEY is a service_role key. Use the public anon key only.')
      }
    } catch (e) {
      if (e instanceof ConfigError) throw e
      /* not a decodable JWT – nothing further to check */
    }
  }
}

export function loadConfig(): AppConfig {
  const env = import.meta.env
  const api = requireUrl('MAIN_VITE_INKWELL_API_URL', env.MAIN_VITE_INKWELL_API_URL)
  const supabase = requireUrl('MAIN_VITE_SUPABASE_URL', env.MAIN_VITE_SUPABASE_URL)
  const anonKey = (env.MAIN_VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (!anonKey) throw new ConfigError('MAIN_VITE_SUPABASE_ANON_KEY is not set.')
  assertNotPrivilegedKey(anonKey)

  return {
    apiUrl: api.origin + api.pathname.replace(/\/+$/, ''),
    supabaseUrl: supabase.origin,
    supabaseAnonKey: anonKey,
    environment: (env.MAIN_VITE_INKWELL_ENV ?? 'development').trim() || 'development'
  }
}
