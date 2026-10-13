/// <reference types="vite/client" />
import type { InkwellBridge } from '../../shared/ipc'

declare global {
  interface Window {
    /** Exposed by the preload script. This is the renderer's only route to the OS and backend. */
    inkwell: InkwellBridge
  }
}

export {}
