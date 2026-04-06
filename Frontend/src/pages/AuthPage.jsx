import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export const AuthPage = () => {
  const { isAuthenticated, login, register } = useAuth()
  const { pushToast } = useToast()

  const [authMode, setAuthMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  })

  if (isAuthenticated) {
    return <Navigate replace to="/app" />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)

    try {
      if (authMode === 'register') {
        await register({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        })
        setAuthMode('login')
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        })
      }
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-8 md:px-8 lg:grid-cols-2">
      <section className="order-2 rounded-3xl border border-teal-100 bg-white/70 p-7 shadow-xl backdrop-blur md:p-10 lg:order-1">
        <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
          Secure Workspace
        </p>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
          Project OS for teams that move fast.
        </h1>
        <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
          Manage projects, tasks, and notes with API-driven collaboration. This
          frontend uses cookie-based sessions and avoids local token storage.
        </p>
      </section>

      <section className="order-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl lg:order-2 lg:p-8">
        <div className="mb-6 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            className={`w-1/2 rounded-lg px-3 py-2 transition ${
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setAuthMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`w-1/2 rounded-lg px-3 py-2 transition ${
              authMode === 'register'
                ? 'bg-white text-slate-900 shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setAuthMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {authMode === 'register' && (
            <>
              <label className="grid gap-1 text-sm text-slate-700">
                Full name
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-teal-500"
                  value={form.fullName}
                  maxLength={80}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                Username
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-teal-500"
                  value={form.username}
                  maxLength={40}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </label>
            </>
          )}

          <label className="grid gap-1 text-sm text-slate-700">
            Email
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-teal-500"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            Password
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-teal-500"
              type="password"
              value={form.password}
              minLength={6}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </label>

          <button
            className="mt-1 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={busy}
            type="submit"
          >
            {busy ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  )
}
