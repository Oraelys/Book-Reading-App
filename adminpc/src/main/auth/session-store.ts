import { app, safeStorage } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { log } from '../logger'

/**
 * Storage adapter for supabase-js, encrypted with the OS credential store
 * (DPAPI on Windows, Keychain on macOS, libsecret/kwallet on Linux) via Electron safeStorage.
 *
 * If OS encryption is unavailable the session is kept in memory only. Writing a refresh token
 * to disk in plaintext is deliberately not offered as a fallback.
 */
export class EncryptedSessionStorage {
  private readonly file = join(app.getPath('userData'), 'session.bin')
  private cache: Record<string, string> | null = null
  private writeChain: Promise<void> = Promise.resolve()

  private get canPersist(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  private async load(): Promise<Record<string, string>> {
    if (this.cache) return this.cache
    this.cache = {}
    if (!this.canPersist) return this.cache
    try {
      const raw = await fs.readFile(this.file)
      const parsed: unknown = JSON.parse(safeStorage.decryptString(raw))
      if (parsed && typeof parsed === 'object') this.cache = parsed as Record<string, string>
    } catch {
      // Missing or undecryptable (e.g. different OS user): start signed out.
      this.cache = {}
    }
    return this.cache
  }

  private persist(): void {
    if (!this.canPersist || !this.cache) return
    const payload = safeStorage.encryptString(JSON.stringify(this.cache))
    const tmp = `${this.file}.tmp`
    this.writeChain = this.writeChain
      .then(async () => {
        await fs.writeFile(tmp, payload, { mode: 0o600 })
        await fs.rename(tmp, this.file)
      })
      .catch((e: unknown) => log.warn('session', 'could not persist session', e instanceof Error ? e.message : e))
  }

  async getItem(key: string): Promise<string | null> {
    return (await this.load())[key] ?? null
  }

  async setItem(key: string, value: string): Promise<void> {
    ;(await this.load())[key] = value
    this.persist()
  }

  async removeItem(key: string): Promise<void> {
    delete (await this.load())[key]
    this.persist()
  }
}
