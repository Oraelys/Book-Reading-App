/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly MAIN_VITE_INKWELL_API_URL?: string
  readonly MAIN_VITE_SUPABASE_URL?: string
  readonly MAIN_VITE_SUPABASE_ANON_KEY?: string
  readonly MAIN_VITE_INKWELL_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
