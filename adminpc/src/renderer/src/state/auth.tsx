import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthState } from '../../../shared/types'
import { api } from '../lib/bridge'
import { queryClient } from '../lib/query-client'

type AuthContextValue = {
  /** `loading` only until the main process reports the restored session. */
  state: AuthState | { status: 'loading' }
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Holds only { id, email, username, role }. Tokens never reach the renderer.
 * This is UI gating: the backend re-checks the admin role on every admin request.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextValue['state']>({ status: 'loading' })

  useEffect(() => {
    let active = true
    api.auth.getState().then((s) => active && setState(s)).catch(() => active && setState({ status: 'signed_out' }))
    // Main pushes changes, including forced sign-out when the session expires or the role is revoked.
    const off = window.inkwell.auth.onChanged((s) => {
      if (s.status === 'signed_out') queryClient.clear() // never keep admin data around after sign-out
      setState(s)
    })
    return () => {
      active = false
      off()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(await api.auth.signIn(email, password))
  }, [])

  const signOut = useCallback(async () => {
    setState(await api.auth.signOut())
    queryClient.clear()
  }, [])

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
