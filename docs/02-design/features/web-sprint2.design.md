# Design — web-sprint2

> **Feature:** Forge Web Sprint 2 — Auth, Editor, Sandbox
> **Plan:** `docs/01-plan/features/web-sprint2.plan.md`
> **Design System:** `docs/DESIGN.md` (Anvil)
> **Created:** 2026-04-10

---

## 1. Architecture

```
apps/web/
├── app/
│   ├── api/
│   │   ├── forge/route.ts           (기존, rate limit 추가)
│   │   ├── gallery/route.ts         (기존)
│   │   ├── agents/[slug]/
│   │   │   ├── route.ts             (기존)
│   │   │   └── fork/route.ts        (기존, auth 강제)
│   │   ├── sandbox/route.ts         ← NEW: 에이전트 실행
│   │   └── webhook/clerk/route.ts   ← NEW: Clerk webhook
│   ├── forge/
│   │   ├── page.tsx                 (기존, Monaco 교체)
│   │   └── [id]/test/page.tsx       ← NEW: Sandbox UI
│   ├── gallery/
│   │   ├── page.tsx                 (기존)
│   │   └── [slug]/page.tsx          ← NEW: Agent Detail
│   ├── sign-in/[[...sign-in]]/page.tsx  ← NEW
│   ├── sign-up/[[...sign-up]]/page.tsx  ← NEW
│   ├── layout.tsx                   (ClerkProvider 래핑)
│   └── page.tsx                     (기존)
├── components/
│   ├── forge/
│   │   ├── monacoEditor.tsx         ← NEW: Monaco 래퍼
│   │   ├── lintPanel.tsx            ← NEW: 인라인 린트 UI
│   │   └── costEstimator.tsx        ← NEW: 비용 그래프
│   ├── sandbox/
│   │   ├── sandboxPanel.tsx         ← NEW: 실행 패널
│   │   ├── traceViewer.tsx          ← NEW: react-flow 그래프
│   │   └── costCounter.tsx          ← NEW: 실시간 카운터
│   └── gallery/
│       └── agentDetail.tsx          ← NEW: 상세 뷰
├── lib/
│   ├── auth.ts                      ← NEW: Clerk 헬퍼
│   ├── rateLimit.ts                 ← NEW: sliding window
│   ├── managedAgents.ts             ← NEW: Agents API 클라이언트
│   └── env.ts                       ← NEW: Zod 환경변수 검증
└── middleware.ts                     ← NEW: Clerk + rate limit
```

---

## 2. Component Design

### 2.1 Auth Flow (C1)

**Sign In / Sign Up**
- Clerk 내장 `<SignIn>` / `<SignUp>` 컴포넌트 사용
- Anvil 테마: bone.100 배경, ember.500 primary 버튼
- redirect: sign-in 후 → `/forge` (의도한 페이지)

**Middleware**
```
Public routes:  /, /gallery, /gallery/[slug], /api/gallery, /api/agents/[slug]
Protected:      /forge, /api/forge, /api/agents/*/fork, /api/sandbox
```

**User Sync**
- Clerk `user.created` webhook → POST /api/webhook/clerk
- `users` 테이블 upsert: `{ id, email, clerkId, tier: 'free' }`
- 프론트: `currentUser()` → tier 확인 → rate limit 적용

### 2.2 Monaco Editor (C2)

**파일:** `components/forge/monacoEditor.tsx`

```
┌─────────────────────────────────────────┐
│ [lint: 92/100]           [Copy] [Ship]  │ ← toolbar
├─────────────────────────────────────────┤
│  1 │ name: incident-commander           │
│  2 │ description: Monitors Sentry...    │
│  3 │ model: claude-opus-4-6             │
│  4 │ system: |                          │
│  5 │   You are an incident...           │
│  6 │   ~~Step 1: Vague instruction~~    │ ← lint error marker
│  7 │ mcp_servers:                       │
│  8 │   - name: sentry                   │
│    │     ...                            │
└─────────────────────────────────────────┘
```

**테마 (forge-light)**
| Token | Color | Usage |
|-------|-------|-------|
| keyword | ember.600 `#B63F0E` | `name:`, `model:`, `system:` |
| string | jade.500 `#4A9B7F` | 문자열 값 |
| key | iron.600 `#3D4D58` | YAML 키 |
| lineNumber | ink.300 `#B8A99C` | 라인 넘버 |
| activeLine | ember.100 `#FCE8DC` | 활성 라인 배경 |
| background | bone.50 `#FFFDF8` | 에디터 배경 |

**Zod 검증**
- `onChange` → `templateSchema.safeParse(yaml.parse(value))`
- 실패 시 → `editor.setModelMarkers()` (빨간 밑줄 + 메시지)
- 디바운스: 300ms

**로딩 전략**
- `dynamic(() => import('@monaco-editor/react'), { ssr: false })`
- Suspense fallback: 기존 `<pre>` 기반 읽기 전용 뷰

### 2.3 Sandbox Runner (F1)

