# Design — web-phase3 (Wow Factors)

> **Feature:** Forge Phase 3 — Launch-Critical Wow Factors
> **Plan:** docs/01-plan/features/web-phase3.plan.md
> **Anvil Design System:** docs/DESIGN.md
> **Created:** 2026-04-12

---

## 1. Architecture

```
apps/web/
├── app/
│   ├── api/
│   │   ├── battle/route.ts           ← W1 POST SSE (A/B 동시 실행 + Judge)
│   │   ├── receipt/[id]/route.ts     ← W2 GET (PDF 또는 HTML)
│   │   ├── receipt/[id]/og/route.ts  ← W2 GET (OG 이미지)
│   │   ├── extract/route.ts          ← W3 POST (대화 → 의도 추출)
│   │   ├── fuzz/route.ts             ← W4 POST SSE (50 케이스 실행)
│   │   ├── lineage/[slug]/route.ts   ← W5 GET (포크 그래프 데이터)
│   │   ├── nocturnal/subscribe/route.ts ← W6 POST (카나리 등록)
│   │   └── nocturnal/cron/route.ts   ← W6 Vercel Cron 엔드포인트
│   ├── battle/
│   │   └── [id]/page.tsx             ← W1 UI
│   ├── forge/
│   │   ├── extract/page.tsx          ← W3 대화 입력 UI
│   │   └── voice/page.tsx            ← W7 PWA (optional)
│   ├── run/
│   │   └── [id]/receipt/page.tsx     ← W2 UI
│   └── gallery/
│       └── [slug]/
│           ├── fuzz/page.tsx         ← W4 UI
│           └── lineage/page.tsx      ← W5 UI
├── components/
│   ├── battle/
│   │   ├── battleArena.tsx           ← 좌우 분할 트레이스
│   │   ├── judgeCard.tsx             ← Opus 심판 결과
│   │   └── battleOgCard.tsx          ← 공유 카드
│   ├── receipt/
│   │   ├── emberReceipt.tsx          ← 영수증 컴포넌트
│   │   ├── traceTimeline.tsx         ← 세로 타임라인
│   │   └── scribeDivider.tsx         ← 이중 세리프 구분선
│   ├── extract/
│   │   └── conversationInput.tsx     ← 대화 텍스트 입력
│   ├── fuzzer/
│   │   ├── fuzzPanel.tsx             ← Fuzzer 제어
│   │   └── fuzzResults.tsx           ← 성공/실패 히스토그램
│   ├── lineage/
│   │   └── lineageTree.tsx           ← react-flow 기반 포크 그래프
│   └── nocturnal/
│       └── canaryToggle.tsx          ← 카나리 모드 스위치
└── lib/
    ├── receipt/
    │   ├── pdfRenderer.ts            ← HTML → PDF (server-side)
    │   └── ogRenderer.ts             ← OG 이미지 생성
    ├── battle.ts                      ← Judge Opus 호출
    ├── fuzzer.ts                      ← 엣지 케이스 생성
    ├── lineage.ts                     ← 재귀 포크 트리 빌드
    └── nocturnal/
        ├── cron.ts                    ← 카나리 실행 로직
        └── email.ts                   ← 다이제스트 이메일 템플릿
```

---

## 2. Feature Designs

### 2.1 Battle Mode (W1)

**Route:** `/battle/[id]`, where id = battle session id

**UI Layout:**
```
┌────────────────────────────────────────────┐
│ Battle: incident-commander vs triage-v2    │
│ Input: "P0 outage in payment service"      │
├──────────────────┬─────────────────────────┤
│ AGENT A          │ AGENT B                 │
│ ┌──────────────┐ │ ┌──────────────┐        │
│ │ TraceViewer  │ │ │ TraceViewer  │        │
│ │ (left-right) │ │ │ (left-right) │        │
│ └──────────────┘ │ └──────────────┘        │
│ Output preview   │ Output preview          │
│ 4,210 tokens     │ 5,105 tokens            │
│ $0.28            │ $0.34                   │
├──────────────────┴─────────────────────────┤
│ 🏆 WINNER: Agent A                         │
│ Score: 8.6 vs 7.1                          │
│ Judge: "A confirmed user intent in step 3" │
│ [Share this battle] [Run another input]    │
└────────────────────────────────────────────┘
```

**Judge Prompt (Opus):**
```
You are judging two AI agents that received the same input.
Return JSON: { winner: 'A'|'B'|'tie', scoreA: 0-10, scoreB: 0-10, notes: string }
Rubric: correctness, reasoning quality, tool use efficiency, user alignment.
```

**API Contract:**
```
POST /api/battle
Body: { agentASlug, agentBSlug, input }
Response: text/event-stream
Events: { type: 'agent_a_event', data: SandboxEvent }
        { type: 'agent_b_event', data: SandboxEvent }
        { type: 'verdict', data: { winner, scoreA, scoreB, notes } }
        { type: 'done' }
```

**Share Card (OG 2048x1080):**
- 상단: "Agent Battle" 타이틀
- 좌우: 에이전트 이름 + 점수 + 짧은 설명
- 중앙: "🏆 WINNER: Agent A" with gold sweep 스타일
- 하단: forge.agents.sh URL + battle id

