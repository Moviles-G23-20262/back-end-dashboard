export type MaterialCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
export type MaterialStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'
export type MaterialCategory = 'BOOKS' | 'CALCULATORS' | 'LAB_EQUIPMENT' | 'FURNITURE' | 'OTHER'
export type NotificationType = 'SMART_MATCH' | 'ORDER_PLACED' | 'OTHER'
export type AnalyticsEventType = 'LISTING_VIEW' | 'SEARCH' | 'CONTACT_SELLER' | 'WISHLIST_ADD' | 'WISHLIST_REMOVE' | 'NOTIFICATION_SENT' | 'NOTIFICATION_OPENED' | 'SMART_MATCH_SHOWN' | 'SMART_MATCH_OPENED' | 'SMART_MATCH_RESERVED' | 'EXCHANGE_CONFIRMED'
export type MeetingZoneType = 'LIBRARY' | 'STUDENT_CENTER' | 'BUILDING_LOBBY' | 'PLAZA'
export type ExchangeStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'
export type MessageType = 'TEXT' | 'MEETING'
export type MeetingProposalStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'

export interface User {
  id: string
  email: string
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
  type: MessageType
  meetingProposalId: string | null
  isRead: boolean
  createdAt: string
}

export interface Exchange {
  id: string
  orderNumber: number
  materialId: string
  buyerId: string
  sellerId: string
  price: number
  status: ExchangeStatus
  createdAt: string
  completedAt: string | null
  cancelledAt: string | null
  receivedCondition: MaterialCondition | null
  meetingPointId: string | null
  meetingStartsAt: string | null
  meetingEndsAt: string | null
  lat: number | null
  lng: number | null
}

export interface MeetingProposal {
  id: string
  chatRoomId: string
  proposerId: string
  meetingPointId: string
  startsAt: string
  endsAt: string
  status: MeetingProposalStatus
  respondedAt: string | null
  createdAt: string
}

export interface ScheduleBlock {
  id: string
  userId: string
  /** 1 = Monday ... 7 = Sunday */
  dayOfWeek: number
  /** Minutes after midnight, campus time */
  startMinute: number
  endMinute: number
  label: string | null
  createdAt: string
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

export interface Rating {
  id: string
  exchangeId: string
  raterId: string
  ratedId: string
  stars: number
  tags: string[]
  review: string | null
  createdAt: string
}

export type EntityName = 'User' | 'Material' | 'ChatRoom' | 'Message' | 'Exchange' | 'MeetingPoint' | 'MeetingProposal' | 'ScheduleBlock' | 'WishlistItem' | 'Notification' | 'AnalyticsEvent' | 'Rating'
export type Entity = User | Material | ChatRoom | Message | Exchange | MeetingPoint | MeetingProposal | ScheduleBlock | WishlistItem | Notification | AnalyticsEvent | Rating
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
