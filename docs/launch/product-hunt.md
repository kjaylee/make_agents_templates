# Product Hunt Launch Post

> **Launch time:** D-0, 9:00 AM PST (simultaneous with Show HN + X)
> **URL:** producthunt.com/posts/forge-agent-builder

---

## Tagline (60 chars max)

**Forge Claude agents the way you brief a teammate**

## Description (260 chars max)

Describe what your agent should do in plain English. Forge generates production-ready YAML, tests it in a sandbox, and ships it in under 60 seconds. Battle Mode lets you pit two agents head-to-head — share the verdict on X.

## Full Description

### The Problem

Creating Claude Agents today requires deep knowledge of MCP URLs, permission policies, agent toolset specs, model tradeoffs, and system prompt engineering. Most practitioners know only 1-2 of these. Copy-pasting templates doesn't work because every use case is different. There's no way to test or share agents.

### Forge is the `docker init` for Claude agents

**1. Describe the job** — Type what your agent should do in plain English. Or paste a Slack thread, meeting notes, or workflow description.

**2. Forge hammers it out** — Claude Opus 4.6 generates a production-ready YAML config with numbered instructions, escape hatches, MCP server matching, and model selection — all validated against our schema.

**3. Edit in a real editor** — Monaco Editor with our custom forge-light theme, real-time Zod validation, lint scoring (0-100), and auto-fix suggestions.

**4. Test in a sandbox** — One-click execution with a visual Trace Viewer showing every tool call as a node graph. See exactly what your agent does.

**5. Ship or share** — Deploy to Claude Console, fork from the gallery, or battle two agents head-to-head and share the results.

### Wow Factors

- **Battle Mode** — Same input, two agents, side-by-side traces, Opus as judge. Share the verdict card on X.
- **Ember Receipt** — Every sandbox run generates a beautiful receipt-style card: agent name, trace timeline, token costs. Print it or share it.
- **Conversation → Agent** — Paste a Slack thread or meeting notes → Forge extracts the repeated task and generates an agent for it.
- **Prompt Fuzzer** — Automatically runs 50 edge cases (adversarial, ambiguous, injection) against your agent. Download the CSV.
- **Agent Lineage Tree** — See who forked your agent and what they improved. Git-graph style visualization.
- **Nocturnal Forge** — Your agents run canary tests overnight. Morning email digest: "3 passed, 2 hallucinated."

### Built with

Claude Opus 4.6, Next.js 16, TypeScript, Tailwind CSS, Drizzle ORM, Framer Motion, react-flow

---

## Media Assets Needed

- [ ] Hero image: 1270x760 — Hammer animation screenshot (YAML streaming)
- [ ] Gallery image 1: Forge Composer (40/60 split, intent + YAML)
- [ ] Gallery image 2: Battle Mode (side-by-side traces + Judge verdict)
- [ ] Gallery image 3: Ember Receipt (4:5 card)
- [ ] Gallery image 4: Trace Viewer (node graph)
- [ ] Gallery image 5: Gallery page (3-column grid)
- [ ] Thumbnail: 240x240 — Anvil logo
- [ ] Maker video: 30s — Hammer click → YAML streaming → Sandbox run

## Topics

`AI`, `Developer Tools`, `Productivity`, `Claude`, `Agents`

## First Comment (Maker)

Hi PH! I'm the maker of Forge.

I kept copy-pasting Claude agent YAML configs and tweaking them by hand. After the 10th time, I thought: "Why isn't there a `docker init` for this?"

So I built Forge. Describe what you want in plain English → get a production agent in under 60 seconds, tested in a sandbox, with a lint score.

My favorite feature is Battle Mode — pit two agents against each other with the same input and let Opus judge who wins. The share cards look incredible on X.

Would love your feedback!
