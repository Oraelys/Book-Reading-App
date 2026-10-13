import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { lifecycleOf } from '../../../shared/lifecycle'
import { useBooks } from '../queries/books'
import { useAuth } from '../state/auth'
import { Icon, type IconName } from './Icon'
import { LibraryTree } from './LibraryTree'
import { WindowControls } from './WindowControls'

/** Rail = every top-level module. Items after the divider have no backend endpoint yet (BACKEND GAP). */
const RAIL: { to: string; label: string; icon: IconName; end?: boolean; gap?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/books', label: 'Imported books', icon: 'book' },
  { to: '/import', label: 'Import book', icon: 'upload' },
  { to: '/users', label: 'Users — backend gap', icon: 'users', gap: true },
  { to: '/authors', label: 'Authors — backend gap', icon: 'pen', gap: true },
  { to: '/activity', label: 'Activity — backend gap', icon: 'activity', gap: true },
  { to: '/moderation', label: 'Moderation — backend gap', icon: 'shield', gap: true },
  { to: '/analytics', label: 'Analytics — backend gap', icon: 'chart', gap: true }
]

function SideLink({ to, icon, label, count, prefix }: { to: string; icon: IconName; label: string; count?: number; prefix?: boolean }) {
  const loc = useLocation()
  const [path = '/', query = ''] = to.split('?')
  const wantSearch = query ? `?${query}` : ''
  const active = (prefix ? loc.pathname.startsWith(path) : loc.pathname === path) && loc.search === wantSearch
  return (
    <Link to={to} className={`side-link${active ? ' active' : ''}`}>
      <Icon name={icon} size={18} />
      <span>{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </Link>
  )
}

const readCollapsed = (): boolean => {
  try {
    return localStorage.getItem('inkwell.sidebar.collapsed') === '1'
  } catch {
    return false
  }
}

export function Shell() {
  const { state, signOut } = useAuth()
  const user = state.status === 'signed_in' ? state.user : null
  const { data } = useBooks()
  const books = data ?? []
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [menu, setMenu] = useState(false)
  const [libraryQuery, setLibraryQuery] = useState('')

  const count = (l: 'draft' | 'published' | 'unpublished') => books.filter((b) => lifecycleOf(b) === l).length
  const displayName = user?.username ?? user?.email.split('@')[0] ?? 'Admin'

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem('inkwell.sidebar.collapsed', c ? '0' : '1')
      } catch {
        /* storage unavailable: keep in memory */
      }
      return !c
    })

  return (
    <div className="app-frame">
      <div className="drag-strip" />

      <aside className="rail" aria-label="Modules">
        <div className="rail-capsule rail-main">
          <nav className="rail-pill">
            <span className="rail-logo" aria-hidden><Icon name="feather" size={20} /></span>
            {RAIL.map((item, i) => (
              <div key={item.to} className="rail-item">
                {item.gap && !RAIL[i - 1]?.gap && <span className="rail-sep" />}
                <NavLink to={item.to} end={item.end} title={item.label} aria-label={item.label} className={({ isActive }) => `rail-btn${isActive ? ' active' : ''}${item.gap ? ' dim' : ''}`}>
                  <Icon name={item.icon} size={19} />
                </NavLink>
              </div>
            ))}
          </nav>
          {/* <span className="rail-label">Admin nav</span> */}
        </div>
        <div className="rail-capsule rail-settings">
          <span className="rail-label">Inkwell settings</span>
          <div className="rail-pill rail-pill-single">
            <NavLink to="/settings" title="Settings" aria-label="Settings" className={({ isActive }) => `rail-btn${isActive ? ' active' : ''}`}>
              <Icon name="sliders" size={19} />
            </NavLink>
          </div>
        </div>
      </aside>

      <div className={`panel${collapsed ? ' collapsed' : ''}`}>
        {!collapsed && (
          <aside className="sidebar">
            <div className="sidebar-top drag">
              <WindowControls />
              <button className="icon-btn no-drag" onClick={toggle} aria-label="Hide sidebar" title="Hide sidebar">
                <Icon name="panel" size={16} />
              </button>
            </div>

            <div className="user-block no-drag">
              <button className="user-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                <span className="avatar" aria-hidden>{displayName.slice(0, 1).toUpperCase()}</span>
                <span className="user-text">
                  <strong>{displayName} <Icon name="chevronDown" size={13} /></strong>
                  <span className="muted small">{user?.email}</span>
                </span>
              </button>
              {menu && (
                <div className="menu" role="menu">
                  <button role="menuitem" onClick={() => void signOut()}>Sign out</button>
                </div>
              )}
            </div>

            <div className="side-scroll">
              <div className="side-label">Books</div>
              <SideLink to="/" icon="list" label="Dashboard" />
              <SideLink to="/books" icon="library" label="Imported books" count={books.length} prefix />
              <SideLink to="/import" icon="upload" label="Import book" />

              <div className="side-sep" />
              <div className="side-label">Status</div>
              <SideLink to="/books?status=draft" icon="file" label="Draft" count={count('draft')} />
              <SideLink to="/books?status=published" icon="checkCircle" label="Published" count={count('published')} />
              <SideLink to="/books?status=unpublished" icon="eyeOff" label="Unpublished" count={count('unpublished')} />

              <div className="side-sep" />
              <div className="side-label">History</div>
              <SideLink to="/books?sort=created" icon="clock" label="Recently imported" />
            </div>

            <div className="side-sep" />
            <div className="library-head">
              <span className="side-label">Library</span>
              <Link to="/import" className="icon-btn" aria-label="Import a book" title="Import a book"><Icon name="plus" size={15} /></Link>
            </div>
            <label className="search-inset">
              <Icon name="search" size={16} />
              <input type="search" placeholder="Search" value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} aria-label="Search library" />
            </label>
            <LibraryTree books={books} query={libraryQuery} />
          </aside>
        )}

        <main className="main">
          {collapsed && (
            <div className="floating-top drag">
              <WindowControls />
              <button className="icon-btn no-drag" onClick={toggle} aria-label="Show sidebar" title="Show sidebar">
                <Icon name="panel" size={16} />
              </button>
            </div>
          )}
          <div className={`content${collapsed ? ' content-collapsed' : ''}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
