import { prisma } from '../../config/database'
import { getPagination, buildMeta } from '../../utils/pagination'

export async function findAll(tenantId: string, query: any) {
  const { page, limit, skip } = getPagination(query)
  const where = {
    tenantId,
    isActive: query.isActive !== 'false',
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }
  const [clients, total] = await Promise.all([
    prisma.client.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { cards: { select: { id: true, uid: true, status: true, label: true } } } }),
    prisma.client.count({ where }),
  ])
  return { data: clients, meta: buildMeta(total, page, limit) }
}

export async function findById(tenantId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    include: {
      cards: true,
      accessLogs: { orderBy: { occurredAt: 'desc' }, take: 20, include: { device: { select: { name: true } } } },
    },
  })
  if (!client) throw new Error('Client not found')
  return client
}

export async function create(tenantId: string, data: any) {
  return prisma.client.create({ data: { ...data, tenantId } })
}

export async function update(tenantId: string, clientId: string, data: any) {
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } })
  if (!client) throw new Error('Client not found')
  return prisma.client.update({ where: { id: clientId }, data })
}

export async function remove(tenantId: string, clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } })
  if (!client) throw new Error('Client not found')
  return prisma.client.update({ where: { id: clientId }, data: { isActive: false } })
}
