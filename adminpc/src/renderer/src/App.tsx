import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Spinner } from './components/ui'
import { BookReview } from './pages/BookReview'
import { BooksList } from './pages/BooksList'
import { Dashboard } from './pages/Dashboard'
import { ImportWizard } from './pages/ImportWizard'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'
import { Unavailable } from './pages/Unavailable'
import { useAuth } from './state/auth'

export function App() {
  const { state } = useAuth()

  if (state.status === 'loading') return <Spinner label="Starting…" />
  if (state.status === 'signed_out') return <Login />

  // HashRouter: the packaged app is served from file://, where history routing does not work.
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BooksList />} />
          <Route path="books/:novelId" element={<BookReview />} />
          <Route path="import" element={<ImportWizard />} />
          <Route path="users" element={<Unavailable page="users" />} />
          <Route path="authors" element={<Unavailable page="authors" />} />
          <Route path="activity" element={<Unavailable page="activity" />} />
          <Route path="moderation" element={<Unavailable page="moderation" />} />
          <Route path="analytics" element={<Unavailable page="analytics" />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
