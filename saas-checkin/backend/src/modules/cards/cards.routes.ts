import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'
import { getPagination, buildMeta } from '../../utils/pagination'

const router = Router()

router.use(authenticate)

// GET /cards
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const { page, limit, skip } = getPagination(req.query as any)

    const [data, total] = await Promise.all([
      prisma.card.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: { client: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.card.count({ where: { tenantId } }),
    ])

    res.json({ data, meta: buildMeta(total, page, limit) })
  } catch (err) {
    next(err)
  }
})

// GET /cards/:id
router.get('/:id', async (req, res, next) => {
  try {
    const card = await prisma.card.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId! },
      include: { client: true },
    })
    if (!card) return res.status(404).json({ error: 'Card not found' })
    res.json(card)
  } catch (err) {
    next(err)
  }
})

// POST /cards
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const { uid, clientId, label, status } = req.body
    if (!uid) return res.status(400).json({ error: 'uid is required' })

    const card = await prisma.card.create({
      data: { tenantId, uid: uid.toUpperCase(), clientId, label, status },
    })
    res.status(201).json(card)
  } catch (err) {
    next(err)
  }
})

// PUT /cards/:id
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const existing = await prisma.card.findFirst({ where: { id: req.params.id, tenantId } })
    if (!existing) return res.status(404).json({ error: 'Card not found' })

    const { clientId, label, status } = req.body
    const card = await prisma.card.update({
      where: { id: req.params.id },
      data: { clientId, label, status },
    })
    res.json(card)
  } catch (err) {
    next(err)
  }
})

// DELETE /cards/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const existing = await prisma.card.findFirst({ where: { id: req.params.id, tenantId } })
    if (!existing) return res.status(404).json({ error: 'Card not found' })

    await prisma.card.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
