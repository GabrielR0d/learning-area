import http from 'http'
import { app } from './app'
import { initSocket } from './config/socket'
import { env } from './config/env'
import { logger } from './utils/logger'

const httpServer = http.createServer(app)
initSocket(httpServer)

httpServer.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`)
  logger.info(`Environment: ${env.NODE_ENV}`)
})

process.on('unhandledRejection', (err) => {
  logger.fatal(err, 'Unhandled rejection')
  process.exit(1)
})
