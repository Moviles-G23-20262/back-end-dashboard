import type { SqlQueryRequest, SqlQueryResult } from '../types'
import { apiBase } from './config'

export async function executeRawSql(request: SqlQueryRequest): Promise<SqlQueryResult> {
  const response = await fetch(`${apiBase}/sql/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    let message = `Unable to execute SQL query (${response.status})`
    try {
      const payload = await response.json() as { message?: string | string[] }
      if (Array.isArray(payload.message)) message = payload.message.join(', ')
      else if (payload.message) message = payload.message
    } catch {
      const fallback = await response.text()
      if (fallback) message = fallback
    }
    throw new Error(message)
  }
  return response.json() as Promise<SqlQueryResult>
}
