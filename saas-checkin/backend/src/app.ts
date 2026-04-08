import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { errorHandler } from './middlewares/error-handler'
import authRoutes from './modules/auth/auth.routes'
import clientRoutes from './modules/clients/clients.routes'
import cardRoutes from './modules/cards/cards.routes'
import deviceRoutes from './modules/devices/devices.routes'
import accessLogRoutes from './modules/access-logs/access-logs.routes'
import cardReadRoutes from './modules/access-logs/card-reads.routes'
import whatsappRoutes from './modules/whatsapp/whatsapp.routes'
import reportsRoutes from './modules/reports/reports.routes'
import settingsRoutes from './modules/settings/settings.routes'
import tenantsRoutes from './modules/tenants/tenants.routes'
import usersRoutes from './modules/users/users.routes'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

const api = '/api/v1'
app.use(`${api}/auth`, authRoutes)
app.use(`${api}/clients`, clientRoutes)
app.use(`${api}/cards`, cardRoutes)
app.use(`${api}/devices`, deviceRoutes)
app.use(`${api}/access-logs`, accessLogRoutes)
app.use(`${api}/card-reads`, cardReadRoutes)
app.use(`${api}/whatsapp`, whatsappRoutes)
app.use(`${api}/reports`, reportsRoutes)
app.use(`${api}/settings`, settingsRoutes)
app.use(`${api}/super-admin/tenants`, tenantsRoutes)
app.use(`${api}/users`, usersRoutes)

app.use(errorHandler)
