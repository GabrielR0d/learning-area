import api from './client'
import type { AccessLog, DashboardSummary, DailyReport, Pagination } from '@/types'

export async function getAccessLogs(params?: Record<string, string | number>) {
  const res = await api.get<Pagination<AccessLog>>('/access-logs', { params })
  return res.data
}

export async function getSummary() {
  const res = await api.get<DashboardSummary>('/reports/summary')
  return res.data
}

export async function getDailyReport() {
  const res = await api.get<DailyReport[]>('/reports/daily')
  return res.data
}

export async function getTopClients() {
  const res = await api.get<{ client: { id: string; name: string; phone: string } | null; count: number }[]>(
    '/reports/top-clients'
  )
  return res.data
}
