import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const db = new PrismaClient()
const u = await db.user.findUnique({ where: { email: 'admin@afrikintel.com' } })
console.log('User:', u.email)
console.log('Password hash:', u.password)
console.log('Hash starts with $2:', u.password?.startsWith('$2'))
const valid = await bcrypt.compare('admin', u.password)
console.log('bcrypt compare "admin":', valid)
process.exit(0)
