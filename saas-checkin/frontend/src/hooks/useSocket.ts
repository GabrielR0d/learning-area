import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'

let socket: Socket | null = null

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!accessToken) return

    if (!socket) {
      socket = io('/', {
        auth: { token: accessToken },
        transports: ['websocket'],
      })
    }

    socketRef.current = socket

    return () => {
      // Don't disconnect on unmount — keep shared connection
    }
  }, [accessToken])

  return socketRef.current
}
