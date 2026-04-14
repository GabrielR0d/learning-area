import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '@/constants'
import { useAuthStore } from '@/stores/auth.store'

let socket: Socket | null = null

export function useSocket(
  event: string,
  handler: (data: unknown) => void
) {
  const token = useAuthStore((s) => s.accessToken)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!token) return

    if (!socket || !socket.connected) {
      socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
      })
    }

    const cb = (data: unknown) => handlerRef.current(data)
    socket.on(event, cb)

    return () => {
      socket?.off(event, cb)
    }
  }, [token, event])
}
