export interface User {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER'
  tenantId: string | null
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  document?: string
  isActive: boolean
  createdAt: string
  cards?: Card[]
}

export interface Card {
  id: string
  uid: string
  label?: string
  status: 'ACTIVE' | 'BLOCKED' | 'LOST'
  lastSeenAt?: string
  clientId?: string
  client?: Pick<Client, 'id' | 'name' | 'phone'>
}

export interface Device {
  id: string
  name: string
  location?: string
  isOnline: boolean
  lastHeartbeat?: string
}

export interface AccessLog {
  id: string
  cardUid: string
  eventType: 'ENTRY' | 'EXIT' | 'UNKNOWN_CARD' | 'BLOCKED_CARD'
  direction: 'IN' | 'OUT'
  occurredAt: string
  whatsappSent: boolean
  client?: Pick<Client, 'id' | 'name' | 'phone'>
  device?: Pick<Device, 'id' | 'name' | 'location'>
}

export interface DashboardSummary {
  totalClients: number
  totalCards: number
  totalDevices: number
  todayEntries: number
  todayExits: number
  unknownCards: number
}

export interface Pagination<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}
