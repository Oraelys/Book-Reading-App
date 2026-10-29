import { useEffect, useRef, type ReactNode } from 'react'
import { AppError } from '../../../shared/errors'
import { lifecycleOf } from '../../../shared/lifecycle'
import type { ContentOrigin, ImportedBook } from '../../../shared/types'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="center-note" role="status">
      <span className="spinner" aria-hidden /> {label}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  )
}

export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof AppError
    ? error.message
    : import.meta.env.DEV && error instanceof Error
      ? error.message
      : 'Something went wrong.'
  return (
    <div className="notice notice-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-small" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  )
}

const LIFECYCLE_LABEL = { draft: 'Draft', published: 'Published', unpublished: 'Unpublished' } as const

export function LifecycleBadge({ book }: { book: Pick<ImportedBook, 'status' | 'publishedAt'> }) {
  const l = lifecycleOf(book)
  return <span className={`badge badge-${l}`}>{LIFECYCLE_LABEL[l]}</span>
}

export function OriginBadge({ origin }: { origin: ContentOrigin }) {
  return origin === 'admin_imported' ? (
    <span className="badge badge-origin-imported">Admin imported</span>
  ) : (
    <span className="badge badge-origin-author">Author created</span>
  )
}

export function ChapterStatusBadge({ published }: { published: boolean }) {
  return <span className={`badge ${published ? 'badge-published' : 'badge-draft'}`}>{published ? 'Published' : 'Draft'}</span>
}

/** The admin endpoints don't return cover_image_url yet, so a placeholder is the honest fallback. */
export function Cover({ url, title, size = 'sm' }: { url: string | null; title: string; size?: 'sm' | 'lg' }) {
  return url ? (
    <img className={`cover cover-${size}`} src={url} alt={`Cover of ${title}`} loading="lazy" />
  ) : (
    <div className={`cover cover-${size} cover-empty`} title="No cover URL provided by the API" aria-label="No cover available">
      {title.slice(0, 1).toUpperCase()}
    </div>
  )
}

export function ConfirmDialog(props: {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const { open, onCancel } = props

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal() // native modal: focus trap + Esc handling for free
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog ref={ref} className="dialog" onCancel={(e) => { e.preventDefault(); if (!props.busy) onCancel() }}>
      <h2>{props.title}</h2>
      <div className="dialog-body">{props.children}</div>
      <div className="row row-end">
        <button className="btn" onClick={onCancel} disabled={props.busy}>
          Cancel
        </button>
        <button className={`btn ${props.danger ? 'btn-danger' : 'btn-primary'}`} onClick={props.onConfirm} disabled={props.busy}>
          {props.busy ? 'Working…' : props.confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
