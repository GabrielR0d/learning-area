import { Router } from 'express'
import { prisma } from '../../config/database'
import { emitToTenant } from '../../config/socket'
import { logger } from '../../utils/logger'

const router = Router()

/**
 * POST /webhooks/whatsapp/:tenantId
 *
 * Receives events from Evolution API webhook.
 * Configure in Evolution API:
 *   URL: https://api.yourapp.com/api/v1/webhooks/whatsapp/:tenantId
 *   Events: CONNECTION_UPDATE, QRCODE_UPDATED, SEND_MESSAGE
 */
router.post('/:tenantId', async (req, res) => {
  const { tenantId } = req.params
  const event = req.body as EvolutionWebhookEvent

  logger.debug({ tenantId, event: event.event }, 'WhatsApp webhook received')

  try {
    switch (event.event) {
      case 'CONNECTION_UPDATE': {
        const state = event.data?.state as string | undefined
        const isConnected = state === 'open'

        await prisma.whatsAppConfig.updateMany({
          where: { tenantId },
          data: { isConnected, ...(isConnected && { qrCode: null }) },
        })

        emitToTenant(tenantId, 'whatsapp:status', { connected: isConnected, state })
        logger.info({ tenantId, state, isConnected }, 'WhatsApp connection updated')
        break
      }

      case 'QRCODE_UPDATED': {
        const qrCode = event.data?.qrcode?.base64 as string | undefined
        if (qrCode) {
          await prisma.whatsAppConfig.updateMany({
            where: { tenantId },
            data: { qrCode, isConnected: false },
          })
          emitToTenant(tenantId, 'whatsapp:qr', { qrCode })
        }
        break
      }

      case 'SEND_MESSAGE': {
        // Mark log as delivered if we can match it
        const messageId = event.data?.key?.id as string | undefined
        logger.debug({ tenantId, messageId }, 'WhatsApp message delivered')
        break
      }
    }
  } catch (err) {
    logger.error({ err, tenantId, event: event.event }, 'Error processing webhook')
  }

  // Always return 200 so Evolution API doesn't retry
  res.sendStatus(200)
})

interface EvolutionWebhookEvent {
  event: string
  instance: string
  data?: Record<string, unknown>
}

export default router
