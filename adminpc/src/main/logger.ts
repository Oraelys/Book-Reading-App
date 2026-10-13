import { app } from 'electron'

/**
 * Technical detail goes to the main-process console in development only.
 * It never crosses IPC, and tokens/passwords must never be passed to it.
 */
const verbose = (): boolean => !app.isPackaged

export const log = {
  debug: (tag: string, ...args: unknown[]): void => {
    if (verbose()) console.debug(`[inkwell:${tag}]`, ...args)
  },
  warn: (tag: string, ...args: unknown[]): void => console.warn(`[inkwell:${tag}]`, ...args),
  error: (tag: string, ...args: unknown[]): void => console.error(`[inkwell:${tag}]`, ...args)
}
