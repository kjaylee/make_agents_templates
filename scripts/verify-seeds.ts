/**
 * Validate every docs/seeds/*.yaml file against templateSchema without touching the DB.
 * Intended for CI and local dry-runs.
 *
 * Usage:
 *   pnpm tsx scripts/verify-seeds.ts
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { templateSchema } from '@forge/schema/validators'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SEEDS_DIR = resolve(__dirname, '../docs/seeds')

const files = (await readdir(SEEDS_DIR))
  .filter((f) => f.endsWith('.yaml'))
  .sort()

let ok = 0
let failed = 0

for (const file of files) {
  const raw = await readFile(join(SEEDS_DIR, file), 'utf8')
  const parsed = parseYaml(raw)
  const result = templateSchema.safeParse(parsed)

  if (result.success) {
    const t = result.data
    const mcps = (t.mcp_servers ?? []).length
    const skills = (t.skills ?? []).length
    console.log(
      `✓ ${file.padEnd(36)} ${t.metadata.template.padEnd(28)} ${t.model.padEnd(22)} mcps=${mcps} skills=${skills}`
    )
    ok += 1
  } else {
    console.error(`✗ ${file}:`)
    console.error(JSON.stringify(result.error.format(), null, 2))
    failed += 1
  }
}

console.log(`\n${ok}/${files.length} seeds valid`)
process.exit(failed > 0 ? 1 : 0)
