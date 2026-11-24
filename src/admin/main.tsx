import { StrictMode, useCallback, useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { api, ApiError } from './api'
import Dashboard from './Dashboard'
import PostEditor from './PostEditor'
import { buttonClass, inputClass, labelClass } from './ui'
import './admin.css'

type View = { name: 'dashboard' } | { name: 'editor'; id?: string }

function Login({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const me = await api<{ username: string }>('/auth/login', 'POST', { username, password })
      onLogin(me.username)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm" aria-labelledby="login-title">
        <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-muted mb-4">Blog CMS</p>
        <h1 id="login-title" className="font-display text-4xl tracking-tighter mb-8">
          Sign in
        </h1>
        <label className="block mb-4">
          <span className={labelClass}>Username</span>
          <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label className="block mb-6">
          <span className={labelClass}>Password</span>
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && (
          <p role="alert" className="mb-4 text-[14px] text-signal">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${buttonClass} w-full bg-ink text-paper hover:bg-cobalt`}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

function AdminApp() {
  // undefined = still checking the session cookie
  const [user, setUser] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>({ name: 'dashboard' })

  const checkSession = () => {
    setError('')
    api<{ username: string }>('/auth/me')
      .then((me) => setUser(me.username))
      .catch((err) => (err instanceof ApiError && err.status === 401 ? setUser(null) : setError(err.message)))
  }
  useEffect(checkSession, [])

  // Any 401 mid-session (expired cookie) drops back to the login form.
  const onAuthError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) setUser(null)
  }, [])

  const logout = async () => {
    await api('/auth/logout', 'POST').catch(() => {})
    setUser(null)
    setView({ name: 'dashboard' })
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert">Can't reach the CMS API: {error}</p>
        <button onClick={checkSession} className={`${buttonClass} border border-ink/20 hover:border-ink`}>
          Retry
        </button>
      </main>
    )
  }
  if (user === undefined) {
    return <p className="min-h-screen flex items-center justify-center font-mono text-[11px] tracking-[0.15em] uppercase text-muted">Loading…</p>
  }
  if (user === null) return <Login onLogin={setUser} />

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <button onClick={() => setView({ name: 'dashboard' })} className="font-display text-lg tracking-tight">
            Blog CMS
          </button>
          <div className="flex items-center gap-4 font-mono text-[11px] tracking-[0.12em] uppercase">
            <a href="/blog" target="_blank" rel="noopener noreferrer" className="hover:text-cobalt">
              View blog
            </a>
            <span className="hidden sm:inline text-muted">{user}</span>
            <button onClick={logout} className="hover:text-cobalt">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {view.name === 'dashboard' ? (
          <Dashboard onEdit={(id) => setView({ name: 'editor', id })} onAuthError={onAuthError} />
        ) : (
          <PostEditor
            key={view.id ?? 'new'}
            id={view.id}
            onBack={() => setView({ name: 'dashboard' })}
            onAuthError={onAuthError}
          />
        )}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
)
