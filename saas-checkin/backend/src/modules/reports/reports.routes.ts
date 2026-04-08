import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'

const router = Router()

router.use(authenticate)

// GET /reports/summary — totals for the dashboard
router.get('/summary', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalClients, totalCards, totalDevices, todayEntries, todayExits, unknownCards] =
      await Promise.all([
        prisma.client.count({ where: { tenantId, isActive: true } }),
        prisma.card.count({ where: { tenantId, status: 'ACTIVE' } }),
        prisma.device.count({ where: { tenantId, isOnline: true } }),
        prisma.accessLog.count({ where: { tenantId, eventType: 'ENTRY', occurredAt: { gte: today } } }),
        prisma.accessLog.count({ where: { tenantId, eventType: 'EXIT', occurredAt: { gte: today } } }),
        prisma.accessLog.count({ where: { tenantId, eventType: 'UNKNOWN_CARD', occurredAt: { gte: today } } }),
      ])

    res.json({ totalClients, totalCards, totalDevices, todayEntries, todayExits, unknownCards })
  } catch (err) {
    next(err)
  }
})

// GET /reports/daily — access counts per day (last 30 days)
router.get('/daily', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const from = new Date()
    from.setDate(from.getDate() - 29)
    from.setHours(0, 0, 0, 0)

    const logs = await prisma.accessLog.findMany({
      where: { tenantId, occurredAt: { gte: from }, eventType: { in: ['ENTRY', 'EXIT'] } },
      select: { occurredAt: true, eventType: true },
    })

    const map: Record<string, { date: string; entries: number; exits: number }> = {}
    for (const log of logs) {
      const date = log.occurredAt.toISOString().slice(0, 10)
      if (!map[date]) map[date] = { date, entries: 0, exits: 0 }
      if (log.eventType === 'ENTRY') map[date].entries++
      else map[date].exits++
    }

    res.json(Object.values(map).sort((a, b) => a.date.localeCompare(b.date)))
  } catch (err) {
    next(err)
  }
})

// GET /reports/top-clients — most frequent visitors
router.get('/top-clients', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const from = new Date()
    from.setDate(from.getDate() - 29)

    const result = await prisma.accessLog.groupBy({
      by: ['clientId'],
      where: { tenantId, clientId: { not: null }, eventType: 'ENTRY', occurredAt: { gte: from } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const clientIds = result.map((r) => r.clientId!).filter(Boolean)
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, phone: true },
    })

    const enriched = result.map((r) => ({
      client: clients.find((c) => c.id === r.clientId) ?? null,
      count: r._count.id,
    }))

    res.json(enriched)
  } catch (err) {
    next(err)
  }
})

export default router
