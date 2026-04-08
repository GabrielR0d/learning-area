import { Router } from 'express'
import { authenticate, requireSuperAdmin } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'
import { getPagination, buildMeta } from '../../utils/pagination'

const router = Router()

router.use(authenticate, requireSuperAdmin)

// GET /super-admin/tenants
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query as any)
    const [data, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, clients: true, devices: true } },
        },
      }),
      prisma.tenant.count(),
    ])
    res.json({ data, meta: buildMeta(total, page, limit) })
  } catch (err) {
    next(err)
  }
})

// GET /super-admin/tenants/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        _count: { select: { clients: true, cards: true, devices: true, accessLogs: true } },
      },
    })
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' })
    res.json(tenant)
  } catch (err) {
    next(err)
  }
})

// POST /super-admin/tenants
router.post('/', async (req, res, next) => {
  try {
    const { name, slug, plan } = req.body
    if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' })

    const tenant = await prisma.tenant.create({
      data: { name, slug, plan },
    })
    res.status(201).json(tenant)
  } catch (err) {
    next(err)
  }
})

// PUT /super-admin/tenants/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, plan, isActive } = req.body
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { name, plan, isActive },
    })
    res.json(tenant)
  } catch (err) {
    next(err)
  }
})

export default router
