import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'
import { getPagination, buildMeta } from '../../utils/pagination'

const router = Router()

router.use(authenticate)

// GET /access-logs
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const { page, limit, skip } = getPagination(req.query as any)
    const { clientId, deviceId, eventType, from, to } = req.query as Record<string, string>

    const where: any = { tenantId }
    if (clientId) where.clientId = clientId
    if (deviceId) where.deviceId = deviceId
    if (eventType) where.eventType = eventType
    if (from || to) {
      where.occurredAt = {}
      if (from) where.occurredAt.gte = new Date(from)
      if (to) where.occurredAt.lte = new Date(to)
    }

    const [data, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          card: { select: { id: true, uid: true, label: true } },
          device: { select: { id: true, name: true, location: true } },
        },
      }),
      prisma.accessLog.count({ where }),
    ])

    res.json({ data, meta: buildMeta(total, page, limit) })
  } catch (err) {
    next(err)
  }
})

// GET /access-logs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const log = await prisma.accessLog.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId! },
      include: {
        client: true,
        card: true,
        device: true,
      },
    })
    if (!log) return res.status(404).json({ error: 'Access log not found' })
    res.json(log)
  } catch (err) {
    next(err)
  }
})

export default router
