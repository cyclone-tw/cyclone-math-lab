import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const site = path.join(root, 'site')
const out = path.join(root, 'docs')
const catalog = JSON.parse(readFileSync(path.join(site, 'catalog.json'), 'utf8'))

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(site, out, { recursive: true })

for (const activity of catalog.activities ?? []) {
  const source = path.join(root, activity.source)
  const dest = path.join(out, 'play', activity.slug)
  if (activity.kind === 'vite') {
    execSync('pnpm run build', { cwd: source, stdio: 'inherit' })
    cpSync(path.join(source, 'dist'), dest, { recursive: true })
  } else if (activity.kind === 'static') {
    cpSync(source, dest, { recursive: true })
  } else {
    throw new Error(`未知的活動類型：${activity.kind}（${activity.slug}）`)
  }
}

console.log(`site written to ${out}`)
