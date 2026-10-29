
import { useState } from 'react';
import type { AdminUserRole } from '../../../shared/admin-types';
import { EmptyState, ErrorNotice, PageHeader, Spinner } from '../components/ui';
import { formatDay, formatNumber } from '../lib/format';
import { useAdminUsers } from '../queries/users';

type RoleFilter = AdminUserRole | 'all';

export function Users() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');

  const {
    data,
    isPending,
    isFetching,
    error,
    refetch,
  } = useAdminUsers(search, role);

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Search registered profiles and review account roles and profile visibility."
        actions={
          <button
            className="btn btn-outline"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <div className="stats">
        <div className="stat-col">
          <div className="stat">
            <div className="stat-title">Matching profiles</div>
            <div className="stat-value">
              {data ? formatNumber(data.total) : '—'}
            </div>
            <div className="muted small">
              Total matching the current filters
            </div>
          </div>
        </div>

        <div className="stat-col">
          <div className="stat">
            <div className="stat-title">Displayed</div>
            <div className="stat-value">
              {data ? formatNumber(data.users.length) : '—'}
            </div>
            <div className="muted small">
              Maximum {data?.limit ?? 100} per request
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <label className="search-inset search-grow">
          <span className="muted" aria-hidden>⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search username, tag or email"
            aria-label="Search users"
          />
        </label>

        <select
          value={role}
          onChange={(event) => setRole(event.target.value as RoleFilter)}
          aria-label="Filter users by role"
        >
          <option value="all">All roles</option>
          <option value="reader">Readers</option>
          <option value="author">Authors</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {isPending ? (
        <Spinner label="Loading users…" />
      ) : error ? (
        <ErrorNotice
          error={error}
          onRetry={() => void refetch()}
        />
      ) : !data || data.users.length === 0 ? (
        <EmptyState title="No matching users">
          Try another search or select a different role.
        </EmptyState>
      ) : (
        <>
          {data.total > data.users.length && (
            <p className="muted small">
              Showing the first {data.users.length} of{' '}
              {formatNumber(data.total)} matching profiles.
              Narrow your search to find specific users.
            </p>
          )}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Profile visibility</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="wrap">
                      <strong>{user.username || 'Unnamed user'}</strong>
                      <div className="muted small">
                        {user.userTag || user.id}
                      </div>
                    </td>

                    <td className="wrap">{user.email || '—'}</td>

                    <td>
                      <span className={`badge ${roleBadge(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    <td>
                      {user.isPublic === null
                        ? 'Unknown'
                        : user.isPublic
                          ? 'Public'
                          : 'Private'}
                    </td>

                    <td>{formatDay(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function roleLabel(role: AdminUserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'author':
      return 'Author';
    default:
      return 'Reader';
  }
}

function roleBadge(role: AdminUserRole): string {
  switch (role) {
    case 'admin':
      return 'badge-published';
    case 'author':
      return 'badge-origin-author';
    default:
      return 'badge-draft';
  }
}
