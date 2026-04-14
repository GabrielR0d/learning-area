import { Router } from 'express'
import { loginController, refreshController, getMeController } from './auth.controller'
import { authenticate } from '../../middlewares/auth.middleware'

const router = Router()

router.post('/login', loginController)
router.post('/refresh', refreshController)
router.get('/me', authenticate, getMeController)

export default router
