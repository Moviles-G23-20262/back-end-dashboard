import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { createEntity, deleteEntity, listEntity, updateEntity } from './api/entities'
import { backendLabel } from './api/config'
import { getRouteMetadata } from './api/metadata'
import { executeRawSql } from './api/rawSql'
import type { ChatRoom, EntityName, Material, Message, RouteMetadata, SqlQueryResult, User } from './types'

type Tab = 'overview' | 'data' | 'routes' | 'sql'
type Entity = User | Material | ChatRoom | Message
type BackendStatus = 'checking' | 'connected' | 'unavailable'
type FormValues = Record<string, string>
type Theme = 'light' | 'dark'

const labels: Record<EntityName, string> = { User: 'Users', Material: 'Materials', ChatRoom: 'Chat rooms', Message: 'Messages' }
const entityHeaders: Record<EntityName, string[]> = {
  User: ['id', 'email', 'fullName', 'major', 'faculty', 'rating', 'createdAt'],
  Material: ['id', 'title', 'courseCode', 'price', 'condition', 'status', 'sellerId', 'createdAt'],
  ChatRoom: ['id', 'materialId', 'buyerId', 'sellerId', 'createdAt'],
  Message: ['id', 'chatRoomId', 'senderId', 'content', 'isRead', 'createdAt'],
}
const methodStyles: Record<string, string> = { GET: 'bg-blue-100 text-blue-700', POST: 'bg-emerald-100 text-emerald-700', PUT: 'bg-amber-100 text-amber-700', PATCH: 'bg-violet-100 text-violet-700', DELETE: 'bg-red-100 text-red-700' }

const formFields: Record<EntityName, Array<{ key: string; label: string; type?: string; required?: boolean }>> = {
  User: [
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'passwordHash', label: 'Password hash', required: true },
    { key: 'fullName', label: 'Full name', required: true },
    { key: 'major', label: 'Major', required: true },
    { key: 'faculty', label: 'Faculty', required: true },
    { key: 'rating', label: 'Rating', type: 'number' },
  ],
  Material: [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: true },
    { key: 'courseCode', label: 'Course code', required: true },
    { key: 'price', label: 'Price', type: 'number', required: true },
    { key: 'condition', label: 'Condition', required: true },
    { key: 'status', label: 'Status' },
    { key: 'imageUrls', label: 'Image URLs (comma separated)' },
    { key: 'sellerId', label: 'Seller ID', required: true },
  ],
  ChatRoom: [
    { key: 'materialId', label: 'Material ID', required: true },
    { key: 'buyerId', label: 'Buyer ID', required: true },
    { key: 'sellerId', label: 'Seller ID', required: true },
  ],
  Message: [
    { key: 'chatRoomId', label: 'Chat room ID', required: true },
    { key: 'senderId', label: 'Sender ID', required: true },
    { key: 'content', label: 'Content', required: true },
    { key: 'isRead', label: 'Read', type: 'checkbox' },
  ],
}

function toFormValues(entity: EntityName, row: Entity): FormValues {
  const values: FormValues = {}
  for (const field of formFields[entity]) {
    const value = row[field.key as keyof Entity]
    values[field.key] = field.type === 'checkbox' ? String(Boolean(value)) : value == null ? '' : Array.isArray(value) ? value.join(', ') : String(value)
  }
  return values
}

