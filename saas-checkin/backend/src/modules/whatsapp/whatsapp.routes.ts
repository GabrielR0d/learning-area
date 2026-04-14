import { Router } from 'express'
import { authenticate, requireRoles } from '../../middlewares/auth.middleware'
import { prisma } from '../../config/database'
import { UserRole } from '@prisma/client'
import axios from 'axios'

const router = Router()

router.use(authenticate)

// GET /whatsapp/config
router.get('/config', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const config = await prisma.whatsAppConfig.findUnique({ where: { tenantId } })
    if (!config) return res.status(404).json({ error: 'WhatsApp not configured' })

    // Mask API key for security
    res.json({ ...config, apiKey: '***' })
  } catch (err) {
    next(err)
  }
})

// PUT /whatsapp/config
router.put('/config', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const { provider, instanceName, apiKey, baseUrl } = req.body

    const config = await prisma.whatsAppConfig.upsert({
      where: { tenantId },
      update: { provider, instanceName, apiKey, baseUrl },
      create: { tenantId, provider, instanceName, apiKey, baseUrl },
    })
    res.json({ ...config, apiKey: '***' })
  } catch (err) {
    next(err)
  }
})

// GET /whatsapp/status
router.get('/status', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const config = await prisma.whatsAppConfig.findUnique({ where: { tenantId } })
    if (!config) return res.json({ configured: false })

    try {
      const response = await axios.get(
        `${config.baseUrl}/instance/connectionState/${config.instanceName}`,
        { headers: { apikey: config.apiKey }, timeout: 5000 }
      )
      const connected = response.data?.instance?.state === 'open'
      await prisma.whatsAppConfig.update({
        where: { tenantId },
        data: { isConnected: connected },
      })
      res.json({ configured: true, connected, state: response.data?.instance?.state })
    } catch {
      res.json({ configured: true, connected: false })
    }
  } catch (err) {
    next(err)
  }
})

// GET /whatsapp/qr
router.get('/qr', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const config = await prisma.whatsAppConfig.findUnique({ where: { tenantId } })
    if (!config) return res.status(404).json({ error: 'WhatsApp not configured' })

    const response = await axios.get(
      `${config.baseUrl}/instance/fetchInstances`,
      { headers: { apikey: config.apiKey }, timeout: 5000 }
    )
    res.json(response.data)
  } catch (err) {
    next(err)
  }
})

// POST /whatsapp/test
router.post('/test', requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!
    const config = await prisma.whatsAppConfig.findUnique({ where: { tenantId } })
    if (!config) return res.status(404).json({ error: 'WhatsApp not configured' })

    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'phone is required' })

    await axios.post(
      `${config.baseUrl}/message/sendText/${config.instanceName}`,
      { number: phone, text: 'Mensagem de teste do sistema de controle de acesso RFID.' },
      { headers: { apikey: config.apiKey } }
    )
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to send test message' })
  }
})

export default router
