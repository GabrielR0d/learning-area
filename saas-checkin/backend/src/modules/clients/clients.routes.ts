import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import * as ctrl from './clients.controller'

const router = Router()
router.use(authenticate)
router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.get('/:id', ctrl.get)
router.patch('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
export default router
