import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/** Preferences that live on this computer only. Nothing here is sent to the backend. */
export type MotionPref = 'system' | 'full' | 'reduced'
export type DensityPref = 'comfortable' | 'compact'
export type SidebarStartup = 'remember' | 'open' | 'closed'

export interface AppSettings {
  /** Follow Windows' "reduce motion" setting, or force animations on/off. */
  motion: MotionPref
  /** Row and card spacing in tables and lists. */
  density: DensityPref
  /** What the secondary sidebar does when the app starts. */
  sidebarStartup: SidebarStartup
  /** The "Needs review" reminder card at the bottom of the sidebar. */
  showReviewCard: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  motion: 'system',
  density: 'comfortable',
  sidebarStartup: 'remember',
  showReviewCard: true
}

const KEY = 'inkwell.settings.v1'

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback

/** Reads and validates stored settings; anything missing or malformed falls back to the default. */
export function loadSettings(): AppSettings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && typeof raw === 'object') {
      const r = raw as Record<string, unknown>
      return {
        motion: pick(r.motion, ['system', 'full', 'reduced'], DEFAULT_SETTINGS.motion),
        density: pick(r.density, ['comfortable', 'compact'], DEFAULT_SETTINGS.density),
        sidebarStartup: pick(r.sidebarStartup, ['remember', 'open', 'closed'], DEFAULT_SETTINGS.sidebarStartup),
        showReviewCard: typeof r.showReviewCard === 'boolean' ? r.showReviewCard : DEFAULT_SETTINGS.showReviewCard
      }
    }
  } catch {
    /* storage unavailable or corrupt: use defaults */
  }
  return { ...DEFAULT_SETTINGS }
}

/** Puts the look-and-feel preferences on <html> so the stylesheet can react to them. */
export function applySettings(s: AppSettings): void {
  document.documentElement.dataset.motion = s.motion
  document.documentElement.dataset.density = s.density
}

/** True when animations should be skipped (explicit choice first, then the operating system). */
export function motionIsReduced(): boolean {
  const pref = document.documentElement.dataset.motion
  if (pref === 'reduced') return true
  if (pref === 'full') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type SettingsContextValue = {
  settings: AppSettings
  update: (patch: Partial<AppSettings>) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    applySettings(settings)
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* storage unavailable: settings last for this session only */
    }
  }, [settings])

  const update = useCallback((patch: Partial<AppSettings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), [])

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
