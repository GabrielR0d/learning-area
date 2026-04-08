import api from './client'
import type { User } from '@/types'

export async function login(email: string, password: string) {
  const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>(
    '/auth/login',
    { email, password }
  )
  return res.data
}

export async function getMe() {
  const res = await api.get<User>('/auth/me')
  return res.data
}
