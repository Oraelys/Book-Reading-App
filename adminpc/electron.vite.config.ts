import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import type { Plugin } from 'vite'

/**
 * Injects a Content-Security-Policy <meta> into index.html. A meta tag (rather than a response
 * header) is used because the packaged app loads over file://, where headers do not apply.
 *
 * Production: scripts/styles only from the bundle, NO network access from the renderer at all
 * (connect-src 'none' – every request goes through the main process), images only from the app,
 * data: URLs (cover previews) and the configured Supabase storage origin.
 * Development: additionally allows the Vite dev server / HMR.
 */
function cspPlugin(supabaseOrigin: string): Plugin {
  const img = ["'self'", 'data:', supabaseOrigin].filter(Boolean).join(' ')
  const strict = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    `img-src ${img}`,
    "font-src 'self'",
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ].join('; ')
  const dev = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img}`,
    "connect-src 'self' ws://localhost:* http://localhost:*",
    "object-src 'none'",
    "base-uri 'none'"
  ].join('; ')

  return {
    name: 'inkwell-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: ctx.server ? dev : strict },
            injectTo: 'head-prepend'
          }
        ]
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'MAIN_VITE_')
  let supabaseOrigin = ''
  try {
    supabaseOrigin = env.MAIN_VITE_SUPABASE_URL ? new URL(env.MAIN_VITE_SUPABASE_URL).origin : ''
  } catch {
    /* validated at app start; CSP simply omits the origin */
  }

  return {
    main: { plugins: [externalizeDepsPlugin()] },
    preload: { plugins: [externalizeDepsPlugin()] },
    renderer: { plugins: [react(), cspPlugin(supabaseOrigin)] }
  }
})
