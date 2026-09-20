const configuredBackendUrl = (import.meta.env.VITE_BACK_URL as string | undefined) ?? 'http://localhost:3000'

export const apiBase = (configuredBackendUrl.startsWith('http') ? configuredBackendUrl : `http://${configuredBackendUrl}`).replace(/\/+$/, '')
export const backendLabel = apiBase.replace(/^https?:\/\//, '')
