import { config } from './config/config'
import { SerialReader } from './readers/serial.reader'
import { HidReader } from './readers/hid.reader'
import { postCardRead, sendHeartbeat } from './services/api.service'
import { logger } from './utils/logger'

async function bootstrap() {
  logger.info('=== RFID Card Reader Client ===')
  logger.info(`Backend: ${config.BACKEND_URL}`)
  logger.info(`Reader type: ${config.READER_TYPE}`)
  logger.info(`Fixed direction: ${config.FIXED_DIRECTION}`)

  const reader =
    config.READER_TYPE === 'HID'
      ? new HidReader(config.HID_VENDOR_ID, config.HID_PRODUCT_ID)
      : new SerialReader(config.SERIAL_PORT, config.SERIAL_BAUD_RATE)

  reader.onCardRead(async (uid) => {
    try {
      await postCardRead(uid)
    } catch {
      // error already logged in api.service
    }
  })

  await reader.start()
  logger.info('Reader active. Waiting for card...')

  // Send heartbeat every 30 seconds
  setInterval(() => sendHeartbeat(), 30_000)
  sendHeartbeat()

  process.on('SIGINT', async () => {
    logger.info('Shutting down...')
    await reader.stop()
    process.exit(0)
  })
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Fatal startup error')
  process.exit(1)
})
