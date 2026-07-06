import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('demo1234', 10)

  const demoUser = await db.user.upsert({
    where: { email: 'demo@afrikintel.com' },
    update: {
      name: 'Afrikintel Demo',
      password,
      role: 'viewer',
      active: true,
    },
    create: {
      email: 'demo@afrikintel.com',
      name: 'Afrikintel Demo',
      password,
      role: 'viewer',
      active: true,
    },
  })

  await db.subscription.upsert({
    where: { id: 'demo-subscription' },
    update: {
      userId: demoUser.id,
      plan: 'business',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'demo-subscription',
      userId: demoUser.id,
      plan: 'business',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  const monitorSpecs = [
    {
      id: 'demo-api',
      name: 'Afrikintel API',
      type: 'website',
      target: 'https://api.afrikintel.com/health',
      status: 'up',
      responseTime: 143,
      uptime: 99.98,
      tags: 'demo,api',
      checkRegions: 'us-east,eu-west,ap-southeast',
    },
    {
      id: 'demo-checkout',
      name: 'Checkout Journey',
      type: 'website',
      target: 'https://afrikintel.com/pricing',
      status: 'degraded',
      responseTime: 1260,
      uptime: 99.41,
      tags: 'demo,billing',
      checkRegions: 'us-east,eu-west',
    },
    {
      id: 'demo-worker',
      name: 'Monitor Worker',
      type: 'server',
      target: 'worker-01',
      status: 'up',
      responseTime: 88,
      uptime: 99.92,
      tags: 'demo,worker',
      checkRegions: 'us-east',
    },
  ]

  for (const monitor of monitorSpecs) {
    await db.monitor.upsert({
      where: { id: monitor.id },
      update: monitor,
      create: {
        ...monitor,
        interval: 60,
        timeout: 30,
        public: true,
        enabled: true,
      },
    })
  }

  await db.incident.upsert({
    where: { id: 'demo-incident-checkout' },
    update: {
      monitorId: 'demo-checkout',
      status: 'open',
      severity: 'warning',
      title: 'Checkout latency above baseline',
      description: 'EWMA anomaly detection noticed elevated response times in eu-west.',
    },
    create: {
      id: 'demo-incident-checkout',
      monitorId: 'demo-checkout',
      status: 'open',
      severity: 'warning',
      title: 'Checkout latency above baseline',
      description: 'EWMA anomaly detection noticed elevated response times in eu-west.',
    },
  })

  await db.statusPage.upsert({
    where: { slug: 'main' },
    update: {
      title: 'Afrikintel Status',
      description: 'Public demo status page for AppSumo reviewers.',
      published: true,
    },
    create: {
      slug: 'main',
      title: 'Afrikintel Status',
      description: 'Public demo status page for AppSumo reviewers.',
      published: true,
    },
  })

  console.log('Demo account ready: demo@afrikintel.com / demo1234')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