function toApiPayload(entity: EntityName, values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const field of formFields[entity]) {
    const value = values[field.key] ?? ''
    if (entity === 'User' && field.key === 'passwordHash' && value === '') continue
    if (field.type === 'checkbox') payload[field.key] = value === 'true'
    else if (field.key === 'price') payload[field.key] = value
    else if (field.type === 'number') payload[field.key] = value === '' ? undefined : Number(value)
    else if (field.key === 'imageUrls') payload[field.key] = value.split(',').map((item) => item.trim()).filter(Boolean)
    else payload[field.key] = value
  }
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem('dashboard-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })
  const [tab, setTab] = useState<Tab>('overview')
  const [entity, setEntity] = useState<EntityName>('User')
  const [records, setRecords] = useState<Record<EntityName, Entity[]>>({ User: [], Material: [], ChatRoom: [], Message: [] })
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('SELECT * FROM "Material" LIMIT 20;')
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null)
  const [executedQuery, setExecutedQuery] = useState('')
  const [queryRunning, setQueryRunning] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')
  const [routes, setRoutes] = useState<RouteMetadata[]>([])
  const [routesError, setRoutesError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<FormValues>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deletingRecords = useRef(new Set<string>())
  const rows = useMemo(() => records[entity].filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [records, entity, search])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('dashboard-theme', theme)
  }, [theme])

  const loadRecords = async () => {
    setLoading(true)
    setError('')
    setBackendStatus('checking')
    try {
      const [users, materials, chatRooms, messages] = await Promise.all([
        listEntity<User>('User'),
        listEntity<Material>('Material'),
        listEntity<ChatRoom>('ChatRoom'),
        listEntity<Message>('Message'),
      ])
      setRecords({ User: users, Material: materials, ChatRoom: chatRooms, Message: messages })
      setBackendStatus('connected')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load backend records')
      setBackendStatus('unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadRecords() }, [])
  useEffect(() => {
    void getRouteMetadata()
      .then(setRoutes)
      .catch((loadError: unknown) => setRoutesError(loadError instanceof Error ? loadError.message : 'Unable to load backend routes'))
  }, [])

  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }
  const deleteRecord = async (id: string) => {
    const deleteKey = `${entity}:${id}`
    if (deletingRecords.current.has(deleteKey)) return
    deletingRecords.current.add(deleteKey)
    setDeletingId(id)
    try {
      await deleteEntity(entity, id)
      setRecords((current) => ({ ...current, [entity]: current[entity].filter((row) => row.id !== id) }))
      notify(`${entity} record deleted`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Unable to delete ${entity}`)
    } finally {
      deletingRecords.current.delete(deleteKey)
      setDeletingId(null)
    }
  }
  const openCreateForm = () => {
    setEditingId(null)
    setFormValues({})
    setFormOpen(true)
  }
  const openEditForm = (id: string) => {
    const row = records[entity].find((item) => item.id === id)
    if (!row) return
    setEditingId(id)
    setFormValues(toFormValues(entity, row))
    setFormOpen(true)
  }
  const saveRecord = async () => {
    setSaving(true)
    try {
      const payload = toApiPayload(entity, formValues)
      if (editingId) {
        const updated = await updateEntity<Entity>(entity, editingId, payload)
        setRecords((current) => ({ ...current, [entity]: current[entity].map((item) => item.id === editingId ? updated : item) }))
        notify(`${entity} record updated`)
      } else {
        const created = await createEntity<Entity>(entity, payload)
        setRecords((current) => ({ ...current, [entity]: [created, ...current[entity]] }))
        notify(`${entity} record created`)
      }
      setFormOpen(false)
    } catch (saveError) {
      console.log(saveError)
      setError(saveError instanceof Error ? saveError.message : `Unable to save ${entity}`)
    } finally {
      setSaving(false)
    }
  }
  const runQuery = async () => {
    if (!query.trim()) {
      setError('Enter a SQL query before running it.')
      return
    }
    setQueryRunning(true)
    setError('')
    try {
      const normalizedQuery = query.trim().replace(/\r?\n/g, ' ')
      setQueryResult(await executeRawSql({ query: normalizedQuery }))
      setExecutedQuery(normalizedQuery)
    } catch (queryError) {
      setQueryResult(null)
      setError(queryError instanceof Error ? queryError.message : 'Unable to execute SQL query')
    } finally {
      setQueryRunning(false)
    }
  }

  return <div className="dashboard-shell min-h-screen bg-[#f5f6fa] font-body text-slate-900">
    <aside className="dashboard-sidebar fixed inset-y-0 left-0 z-10 flex w-[250px] flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-10 flex items-center gap-3 px-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-200">◈</div><div><div className="font-heading text-lg font-semibold">Backoffice</div><div className="text-xs text-slate-400">Developer console</div></div></div>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</div>
      <nav className="space-y-1">{([['overview', '⌂', 'Overview'], ['data', '▦', 'Database'], ['routes', '↔', 'API routes'], ['sql', '⌘', 'SQL console']] as const).map(([key, icon, label]) => <button key={key} onClick={() => setTab(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${tab === key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><span className="text-[18px]">{icon}</span>{label}{key === 'routes' && <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{routes.length || '—'}</span>}</button>)}</nav>
      <div className="status-panel mt-auto rounded-2xl bg-slate-900 p-4 text-white"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">Backend status</span><span className={`h-2 w-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-400' : backendStatus === 'checking' ? 'bg-amber-400' : 'bg-red-400'}`} /></div><div className="break-all font-mono text-[11px] text-slate-400">{backendLabel} · {backendStatus}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className={`h-full rounded-full transition-all ${backendStatus === 'connected' ? 'w-full bg-emerald-400' : backendStatus === 'checking' ? 'w-1/2 bg-amber-400' : 'w-1/4 bg-red-400'}`} /></div><div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>{backendStatus === 'connected' ? 'API reachable' : backendStatus === 'checking' ? 'Checking API' : 'Request failed'}</span><span>{backendStatus === 'connected' ? 'healthy' : 'attention needed'}</span></div></div>
    </aside>
    <main className="ml-[250px] min-h-screen"><header className="dashboard-header flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-10"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Developer admin</p><h1 className="font-heading text-2xl font-semibold">{tab === 'overview' ? 'Good morning, team' : tab === 'data' ? 'Database explorer' : tab === 'routes' ? 'API route inspector' : 'Raw SQL console'}</h1></div><div className="flex items-center gap-4"><input aria-label="Search records" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records..." className="theme-input w-56 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /><button type="button" className="theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '☾ Dark' : '☀ Light'}</button><div className="h-9 w-9 rounded-full bg-indigo-100 pt-2 text-center text-xs font-bold text-indigo-700">DT</div></div></header><div className="p-10">{notice && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}{loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">Loading records from {backendLabel}...</div> : tab === 'overview' ? <Overview records={records} routeCount={routes.length} setTab={setTab} /> : tab === 'data' ? <DatabaseView entity={entity} setEntity={setEntity} rows={rows} onRefresh={() => void loadRecords()} onAdd={openCreateForm} editRecord={openEditForm} deleteRecord={deleteRecord} deletingId={deletingId} /> : tab === 'routes' ? <RoutesView routes={routes} error={routesError} />         : <SqlView query={query} setQuery={setQuery} queryResult={queryResult} queryRunning={queryRunning} executedQuery={executedQuery} runQuery={() => void runQuery()} />}{formOpen && <EntityForm entity={entity} values={formValues} editing={Boolean(editingId)} saving={saving} records={records} onChange={(key, value) => setFormValues((current) => ({ ...current, [key]: value }))} onCancel={() => setFormOpen(false)} onSubmit={() => void saveRecord()} />}</div>{error && <div role="alert" className="global-error-alert flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" aria-label="Close error message" onClick={() => setError('')} className="shrink-0 text-lg font-semibold leading-none text-red-500 hover:text-red-700">×</button></div>}</main>
  </div>
}

function Overview({ records, routeCount, setTab }: { records: Record<EntityName, Entity[]>; routeCount: number; setTab: (tab: Tab) => void }) {
  const totalRecords = Object.values(records).reduce((total, values) => total + values.length, 0)
  const activeListings = records.Material.filter((record) => 'status' in record && record.status === 'AVAILABLE').length
  const unreadMessages = records.Message.filter((record) => 'isRead' in record && !record.isRead).length
  const stats = [['Total records', totalRecords.toString(), 'from backend', '▦'], ['Active listings', activeListings.toString(), 'current', '◇'], ['Unread messages', unreadMessages.toString(), 'current', '◌'], ['API routes', routeCount.toString(), 'from backend', '↗']]
  return <div className="space-y-8"><section className="grid grid-cols-4 gap-5">{stats.map(([label, value, delta, icon], index) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${index === 2 ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{icon}</span></div><div className="flex items-end gap-3"><span className="font-heading text-3xl font-semibold">{value}</span><span className="mb-1 text-xs font-semibold text-slate-400">{delta}</span></div><div className="mt-2 text-xs text-slate-400">Current backend value</div></div>)}</section><section className="grid grid-cols-[1.4fr_1fr] gap-5"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-heading text-xl font-semibold">Backend data summary</h2><p className="mt-1 text-sm text-slate-400">Counts loaded from the live API</p><div className="mt-6 space-y-4">{(Object.keys(records) as EntityName[]).map((name) => <div key={name} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm"><span className="text-slate-500">{labels[name]}</span><span className="font-semibold">{records[name].length} records</span></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-heading text-xl font-semibold">Quick actions</h2><p className="mt-1 text-sm text-slate-400">Common developer workflows</p><div className="mt-6 space-y-3">{[['▦', 'Browse database', 'Inspect and manage records', 'data'], ['↔', 'Inspect API routes', 'Review registered endpoints', 'routes'], ['⌘', 'Run a SQL query', 'Query the development database', 'sql']].map(([icon, title, description, target]) => <button key={title} onClick={() => setTab(target as Tab)} className="flex w-full items-center gap-4 rounded-xl border border-slate-100 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-indigo-600">{icon}</span><span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-slate-400">{description}</span></span><span className="ml-auto text-slate-300">→</span></button>)}</div></div></section></div>
}

function EntityForm({ entity, values, editing, saving, records, onChange, onCancel, onSubmit }: { entity: EntityName; values: FormValues; editing: boolean; saving: boolean; records: Record<EntityName, Entity[]>; onChange: (key: string, value: string) => void; onCancel: () => void; onSubmit: () => void }) {
  const fields = formFields[entity]
  const options: Record<string, string[]> = {
    condition: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'],
    status: ['AVAILABLE', 'RESERVED', 'SOLD'],
    sellerId: records.User.map((record) => record.id),
    buyerId: records.User.map((record) => record.id),
    senderId: records.User.map((record) => record.id),
    materialId: records.Material.map((record) => record.id),
    chatRoomId: records.ChatRoom.map((record) => record.id),
  }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-6"><form onSubmit={(event) => { event.preventDefault(); onSubmit() }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{editing ? 'Update record' : 'Create record'}</p><h2 className="mt-1 font-heading text-2xl font-semibold">{labels[entity]}</h2></div><button type="button" onClick={onCancel} className="text-xl text-slate-400 hover:text-slate-700">×</button></div><div className="grid grid-cols-2 gap-4">{fields.map((field) => <label key={field.key} className={field.type === 'checkbox' ? 'col-span-2 flex items-center gap-3 text-sm font-medium' : 'block'}>{field.type === 'checkbox' ? <input type="checkbox" checked={values[field.key] === 'true'} onChange={(event) => onChange(field.key, String(event.target.checked))} /> : <><span className="mb-1.5 block text-xs font-semibold text-slate-500">{field.label}</span>{options[field.key] ? <select required={field.required} value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"><option value="">Select {field.label.toLowerCase()}</option>{options[field.key].map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={field.required} type={field.type ?? 'text'} value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />}</>}</label>)}</div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onCancel} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create record'}</button></div></form></div>
}

