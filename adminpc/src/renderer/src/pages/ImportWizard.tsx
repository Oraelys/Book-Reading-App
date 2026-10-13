import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppError } from '../../../shared/errors'
import { COVER_EXTENSIONS, MANUSCRIPT_EXTENSIONS, type ImportPhase, type PickedFile } from '../../../shared/types'
import { PageHeader } from '../components/ui'
import { api } from '../lib/bridge'
import { formatBytes, formatElapsed } from '../lib/format'
import { cancelImport, resetImport, startImport, useImportState } from '../state/import-store'
import { useToast } from '../state/toast'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ImportWizard() {
  const importState = useImportState()

  return (
    <>
      <PageHeader
        title="Import book"
        subtitle="Only administrators can add manuscripts. Imported chapters start unpublished so you can review them first."
      />
      {importState.status === 'idle' ? <ImportForm /> : <ImportProgressPanel />}
    </>
  )
}

function ImportForm() {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [manuscript, setManuscript] = useState<PickedFile | null>(null)
  const [cover, setCover] = useState<PickedFile | null>(null)

  const authorIdInvalid = authorId.trim() !== '' && !UUID.test(authorId.trim())
  const ready = title.trim() && authorName.trim() && manuscript && cover && !authorIdInvalid

  async function pick(kind: 'manuscript' | 'cover') {
    try {
      const file = await (kind === 'manuscript' ? api.files.pickManuscript() : api.files.pickCover())
      if (!file) return // dialog cancelled
      if (file.warning) toast.push('info', file.warning)
      kind === 'manuscript' ? setManuscript(file) : setCover(file)
    } catch (e) {
      toast.push('error', e instanceof AppError ? e.message : 'Could not select that file.')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!ready) return
    void startImport({
      title,
      authorName,
      ...(authorId.trim() ? { authorId: authorId.trim() } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      manuscriptToken: manuscript.token,
      coverToken: cover.token
    })
  }

  return (
    <form className="import-grid" onSubmit={submit}>
      <section className="card form">
        <h2>Book details</h2>
        <label>Title *<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} required /></label>
        <label>Author name * <span className="hint">credited on the book</span>
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={200} required />
        </label>
        <label>Inkwell author ID <span className="hint">optional — leave blank for an external author</span>
          <input value={authorId} onChange={(e) => setAuthorId(e.target.value)} placeholder="Profile UUID" spellCheck={false} aria-invalid={authorIdInvalid} />
          {authorIdInvalid && <span className="field-error">That is not a valid UUID.</span>}
        </label>
        <label>Category<input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={100} /></label>
        <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} /></label>
        <p className="muted small">
          The book is credited to the author above; it is <strong>not</strong> assigned to your administrator account.
          Title, description, category and cover are all required before the server will let you publish.
        </p>
      </section>

      <section className="card form">
        <h2>Files</h2>
        <div className="file-slot">
          <div>
            <strong>Manuscript *</strong>
            <div className="muted small">{MANUSCRIPT_EXTENSIONS.join(', ').toUpperCase()} · up to 50 MB</div>
            {manuscript && <div className="file-name">{manuscript.name} <span className="muted">({formatBytes(manuscript.size)})</span></div>}
          </div>
          <button type="button" className="btn" onClick={() => void pick('manuscript')}>{manuscript ? 'Change…' : 'Choose file…'}</button>
        </div>

        <div className="file-slot">
          <div>
            <strong>Cover image *</strong>
            <div className="muted small">{COVER_EXTENSIONS.join(', ').toUpperCase()} · up to 10 MB · required by the server</div>
            {cover && <div className="file-name">{cover.name} <span className="muted">({formatBytes(cover.size)})</span></div>}
          </div>
          <button type="button" className="btn" onClick={() => void pick('cover')}>{cover ? 'Change…' : 'Choose image…'}</button>
        </div>
        {cover?.previewDataUrl && <img className="cover-preview" src={cover.previewDataUrl} alt="Selected cover preview" />}

        <button className="btn btn-primary btn-wide" disabled={!ready}>Import book</button>
      </section>
    </form>
  )
}

const STEPS: { phase: ImportPhase; label: string }[] = [
  { phase: 'preparing', label: 'Preparing' },
  { phase: 'uploading', label: 'Uploading' },
  { phase: 'processing', label: 'Processing on server' },
  { phase: 'completed', label: 'Completed' }
]

function ImportProgressPanel() {
  const state = useImportState()
  const navigate = useNavigate()
  const toast = useToast()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  if (state.status === 'idle') return null

  const phase: ImportPhase =
    state.status === 'running' ? (state.progress?.phase ?? 'preparing') : state.status === 'succeeded' ? 'completed' : 'failed'
  const activeIndex = STEPS.findIndex((s) => s.phase === phase)
  const progress = state.status === 'running' ? state.progress : null
  const pct = progress && progress.totalBytes > 0 ? Math.min(100, Math.round((progress.sentBytes / progress.totalBytes) * 100)) : 0

  return (
    <section className="card">
      <h2>{state.title}</h2>

      <ol className="steps">
        {STEPS.map((s, i) => {
          const done = state.status === 'succeeded' || (activeIndex >= 0 && i < activeIndex)
          const active = state.status === 'running' && i === activeIndex
          return (
            <li key={s.phase} className={done ? 'done' : active ? 'active' : ''}>
              {s.label}
              {s.phase === 'uploading' && active && ` — ${pct}%`}
              {s.phase === 'processing' && active && ` — ${formatElapsed(now - state.startedAt)}`}
            </li>
          )
        })}
      </ol>

      {state.status === 'running' && (
        <>
          <progress className={phase === 'processing' ? 'indeterminate' : ''} max={100} value={phase === 'processing' ? undefined : pct} />
          {phase === 'processing' ? (
            <p className="muted">
              Upload finished. The server is parsing the manuscript, detecting chapters and saving them. This can take several minutes for large books —
              you can leave this page; progress is kept.
            </p>
          ) : (
            <p className="muted small">{progress ? `${formatBytes(progress.sentBytes)} of ${formatBytes(progress.totalBytes)}` : 'Starting…'}</p>
          )}
          {phase === 'uploading' && (
            <button
              className="btn"
              onClick={() => void cancelImport().catch((e: unknown) => toast.push('error', e instanceof AppError ? e.message : 'Could not cancel.'))}
            >
              Cancel upload
            </button>
          )}
        </>
      )}

      {state.status === 'succeeded' && (
        <div className="notice notice-ok" role="status">
          <div>
            <strong>Imported.</strong> The server confirmed “{state.outcome.title ?? state.title}”
            {state.outcome.chapterCount !== null && <> with {state.outcome.chapterCount} detected chapter{state.outcome.chapterCount === 1 ? '' : 's'}</>}
            {state.outcome.creditedAuthor && <>, credited to {state.outcome.creditedAuthor}</>}. Chapters are unpublished — review, validate, then publish.
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={() => navigate(`/books/${state.outcome.novelId}`)}>Review book</button>
            <button className="btn" onClick={resetImport}>Import another</button>
          </div>
        </div>
      )}

      {state.status === 'failed' && (
        <div className="notice notice-error" role="alert">
          <div>
            <strong>{state.error.outcomeUnknown ? 'Result unknown.' : state.error.kind === 'cancelled' ? 'Cancelled.' : 'Import failed.'}</strong>{' '}
            {state.error.message}
            {state.error.outcomeUnknown && (
              <> <Link to="/books">Open Imported books</Link> to check.</>
            )}
          </div>
          <button className="btn" onClick={resetImport}>Back to form</button>
        </div>
      )}
    </section>
  )
}
