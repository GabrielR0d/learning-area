import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { prisma } from '../../config/database'
import { authenticate, requireRoles } from '../../middlewares/auth.middleware'
import { logger } from '../../utils/logger'
import { UserRole } from '@prisma/client'

const router = Router()

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// Price IDs from your Stripe dashboard
const PRICE_IDS: Record<string, string> = {
  BASIC: process.env.STRIPE_PRICE_BASIC || 'price_basic',
  PRO: process.env.STRIPE_PRICE_PRO || 'price_pro',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
}

function getStripe() {
  if (!STRIPE_SECRET) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(STRIPE_SECRET, { apiVersion: '2024-02-15' })
}

// POST /billing/checkout — create Stripe Checkout session
router.post(
  '/checkout',
  authenticate,
  requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { plan } = req.body as { plan: 'BASIC' | 'PRO' | 'ENTERPRISE' }
      const tenantId = req.user!.tenantId!
      const priceId = PRICE_IDS[plan]

      if (!priceId) return res.status(400).json({ error: 'Invalid plan' })

      const stripe = getStripe()

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' })

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/settings?billing=success`,
        cancel_url: `${process.env.FRONTEND_URL}/settings?billing=cancelled`,
        metadata: { tenantId, plan },
        customer_email: req.user?.userId
          ? (await prisma.user.findUnique({ where: { id: req.user.userId }, select: { email: true } }))?.email ?? undefined
          : undefined,
      })

      res.json({ url: session.url })
    } catch (err: any) {
      logger.error(err, 'Stripe checkout error')
      res.status(500).json({ error: err.message })
    }
  }
)

// GET /billing/plans — list available plans with limits
router.get('/plans', (_, res) => {
  res.json([
    {
      id: 'FREE',
      name: 'Grátis',
      price: 0,
      limits: { maxClients: 50, maxDevices: 1, maxCards: 100 },
      features: ['1 dispositivo', '50 clientes', 'Notificações WhatsApp'],
    },
    {
      id: 'BASIC',
      name: 'Básico',
      price: 4990, // R$ 49,90 in centavos
      limits: { maxClients: 200, maxDevices: 3, maxCards: 500 },
      features: ['3 dispositivos', '200 clientes', 'Relatórios avançados', 'Suporte por email'],
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 9990,
      limits: { maxClients: 2000, maxDevices: 10, maxCards: 5000 },
      features: ['10 dispositivos', '2.000 clientes', 'Exportação CSV', 'Multi-usuário', 'Suporte prioritário'],
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: null, // custom
      limits: { maxClients: Infinity, maxDevices: Infinity, maxCards: Infinity },
      features: ['Ilimitado', 'SLA dedicado', 'Integração personalizada', 'Onboarding'],
    },
  ])
})

// POST /billing/webhook — Stripe webhook handler (raw body needed)
router.post('/webhook', async (req: Request, res: Response) => {
  if (!STRIPE_WEBHOOK_SECRET) return res.sendStatus(400)

  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    logger.error(err, 'Stripe webhook signature verification failed')
    return res.status(400).json({ error: err.message })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tenantId = session.metadata?.tenantId
        const plan = session.metadata?.plan as string

        if (tenantId && plan) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan: plan as 'BASIC' | 'PRO' | 'ENTERPRISE',
            },
          })
          logger.info({ tenantId, plan }, 'Tenant plan upgraded via Stripe')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const tenantId = sub.metadata?.tenantId
        if (tenantId) {
          await prisma.tenant.update({ where: { id: tenantId }, data: { plan: 'FREE' } })
          logger.info({ tenantId }, 'Tenant downgraded to FREE (subscription cancelled)')
        }
        break
      }
    }
  } catch (err) {
    logger.error(err, 'Error processing Stripe webhook')
  }

  res.sendStatus(200)
})

export default router
