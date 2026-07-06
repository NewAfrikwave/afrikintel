import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Clear existing journeys
  await db.journeyRun.deleteMany()
  await db.journeyStep.deleteMany()
  await db.journey.deleteMany()

  // Create demo journeys
  const j1 = await db.journey.create({
    data: {
      name: 'Google Homepage Check',
      description: 'Navigate to google.com and assert Google is in the title',
      interval: 120,
      timeout: 30,
    },
  })
  await db.journeyStep.createMany({
    data: [
      { journeyId: j1.id, order: 0, action: 'navigate', target: 'https://google.com', description: 'Load Google homepage' },
      { journeyId: j1.id, order: 1, action: 'assert', target: '', value: 'Google', description: 'Verify page contains "Google"' },
    ],
  })

  const j2 = await db.journey.create({
    data: {
      name: 'GitHub Login Flow',
      description: 'Navigate to GitHub and verify the login page loads',
      interval: 180,
      timeout: 30,
    },
  })
  await db.journeyStep.createMany({
    data: [
      { journeyId: j2.id, order: 0, action: 'navigate', target: 'https://github.com/login', description: 'Load GitHub login page' },
      { journeyId: j2.id, order: 1, action: 'assert', target: '', value: 'Sign in to GitHub', description: 'Verify login form is present' },
    ],
  })

  const j3 = await db.journey.create({
    data: {
      name: 'Cloudflare Status',
      description: 'Check Cloudflare homepage loads successfully',
      interval: 120,
      timeout: 30,
    },
  })
  await db.journeyStep.createMany({
    data: [
      { journeyId: j3.id, order: 0, action: 'navigate', target: 'https://cloudflare.com', description: 'Load Cloudflare homepage' },
      { journeyId: j3.id, order: 1, action: 'wait', target: '', value: '1000', description: 'Wait 1 second' },
      { journeyId: j3.id, order: 2, action: 'assert', target: '', value: 'Cloudflare', description: 'Verify page contains "Cloudflare"' },
    ],
  })

  console.log('Created 3 demo journeys')
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