function DatabaseView({ entity, setEntity, rows, onRefresh, onAdd, editRecord, deleteRecord, deletingId }: { entity: EntityName; setEntity: (entity: EntityName) => void; rows: Entity[]; onRefresh: () => void; onAdd: () => void; editRecord: (id: string) => void; deleteRecord: (id: string) => void; deletingId: string | null }) {
  const headers = entityHeaders[entity]
  return <div className="space-y-6"><div className="flex items-end justify-between"><div><h2 className="font-heading text-2xl font-semibold">Tables</h2><p className="mt-1 text-sm text-slate-400">Manage records from your Prisma schema</p></div><div className="flex gap-3"><button onClick={onRefresh} className="btn-secondary">↻ Refresh</button><button onClick={onAdd} className="btn-primary">＋ Add {entity}</button></div></div><div className="flex gap-2 border-b border-slate-200">{(Object.keys(labels) as EntityName[]).map((name) => <button key={name} onClick={() => setEntity(name)} className={`border-b-2 px-4 py-3 text-sm font-semibold ${entity === name ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'}`}>{labels[name]}{entity === name && <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">{rows.length}</span>}</button>)}</div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr>{headers.map((header) => <th key={header} className="px-5 py-4 font-semibold">{header.replace(/([A-Z])/g, ' $1')}</th>)}<th className="px-5 py-4 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id} className="hover:bg-slate-50">{headers.map((header) => <td key={header} className="max-w-[260px] truncate px-5 py-4 text-slate-600">{header === 'status' || header === 'condition' ? <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{String(row[header as keyof Entity])}</span> : header === 'rating' ? `★ ${String(row[header as keyof Entity])}` : header === 'price' ? `$${Number(row[header as keyof Entity]).toFixed(2)}` : header.endsWith('At') ? new Date(String(row[header as keyof Entity])).toLocaleDateString() : String(row[header as keyof Entity])}</td>)}<td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><button type="button" aria-label={`Edit ${entity} record`} onClick={() => editRecord(row.id)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100">✎ Edit</button><button type="button" aria-label={`Delete ${entity} record`} disabled={deletingId === row.id} onClick={() => void deleteRecord(row.id)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">{deletingId === row.id ? 'Deleting...' : '🗑 Delete'}</button></div></td></tr>)}</tbody></table></div>{rows.length === 0 && <div className="flex flex-col items-center justify-center gap-4 p-12 text-center"><p className="text-sm text-slate-400">No records exist yet for {labels[entity]}.</p><button type="button" onClick={onAdd} className="btn-primary">＋ Add first {entity}</button></div>}<div className="flex justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-400"><span>Showing {rows.length} records</span><span>Schema: public · {entity}</span></div></div></div>
}

function RoutesView({ routes, error }: { routes: RouteMetadata[]; error: string }) {
  const [method, setMethod] = useState('ALL')
  const filtered = routes.filter((route) => method === 'ALL' || route.method === method)
  return <div className="space-y-6"><div className="flex items-end justify-between"><div><h2 className="font-heading text-2xl font-semibold">Registered routes</h2><p className="mt-1 text-sm text-slate-400">Live NestJS endpoint metadata from Swagger</p></div><div className="flex gap-2">{['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => <button key={value} onClick={() => setMethod(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${method === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}>{value}</button>)}</div></div>{error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><div className="font-semibold">Swagger route metadata is unavailable</div><div className="mt-1 font-mono text-xs">{error}</div><p className="mt-3 text-xs">The backend must expose <code>/api-json</code> for this view to display live routes.</p></div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{filtered.map((route) => <div key={`${route.method}-${route.path}`} className="flex items-center gap-5 border-b border-slate-100 px-6 py-5 last:border-0"><span className={`w-16 rounded-md px-2 py-1.5 text-center text-[10px] font-bold ${methodStyles[route.method]}`}>{route.method}</span><div className="min-w-[230px] font-mono text-sm font-medium">{route.path}</div><div className="flex-1"><div className="text-sm font-semibold">{route.summary || 'No summary provided'}</div><div className="mt-1 text-xs text-slate-400">{route.controller}{route.payload && ` · ${route.payload}`}</div></div><span className="text-xs text-emerald-600">● active</span></div>)}</div>}</div>
}

function SqlView({ query, setQuery, queryResult, queryRunning, executedQuery, runQuery }: { query: string; setQuery: (query: string) => void; queryResult: SqlQueryResult | null; queryRunning: boolean; executedQuery: string; runQuery: () => void }) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      runQuery()
    }
  }
  return <div className="sql-view space-y-6"><div><h2 className="font-heading text-2xl font-semibold">Raw SQL console</h2><p className="mt-1 text-sm text-slate-400">Execute SQL directly against the development database.</p><div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-800">Supports row-returning statements such as SELECT, WITH, SHOW, EXPLAIN, VALUES, TABLE, and statements with RETURNING. INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, and other non-row statements are also supported. Comments, semicolons, and empty-query validation are handled by the backend.</div></div><div className="sql-console overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg"><div className="flex items-center justify-between border-b border-slate-700 px-5 py-3"><div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div><span className="font-mono text-[11px] text-slate-500">query.sql</span><span className="text-[11px] text-slate-500">Ctrl/Cmd + Enter to run</span></div><textarea value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} className="sql-editor h-48 w-full resize-none bg-slate-900 p-6 font-mono text-sm leading-7 text-slate-200 outline-none" spellCheck={false} /><div className="flex items-center justify-between border-t border-slate-700 px-5 py-3"><span className="font-mono text-xs text-slate-500">PostgreSQL · read/write enabled</span><button onClick={runQuery} disabled={queryRunning} className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">{queryRunning ? 'Running...' : '▶ Run query'}</button></div></div>{queryResult && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-semibold">Query results</h3><p className="mt-1 text-xs text-slate-400">{queryResult.rowCount} affected/returned rows · {queryResult.durationMs}ms</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">Success</span></div><div className="border-b border-slate-100 bg-slate-50 px-5 py-3 font-mono text-xs text-slate-500">{executedQuery}</div>{queryResult.columns.length === 0 ? <div className="p-8 text-sm text-slate-500">{queryResult.rowCount === 0 ? 'The query executed successfully, but the database returned no rows.' : 'Statement executed successfully. No row columns were returned.'}</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr>{queryResult.columns.map((column) => <th key={column} className="px-5 py-3 font-semibold">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{queryResult.rows.length === 0 ? <tr><td colSpan={queryResult.columns.length} className="px-5 py-8 text-center text-sm text-slate-500">The query returned no rows.</td></tr> : queryResult.rows.map((row, rowIndex) => <tr key={rowIndex}>{queryResult.columns.map((column) => <td key={column} className="px-5 py-3 font-mono text-xs text-slate-600">{row[column] == null ? 'NULL' : String(row[column])}</td>)}</tr>)}</tbody></table></div>}</div>}</div>
}

export default App