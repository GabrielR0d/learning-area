import axios from 'axios'
import { API_URL } from '@/constants'
import { useAuthStore } from '@/stores/auth.store'

const api = axios.create({ baseURL: `${API_URL}/api/v1` })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default api
