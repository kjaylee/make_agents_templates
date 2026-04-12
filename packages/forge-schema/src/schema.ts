/**
 * Forge — Drizzle schema.
 * Mirrors docs/PLAN.md §4.2 core data model.
 */
import {
  pgTable,
  pgEnum,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  uuid
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ──────────────────────────────────────────────────
export const userTier = pgEnum('user_tier', [
  'free',
  'pro',
  'team',
  'enterprise'
])

export const runVerdict = pgEnum('run_verdict', [
  'pending',
  'success',
  'error',
  'timeout'
])

export const battleOutcome = pgEnum('battle_outcome', [
  'A',
  'B',
  'tie',
  'no_verdict'
])

// ─── users ──────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    githubId: varchar('github_id', { length: 64 }),
    clerkId: varchar('clerk_id', { length: 64 }).notNull(),
    tier: userTier('tier').notNull().default('free'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    clerkIdx: uniqueIndex('users_clerk_idx').on(t.clerkId)
  })
)

// ─── agents ─────────────────────────────────────────────────
export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable: seed templates have no owner (system-owned public templates).
    ownerId: uuid('owner_id').references(() => users.id, {
      onDelete: 'cascade'
    }),
    slug: varchar('slug', { length: 128 }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    yaml: text('yaml').notNull(),
    isPublic: boolean('is_public').notNull().default(false),
    // TODO(phase-2): add self-referential FK once parent tracking lands.
    parentId: uuid('parent_id'),
    mcpServers: jsonb('mcp_servers').$type<string[]>().notNull().default([]),
    model: varchar('model', { length: 64 }).notNull(),
    skillIds: jsonb('skill_ids').$type<string[]>().notNull().default([]),
    version: integer('version').notNull().default(1),
    forkCount: integer('fork_count').notNull().default(0),
    lintScore: integer('lint_score'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    slugIdx: uniqueIndex('agents_slug_idx').on(t.slug),
    ownerIdx: index('agents_owner_idx').on(t.ownerId),
    publicIdx: index('agents_public_idx').on(t.isPublic)
  })
)

// ─── forks ──────────────────────────────────────────────────
export const forks = pgTable(
  'forks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceAgentId: uuid('source_agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    targetAgentId: uuid('target_agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    pairIdx: uniqueIndex('forks_pair_idx').on(t.sourceAgentId, t.targetAgentId)
  })
)

// ─── runs ───────────────────────────────────────────────────
export const runs = pgTable(
  'runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    input: jsonb('input').notNull(),
    output: jsonb('output'),
    traceUrl: text('trace_url'),
    tokensIn: integer('tokens_in').notNull().default(0),
    tokensOut: integer('tokens_out').notNull().default(0),
    costCents: integer('cost_cents').notNull().default(0),
    verdict: runVerdict('verdict').notNull().default('pending'),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    agentIdx: index('runs_agent_idx').on(t.agentId),
    userIdx: index('runs_user_idx').on(t.userId)
  })
)

// ─── battles ────────────────────────────────────────────────
export const battles = pgTable('battles', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentA: uuid('agent_a')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  agentB: uuid('agent_b')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  input: jsonb('input').notNull(),
  winner: battleOutcome('winner').notNull().default('no_verdict'),
  judgeNotes: text('judge_notes'),
  scoreA: integer('score_a'),
  scoreB: integer('score_b'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow()
})

// ─── mcp_catalog ────────────────────────────────────────────
export const mcpCatalog = pgTable(
  'mcp_catalog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 64 }).notNull(),
    url: text('url').notNull(),
    description: text('description'),
    category: varchar('category', { length: 64 }),
    popularity: integer('popularity').notNull().default(0)
  },
  (t) => ({
    nameIdx: uniqueIndex('mcp_name_idx').on(t.name)
  })
)

// ─── skills_catalog ─────────────────────────────────────────
export const skillsCatalog = pgTable(
  'skills_catalog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    skillId: varchar('skill_id', { length: 64 }).notNull(),
    source: varchar('source', { length: 32 }).notNull(), // 'anthropic' | 'community'
    description: text('description'),
    approved: boolean('approved').notNull().default(false)
  },
  (t) => ({
    skillIdIdx: uniqueIndex('skills_skill_id_idx').on(t.skillId)
  })
)

// ─── relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
  runs: many(runs)
}))

export const agentsRelations = relations(agents, ({ one, many }) => ({
  owner: one(users, { fields: [agents.ownerId], references: [users.id] }),
  runs: many(runs)
}))

export const runsRelations = relations(runs, ({ one }) => ({
  agent: one(agents, { fields: [runs.agentId], references: [agents.id] }),
  user: one(users, { fields: [runs.userId], references: [users.id] })
}))
