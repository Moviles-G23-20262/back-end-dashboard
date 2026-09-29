import type { EntityName } from '../types'
import { apiBase } from './config'

const entityPaths: Record<EntityName, string> = {
  User: '/users',
  Material: '/materials',
  ChatRoom: '/chatrooms',
  Message: '/messages',
  Exchange: '/exchanges',
  MeetingPoint: '/meeting-points',
  WishlistItem: '/wishlist-items',
  Notification: '/notifications',
  AnalyticsEvent: '/analytics-events',
}


export async function listEntity<T>(entity: EntityName): Promise<T[]> {
  const response = await fetch(`${apiBase}${entityPaths[entity]}`)

  if (!response.ok) {
    let message = `Unable to load ${entity} records (${response.status})`

    try {
      const errorPayload = await response.json() as {
        message?: string | string[]
      }

      if (errorPayload.message) {
        message = Array.isArray(errorPayload.message)
          ? errorPayload.message.join(', ')
          : errorPayload.message
      }
    } catch {
      // Keep the default error message if the response is not valid JSON
    }

    throw new Error(message)
  }

  return response.json() as Promise<T[]>
}


export async function createEntity<T>(
  entity: EntityName,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${apiBase}${entityPaths[entity]}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = `Unable to create ${entity} (${response.status})`

    try {
      const errorPayload = await response.json() as {
        message?: string | string[]
      }

      if (errorPayload.message) {
        message = Array.isArray(errorPayload.message)
          ? errorPayload.message.join(', ')
          : errorPayload.message
      }
    } catch {
      // Keep the default error message if the response is not valid JSON
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function updateEntity<T>(
  entity: EntityName,
  recordId: string,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${apiBase}${entityPaths[entity]}/${recordId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = `Unable to update ${entity} (${response.status})`

    try {
      const errorPayload = await response.json() as {
        message?: string | string[]
      }

      if (errorPayload.message) {
        message = Array.isArray(errorPayload.message)
          ? errorPayload.message.join(', ')
          : errorPayload.message
      }
    } catch {
      // Keep the default error message if the response is not valid JSON
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function deleteEntity(
  entity: EntityName,
  recordId: string
): Promise<void> {
  const response = await fetch(
    `${apiBase}${entityPaths[entity]}/${recordId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    let message = `Unable to delete ${entity} (${response.status})`

    try {
      const errorPayload = await response.json() as {
        message?: string | string[]
      }

      if (errorPayload.message) {
        message = Array.isArray(errorPayload.message)
          ? errorPayload.message.join(', ')
          : errorPayload.message
      }
    } catch {
      // Keep the default error message if the response is not valid JSON
    }

    throw new Error(message)
  }
}
