/**
 * Seed Forge DB with the 10 templates in docs/seeds/*.yaml.
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm db:seed
 *
 * Reads each YAML file, validates it against templateSchema, and upserts
 * the agents table with `slug = metadata.template`.
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import { agents } from '@forge/schema/schema'
import { templateSchema } from '@forge/schema/validators'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SEEDS_DIR = resolve(__dirname, '../docs/seeds')

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required')
  }

  const client = postgres(url, { max: 1 })
  const db = drizzle(client)

  const files = (await readdir(SEEDS_DIR))
    .filter((f) => f.endsWith('.yaml'))
    .sort()

  console.log(`→ Seeding ${files.length} templates from ${SEEDS_DIR}`)

  let ok = 0
  let failed = 0

  for (const file of files) {
    const raw = await readFile(join(SEEDS_DIR, file), 'utf8')
    const parsed = parseYaml(raw)

    const result = templateSchema.safeParse(parsed)
    if (!result.success) {
      console.error(`✗ ${file} — invalid:`, result.error.format())
      failed += 1
      continue
    }

    const t = result.data
    const mcpServerNames = (t.mcp_servers ?? []).map((m) => m.name)
    const skillIds = (t.skills ?? []).map((s) => s.skill_id)

    await db
      .insert(agents)
      .values({
        slug: t.metadata.template,
        title: t.name,
        description: t.description,
        yaml: raw,
        isPublic: true,
        model: t.model,
        mcpServers: mcpServerNames,
        skillIds,
        version: 1
      })
      .onConflictDoUpdate({
        target: agents.slug,
        set: {
          title: t.name,
          description: t.description,
          yaml: raw,
          model: t.model,
          mcpServers: mcpServerNames,
          skillIds,
          updatedAt: sql`now()`
        }
      })

    console.log(`✓ ${file} → ${t.metadata.template}`)
    ok += 1
  }

  await client.end()
  console.log(`\n— Done: ${ok} upserted, ${failed} failed`)

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
