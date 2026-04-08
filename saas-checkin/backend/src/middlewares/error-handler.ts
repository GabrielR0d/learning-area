import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../utils/logger'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
    })
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error')
  return res.status(500).json({ error: 'Internal server error' })
}
