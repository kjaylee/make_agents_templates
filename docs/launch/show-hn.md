# Show HN Post

> **URL:** news.ycombinator.com
> **Timing:** D-0, 9:00 AM PST (simultaneous with Product Hunt + X)

---

## Title (80 chars max)

**Show HN: Forge – Generate, test, and share Claude agents from plain English**

## Body

I built Forge because I got tired of hand-crafting Claude agent YAML configs. MCP URLs, permission policies, system prompt engineering, model selection — it's a lot to get right, and copy-pasting templates never fits your exact use case.

Forge is like `docker init` for Claude agents:

1. Describe what your agent should do in plain English
2. Forge (Opus 4.6) generates a validated YAML config with numbered instructions, MCP server matching, and model selection
3. Edit in Monaco Editor with real-time Zod validation and lint scoring
4. Test in a sandbox with a visual Trace Viewer (every tool call as a node graph)
5. Share via the gallery, fork others' agents, or battle two agents head-to-head

Tech stack: Next.js 16 + Turbopack, TypeScript, Tailwind, Drizzle ORM, Anthropic SDK, react-flow, Framer Motion.

The 6-stage pipeline: Haiku classifies intent → retrieves similar templates → recommends MCPs → Opus generates via tool_use → Haiku lints for anti-patterns → YAML streams character-by-character.

Some features I'm particularly proud of:

- **Battle Mode**: Same input, two agents, side-by-side execution. Opus judges the winner. The share card is designed for X/LinkedIn virality.

- **Ember Receipt**: Every sandbox run generates a receipt-style card (think thermal printer aesthetic) with trace timeline, token costs, and an anvil watermark. Download as PNG or share via OG image.

- **Prompt Fuzzer**: 50 edge cases (adversarial, ambiguous, empty, injection) auto-generated and run against your agent. CSV export.

- **Conversation → Agent**: Paste a Slack thread → Forge extracts the repeated task and generates an agent for it.

The design system is called "Anvil" — warm paper textures, ember orange accents, hammer animations, and serif display type. Every screenshot is designed to stop scrolling.

Would love feedback, especially on the generation quality and the sandbox UX.

GitHub: github.com/kjaylee/make_agents_templates
