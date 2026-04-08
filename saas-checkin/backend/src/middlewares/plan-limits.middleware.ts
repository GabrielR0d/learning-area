import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'

const PLAN_LIMITS = {
  FREE: { maxClients: 50, maxDevices: 1, maxCards: 100 },
  BASIC: { maxClients: 200, maxDevices: 3, maxCards: 500 },
  PRO: { maxClients: 2000, maxDevices: 10, maxCards: 5000 },
  ENTERPRISE: { maxClients: Infinity, maxDevices: Infinity, maxCards: Infinity },
} as const

type Resource = 'clients' | 'devices' | 'cards'

export function checkPlanLimit(resource: Resource) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only enforce on POST (creation)
    if (req.method !== 'POST') return next()

    const tenantId = req.user?.tenantId
    if (!tenantId) return next()

    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      if (!tenant) return next()

      const limits = PLAN_LIMITS[tenant.plan]
      const limitKey = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof limits
      const limit = limits[limitKey]

      if (limit === Infinity) return next()

      let count = 0
      if (resource === 'clients') {
        count = await prisma.client.count({ where: { tenantId, isActive: true } })
      } else if (resource === 'devices') {
        count = await prisma.device.count({ where: { tenantId } })
      } else if (resource === 'cards') {
        count = await prisma.card.count({ where: { tenantId } })
      }

      if (count >= limit) {
        return res.status(403).json({
          error: `Limite do plano ${tenant.plan} atingido`,
          detail: `Seu plano permite no máximo ${limit} ${resource}. Faça upgrade para continuar.`,
          currentPlan: tenant.plan,
          limit,
          current: count,
        })
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

export { PLAN_LIMITS }
