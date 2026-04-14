import { Router } from 'express'
import { authenticate, requireRoles } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const router = Router()

router.use(authenticate)

// GET /users
router.get('/', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId
    const where = tenantId ? { tenantId } : {}
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenantId: true,
      },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

// GET /users/:id
router.get('/:id', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, lastLoginAt: true, createdAt: true, tenantId: true,
      },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// POST /users
router.post('/', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' })
    }

    const tenantId = req.user!.tenantId
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role ?? UserRole.OPERATOR, tenantId },
      select: { id: true, name: true, email: true, role: true, isActive: true, tenantId: true },
    })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

// PUT /users/:id
router.put('/:id', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { name, role, isActive, password } = req.body
    const data: any = { name, role, isActive }
    if (password) data.passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, tenantId: true },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

// DELETE /users/:id
router.delete('/:id', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
