import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../config/database'
import { sendEmail } from '../../config/email'

const router = Router()

// In-memory store for reset tokens (use Redis in production)
const resetTokens = new Map<string, { userId: string; expiresAt: number }>()

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })

    // Always return 200 to avoid user enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.json({ message: 'Se o email existir, você receberá as instruções.' })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hour

    resetTokens.set(token, { userId: user.id, expiresAt })

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await sendEmail({
      to: email,
      subject: 'Redefinição de senha — CheckIn RFID',
      html: `
        <h2>Redefinição de senha</h2>
        <p>Olá, ${user.name}!</p>
        <p>Clique no link abaixo para redefinir sua senha. O link expira em 1 hora.</p>
        <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Redefinir senha</a></p>
        <p style="color:#666;font-size:12px;">Se você não solicitou isso, ignore este email.</p>
        <p style="color:#666;font-size:12px;">Link: ${resetUrl}</p>
      `,
    })

    return res.json({ message: 'Se o email existir, você receberá as instruções.' })
  } catch (err) {
    next(err)
  }
})

// POST /auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const entry = resetTokens.get(token)
    if (!entry || entry.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Token inválido ou expirado' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: entry.userId },
      data: { passwordHash },
    })

    resetTokens.delete(token)

    return res.json({ message: 'Senha redefinida com sucesso' })
  } catch (err) {
    next(err)
  }
})

export default router
