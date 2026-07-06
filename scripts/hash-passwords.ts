import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // Hash passwords for existing users
  const users = await db.user.findMany()
  for (const u of users) {
    // If password looks like a plain string (not a bcrypt hash), hash it
    if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
      const hashed = await bcrypt.hash(u.password, 10)
      await db.user.update({ where: { id: u.id }, data: { password: hashed } })
      console.log(`Hashed password for ${u.email}`)
    }
  }

  // Add a settings entry for nextauth secret if missing
  const existing = await db.setting.findUnique({ where: { key: 'nextauth_secret' } })
  if (!existing) {
    const secret = await bcrypt.hash('afrikintel-nextauth-' + Date.now(), 10)
    await db.setting.create({
      data: { id: 's_nextauth', key: 'nextauth_secret', value: secret },
    })
    console.log('Created nextauth_secret setting')
  }

  // Add SMTP settings placeholders
  const smtpSetting = await db.setting.findUnique({ where: { key: 'smtp_host' } })
  if (!smtpSetting) {
    await db.setting.createMany({
      data: [
        { id: 's_smtp_host', key: 'smtp_host', value: '' },
        { id: 's_smtp_port', key: 'smtp_port', value: '587' },
        { id: 's_smtp_user', key: 'smtp_user', value: '' },
        { id: 's_smtp_pass', key: 'smtp_pass', value: '' },
        { id: 's_smtp_from', key: 'smtp_from', value: 'alerts@afrikintel.com' },
        { id: 's_check_regions', key: 'check_regions', value: 'us-east,eu-west,ap-southeast' },
      ],
    })
    console.log('Created SMTP + multi-region settings')
  }

  console.log('Done')
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
