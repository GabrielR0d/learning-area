import axios, { AxiosInstance } from 'axios'
import { config } from '../config/config'
import { logger } from '../utils/logger'

const api: AxiosInstance = axios.create({
  baseURL: config.BACKEND_URL,
  headers: { 'x-device-key': config.DEVICE_API_KEY },
  timeout: 10000,
})

export async function postCardRead(uid: string): Promise<void> {
  try {
    const response = await api.post('/api/v1/card-reads', {
      cardUid: uid,
      direction: config.FIXED_DIRECTION,
    })
    logger.info({ uid, direction: config.FIXED_DIRECTION, eventType: response.data.eventType }, 'Card read submitted')
  } catch (err: any) {
    const status = err?.response?.status
    const message = err?.response?.data?.error ?? err?.message
    logger.error({ uid, status, message }, 'Failed to submit card read')
    throw err
  }
}

export async function sendHeartbeat(): Promise<void> {
  try {
    await api.post('/api/v1/card-reads/heartbeat')
  } catch (err) {
    logger.warn('Heartbeat failed')
  }
}
