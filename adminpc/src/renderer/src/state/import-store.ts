import { useSyncExternalStore } from 'react'
import { AppError } from '../../../shared/errors'
import type { ImportOutcome, ImportProgress, ImportRequest } from '../../../shared/types'
import { api } from '../lib/bridge'
import { queryClient, keys } from '../lib/query-client'

export type ImportUiState =
  | { status: 'idle' }
  | { status: 'running'; title: string; startedAt: number; progress: ImportProgress | null }
  | { status: 'succeeded'; title: string; outcome: ImportOutcome }
  | { status: 'failed'; title: string; error: AppError }

/**
 * Lives outside React so a long-running import (the backend processes synchronously and can take
 * minutes) keeps reporting when the administrator navigates to another page and back.
 * "Succeeded" is only ever set from the backend's response — never from local assumptions.
 */
let current: ImportUiState = { status: 'idle' }
const listeners = new Set<() => void>()

function set(next: ImportUiState): void {
  current = next
  for (const l of listeners) l()
}

let subscribed = false
function ensureProgressSubscription(): void {
  if (subscribed) return
  subscribed = true
  window.inkwell.imports.onProgress((progress) => {
    if (current.status === 'running') set({ ...current, progress })
  })
}

export async function startImport(request: ImportRequest): Promise<void> {
  if (current.status === 'running') return
  ensureProgressSubscription()
  set({ status: 'running', title: request.title, startedAt: Date.now(), progress: null })
  try {
    const outcome = await api.imports.start(request)
    set({ status: 'succeeded', title: request.title, outcome })
  } catch (e) {
    set({
      status: 'failed',
      title: request.title,
      error: e instanceof AppError ? e : new AppError({ kind: 'unknown', message: 'The import failed unexpectedly.' })
    })
  } finally {
    // Whether it succeeded, failed, or is unknown, the list must be re-read from the server.
    void queryClient.invalidateQueries({ queryKey: keys.books })
  }
}

export async function cancelImport(): Promise<void> {
  await api.imports.cancel()
}

export function resetImport(): void {
  if (current.status !== 'running') set({ status: 'idle' })
}

export function useImportState(): ImportUiState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current
  )
}
