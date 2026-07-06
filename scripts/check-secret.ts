import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const s = await db.setting.findUnique({ where: { key: 'nextauth_secret' } })
console.log('nextauth_secret setting:', s?.value?.substring(0, 20) + '...')
// The issue: NextAuth needs NEXTAUTH_SECRET env var, not a DB setting
console.log('NEXTAUTH_SECRET env:', process.env.NEXTAUTH_SECRET || 'NOT SET')
console.log('NEXTAUTH_URL env:', process.env.NEXTAUTH_URL || 'NOT SET')
process.exit(0)
