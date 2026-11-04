import { useEffect, useState } from 'react';
import type { AdminUser, AdminUserRole } from '../../../shared/admin-types';
import { EmptyState, ErrorNotice, PageHeader, Spinner } from '../components/ui';
import { formatDay, formatNumber } from '../lib/format';
import {
  useAdminUsers,
  useAdminUserDetails,
  useChangeAdminUserRole,
} from '../queries/users';

type RoleFilter = AdminUserRole | 'all';

export function Users() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isPending, isFetching, error, refetch } = useAdminUsers(search, role);
  const details = useAdminUserDetails(selectedUserId);

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Search registered profiles, manage account roles and inspect account activity."
        actions={
          <button className="btn btn-outline" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <div className="stats">
        <div className="stat-col">
          <div className="stat">
            <div className="stat-title">Matching profiles</div>
            <div className="stat-value">{data ? formatNumber(data.total) : '—'}</div>
            <div className="muted small">Total matching the current filters</div>
          </div>
        </div>
        <div className="stat-col">
          <div className="stat">
            <div className="stat-title">Displayed</div>
            <div className="stat-value">{data ? formatNumber(data.users.length) : '—'}</div>
            <div className="muted small">Maximum {data?.limit ?? 100} per request</div>
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
        <select value={role} onChange={(event) => setRole(event.target.value as RoleFilter)} aria-label="Filter users by role">
          <option value="all">All roles</option>
          <option value="reader">Readers</option>
          <option value="author">Authors</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {isPending ? (
        <Spinner label="Loading users…" />
      ) : error ? (
        <ErrorNotice error={error} onRetry={() => void refetch()} />
      ) : !data || data.users.length === 0 ? (
        <EmptyState title="No matching users">Try another search or select a different role.</EmptyState>
      ) : (
        <>
          {data.total > data.users.length && (
            <p className="muted small">
              Showing the first {data.users.length} of {formatNumber(data.total)} matching profiles.
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
                  <th>Manage role</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="wrap">
                      <strong>{user.username || 'Unnamed user'}</strong>
                      <div className="muted small">{user.userTag || user.id}</div>
                    </td>
                    <td className="wrap">{user.email || '—'}</td>
                    <td><span className={`badge ${roleBadge(user.role)}`}>{roleLabel(user.role)}</span></td>
                    <td>{user.isPublic === null ? 'Unknown' : user.isPublic ? 'Public' : 'Private'}</td>
                    <td>{formatDay(user.createdAt)}</td>
                    <td><UserRoleControl user={user} /></td>
                    <td>
                      <button
                        className="btn btn-small btn-outline"
                        aria-expanded={selectedUserId === user.id}
                        onClick={() => setSelectedUserId((current) => current === user.id ? null : user.id)}
                      >
                        {selectedUserId === user.id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedUserId && (
            <UserDetailsPanel
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
              query={details}
            />
          )}
        </>
      )}
    </>
  );
}

function UserDetailsPanel({ userId, onClose, query }: {
  userId: string;
  onClose: () => void;
  query: ReturnType<typeof useAdminUserDetails>;
}) {
  if (query.isPending) return <section className="card"><Spinner label="Loading user details…" /></section>;
  if (query.error) return <section className="card"><ErrorNotice error={query.error} onRetry={() => void query.refetch()} /></section>;
  if (!query.data) return <section className="card"><EmptyState title="User details unavailable" /></section>;

  const { user, activity, activityLimit } = query.data;
  return (
    <section className="card user-details" aria-label="User details">
      <div className="row row-between">
        <div>
          <h2>{user.username || 'Unnamed user'}</h2>
          <p className="muted small">{user.userTag || user.id}</p>
        </div>
        <button className="btn btn-outline btn-small" onClick={onClose}>Close details</button>
      </div>
      <div className="stats">
        <div className="stat-col"><div className="stat"><div className="stat-title">Email</div><div className="stat-value small">{user.email || '—'}</div></div></div>
        <div className="stat-col"><div className="stat"><div className="stat-title">Role</div><div className="stat-value small">{roleLabel(user.role)}</div></div></div>
        <div className="stat-col"><div className="stat"><div className="stat-title">Visibility</div><div className="stat-value small">{user.isPublic === null ? 'Unknown' : user.isPublic ? 'Public' : 'Private'}</div></div></div>
        <div className="stat-col"><div className="stat"><div className="stat-title">Last profile update</div><div className="stat-value small">{formatDay(user.updatedAt)}</div></div></div>
      </div>
      {user.bio && <p>{user.bio}</p>}
      <h3>Recent activity</h3>
      <p className="muted small">Latest {activityLimit} recorded events for this account.</p>
      {activity.length === 0 ? (
        <EmptyState title="No activity recorded for this user" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Activity</th><th>Novel ID</th><th>Chapter ID</th><th>When</th></tr></thead>
            <tbody>
              {activity.map((item) => (
                <tr key={item.id}>
                  <td>{item.activityType.replaceAll('_', ' ')}</td>
                  <td className="muted small">{item.novelId || '—'}</td>
                  <td className="muted small">{item.chapterId || '—'}</td>
                  <td>{formatDay(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Role-change audit</h3>
      {query.data.roleChanges.length === 0 ? (
        <EmptyState title="No role changes recorded" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Previous role</th><th>New role</th><th>Changed by (admin ID)</th><th>When</th></tr></thead>
            <tbody>
              {query.data.roleChanges.map((change) => (
                <tr key={change.id}>
                  <td>{roleLabel(change.previousRole)}</td>
                  <td>{roleLabel(change.newRole)}</td>
                  <td className="muted small">{change.actorUserId}</td>
                  <td>{formatDay(change.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function roleLabel(role: AdminUserRole): string {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'author': return 'Author';
    default: return 'Reader';
  }
}

function roleBadge(role: AdminUserRole): string {
  switch (role) {
    case 'admin': return 'badge-published';
    case 'author': return 'badge-origin-author';
    default: return 'badge-draft';
  }
}

function UserRoleControl({ user }: { user: AdminUser }) {
  const [role, setRole] = useState<AdminUserRole>(user.role);
  const mutation = useChangeAdminUserRole();

  useEffect(() => setRole(user.role), [user.role]);

  return (
    <div className="user-role-control">
      <select value={role} onChange={(event) => setRole(event.target.value as AdminUserRole)} disabled={mutation.isPending} aria-label={'Role for ' + (user.username || user.id)}>
        <option value="reader">Reader</option>
        <option value="author">Author</option>
        <option value="admin">Administrator</option>
      </select>
      <button
        className="btn btn-small btn-outline"
        disabled={role === user.role || mutation.isPending}
        onClick={() => {
          if (window.confirm('Change ' + (user.username || 'this user') + ' from ' + roleLabel(user.role) + ' to ' + roleLabel(role) + '? This action is audited.')) {
            mutation.mutate({ userId: user.id, role });
          }
        }}
      >
        {mutation.isPending ? 'Saving…' : 'Save'}
      </button>
      {mutation.isError && <ErrorNotice error={mutation.error} />}
      {mutation.isSuccess && <span className="muted small">Updated</span>}
    </div>
  );
}
