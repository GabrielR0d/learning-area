import { prisma } from '../../config/database'
import { getPagination, buildMeta } from '../../utils/pagination'

export async function findAll(tenantId: string, query: any) {
  const { page, limit, skip } = getPagination(query)
  const where = {
    tenantId,
    ...(query.clientId && { clientId: query.clientId }),
    ...(query.status && { status: query.status }),
    ...(query.search && { uid: { contains: query.search } }),
  }
  const [cards, total] = await Promise.all([
    prisma.card.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { client: { select: { id: true, name: true, phone: true } } } }),
    prisma.card.count({ where }),
  ])
  return { data: cards, meta: buildMeta(total, page, limit) }
}

export async function create(tenantId: string, data: any) {
  const existing = await prisma.card.findUnique({ where: { tenantId_uid: { tenantId, uid: data.uid } } })
  if (existing) throw new Error('Card UID already registered in this tenant')
  return prisma.card.create({ data: { ...data, tenantId } })
}

export async function bind(tenantId: string, uid: string, clientId: string) {
  const card = await prisma.card.findUnique({ where: { tenantId_uid: { tenantId, uid } } })
  if (!card) throw new Error('Card not found')
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } })
  if (!client) throw new Error('Client not found')
  return prisma.card.update({ where: { id: card.id }, data: { clientId } })
}

export async function update(tenantId: string, cardId: string, data: any) {
  const card = await prisma.card.findFirst({ where: { id: cardId, tenantId } })
  if (!card) throw new Error('Card not found')
  return prisma.card.update({ where: { id: cardId }, data })
}

export async function remove(tenantId: string, cardId: string) {
  const card = await prisma.card.findFirst({ where: { id: cardId, tenantId } })
  if (!card) throw new Error('Card not found')
  return prisma.card.delete({ where: { id: cardId } })
}
