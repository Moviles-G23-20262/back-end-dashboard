const STORAGE_KEY = 'dashboard-admin-key'
const REJECTED_EVENT = 'dashboard:admin-key-rejected'

export class AdminKeyRejectedError extends Error {
  constructor() {
    super('The backend rejected the admin key.')
    this.name = 'AdminKeyRejectedError'
  }
}

// sessionStorage on purpose: the key is typed by the developer, lives only as long as the tab,
// and is never baked into the build.
export function getAdminKey(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setAdminKey(key: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, key)
  } catch {
    // Storage unavailable (private mode): the key just won't survive a reload.
  }
}

export function clearAdminKey(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** Calls `callback` when a request was refused because of the key, so the UI can ask for it again. */
export function onAdminKeyRejected(callback: () => void): () => void {
  window.addEventListener(REJECTED_EVENT, callback)
  return () => window.removeEventListener(REJECTED_EVENT, callback)
}

/** `fetch` that sends the admin key. A 401/403 means the key is wrong: it is forgotten and the UI is told. */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const key = getAdminKey()
  if (key) headers.set('X-Admin-Key', key)

  const response = await fetch(input, { ...init, headers })
  if (response.status === 401 || response.status === 403) {
    clearAdminKey()
    window.dispatchEvent(new Event(REJECTED_EVENT))
    throw new AdminKeyRejectedError()
  }
  return response
}
