import { useState } from 'react'
import type { FormEvent } from 'react'
import { backendLabel } from './api/config'

/** Shown instead of the dashboard until the developer provides the backend's admin key. */
export function AdminKeyGate({ rejected, onSubmit }: { rejected: boolean; onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return <div className="dashboard-shell flex min-h-screen items-center justify-center bg-[#f5f6fa] px-6 font-body text-slate-900">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">◈</div><div><div className="font-heading text-lg font-semibold">Back End</div><div className="text-xs text-slate-400">Developer console</div></div></div>
      <h1 className="font-heading text-xl font-semibold">Admin key required</h1>
      <p className="mt-2 text-sm text-slate-500">Enter the <span className="font-mono">ADMIN_API_KEY</span> of <span className="font-mono">{backendLabel}</span>. It is kept only for this browser tab.</p>
      <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500" htmlFor="admin-key">Admin key</label>
      <input id="admin-key" type="password" autoComplete="off" autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="input-field mt-2 w-full font-mono" placeholder="Paste the admin key" />
      {rejected && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">The backend rejected that key. Check it and try again.</p>}
      <button type="submit" disabled={!value.trim()} className="btn-primary mt-6 w-full disabled:opacity-50">Unlock dashboard</button>
    </form>
  </div>
}
