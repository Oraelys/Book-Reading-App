import { PageHeader } from '../components/ui'

interface Spec {
  title: string
  purpose: string
  /** Proposed contracts. None of these exist in the backend today. */
  endpoints: string[]
}

const SPECS: Record<string, Spec> = {
  users: {
    title: 'Users',
    purpose: 'Search users, view role/status, and see account activity.',
    endpoints: ['GET /admin/users?search=&role=&cursor=', 'GET /admin/users/:id']
  },
  authors: {
    title: 'Authors',
    purpose: 'List authors and pick an Inkwell author when importing a book (today the import form takes a raw profile UUID).',
    endpoints: ['GET /admin/authors?search=', 'GET /admin/authors/:id']
  },
  activity: {
    title: 'Activity',
    purpose: 'Recent imports, publishing events and administrative actions.',
    endpoints: ['GET /admin/activity?type=&cursor=  (the existing /activity/* routes are per-user / per-novel, not an admin feed)']
  },
  moderation: {
    title: 'Moderation',
    purpose: 'Review reported comments, books and accounts.',
    endpoints: ['GET /admin/moderation/queue', 'POST /admin/moderation/:id/resolve']
  },
  analytics: {
    title: 'Analytics',
    purpose: 'Platform-wide metrics and trends.',
    endpoints: ['GET /admin/analytics/overview  (the existing /analytics/* routes are per-reader / novel / author, not admin-wide)']
  }
}

export function Unavailable({ page }: { page: keyof typeof SPECS }) {
  const spec = SPECS[page] as Spec
  return (
    <>
      <PageHeader title={spec.title} subtitle="No admin endpoint exists for this yet" />
      <section className="card card-dashed">
        <p><span className="badge badge-gap">Backend gap</span></p>
        <p>{spec.purpose}</p>
        <p className="muted">
          The backend has no administrator-guarded route for this, so this app does not fake one or read protected tables directly.
          Suggested contract for the backend team — <strong>none of these exist today</strong>:
        </p>
        <ul className="mono-list">
          {spec.endpoints.map((e) => (
            <li key={e}><code>{e}</code></li>
          ))}
        </ul>
      </section>
    </>
  )
}
