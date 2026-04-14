import api from './client'
import type { Client, Pagination } from '@/types'

export async function getClients(params?: Record<string, string | number>) {
  const res = await api.get<Pagination<Client>>('/clients', { params })
  return res.data
}

export async function getClient(id: string) {
  const res = await api.get<Client>(`/clients/${id}`)
  return res.data
}

export async function createClient(data: Partial<Client>) {
  const res = await api.post<Client>('/clients', data)
  return res.data
}

export async function updateClient(id: string, data: Partial<Client>) {
  const res = await api.put<Client>(`/clients/${id}`, data)
  return res.data
}

export async function deleteClient(id: string) {
  await api.delete(`/clients/${id}`)
}
