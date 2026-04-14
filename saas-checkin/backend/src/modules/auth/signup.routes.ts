import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../../config/database'
import { signAccessToken, signRefreshToken } from '../../utils/jwt'

const router = Router()

const signupSchema = z.object({
  companyName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  adminName: z.string().min(2).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
})

// POST /auth/signup — public, creates tenant + admin user
router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body)

    // Check slug availability
    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } })
    if (existing) {
      return res.status(409).json({ error: 'Este slug já está em uso. Escolha outro.' })
    }

    // Check email availability
    const existingUser = await prisma.user.findUnique({ where: { email: data.adminEmail } })
    if (existingUser) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
    }

    // Create tenant + admin + settings atomically
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          slug: data.slug,
          plan: 'FREE',
        },
      })

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.adminName,
          email: data.adminEmail,
          passwordHash: await bcrypt.hash(data.adminPassword, 10),
          role: 'ADMIN',
        },
      })

      await tx.tenantSettings.create({ data: { tenantId: tenant.id } })

      return { tenant, user }
    })

    const payload = {
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.user.role,
    }

    return res.status(201).json({
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.tenant.id,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /auth/check-slug?slug=xxx — check slug availability
router.get('/check-slug', async (req, res) => {
  const slug = (req.query.slug as string)?.toLowerCase().trim()
  if (!slug || !/^[a-z0-9-]{3,30}$/.test(slug)) {
    return res.json({ available: false, reason: 'Formato inválido' })
  }
  const existing = await prisma.tenant.findUnique({ where: { slug } })
  return res.json({ available: !existing })
})

export default router
