import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { verifyAccessToken } from '../utils/jwt'
import { logger } from '../utils/logger'
import { env } from './env'

let io: Server

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string
    if (!token) return next(new Error('No token provided'))

    try {
      const payload = verifyAccessToken(token)
      socket.data.tenantId = payload.tenantId
      socket.data.userId = payload.userId
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const tenantId = socket.data.tenantId as string
    socket.join(`tenant:${tenantId}`)
    logger.info({ tenantId, socketId: socket.id }, 'Client connected')

    socket.on('disconnect', () => {
      logger.info({ tenantId, socketId: socket.id }, 'Client disconnected')
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function emitToTenant(tenantId: string, event: string, data: unknown) {
  getIO().to(`tenant:${tenantId}`).emit(event, data)
}
