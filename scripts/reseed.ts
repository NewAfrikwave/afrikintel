import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // Clear all monitor-related data
  await db.check.deleteMany()
  await db.serverMetric.deleteMany()
  await db.incidentUpdate.deleteMany()
  await db.incident.deleteMany()
  await db.monitor.deleteMany()
  await db.anomalyAlert.deleteMany()
  await db.incidentGroup.deleteMany()
  await db.alertDedup.deleteMany()
  await db.notificationLog.deleteMany()
  console.log('Cleared all data')

  // Update settings
  const demoSetting = await db.setting.findUnique({ where: { key: 'demoMode' } })
  if (demoSetting) {
    await db.setting.update({ where: { key: 'demoMode' }, data: { value: 'false' } })
  } else {
    await db.setting.create({ data: { id: 's_demoMode', key: 'demoMode', value: 'false' } })
  }
  const siteName = await db.setting.findUnique({ where: { key: 'siteName' } })
  if (siteName) {
    await db.setting.update({ where: { key: 'siteName' }, data: { value: 'Afrikintel' } })
  }
  console.log('Settings updated')

  // Re-hash passwords and update emails
  const users = await db.user.findMany()
  for (const u of users) {
    const newEmail = u.email.replace(/@nmon\.io$/, '@afrikintel.com')
    const hashed = await bcrypt.hash(u.password?.startsWith('$2') ? 'admin' : u.password || 'admin', 10)
    // Set known passwords: admin/admin, ops/ops, viewer/view
    const password = u.email.includes('admin') ? 'admin' : u.email.includes('ops') ? 'ops' : 'view'
    const hashedPw = await bcrypt.hash(password, 10)
    await db.user.update({
      where: { id: u.id },
      data: { email: newEmail, password: hashedPw },
    })
    console.log(`Updated user: ${newEmail}`)
  }

  // Create real-target monitors
  const monitors = [
    { name: 'Google', type: 'website', target: 'https://google.com', interval: 60, description: 'Google homepage', region: 'global', tags: 'demo,real', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'Cloudflare', type: 'website', target: 'https://cloudflare.com', interval: 60, description: 'Cloudflare homepage', region: 'global', tags: 'demo,real', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'GitHub', type: 'website', target: 'https://github.com', interval: 60, description: 'GitHub homepage', region: 'global', tags: 'demo,real', checkRegions: 'us-east,eu-west' },
    { name: 'GitHub API', type: 'service', target: 'api.github.com', port: 443, interval: 60, description: 'GitHub REST API on 443', region: 'global', tags: 'demo,real', checkRegions: 'us-east,eu-west' },
    { name: 'Google DNS', type: 'service', target: '8.8.8.8', port: 53, interval: 60, description: 'Google public DNS TCP', region: 'global', tags: 'demo,real', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'Cloudflare DNS', type: 'service', target: '1.1.1.1', port: 53, interval: 60, description: 'Cloudflare public DNS TCP', region: 'global', tags: 'demo,real', checkRegions: 'us-east,eu-west,ap-southeast' },
    { name: 'Google DNS Resolve', type: 'dns', target: 'google.com', interval: 60, description: 'DNS resolution check', region: 'global', tags: 'demo,real', checkRegions: 'us-east,eu-west' },
    { name: 'Cloudflare Ping', type: 'ping', target: '1.1.1.1', interval: 60, description: 'ICMP ping to Cloudflare', region: 'global', tags: 'demo,real' },
    { name: 'Google Ping', type: 'ping', target: '8.8.8.8', interval: 60, description: 'ICMP ping to Google DNS', region: 'global', tags: 'demo,real' },
    { name: 'GitHub Blacklist', type: 'blacklist', target: '140.82.121.4', interval: 300, description: 'Check GitHub IP against major blacklists', region: 'global', tags: 'demo,real', checkRegions: 'us-east' },
  ]
  for (const m of monitors) {
    await db.monitor.create({ data: { ...m, status: 'pending' as const, uptime: 100, responseTime: null } })
  }
  console.log(`Created ${monitors.length} monitors`)

  // Update notification channels
  await db.notificationChannel.updateMany({
    where: { name: 'Ops Team Email' },
    data: { config: JSON.stringify({ address: 'ops@afrikintel.com' }) },
  })
  console.log('Updated notification channels')

  // Update status page
  await db.statusPage.updateMany({
    where: { slug: 'main' },
    data: { title: 'Afrikintel Status', description: 'Real-time status of all monitored services' },
  })
  console.log('Updated status page')
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
