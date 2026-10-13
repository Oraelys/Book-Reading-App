import { useState, type FormEvent } from 'react'
import { AppError } from '../../../shared/errors'
import { Icon } from '../components/Icon'
import { WindowControls } from '../components/WindowControls'
import { useAuth } from '../state/auth'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-frame login-frame">
      <div className="drag-strip drag-strip-tall" />
      <div className="login-controls"><WindowControls /></div>
      <form className="login-card" onSubmit={(e) => void submit(e)}>
        <span className="login-mark" aria-hidden><Icon name="feather" size={22} /></span>
        <h1>Inkwell Admin</h1>
        <p className="muted">Sign in with your administrator account.</p>
        <label>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-wide" disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
