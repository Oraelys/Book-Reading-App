import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppError, type ValidationIssue } from '../../../shared/errors'
import { lifecycleOf } from '../../../shared/lifecycle'
import type { ChapterSummary } from '../../../shared/types'
import { ChapterStatusBadge, ConfirmDialog, Cover, ErrorNotice, LifecycleBadge, OriginBadge, PageHeader, Spinner } from '../components/ui'
import { formatDateTime, formatNumber } from '../lib/format'
import {
  useBook, useChapter, useChapters, usePublishBook, usePublishChapter, useUnpublishBook, useUnpublishChapter, useValidateBook
} from '../queries/books'
import { useToast } from '../state/toast'

export function BookReview() {
  const { novelId = '' } = useParams()
  const toast = useToast()
  const book = useBook(novelId)
  const chapters = useChapters(novelId)
  const validate = useValidateBook(novelId)
  const publishBook = usePublishBook(novelId)
  const unpublishBook = useUnpublishBook(novelId)
  const publishChapter = usePublishChapter(novelId)
  const unpublishChapter = useUnpublishChapter(novelId)

  const [confirm, setConfirm] = useState<'publish' | 'unpublish' | null>(null)
  const [blocked, setBlocked] = useState<ValidationIssue[] | null>(null)
  const [preview, setPreview] = useState<number | null>(null)

  const fail = (e: unknown) => toast.push('error', e instanceof AppError ? e.message : 'Something went wrong.')
  const changed = () => { validate.reset(); setBlocked(null) } // any server-side change makes old validation stale

  if (book.isPending) return <Spinner />
  if (book.error) return <ErrorNotice error={book.error} onRetry={() => void book.refetch()} />
  const b = book.data
  const lifecycle = lifecycleOf(b)
  const validation = validate.data

  function runPublish() {
    publishBook.mutate(undefined, {
      onSuccess: (r) => { toast.push('success', r.message ?? 'Book published.'); changed(); setConfirm(null) },
      onError: (e) => {
        setConfirm(null)
        // The backend rejects publishing an invalid book with its validation result as the body.
        if (e instanceof AppError && e.issues) setBlocked(e.issues)
        else fail(e)
      }
    })
  }

  function runUnpublish() {
    unpublishBook.mutate(undefined, {
      onSuccess: (r) => { toast.push('success', r.message ?? 'Book unpublished.'); changed(); setConfirm(null) },
      onError: (e) => { setConfirm(null); fail(e) }
    })
  }

  function toggleChapter(c: ChapterSummary) {
    const m = c.isPublished ? unpublishChapter : publishChapter
    m.mutate(c.id, {
      onSuccess: (r) => { toast.push('success', r.message ?? `Chapter ${c.chapterNumber} ${c.isPublished ? 'unpublished' : 'published'}.`); changed() },
      onError: fail
    })
  }

  const busyChapter = (id: string) =>
    (publishChapter.isPending && publishChapter.variables === id) || (unpublishChapter.isPending && unpublishChapter.variables === id)

  return (
    <>
      <p className="crumb"><Link to="/books">← Imported books</Link></p>
      <PageHeader
        title={b.title}
        subtitle={`by ${b.authorName || 'unknown author'}`}
        actions={
          <>
            <button className="btn" onClick={() => validate.mutate(undefined, { onSuccess: () => setBlocked(null), onError: fail })} disabled={validate.isPending}>
              {validate.isPending ? 'Validating…' : 'Validate'}
            </button>
            {lifecycle === 'published' ? (
              <button className="btn btn-danger" onClick={() => setConfirm('unpublish')}>Unpublish book</button>
            ) : (
              <button className="btn btn-primary" onClick={() => setConfirm('publish')}>Publish book</button>
            )}
          </>
        }
      />

      <section className="card book-head">
        <Cover url={b.coverImageUrl} title={b.title} size="lg" />
        <div>
          <div className="row">
            <OriginBadge origin={b.contentOrigin} />
            <LifecycleBadge book={b} />
            {validation?.canPublish && lifecycle !== 'published' && <span className="badge badge-ready">Ready to publish</span>}
            {validation && !validation.canPublish && <span className="badge badge-attention">Needs review</span>}
          </div>
          <p className="description">{b.description ?? <span className="muted">No description.</span>}</p>
          <dl className="kv kv-wide">
            <dt>Category</dt><dd>{b.category ?? '—'}</dd>
            <dt>Chapters</dt><dd>{b.totalChapters} total · {b.publishedChapters} published · {b.draftChapters} draft</dd>
            <dt>Words</dt><dd>{formatNumber(b.wordCount)}</dd>
            <dt>Visibility</dt><dd>{b.visibility ?? (b.isPublic ? 'public' : 'private')}</dd>
            <dt>Imported</dt><dd>{formatDateTime(b.createdAt)}</dd>
            <dt>Last updated</dt><dd>{formatDateTime(b.updatedAt)}</dd>
            <dt>Published</dt><dd>{formatDateTime(b.publishedAt)}</dd>
          </dl>
        </div>
      </section>

      {(validation || blocked) && (
        <section className={`card ${(validation?.canPublish ?? false) ? 'card-ok' : 'card-warn'}`} role="region" aria-label="Validation result">
          {blocked ? (
            <h2>Publishing was blocked by the server</h2>
          ) : validation?.canPublish ? (
            <h2>Validation passed — this book can be published</h2>
          ) : (
            <h2>Validation found {validation?.errors.length} issue{validation?.errors.length === 1 ? '' : 's'}</h2>
          )}
          {(blocked ?? validation?.errors ?? []).length > 0 && (
            <ul className="issues">
              {(blocked ?? validation?.errors ?? []).map((i, n) => (
                <li key={n}>{i.field && <code>{i.field}</code>} {i.message}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card">
        <h2>Chapters</h2>
        {chapters.isPending ? (
          <Spinner />
        ) : chapters.error ? (
          <ErrorNotice error={chapters.error} onRetry={() => void chapters.refetch()} />
        ) : chapters.data.length === 0 ? (
          <p className="muted">This book has no chapters.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th className="num">#</th><th>Title</th><th className="num">Words</th><th>Status</th><th>Updated</th><th /></tr>
              </thead>
              <tbody>
                {chapters.data.map((c) => (
                  <tr key={c.id}>
                    <td className="num">{c.chapterNumber}</td>
                    <td className="wrap">{c.title}</td>
                    <td className="num">{formatNumber(c.wordCount)}</td>
                    <td><ChapterStatusBadge published={c.isPublished} /></td>
                    <td>{formatDateTime(c.updatedAt)}</td>
                    <td>
                      <div className="row row-end nowrap">
                        <button className="btn btn-small" onClick={() => setPreview(c.chapterNumber)}>Preview</button>
                        <button className="btn btn-small" disabled={busyChapter(c.id)} onClick={() => toggleChapter(c)}>
                          {busyChapter(c.id) ? '…' : c.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {preview !== null && (
        <ChapterDrawer
          novelId={novelId}
          chapterNumber={preview}
          summary={chapters.data?.find((c) => c.chapterNumber === preview)}
          busy={busyChapter}
          onToggle={toggleChapter}
          onClose={() => setPreview(null)}
        />
      )}

      <ConfirmDialog
        open={confirm === 'publish'}
        title="Publish this book?"
        confirmLabel="Publish"
        busy={publishBook.isPending}
        onConfirm={runPublish}
        onCancel={() => setConfirm(null)}
      >
        <p>“{b.title}” becomes visible to all readers. The server re-validates the book and will refuse if it is not ready.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === 'unpublish'}
        title="Unpublish this book?"
        confirmLabel="Unpublish"
        danger
        busy={unpublishBook.isPending}
        onConfirm={runUnpublish}
        onCancel={() => setConfirm(null)}
      >
        <p>“{b.title}” is hidden from readers immediately (status returns to draft, visibility to private). Chapters keep their own publish state.</p>
      </ConfirmDialog>
    </>
  )
}

function ChapterDrawer(props: {
  novelId: string
  chapterNumber: number
  summary: ChapterSummary | undefined
  busy: (id: string) => boolean
  onToggle: (c: ChapterSummary) => void
  onClose: () => void
}) {
  const { data, isPending, error, refetch } = useChapter(props.novelId, props.chapterNumber)
  const { onClose } = props

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Publish state comes from the (refetched) chapter list so the drawer never shows a stale badge.
  const live = props.summary ?? data

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label={`Chapter ${props.chapterNumber} preview`} onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <div className="muted small">Chapter {props.chapterNumber}</div>
            <h2>{data?.title ?? props.summary?.title ?? '…'}</h2>
            {live && <div className="row"><ChapterStatusBadge published={live.isPublished} /><span className="muted small">{formatNumber(live.wordCount)} words</span></div>}
          </div>
          <div className="row">
            {live && (
              <button className="btn btn-small" disabled={props.busy(live.id)} onClick={() => props.onToggle(live as ChapterSummary)}>
                {live.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            )}
            <button className="btn btn-small" onClick={onClose} aria-label="Close preview">Close</button>
          </div>
        </header>
        <div className="drawer-body">
          {isPending ? <Spinner /> : error ? <ErrorNotice error={error} onRetry={() => void refetch()} /> : data.content.trim() ? (
            <article className="chapter-text">{data.content}</article>
          ) : (
            <p className="muted">This chapter has no content — the server will refuse to publish it.</p>
          )}
        </div>
      </aside>
    </div>
  )
}
