import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Super admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      email: 'admin@system.com',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log('Super admin created:', superAdmin.email)

  // Demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Empresa Demo',
      slug: 'demo',
      plan: 'PRO',
    },
  })
  console.log('Demo tenant created:', tenant.slug)

  // Tenant admin
  const tenantAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('Demo@123', 10),
      name: 'Admin Demo',
      role: UserRole.ADMIN,
    },
  })
  console.log('Tenant admin created:', tenantAdmin.email)

  // Tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
    },
  })

  // Demo device
  const device = await prisma.device.create({
    data: {
      tenantId: tenant.id,
      name: 'Entrada Principal',
      location: 'Recepção',
      apiKey: 'demo-device-api-key-12345',
    },
  })
  console.log('Demo device created, apiKey:', device.apiKey)

  // Demo client
  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'João Silva',
      phone: '5511999999999',
      email: 'joao@exemplo.com',
    },
  })

  // Demo card
  await prisma.card.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      uid: 'A3F2C1B4',
      label: 'Cartão Principal',
    },
  })

  console.log('Seed completed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