**API: POST /api/sandbox**
```typescript
Request: {
  agentYaml: string     // 전체 YAML
  input: string         // 샘플 입력
  apiKey?: string       // BYOK (optional)
}

Response: text/event-stream (SSE)
Events:
  { type: 'tool_call', data: { name, input, id } }
  { type: 'tool_result', data: { id, output, duration_ms } }
  { type: 'assistant', data: { text, tokens } }
  { type: 'done', data: { totalTokens, costCents, duration_ms } }
  { type: 'error', data: { code, message } }
```

**Managed Agents API 호출 흐름**
```
1. POST /v1/agents → agent_id 생성
2. POST /v1/sessions → session_id 생성
3. SSE stream → tool_call / tool_result / assistant 이벤트 중계
4. 완료 후 agent 삭제 (ephemeral)
```

**BYOK 정책**
- MVP: `ANTHROPIC_API_KEY` 공용 키로 분당 5회 실행
- Pro 이상 또는 자체 키: 무제한
- 키는 요청 헤더로만 릴레이, DB 미저장

### 2.4 Trace Viewer (F2)

**파일:** `components/sandbox/traceViewer.tsx`

```
User ──→ Assistant ──→ sentry.get_issue ──→ Assistant ──→ linear.create
 │                      ✓ 210ms              │            ✓ 720ms
 │                                           │
 │                      repo.search ─────────┘
 │                      ✓ 480ms
 └──────────────────────────────────────────────→ Final Response
                                                   15 tokens
```

**노드 스타일 (Anvil)**
| Type | Border | Background | Icon |
|------|--------|------------|------|
| User | ink.900 | bone.50 | user circle |
| Assistant | ember.500 | bone.50 | flame |
| Tool Call | iron.600 | bone.50 | hammer |
| Tool Result | jade.500 (success) / rust.500 (error) | bone.50 | check / x |

**엣지 스타일**
- 이중선 (Scribe divider 스타일)
- 데이터 흐름: ember dot이 1.5s 주기로 이동
- 실행 중인 노드: ember pulse 애니메이션

**인터랙션**
- 노드 클릭: 상세 패널 확장 (input/output JSON)
- 줌: 스크롤 + 핀치
- 접기: Assistant 노드 더블클릭 → 하위 tool calls 숨김

### 2.5 Prompt Linter UI (F3)

**파일:** `components/forge/lintPanel.tsx`

```
┌─────────────────────────────────────────┐
│ Lint Score: 78/100                      │
│ ████████████████░░░░  3 suggestions     │
├─────────────────────────────────────────┤
│ ⚠ Line 5: Vague instruction            │
│   "Monitor and handle" is too broad.    │
│   [Auto-fix] Add numbered steps         │
│                                         │
│ ⚠ Line 12: Missing escape hatch        │
│   No fallback for uncertain cases.      │
│   [Auto-fix] Add "If unclear, ask..."   │
│                                         │
│ ℹ Line 1: System prompt > 2000 chars   │
│   Consider splitting into sections.     │
└─────────────────────────────────────────┘
```

**Auto-fix 동작**
- 버튼 클릭 → Haiku API 호출로 수정 제안 생성
- Monaco Editor에 diff 하이라이트 표시
- "Apply" / "Dismiss" 선택

### 2.6 Cost Estimator (F4)

**파일:** `components/forge/costEstimator.tsx`

```
┌──────────────────────────────────────┐
│ Monthly Cost Estimate                │
│                                      │
│  Opus    ████████████  $47.20/mo     │
│  Sonnet  ██████        $12.80/mo     │
│  Haiku   ██            $ 3.40/mo     │
│                                      │
│  Based on: 50 runs/day, avg 2K tokens│
│  [Adjust assumptions ↓]              │
└──────────────────────────────────────┘
```

- 입력: runs/day 슬라이더 (1-500), avg tokens (500-10K)
- 모델별 가격: Opus $15/$75, Sonnet $3/$15, Haiku $0.25/$1.25 (per 1M tokens)
- 바 차트: ember (현재 선택 모델), ink.300 (나머지)

### 2.7 Agent Detail Page (F5)

**라우트:** `/gallery/[slug]`