---

### 2.2 Ember Receipt (W2)

**Route:** `/run/[id]/receipt`

**UI (4:5 비율, 화면 + PDF + OG 동일 소스):**
```
┌────────────────────────────────────────┐
│      [anvil watermark 12% opacity]     │
│                                        │
│            Ember Receipt               │
│    2026-04-12T14:32:17Z · run/9f3a…    │
│════════════════════════════════════════│
│ Agent      incident-commander v3       │
│ Model      Opus 4.6                    │
│ MCP        sentry · linear · slack     │
│ Cost       $0.38                       │
│ Duration   00:01:47                    │
│ Tokens     12,350 / 4,210              │
│════════════════════════════════════════│
│ INPUT                                  │
│ > [Code preview, 4 lines]              │
│════════════════════════════════════════│
│ TRACE                                  │
│ ■ 00:00.12  🔨 sentry.get_issue ✓210ms │
│ ■ 00:00.34  🔨 repo.search     ✓480ms  │
│ ■ 00:01.02  🔨 linear.create   ✓720ms  │
│ ■ 00:01.47  💬 assistant reply          │
│════════════════════════════════════════│
│ OUTPUT                                 │
│ [ink.700 preview, 300 chars + expand]  │
│════════════════════════════════════════│
│ Forged by @alice  •  Real run          │
│ QR → run.forge.sh/r/<id>               │
│        Made with Forge                 │
└────────────────────────────────────────┘
```

**Rendering:**
- Screen view: React component with Anvil styling
- PDF: Server-side puppeteer (or html2canvas client fallback)
- OG image: `@vercel/og` with same layout at 2048x1080
- Slack unfurl: oEmbed via `/api/receipt/[id]/oembed`

**Animation (화면 view):**
- Receipt unroll: 900ms ease-out (paper slip slide-in)
- Dab: ember 잉크 자국 200ms

---

### 2.3 Conversation → Agent (W3)

**Route:** `/forge/extract`

**UI:**
```
┌────────────────────────────────────────┐
│ Describe an existing routine.          │
│ We'll turn it into an agent.           │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Paste a conversation, meeting     │ │
│ │ notes, or describe a workflow...  │ │
│ │                                    │ │
│ │ [textarea 10 rows]                 │ │
│ └────────────────────────────────────┘ │
│                                        │
│        [🔨 Forge from this]            │
└────────────────────────────────────────┘
```

**Pipeline:**
1. Haiku classifier: "Is this a description of a repeated task?" → task summary
2. Opus generator (existing): task summary → Template
3. Redirect to /forge with YAML + classification context

**API:**
```
POST /api/extract
Body: { text: string }
Response: SSE (same ForgeEvent format as /api/forge)
```

---

### 2.4 Prompt Fuzzer (W4)

**Route:** `/gallery/[slug]/fuzz`

**Flow:**
1. "Run Fuzzer" button on agent detail page
2. Haiku generates 50 edge cases in 4 categories:
   - Adversarial (12): injection attempts, conflicting instructions
   - Ambiguous (13): vague input, missing context
   - Empty (13): whitespace, very short input
   - Injection (12): "Ignore previous instructions..."
3. Each case runs in sandbox (mock for MVP, real with API)
4. Results: pass/fail per case, aggregate score

**UI:**
```
┌────────────────────────────────────────┐
│ Fuzzer: incident-commander              │
│ ■■■■■■■■■■■■■■■■■■░░  42/50 complete    │
│                                        │
│  Score: 84/100                         │
│  ✓ 42 passed   ✗ 8 failed              │
│                                        │
│  Pass rate by category:                │
│  Adversarial  ██████░░░░  60%          │
│  Ambiguous    █████████░  92%          │
│  Empty        ██████████  100%         │
│  Injection    ███████░░░  75%          │
│                                        │
│  [Download CSV] [View failures]        │
└────────────────────────────────────────┘
```

**API:**
```
POST /api/fuzz
Body: { agentSlug }
Response: SSE
Events: { type: 'progress', data: { completed: number, total: 50 } }
        { type: 'case_result', data: { case, verdict, output } }
        { type: 'done', data: { score, passRateByCategory, failures } }
```

---

### 2.5 Agent Lineage Tree (W5)

**Route:** `/gallery/[slug]/lineage`

**UI:** react-flow 기반 git-graph 스타일
```
                root: incident-commander v1
                          │
                  ┌───────┼───────┐
                  │       │       │
                  v2     v2.1   v2-fork (@bob)
                  │               │
                  v3 (current)   v2-fork-tuned
```

**노드:**
- Root: ink.900 border, crown icon
- 중간: ember.500 border
- 현재 에이전트: ember pulse + "CURRENT" 배지
- 포크: iron.600 border + 사용자 아바타

**인터랙션:**
- 노드 클릭 → 해당 에이전트 페이지로 이동
- 호버 → popover에 diff 요약 (변경된 필드)

**API:**
```
GET /api/lineage/[slug]
Response: { nodes: [...], edges: [...], currentId: string }
```

---

### 2.6 Nocturnal Forge (W6)

