import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { lifecycleOf } from '../../../shared/lifecycle'
import { Icon } from '../components/Icon'
import { Tabs } from '../components/Tabs'
import { Cover, EmptyState, ErrorNotice, LifecycleBadge, OriginBadge, PageHeader, Spinner } from '../components/ui'
import { formatDay, formatNumber } from '../lib/format'
import { useBooks } from '../queries/books'

type StatusFilter = 'all' | 'draft' | 'published' | 'unpublished'
type Sort = 'updated' | 'created' | 'title'

export function BooksList() {
  const { data: books, isPending, isFetching, error, refetch } = useBooks()
  const navigate = useNavigate()
  // Filters live in the URL so sidebar links (Status, History) and back/forward navigation work.
  const [params, setParams] = useSearchParams()
  const rawStatus = params.get('status')
  const rawSort = params.get('sort')
  const status: StatusFilter = rawStatus === 'draft' || rawStatus === 'published' || rawStatus === 'unpublished' ? rawStatus : 'all'
  const sort: Sort = rawSort === 'created' || rawSort === 'title' ? rawSort : 'updated'
  const query = params.get('q') ?? ''
  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== fallback) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const countOf = (l: StatusFilter) => (books ?? []).filter((b) => l === 'all' || lifecycleOf(b) === l).length

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = (books ?? []).filter(
      (b) =>
        (status === 'all' || lifecycleOf(b) === status) &&
        (!q || b.title.toLowerCase().includes(q) || b.authorName.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q))
    )
    return filtered.sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : (sort === 'created' ? (b.createdAt ?? '') : (b.updatedAt ?? '')).localeCompare(sort === 'created' ? (a.createdAt ?? '') : (a.updatedAt ?? ''))
    )
  }, [books, query, status, sort])

  return (
    <>
      <PageHeader
        title="Imported books"
        subtitle="Books imported by administrators. Author-created books need a backend admin endpoint before they can appear here."
        actions={
          <button className="btn" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <Tabs
        value={status}
        onChange={(v) => setParam('status', v, 'all')}
        items={[
          { id: 'all', label: 'All', count: countOf('all') },
          { id: 'draft', label: 'Draft', count: countOf('draft') },
          { id: 'published', label: 'Published', count: countOf('published') },
          { id: 'unpublished', label: 'Unpublished', count: countOf('unpublished') }
        ]}
      />
      <div className="toolbar">
        <label className="search-inset search-grow">
          <Icon name="search" size={16} />
          <input type="search" placeholder="Search title, author or category" value={query} onChange={(e) => setParam('q', e.target.value, '')} aria-label="Search books" />
        </label>
        <select value={sort} onChange={(e) => setParam('sort', e.target.value, 'updated')} aria-label="Sort">
          <option value="updated">Recently updated</option>
          <option value="created">Recently imported</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorNotice error={error} onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title={books.length === 0 ? 'No imported books yet' : 'No books match your filters'} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Title</th>
                <th>Author</th>
                <th>Origin</th>
                <th>Status</th>
                <th className="num">Chapters</th>
                <th className="num">Words</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="clickable" tabIndex={0} onClick={() => navigate(`/books/${b.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/books/${b.id}`)}>
                  <td><Cover url={b.coverImageUrl} title={b.title} /></td>
                  <td className="wrap"><strong>{b.title}</strong><div className="muted small">{b.category ?? 'No category'}</div></td>
                  <td>{b.authorName || '—'}</td>
                  <td><OriginBadge origin={b.contentOrigin} /></td>
                  <td><LifecycleBadge book={b} /></td>
                  <td className="num">{b.publishedChapters} / {b.totalChapters}</td>
                  <td className="num">{formatNumber(b.wordCount)}</td>
                  <td>{formatDay(b.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
