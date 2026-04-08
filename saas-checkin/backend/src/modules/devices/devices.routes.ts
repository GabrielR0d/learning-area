import { Router } from 'express'
import { authenticate, requireRoles } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'
import { UserRole } from '@prisma/client'

const router = Router()

router.use(authenticate)

// GET /devices
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const devices = await prisma.device.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })
    res.json(devices)
  } catch (err) {
    next(err)
  }
})

// GET /devices/:id
router.get('/:id', async (req, res, next) => {
  try {
    const device = await prisma.device.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId! },
    })
    if (!device) return res.status(404).json({ error: 'Device not found' })
    res.json(device)
  } catch (err) {
    next(err)
  }
})

// POST /devices
router.post('/', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const { name, location } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const device = await prisma.device.create({
      data: { tenantId, name, location },
    })
    res.status(201).json(device)
  } catch (err) {
    next(err)
  }
})

// PUT /devices/:id
router.put('/:id', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const existing = await prisma.device.findFirst({ where: { id: req.params.id, tenantId } })
    if (!existing) return res.status(404).json({ error: 'Device not found' })

    const { name, location } = req.body
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { name, location },
    })
    res.json(device)
  } catch (err) {
    next(err)
  }
})

// DELETE /devices/:id
router.delete('/:id', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const existing = await prisma.device.findFirst({ where: { id: req.params.id, tenantId } })
    if (!existing) return res.status(404).json({ error: 'Device not found' })

    await prisma.device.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// POST /devices/:id/regenerate-key
router.post('/:id/regenerate-key', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const existing = await prisma.device.findFirst({ where: { id: req.params.id, tenantId } })
    if (!existing) return res.status(404).json({ error: 'Device not found' })

    const { randomUUID } = await import('crypto')
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { apiKey: randomUUID() },
    })
    res.json({ apiKey: device.apiKey })
  } catch (err) {
    next(err)
  }
})

export default router
