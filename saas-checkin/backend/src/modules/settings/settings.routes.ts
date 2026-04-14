import { Router } from 'express'
import { authenticate, requireRoles } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'
import { UserRole } from '@prisma/client'

const router = Router()

router.use(authenticate)

// GET /settings
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
    if (!settings) return res.status(404).json({ error: 'Settings not found' })
    res.json(settings)
  } catch (err) {
    next(err)
  }
})

// PUT /settings
router.put('/', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const {
      notifyClientOnEntry,
      notifyClientOnExit,
      notifyAdminOnEntry,
      adminPhoneNumber,
      entryMessageTemplate,
      exitMessageTemplate,
      timezone,
    } = req.body

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        notifyClientOnEntry,
        notifyClientOnExit,
        notifyAdminOnEntry,
        adminPhoneNumber,
        entryMessageTemplate,
        exitMessageTemplate,
        timezone,
      },
      create: {
        tenantId,
        notifyClientOnEntry,
        notifyClientOnExit,
        notifyAdminOnEntry,
        adminPhoneNumber,
        entryMessageTemplate,
        exitMessageTemplate,
        timezone,
      },
    })
    res.json(settings)
  } catch (err) {
    next(err)
  }
})

export default router
