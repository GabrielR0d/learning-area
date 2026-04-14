import { Request, Response } from 'express'
import * as service from './clients.service'

export async function list(req: Request, res: Response) {
  try {
    const result = await service.findAll(req.user!.tenantId!, req.query)
    res.json(result)
  } catch (err: any) { res.status(400).json({ error: err.message }) }
}

export async function get(req: Request, res: Response) {
  try {
    const result = await service.findById(req.user!.tenantId!, req.params.id)
    res.json(result)
  } catch (err: any) { res.status(404).json({ error: err.message }) }
}

export async function create(req: Request, res: Response) {
  try {
    const result = await service.create(req.user!.tenantId!, req.body)
    res.status(201).json(result)
  } catch (err: any) { res.status(400).json({ error: err.message }) }
}

export async function update(req: Request, res: Response) {
  try {
    const result = await service.update(req.user!.tenantId!, req.params.id, req.body)
    res.json(result)
  } catch (err: any) { res.status(400).json({ error: err.message }) }
}

export async function remove(req: Request, res: Response) {
  try {
    await service.remove(req.user!.tenantId!, req.params.id)
    res.status(204).send()
  } catch (err: any) { res.status(404).json({ error: err.message }) }
}
