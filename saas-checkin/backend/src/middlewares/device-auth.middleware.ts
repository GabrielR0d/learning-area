import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'

export async function authenticateDevice(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-device-key'] as string
  if (!apiKey) return res.status(401).json({ error: 'No device key provided' })

  const device = await prisma.device.findUnique({ where: { apiKey } })
  if (!device) return res.status(401).json({ error: 'Invalid device key' })

  req.deviceId = device.id
  req.tenantId = device.tenantId

  // Update online status
  await prisma.device.update({
    where: { id: device.id },
    data: { isOnline: true, lastHeartbeat: new Date() },
  })

  next()
}
