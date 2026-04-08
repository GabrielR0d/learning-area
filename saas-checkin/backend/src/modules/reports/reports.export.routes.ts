import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'

const router = Router()

router.use(authenticate)

// GET /reports/export/csv — export access logs as CSV
router.get('/export/csv', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const { from, to, eventType, clientId } = req.query as Record<string, string>

    const where: Record<string, unknown> = { tenantId }
    if (eventType) where.eventType = eventType
    if (clientId) where.clientId = clientId
    if (from || to) {
      where.occurredAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      }
    }

    const logs = await prisma.accessLog.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: 10_000, // safety limit
      include: {
        client: { select: { name: true, phone: true } },
        device: { select: { name: true, location: true } },
        card: { select: { uid: true, label: true } },
      },
    })

    const header = [
      'Data/Hora',
      'Evento',
      'Direção',
      'Cliente',
      'Telefone',
      'UID do Cartão',
      'Rótulo do Cartão',
      'Dispositivo',
      'Localização',
      'WhatsApp Enviado',
    ].join(';')

    const rows = logs.map((log) => {
      const date = new Date(log.occurredAt).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      })

      const eventLabels: Record<string, string> = {
        ENTRY: 'Entrada',
        EXIT: 'Saída',
        UNKNOWN_CARD: 'Cartão desconhecido',
        BLOCKED_CARD: 'Cartão bloqueado',
      }

      return [
        date,
        eventLabels[log.eventType] ?? log.eventType,
        log.direction === 'IN' ? 'Entrada' : 'Saída',
        log.client?.name ?? '',
        log.client?.phone ?? '',
        log.cardUid,
        log.card?.label ?? '',
        log.device?.name ?? '',
        log.device?.location ?? '',
        log.whatsappSent ? 'Sim' : 'Não',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';')
    })

    const csv = [header, ...rows].join('\n')
    const filename = `acessos-${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    // BOM for Excel to recognize UTF-8
    res.send('\uFEFF' + csv)
  } catch (err) {
    next(err)
  }
})

export default router
