import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Tabs } from '../components/Tabs'
import { EmptyState, ErrorNotice, LifecycleBadge, PageHeader, Spinner } from '../components/ui'
import { formatDay, formatNumber } from '../lib/format'
import { useBooks } from '../queries/books'

/**
 * Every figure is computed from GET /content/admin/imported — the only admin data the backend
 * exposes — and labelled as such. Metrics with no backend source are listed as BACKEND GAP.
 */
export function Dashboard() {
  const { data: books, isPending, error, refetch } = useBooks()
  const [tab, setTab] = useState<'recent' | 'attention'>('recent')

  if (isPending) return <Spinner />
  if (error) return <ErrorNotice error={error} onRetry={() => void refetch()} />

  const published = books.filter((b) => b.status === 'published').length
  const totalChapters = books.reduce((n, b) => n + b.totalChapters, 0)
  const publishedChapters = books.reduce((n, b) => n + b.publishedChapters, 0)
  const words = books.reduce((n, b) => n + (b.wordCount ?? 0), 0)
  const recent = [...books].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 6)
  const attention = books.filter((b) => b.publishedChapters === 0)
  const rows = tab === 'recent' ? recent : attention.slice(0, 6)

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Imported books, straight from the backend" />

      <div className="stats">
        <div className="stat-col">
          <div className="stat stat-hero">
            <div className="stat-title">Imported books</div>
            <div className="stat-row">
              <span className="stat-value stat-value-xl">{formatNumber(books.length)}</span>
              <span className="pill-up"><Icon name="arrowUp" size={12} /> {published} published</span>
            </div>
          </div>
        </div>
        <Stat title="Chapters" value={formatNumber(publishedChapters)} sub={`published · ${formatNumber(totalChapters)} total`} />
        <Stat title="Words" value={formatNumber(words)} sub="across imported books" />
        <Stat title="Not published" value={formatNumber(books.length - published)} sub="draft or unpublished" />
      </div>

      <Link className="btn btn-outline stats-action" to="/books">
        View imported books <Icon name="arrowRight" size={15} />
      </Link>

      <h2 className="section-title">Books</h2>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'recent', label: 'Recently imported' },
          { id: 'attention', label: 'No published chapter', count: attention.length }
        ]}
      />
      <section className="card list-card">
        {rows.length === 0 ? (
          <EmptyState title={tab === 'recent' ? 'No imported books yet' : 'Nothing waiting'}>
            {tab === 'recent' ? 'Use Import book to add the first one.' : 'Every imported book has at least one published chapter.'}
          </EmptyState>
        ) : (
          <ul className="list">
            {rows.map((b) => (
              <li key={b.id}>
                <Link to={`/books/${b.id}`}>{b.title}</Link>
                <span className="muted small">{b.authorName} · {formatDay(b.createdAt)}</span>
                <LifecycleBadge book={b} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card card-dashed">
        <h2><span className="badge badge-gap">Backend gap</span> Not shown, on purpose</h2>
        <p className="muted">
          The backend has no admin endpoint for: total books including author-created, users, authors, platform activity, processing failures or
          moderation. Nothing here is estimated — see the greyed modules in the rail for the contract each one needs.
        </p>
      </section>
    </>
  )
}

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="stat-col">
      <div className="stat">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="muted small">{sub}</div>
      </div>
    </div>
  )
}
