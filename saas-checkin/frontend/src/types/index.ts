export interface User {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER'
  tenantId: string | null
}

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  isActive: boolean
  createdAt: string
}

export interface Client {
  id: string
  tenantId: string
  name: string
  phone: string
  email?: string
  document?: string
  notes?: string
  isActive: boolean
  createdAt: string
  cards?: Card[]
}

export interface Card {
  id: string
  tenantId: string
  clientId?: string
  client?: Pick<Client, 'id' | 'name' | 'phone'>
  uid: string
  label?: string
  status: 'ACTIVE' | 'BLOCKED' | 'LOST'
  lastSeenAt?: string
  createdAt: string
}

export interface Device {
  id: string
  tenantId: string
  name: string
  location?: string
  apiKey: string
  isOnline: boolean
  lastHeartbeat?: string
  createdAt: string
}

export interface AccessLog {
  id: string
  tenantId: string
  clientId?: string
  cardId?: string
  deviceId?: string
  cardUid: string
  eventType: 'ENTRY' | 'EXIT' | 'UNKNOWN_CARD' | 'BLOCKED_CARD'
  direction: 'IN' | 'OUT'
  whatsappSent: boolean
  whatsappSentAt?: string
  whatsappError?: string
  occurredAt: string
  client?: Pick<Client, 'id' | 'name' | 'phone'>
  card?: Pick<Card, 'id' | 'uid' | 'label'>
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

export interface DailyReport {
  date: string
  entries: number
  exits: number
}

export interface Pagination<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
