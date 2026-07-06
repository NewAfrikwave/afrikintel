import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const existing = await db.setting.findUnique({ where: { key: 'engineStartedAt' } })
const now = String(Date.now())
if (existing) {
  await db.setting.update({ where: { key: 'engineStartedAt' }, data: { value: now } })
} else {
  await db.setting.create({ data: { id: 's_engineStartedAt', key: 'engineStartedAt', value: now } })
}
console.log('engineStartedAt =', now)
process.exit(0)
