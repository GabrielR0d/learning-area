import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: User, accessToken: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: async (user, accessToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('user', JSON.stringify(user))
    set({ user, accessToken })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('user')
    set({ user: null, accessToken: null })
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken')
      const userJson = await SecureStore.getItemAsync('user')
      if (token && userJson) {
        set({ accessToken: token, user: JSON.parse(userJson) })
      }
    } catch {
      // ignore
    } finally {
      set({ isLoading: false })
    }
  },
}))
