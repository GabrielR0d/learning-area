import bcrypt from 'bcryptjs'
import { prisma } from '../../config/database'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt'

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const payload = { userId: user.id, tenantId: user.tenantId, role: user.role }
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
  }
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken)
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.isActive) throw new Error('User not found')

  const newPayload = { userId: user.id, tenantId: user.tenantId, role: user.role }
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
  })
  if (!user) throw new Error('User not found')
  return user
}
