import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/bridge'
import { ErrorNotice, PageHeader, Spinner } from '../components/ui'
import { formatDateTime } from '../lib/format'
import { useAuth } from '../state/auth'

export function Settings() {
  const { state } = useAuth()
  const info = useQuery({ queryKey: ['appInfo'], queryFn: api.appInfo, staleTime: Infinity })
  // GET / on the backend — the unauthenticated health check.
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, retry: false, staleTime: 0, refetchOnWindowFocus: false })
  const user = state.status === 'signed_in' ? state.user : null

  return (
    <>
      <PageHeader title="Settings" subtitle="Application, session and backend status" />

      <section className="card">
        <div className="row between">
          <h2>Backend status</h2>
          <button className="btn btn-small" onClick={() => void health.refetch()} disabled={health.isFetching}>
            {health.isFetching ? 'Checking…' : 'Check again'}
          </button>
        </div>
        {health.isPending ? (
          <Spinner label="Contacting backend… (a sleeping server can take a minute)" />
        ) : health.error ? (
          <ErrorNotice error={health.error} />
        ) : (
          <dl className="kv">
            <dt>Status</dt>
            <dd><span className={`badge ${health.data.status === 'ok' ? 'badge-published' : 'badge-unpublished'}`}>{health.data.status ?? `HTTP ${health.data.httpStatus}`}</span></dd>
            <dt>Service</dt><dd>{health.data.service ?? '—'}</dd>
            <dt>Response time</dt><dd>{health.data.latencyMs} ms</dd>
            <dt>Server time</dt><dd>{formatDateTime(health.data.timestamp)}</dd>
          </dl>
        )}
      </section>

      <section className="card">
        <h2>Application</h2>
        {!info.data ? (
          <Spinner />
        ) : (
          <dl className="kv">
            <dt>Application</dt><dd>{info.data.name} {info.data.version}</dd>
            <dt>Environment</dt><dd>{info.data.environment}</dd>
            <dt>API host</dt><dd>{info.data.apiHost}</dd>
            <dt>Platform</dt><dd>{info.data.platform}</dd>
            <dt>Signed in as</dt><dd>{user?.email}</dd>
            <dt>Role</dt><dd>{user?.role}</dd>
          </dl>
        )}
        <p className="muted small">
          The API URL is fixed at build time (see .env.example). Administrator access is enforced by the backend on every request; this screen only reflects your session.
        </p>
      </section>
    </>
  )
}
