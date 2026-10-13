# Inkwell Admin (Desktop)

Electron + TypeScript + React admin workstation for the Inkwell backend (NestJS + Supabase).
Admin-only: it imports and reviews books. It is not the reader or author app.

## Run on Windows
1. Install Node 22+.
2. `npm install`
3. Copy `.env.example` to `.env.development` and fill in the three MAIN_VITE_* values
   (backend URL, Supabase URL, Supabase **anon** key — never the service-role key).
4. `npm run dev`, then sign in with an account whose `profiles.role` is `admin`.

Build: `npm run build` (production env from `.env.production`), `npm run build:staging`,
installer: `npm run dist:win`.

## Architecture
- `src/main`     all HTTP + Supabase auth (backend has no CORS; tokens never reach the renderer)
- `src/preload`  fixed, named operations only (no raw ipcRenderer, no generic request channel)
- `src/renderer` React UI; talks only to `window.inkwell`
- `src/shared`   types and the IPC contract

## UI
Soft-grey neumorphic theme (floating dark rail, frosted active states, inset fields). The window is frameless: the three dots top-left are real close/minimise/maximise controls; the icon beside them hides the sidebar.

## Status
Typechecks and builds. NOT yet run against a live backend: test login, list, then import
a small TXT + PNG cover, validate, publish a chapter, publish the book.

## Backend notes
- Import (`POST /content/admin/import`) is synchronous; cover is required and must be <= 10 MB.
- Admin list/detail endpoints don't return `cover_image_url`, `word_count`, `visibility`.
- `/database/*`, `/processing/*`, `/analytics/*`, `DELETE /activity/:id` have no auth guard.
- Users/Authors/Activity/Moderation/Analytics are labelled BACKEND GAP placeholders (no admin endpoints exist).
- Settings shows Backend Status from the public `GET /` health check.
