import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Update some monitors to use multi-region checks
  const updates = [
    { name: 'Google', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'Cloudflare', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'GitHub', checkRegions: 'us-east,eu-west' },
    { name: 'GitHub API', checkRegions: 'us-east,eu-west' },
    { name: 'Google DNS', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'Cloudflare DNS', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'Google DNS Resolve', checkRegions: 'us-east,eu-west' },
    { name: 'GitHub Blacklist', checkRegions: 'us-east' },
    // Pings stay single-region (global) since they fail in sandbox anyway
  ]

  for (const u of updates) {
    const result = await db.monitor.updateMany({
      where: { name: u.name },
      data: { checkRegions: u.checkRegions },
    })
    console.log(`Updated ${u.name} → ${u.checkRegions} (${result.count} rows)`)
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
