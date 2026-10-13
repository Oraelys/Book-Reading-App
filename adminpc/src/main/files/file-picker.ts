import { dialog, type BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import { basename, extname } from 'node:path'
import { AppError } from '../../shared/errors'
import {
  COVER_EXTENSIONS,
  MANUSCRIPT_EXTENSIONS,
  MAX_COVER_BYTES,
  MAX_MANUSCRIPT_BYTES,
  type PickedFile
} from '../../shared/types'
import type { FileRegistry } from './file-registry'

const MB = (n: number): string => `${Math.round(n / 1024 / 1024)} MB`

const MANUSCRIPT_MIME: Record<string, string> = {
  txt: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  epub: 'application/epub+zip'
}

/** Content sniffing so a renamed file is caught before a 50 MB upload, not after. */
function sniffImage(head: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg'
  if (head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  return null
}

const isZip = (head: Buffer): boolean => head.length >= 4 && head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04

async function readHead(path: string, bytes: number): Promise<Buffer> {
  const handle = await fs.open(path, 'r')
  try {
    const buf = Buffer.alloc(bytes)
    const { bytesRead } = await handle.read(buf, 0, bytes, 0)
    return buf.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

async function statFile(path: string): Promise<number> {
  const stat = await fs.stat(path).catch(() => null)
  if (!stat?.isFile()) throw new AppError({ kind: 'validation', message: 'That file could not be read.' })
  if (stat.size === 0) throw new AppError({ kind: 'validation', message: 'That file is empty.' })
  return stat.size
}

export class FilePicker {
  constructor(
    private readonly registry: FileRegistry,
    private readonly getWindow: () => BrowserWindow | null
  ) {}

  async pickManuscript(): Promise<PickedFile | null> {
    const path = await this.choose('Select manuscript', [
      { name: 'Manuscript (TXT, DOCX, EPUB)', extensions: [...MANUSCRIPT_EXTENSIONS] }
    ])
    if (!path) return null

    const extension = extname(path).slice(1).toLowerCase()
    if (!(MANUSCRIPT_EXTENSIONS as readonly string[]).includes(extension)) {
      throw new AppError({ kind: 'validation', message: 'Manuscripts must be TXT, DOCX or EPUB files.' })
    }
    const size = await statFile(path)
    if (size > MAX_MANUSCRIPT_BYTES) {
      throw new AppError({ kind: 'too_large', message: `Manuscripts can be at most ${MB(MAX_MANUSCRIPT_BYTES)}.` })
    }

    const head = await readHead(path, 4096)
    let warning: string | null = null
    if (extension === 'txt') {
      if (head.includes(0)) {
        warning =
          'This text file contains binary/UTF-16 data. If chapters import garbled, re-save it as UTF-8 first.'
      }
    } else if (!isZip(head)) {
      throw new AppError({ kind: 'validation', message: `This does not look like a valid ${extension.toUpperCase()} file.` })
    }

    const name = basename(path)
    const token = this.registry.register({
      path,
      name,
      size,
      extension,
      contentType: MANUSCRIPT_MIME[extension] ?? 'application/octet-stream',
      kind: 'manuscript'
    })
    return { token, name, size, extension, previewDataUrl: null, warning }
  }

  async pickCover(): Promise<PickedFile | null> {
    const path = await this.choose('Select cover image', [
      { name: 'Cover image (JPG, PNG, WEBP)', extensions: [...COVER_EXTENSIONS] }
    ])
    if (!path) return null

    const extension = extname(path).slice(1).toLowerCase()
    if (!(COVER_EXTENSIONS as readonly string[]).includes(extension)) {
      throw new AppError({ kind: 'validation', message: 'Covers must be JPG, JPEG, PNG or WEBP images.' })
    }
    const size = await statFile(path)
    // MediaValidationService rejects covers over 10 MB (after creating the novel and rolling back).
    if (size > MAX_COVER_BYTES) {
      throw new AppError({ kind: 'too_large', message: `Cover images can be at most ${MB(MAX_COVER_BYTES)}.` })
    }

    const mime = sniffImage(await readHead(path, 16))
    if (!mime) {
      throw new AppError({ kind: 'validation', message: 'This does not look like a valid JPG, PNG or WEBP image.' })
    }

    const bytes = await fs.readFile(path)
    const name = basename(path)
    const token = this.registry.register({ path, name, size, extension, contentType: mime, kind: 'cover' })
    return {
      token,
      name,
      size,
      extension,
      previewDataUrl: `data:${mime};base64,${bytes.toString('base64')}`,
      warning: null
    }
  }

  private async choose(title: string, filters: Electron.FileFilter[]): Promise<string | null> {
    const win = this.getWindow()
    const options: Electron.OpenDialogOptions = { title, filters, properties: ['openFile'] }
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
    return result.canceled ? null : (result.filePaths[0] ?? null)
  }
}
