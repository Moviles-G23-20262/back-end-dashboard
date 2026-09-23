export type MaterialCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
export type MaterialStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'
export type MaterialCategory = 'BOOKS' | 'CALCULATORS' | 'LAB_EQUIPMENT' | 'FURNITURE' | 'OTHER'
export type NotificationType = 'SMART_MATCH' | 'OTHER'
export type MeetingZoneType = 'LIBRARY' | 'STUDENT_CENTER' | 'BUILDING_LOBBY' | 'PLAZA'
export type AnalyticsEventType = 'LISTING_VIEW' | 'SEARCH' | 'CONTACT_SELLER' | 'WISHLIST_ADD' | 'WISHLIST_REMOVE' | 'NOTIFICATION_SENT' | 'NOTIFICATION_OPENED'

export interface User {
  id: string
  email: string
  passwordHash: string
  fullName: string
  major: string
  faculty: string | null
  rating: number
  createdAt: string
}

export interface Material {
  id: string
  title: string
  description: string
  courseCode: string | null
  price: number
  condition: MaterialCondition | null
  status: MaterialStatus
  imageUrls: string[]
  sellerId: string
  edition: string | null
  model: string | null
  category: MaterialCategory
  createdAt: string
  updatedAt: string
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

export interface Exchange {
  id: string
  materialId: string
  buyerId: string
  sellerId: string
  price: number
  completedAt: string
  meetingPointId: string | null
  lat: number | null
  lng: number | null
}

export interface MeetingPoint {
  id: string
  name: string
  detail: string | null
  zoneType: MeetingZoneType
  isMonitored: boolean
  lat: number
  lng: number
  createdAt: string
}

export interface BusinessQuestionQuery {
  id: string
  label: string
  sql: string
}

export interface WishlistItem {
  id: string
  userId: string
  materialId: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  materialId: string | null
  type: NotificationType
  sentAt: string
  openedAt: string | null
}

export interface AnalyticsEvent {
  id: string
  userId: string | null
  materialId: string | null
  eventType: AnalyticsEventType
  metadata: Record<string, unknown> | null
  occurredAt: string
}

export type EntityName = 'User' | 'Material' | 'ChatRoom' | 'Message' | 'Exchange' | 'WishlistItem' | 'Notification' | 'AnalyticsEvent'
export type Entity = User | Material | ChatRoom | Message | Exchange | WishlistItem | Notification | AnalyticsEvent
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