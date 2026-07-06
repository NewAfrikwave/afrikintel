process.on('unhandledRejection', (e) => {
  console.error('[unhandledRejection]', e)
})
process.on('uncaughtException', (e) => {
  console.error('[uncaughtException]', e)
})
import('./index.ts')
