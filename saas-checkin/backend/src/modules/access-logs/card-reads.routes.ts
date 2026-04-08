import { Router } from 'express'
import { authenticateDevice } from '../../middlewares/device-auth.middleware'
import { prisma } from '../../config/database'
import { emitToTenant } from '../../config/socket'
import { logger } from '../../utils/logger'
import { AccessDirection, AccessEventType, CardStatus } from '@prisma/client'

const router = Router()

// POST /card-reads  — called by RFID devices
router.post('/', authenticateDevice, async (req, res, next) => {
  try {
    const tenantId = req.tenantId!
    const deviceId = req.deviceId!
    const { cardUid, direction } = req.body as { cardUid: string; direction: AccessDirection }

    if (!cardUid || !direction) {
      return res.status(400).json({ error: 'cardUid and direction are required' })
    }

    const uid = cardUid.toUpperCase()

    // Find the card and associated client
    const card = await prisma.card.findUnique({
      where: { tenantId_uid: { tenantId, uid } },
      include: { client: true },
    })

    let eventType: AccessEventType
    let clientId: string | null = null

    if (!card) {
      eventType = AccessEventType.UNKNOWN_CARD
    } else if (card.status === CardStatus.BLOCKED || card.status === CardStatus.LOST) {
      eventType = AccessEventType.BLOCKED_CARD
      clientId = card.clientId ?? null
    } else {
      eventType = direction === AccessDirection.IN ? AccessEventType.ENTRY : AccessEventType.EXIT
      clientId = card.clientId ?? null

      // Update last seen
      await prisma.card.update({
        where: { id: card.id },
        data: { lastSeenAt: new Date() },
      })
    }

    const log = await prisma.accessLog.create({
      data: {
        tenantId,
        clientId,
        cardId: card?.id ?? null,
        deviceId,
        cardUid: uid,
        eventType,
        direction,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        device: { select: { id: true, name: true, location: true } },
      },
    })

    // Emit real-time event to dashboard
    emitToTenant(tenantId, 'access:new', log)

    // Queue WhatsApp notification if eligible
    if (
      clientId &&
      (eventType === AccessEventType.ENTRY || eventType === AccessEventType.EXIT)
    ) {
      queueWhatsAppNotification(tenantId, log.id, eventType).catch((err) =>
        logger.error(err, 'Failed to queue WhatsApp notification')
      )
    }

    res.status(201).json({ success: true, eventType, logId: log.id })
  } catch (err) {
    next(err)
  }
})

// POST /card-reads/heartbeat — device keepalive
router.post('/heartbeat', authenticateDevice, async (req, res) => {
  res.json({ ok: true, serverTime: new Date().toISOString() })
})

async function queueWhatsAppNotification(
  tenantId: string,
  logId: string,
  eventType: AccessEventType
) {
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  if (!settings) return

  const shouldNotify =
    (eventType === AccessEventType.ENTRY && settings.notifyClientOnEntry) ||
    (eventType === AccessEventType.EXIT && settings.notifyClientOnExit)

  if (!shouldNotify) return

  const waConfig = await prisma.whatsAppConfig.findUnique({ where: { tenantId } })
  if (!waConfig || !waConfig.isConnected) return

  const log = await prisma.accessLog.findUnique({
    where: { id: logId },
    include: { client: true },
  })
  if (!log?.client) return

  const template =
    eventType === AccessEventType.ENTRY
      ? settings.entryMessageTemplate
      : settings.exitMessageTemplate

  const now = new Date()
  const message = template
    .replace('{nome}', log.client.name)
    .replace('{data}', now.toLocaleDateString('pt-BR'))
    .replace('{hora}', now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

  try {
    const axios = (await import('axios')).default
    await axios.post(
      `${waConfig.baseUrl}/message/sendText/${waConfig.instanceName}`,
      { number: log.client.phone, text: message },
      { headers: { apikey: waConfig.apiKey } }
    )

    await prisma.accessLog.update({
      where: { id: logId },
      data: { whatsappSent: true, whatsappSentAt: new Date() },
    })
  } catch (err: any) {
    await prisma.accessLog.update({
      where: { id: logId },
      data: { whatsappError: err?.message ?? 'Unknown error' },
    })
    logger.error({ err, logId }, 'WhatsApp send failed')
  }
}

export default router
