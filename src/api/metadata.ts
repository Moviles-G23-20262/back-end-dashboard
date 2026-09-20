import type { RouteMetadata } from '../types'
import { apiBase } from './config'

type SwaggerOperation = {
  operationId?: string
  tags?: string[]
  summary?: string
  description?: string
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: { $ref?: string }
      }
    }
  }
}

type SwaggerDocument = {
  paths?: Record<string, Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', SwaggerOperation>>>
}

export async function getRouteMetadata(): Promise<RouteMetadata[]> {
  const response = await fetch(`${apiBase}/api-json`)
  if (!response.ok) throw new Error(`Unable to load Swagger JSON (${response.status})`)

  const document = await response.json() as SwaggerDocument
  return Object.entries(document.paths ?? {}).flatMap(([path, operations]) =>
    Object.entries(operations).flatMap(([method, operation]) => {
      if (!operation) return []
      const operationId = operation.operationId ?? ''
      const controller = operation.tags?.[0] ?? operationId.split('_')[0] ?? 'UnknownController'
      const payload = operation.requestBody?.content?.['application/json']?.schema?.$ref?.split('/').pop()
      return [{
        path,
        method: method.toUpperCase() as RouteMetadata['method'],
        controller,
        summary: operation.summary ?? operation.description ?? operationId,
        payload,
      }]
    }),
  )
}
