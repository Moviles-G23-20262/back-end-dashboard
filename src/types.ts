export type MaterialCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
export type MaterialStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'

export interface User {
  id: string
  email: string
  passwordHash: string
  fullName: string
  major: string
  faculty: string
  rating: number
  createdAt: string
}

export interface Material {
  id: string
  title: string
  description: string
  courseCode: string
  price: number
  condition: MaterialCondition
  status: MaterialStatus
  imageUrls: string[]
  sellerId: string
}

export interface ChatRoom {
  id: string
  materialId: string
  buyerId: string
  sellerId: string
  createdAt: string
}

export interface Message {
  id: string
  chatRoomId: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
}

export type EntityName = 'User' | 'Material' | 'ChatRoom' | 'Message'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RouteMetadata {
  path: string
  method: HttpMethod
  controller: string
  summary: string
  payload?: string
}

export interface SqlQueryRequest {
  query: string
}

export interface SqlQueryResult {
  columns: string[]
  rows: Array<Record<string, string | number | boolean | null>>
  rowCount: number
  durationMs: number
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}