**Components:**
1. **Canary Toggle** — Agent Detail 페이지에 "Nightly canary" 스위치
2. **Cron endpoint** — `/api/nocturnal/cron` (Vercel Cron 02:00 UTC)
3. **Email** — 06:30 local time, Resend API

**Flow:**
```
User toggles "Nightly canary" on agent
  ↓
POST /api/nocturnal/subscribe { agentSlug, sampleInputs }
  ↓ stores canary_subscriptions table
  ↓
Vercel Cron (02:00 UTC daily)
  ↓ runs each canary in sandbox
  ↓ stores results in canary_runs table
  ↓
Cron also triggers digest email at user's local 06:30
  ↓ Resend API → email template
```

**Email Design (DESIGN.md §9.8):**
- 🌙 hero card
- Per-agent card with canary pass rate + health gauge
- "Review full trace →" CTA
- Dark mode compatible

**DB Tables (Drizzle):**
```
canary_subscriptions (id, user_id, agent_id, sample_inputs, enabled, created_at)
canary_runs (id, subscription_id, run_id, verdict, duration_ms, cost_cents, created_at)
```

---

### 2.7 Voice Forging (W7) — Optional

**Route:** `/forge/voice` (mobile PWA)

**Minimal MVP:**
1. Voice orb press → MediaRecorder API
2. Release → POST audio blob to /api/voice/transcribe
3. Whisper API (or mock) returns transcript
4. Transcript → existing /api/forge pipeline
5. Mobile editor (read-only + Fork)

**PWA:** manifest.json + service worker (optional)

---

## 3. Data Flow Diagrams

### 3.1 Battle Flow
```
Client: Select 2 agents + input → POST /api/battle
Server: Fetch both YAMLs → run A and B in parallel mock sandboxes
        Stream both event streams to client
        After both 'done', call Judge Opus with results
        Emit 'verdict' event
Client: Render traces side-by-side, show Judge card
```

### 3.2 Receipt Flow
```
Client: Sandbox finishes → receipt data stored
        Navigate to /run/:id/receipt
Server: Fetch run data from DB (mock for MVP)
Client: Render <EmberReceipt> component
        "Download PDF" → GET /api/receipt/:id (server-side PDF)
        "Share" → GET /api/receipt/:id/og (2048x1080 image)
```

### 3.3 Nocturnal Flow
```
Vercel Cron (02:00 UTC daily)
  ↓ GET /api/nocturnal/cron
Server: Fetch all enabled subscriptions
        For each: run canary inputs in sandbox
        Store results
        Group by user → prepare digest
        At user's local 06:30: send email via Resend
```

---

## 4. API Contracts

| Endpoint | Method | Auth | Rate Limit | Purpose |
|----------|:------:|:----:|:----------:|---------|
| /api/battle | POST | required | 10/min | A/B battle execution |
| /api/receipt/[id] | GET | optional | 60/min | Receipt HTML/PDF |
| /api/receipt/[id]/og | GET | optional | 120/min | OG image |
| /api/extract | POST | required | 20/min | Conversation → agent |
| /api/fuzz | POST | required | 5/min | 50-case fuzzer |
| /api/lineage/[slug] | GET | optional | 60/min | Fork tree data |
| /api/nocturnal/subscribe | POST | required | 10/min | Enable canary |
| /api/nocturnal/cron | GET | secret | N/A | Vercel Cron endpoint |

---

## 5. Implementation Order

### Week 1 (Launch Critical)
1. W2 Ember Receipt — 가장 자주 공유될 자산, 먼저 확정
2. W1 Battle Mode — 트위터 스레드 바이럴 핵심
3. W3 Conversation → Agent — activation 퍼널

### Week 2 (Differentiation)
4. W4 Prompt Fuzzer
5. W5 Lineage Tree
6. W6 Nocturnal Forge

### Week 3 (Optional)
7. W7 Voice Forging PWA

---

## 6. Dependencies

| Package | Purpose | Bundle Impact |
|---------|---------|:------------:|
| `@vercel/og` | OG image rendering (already in Next.js) | 0 |
| `html2canvas` | Client-side receipt snapshot | ~150KB |
| `resend` | Nocturnal digest email | ~30KB |
| `csv-stringify` | Fuzzer CSV export | ~20KB |

Note: Voice Forging (W7) would require `openai` SDK for Whisper, but is optional.

---

## 7. Acceptance Criteria

- [ ] W1: Battle Mode renders side-by-side traces + Judge verdict
- [ ] W1: Share card generated as 2048x1080 OG image
- [ ] W2: Ember Receipt rendered on screen with Anvil styling
- [ ] W2: PDF download working (puppeteer or html2canvas)
- [ ] W2: OG image endpoint returns 2048x1080 receipt card
- [ ] W3: Conversation input → agent YAML generated
- [ ] W4: Fuzzer generates 50 edge cases + runs mock sandbox
- [ ] W4: CSV export of failures
- [ ] W5: Lineage Tree shows fork relationships in react-flow
- [ ] W6: Canary toggle + cron endpoint + digest email template
- [ ] Optional: W7 voice orb records + transcribes
- [ ] typecheck + build passes
