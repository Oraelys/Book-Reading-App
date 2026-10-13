import { randomUUID } from 'node:crypto'

export interface RegisteredFile {
  path: string
  name: string
  size: number
  extension: string
  contentType: string
  kind: 'manuscript' | 'cover'
  registeredAt: number
}

const TTL_MS = 30 * 60 * 1000

/**
 * Maps opaque tokens to file paths chosen through the native dialog.
 * The renderer only ever holds tokens, so it cannot make main read or upload an arbitrary path.
 */
export class FileRegistry {
  private readonly entries = new Map<string, RegisteredFile>()

  register(file: Omit<RegisteredFile, 'registeredAt'>): string {
    this.sweep()
    const token = randomUUID()
    this.entries.set(token, { ...file, registeredAt: Date.now() })
    return token
  }

  get(token: string, kind: RegisteredFile['kind']): RegisteredFile | null {
    this.sweep()
    const entry = this.entries.get(token)
    return entry && entry.kind === kind ? entry : null
  }

  release(...tokens: string[]): void {
    for (const t of tokens) this.entries.delete(t)
  }

  private sweep(): void {
    const now = Date.now()
    for (const [token, entry] of this.entries) {
      if (now - entry.registeredAt > TTL_MS) this.entries.delete(token)
    }
  }
}
