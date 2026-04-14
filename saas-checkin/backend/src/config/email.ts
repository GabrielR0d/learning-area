import nodemailer from 'nodemailer'
import { logger } from '../utils/logger'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    // Ethereal fake SMTP for development — logs the preview URL
    logger.warn('SMTP not configured. Emails will be logged to console only.')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const transport = createTransport()

  if (!transport) {
    logger.info({ to, subject }, 'Email (not sent — SMTP not configured):')
    logger.info(html)
    return
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  const info = await transport.sendMail({ from, to, subject, html })
  logger.info({ messageId: info.messageId, to }, 'Email sent')
}
