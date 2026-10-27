
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Tabs } from '../components/Tabs';
import {
  EmptyState,
  ErrorNotice,
  LifecycleBadge,
  PageHeader,
  Spinner,
} from '../components/ui';
import { formatDay, formatNumber } from '../lib/format';
import { useAdminDashboard } from '../queries/admin';
import { useBooks } from '../queries/books';

type DashboardTab = 'recent' | 'attention';

export function Dashboard() {
  const {
    data: overview,
    isPending: overviewPending,
    error: overviewError,
    refetch: refetchOverview,
  } = useAdminDashboard();

  const {
    data: books,
    isPending: booksPending,
    error: booksError,
    refetch: refetchBooks,
  } = useBooks();

  const [tab, setTab] = useState<DashboardTab>('recent');

  if (overviewPending || booksPending) {
    return <Spinner label="Loading dashboard…" />;
  }

  if (overviewError) {
    return (
      <ErrorNotice
        error={overviewError}
        onRetry={() => void refetchOverview()}
      />
    );
  }

  if (booksError) {
    return (
      <ErrorNotice
        error={booksError}
        onRetry={() => void refetchBooks()}
      />
    );
  }

  if (!overview || !books) {
    return <EmptyState title="Dashboard data unavailable" />;
  }

  const publishedBooks = books.filter(
    (book) => book.status === 'published',
  ).length;

  const totalImportedChapters = books.reduce(
    (total, book) => total + book.totalChapters,
    0,
  );

  const publishedImportedChapters = books.reduce(
    (total, book) => total + book.publishedChapters,
    0,
  );

  const importedWords = books.reduce(
    (total, book) => total + (book.wordCount ?? 0),
    0,
  );

  const recentBooks = [...books]
    .sort((a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    )
    .slice(0, 6);

  const attentionBooks = books.filter(
    (book) => book.publishedChapters === 0,
  );

  const rows =
    tab === 'recent' ? recentBooks : attentionBooks.slice(0, 6);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and imported-book activity"
      />

      <div className="stats">
        <Stat
          title="Platform users"
          value={formatNumber(overview.totals.users)}
          sub="Registered profiles"
        />

        <Stat
          title="Platform novels"
          value={formatNumber(overview.totals.novels)}
          sub="All novels in the database"
        />

        <Stat
          title="Platform chapters"
          value={formatNumber(overview.totals.chapters)}
          sub={`${formatNumber(overview.totals.publishedChapters)} published`}
        />

        <Stat
          title="Imported books"
          value={formatNumber(books.length)}
          sub={`${formatNumber(publishedBooks)} published`}
        />
      </div>

      <div className="stats">
        <Stat
          title="Imported chapters"
          value={formatNumber(publishedImportedChapters)}
          sub={`${formatNumber(totalImportedChapters)} total`}
        />

        <Stat
          title="Imported words"
          value={formatNumber(importedWords)}
          sub="Only counts books returned by the import API"
        />

        <Stat
          title="Imports needing attention"
          value={formatNumber(attentionBooks.length)}
          sub="Imported books with no published chapters"
        />
      </div>

      <Link className="btn btn-outline stats-action" to="/books">
        View imported books <Icon name="arrowRight" size={15} />
      </Link>

      <h2 className="section-title">Imported books</h2>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'recent', label: 'Recently imported' },
          {
            id: 'attention',
            label: 'No published chapter',
            count: attentionBooks.length,
          },
        ]}
      />

      <section className="card list-card">
        {rows.length === 0 ? (
          <EmptyState
            title={tab === 'recent' ? 'No imported books yet' : 'Nothing waiting'}
          >
            {tab === 'recent'
              ? 'Use Import book to add the first one.'
              : 'Every imported book has at least one published chapter.'}
          </EmptyState>
        ) : (
          <ul className="list">
            {rows.map((book) => (
              <li key={book.id}>
                <Link to={`/books/${book.id}`}>{book.title}</Link>
                <span className="muted small">
                  {book.authorName} · {formatDay(book.createdAt)}
                </span>
                <LifecycleBadge book={book} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="section-title">Recent platform activity</h2>

      <section className="card list-card">
        {overview.recentActivity.length === 0 ? (
          <EmptyState title="No activity recorded yet">
            Activity will appear here once the backend records user events.
          </EmptyState>
        ) : (
          <ul className="list">
            {overview.recentActivity.map((activity) => (
              <li key={activity.id}>
                <strong>{formatActivityType(activity.activityType)}</strong>
                <span className="muted small">
                  {activity.createdAt
                    ? new Date(activity.createdAt).toLocaleString()
                    : 'Time unavailable'}
                </span>
                <span className="muted small">
                  {activity.novelId
                    ? `Novel: ${activity.novelId}`
                    : activity.userId
                      ? `User: ${activity.userId}`
                      : 'Platform event'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="muted small">
        Dashboard refreshed from the backend. Last response:{' '}
        {new Date(overview.generatedAt).toLocaleString()}.
      </p>
    </>
  );
}

function Stat({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="stat-col">
      <div className="stat">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="muted small">{sub}</div>
      </div>
    </div>
  );
}

function formatActivityType(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