```
┌──────────────────────────────────────────────┐
│ ← Back to Gallery                            │
│                                              │
│ incident-commander                    v3     │
│ Monitors Sentry alerts and creates           │
│ Linear incidents automatically.              │
│                                              │
│ Model: Opus 4.6    MCP: sentry linear slack  │
│ Forks: 47          Created: 2026-04-09       │
│                                              │
│ [Fork] [Ship to Console] [Test in Sandbox]   │
├──────────────────────────────────────────────┤
│ ┌── YAML (read-only Monaco) ──────────────┐  │
│ │  1 │ name: incident-commander           │  │
│ │  2 │ description: Monitors...           │  │
│ │  ...                                    │  │
│ └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

- 상단: 메타데이터 카드 (모델, MCP 칩, 포크 수, 날짜)
- CTA 3개: Fork (인증 필요), Ship to Console, Test in Sandbox
- 하단: Monaco 읽기 전용 뷰 (forge-light 테마)

### 2.8 Rate Limiting (C3)

**구현:** `lib/rateLimit.ts`

```typescript
// Sliding window counter (in-memory Map)
interface RateLimitConfig {
  windowMs: number    // 60_000 (1분)
  maxRequests: number // 5 (unauth) | 20 (auth)
}
```

| Endpoint | Unauth | Auth (free) | Auth (pro+) |
|----------|:------:|:-----------:|:-----------:|
| POST /api/forge | 5/min | 20/min | 60/min |
| POST /api/sandbox | 0 | 5/min | 30/min |
| POST /api/*/fork | 0 | 10/min | 30/min |
| GET /api/gallery | 60/min | 120/min | 120/min |

- 429 응답: `{ error: { code: 'RATE_LIMITED', message, retryAfter } }`
- `Retry-After` 헤더 포함

### 2.9 API Error Format (C4)

**표준 에러 envelope:**
```typescript
interface ApiError {
  error: {
    code: string        // 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'INTERNAL'
    message: string     // 사람 읽기 가능
    details?: unknown   // Zod 에러 등 상세
  }
}
```

모든 API 라우트에 공통 `handleApiError()` 래퍼 적용.

---

## 3. Data Flow

### 3.1 Sandbox 실행 흐름

```
User clicks "Test in Sandbox"
    ↓
/forge/[id]/test page loads
    ↓
User enters sample input + clicks Run
    ↓
POST /api/sandbox { agentYaml, input, apiKey? }
    ↓
Server: POST /v1/agents (create ephemeral agent)
    ↓
Server: POST /v1/sessions (create session with input)
    ↓
Server streams SSE → Client renders Trace Viewer nodes
    ↓
Done → Cost Counter shows total tokens/cost
    ↓
Server: DELETE /v1/agents/:id (cleanup)
```

### 3.2 Monaco 편집 흐름

```
YAML streamed from Forge Engine
    ↓
Monaco Editor receives value
    ↓
User edits YAML manually
    ↓
onChange (debounced 300ms)
    ↓
templateSchema.safeParse(yaml.parse(value))
    ↓
Pass → clear markers
Fail → setModelMarkers (red underlines + messages)
```

---

## 4. Responsive Breakpoints

| Screen | Forge Composer | Sandbox | Gallery Detail |
|--------|---------------|---------|----------------|
| Desktop (>1024px) | 40/60 split | Trace left + Input right | Full width |
| Tablet (768-1024px) | Stacked (intent top, editor bottom) | Stacked | Full width |
| Mobile (<768px) | Intent only → navigate to editor | Not supported (toast: "Open on desktop") | Scrollable |

---

## 5. Dependencies

| Package | Bundle Impact | Mitigation |
|---------|:------------:|------------|
| `@clerk/nextjs` | ~150KB | Tree-shaking, middleware only |
| `@monaco-editor/react` | ~2.5MB | dynamic import, ssr: false, Suspense |
| `@xyflow/react` | ~200KB | dynamic import for sandbox page only |

---

## 6. Implementation Order

```
1. lib/env.ts              ← 환경변수 검증 (모든 것의 기반)
2. lib/auth.ts             ← Clerk 헬퍼
3. middleware.ts            ← 보호 라우트 + rate limit
4. sign-in, sign-up pages  ← Auth UI
5. api/webhook/clerk        ← User 동기화
6. lib/rateLimit.ts         ← Rate limiting
7. monacoEditor.tsx         ← Monaco 통합
8. gallery/[slug]/page.tsx  ← Agent Detail
9. lib/managedAgents.ts     ← Agents API 클라이언트
10. api/sandbox/route.ts    ← Sandbox API
11. traceViewer.tsx         ← react-flow 그래프
12. sandboxPanel.tsx        ← Sandbox UI
13. lintPanel.tsx           ← Lint 인라인 UI
14. costEstimator.tsx       ← 비용 그래프
15. costCounter.tsx         ← 실시간 카운터
16. API error format 적용   ← 모든 라우트 표준화
```

---

## 7. Acceptance Criteria

- [ ] GitHub/Google OAuth 로그인 → 리다이렉트 → /forge
- [ ] Monaco Editor에서 YAML 편집 시 Zod 에러 인라인 표시
- [ ] forge-light 테마: ember keywords, jade strings, iron keys
- [ ] /gallery/[slug] 에이전트 상세 + Fork/Ship/Test CTA
- [ ] 샌드박스 실행 → Trace Viewer에 tool calls 노드 표시
- [ ] 비인증 /api/forge 6회 요청 시 429 응답
- [ ] 비인증 /api/sandbox 요청 시 401 응답
- [ ] Cost Estimator에서 모델별 월 비용 그래프 표시
- [ ] 린트 패널에서 Auto-fix 클릭 → Monaco에 diff 반영
- [ ] typecheck + build 통과
