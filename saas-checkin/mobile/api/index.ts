import api from './client'
import type { AccessLog, Client, Card, DashboardSummary, Pagination, User } from '@/types'

// Auth
export const login = (email: string, password: string) =>
  api.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', { email, password })
    .then(r => r.data)

// Dashboard
export const getSummary = () =>
  api.get<DashboardSummary>('/reports/summary').then(r => r.data)

// Access Logs
export const getAccessLogs = (params?: Record<string, string | number>) =>
  api.get<Pagination<AccessLog>>('/access-logs', { params }).then(r => r.data)

// Clients
export const getClients = (params?: Record<string, string | number>) =>
  api.get<Pagination<Client>>('/clients', { params }).then(r => r.data)

export const createClient = (data: Partial<Client>) =>
  api.post<Client>('/clients', data).then(r => r.data)

export const updateClient = (id: string, data: Partial<Client>) =>
  api.put<Client>(`/clients/${id}`, data).then(r => r.data)

// Cards
export const getCards = (params?: Record<string, string | number>) =>
  api.get<{ data: Card[] }>('/cards', { params }).then(r => r.data)

export const createCard = (data: { uid: string; label?: string; clientId?: string }) =>
  api.post<Card>('/cards', data).then(r => r.data)

export const updateCard = (id: string, data: Partial<Card>) =>
  api.put<Card>(`/cards/${id}`, data).then(r => r.data)
