import { Request, Response } from 'express'
import * as authService from './auth.service'

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const result = await authService.login(email, password)
    return res.json(result)
  } catch (err: any) {
    return res.status(401).json({ error: err.message })
  }
}

export async function refreshController(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })
    const tokens = await authService.refresh(refreshToken)
    return res.json(tokens)
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
}

export async function getMeController(req: Request, res: Response) {
  try {
    const user = await authService.getMe(req.user!.userId)
    return res.json(user)
  } catch (err: any) {
    return res.status(404).json({ error: err.message })
  }
}
