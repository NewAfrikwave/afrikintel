import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const standalone = path.join(root, '.next', 'standalone')

function copyDir(from, to) {
  if (!fs.existsSync(from)) return
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.cpSync(from, to, { recursive: true, force: true })
}

copyDir(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'))
copyDir(path.join(root, 'public'), path.join(standalone, 'public'))

console.log('Copied standalone assets')
