import { randomBytes } from 'node:crypto'
import { createReadStream } from 'node:fs'

export interface FieldPart {
  kind: 'field'
  name: string
  value: string
}

export interface FilePart {
  kind: 'file'
  name: string
  filename: string
  contentType: string
  path: string
  /** Size at selection time. Streaming throws if the file changed underneath us. */
  size: number
}

export type Part = FieldPart | FilePart

export class FileChangedError extends Error {
  constructor(name: string) {
    super(`"${name}" changed on disk while it was being uploaded.`)
    this.name = 'FileChangedError'
  }
}

/** ASCII-only, no quotes/CR/LF, so it can never break out of the Content-Disposition header. */
export function safeFilename(name: string): string {
  const cleaned = name.replace(/[\r\n"\\]/g, '_').replace(/[^\x20-\x7e]/g, '_').trim()
  return cleaned || 'file'
}

const CRLF = Buffer.from('\r\n')

/**
 * Streams a multipart/form-data body without loading files into memory (manuscripts can be 50 MB).
 * Field names/values are exactly what the NestJS controller reads: title, authorName, authorId,
 * description, category (text) and file, cover (files, with the part Content-Type that
 * MediaValidationService checks).
 */
export class MultipartBody {
  readonly boundary = `----InkwellAdmin${randomBytes(12).toString('hex')}`
  readonly contentType = `multipart/form-data; boundary=${this.boundary}`
  readonly contentLength: number
  private readonly heads: Buffer[]
  private readonly closing: Buffer

  constructor(private readonly parts: readonly Part[]) {
    this.heads = parts.map((p) => {
      const disposition =
        p.kind === 'field'
          ? `form-data; name="${p.name}"`
          : `form-data; name="${p.name}"; filename="${safeFilename(p.filename)}"`
      const type = p.kind === 'file' ? `\r\nContent-Type: ${p.contentType}` : ''
      return Buffer.from(`--${this.boundary}\r\nContent-Disposition: ${disposition}${type}\r\n\r\n`)
    })
    this.closing = Buffer.from(`--${this.boundary}--\r\n`)

    let total = this.closing.length
    parts.forEach((p, i) => {
      total += (this.heads[i] as Buffer).length + CRLF.length
      total += p.kind === 'field' ? Buffer.byteLength(p.value) : p.size
    })
    this.contentLength = total
  }

  async *stream(): AsyncGenerator<Buffer> {
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i] as Part
      yield this.heads[i] as Buffer
      if (part.kind === 'field') {
        yield Buffer.from(part.value)
      } else {
        let read = 0
        for await (const chunk of createReadStream(part.path, { highWaterMark: 256 * 1024 })) {
          const buf = chunk as Buffer
          read += buf.length
          yield buf
        }
        if (read !== part.size) throw new FileChangedError(part.filename)
      }
      yield CRLF
    }
    yield this.closing
  }
}
