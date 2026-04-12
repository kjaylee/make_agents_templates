# Plan — web-sprint2

> **Feature:** Forge Web Sprint 2 — Auth, Editor, Sandbox
> **Created:** 2026-04-10
> **Priority:** P0
> **Depends on:** web (Sprint 1, archived, 90% match rate)

---

## 1. Overview

Sprint 1에서 Forge의 핵심 파이프라인(Engine + API + Composer UI + Gallery)을 구현했다. Sprint 2는 세 가지 축으로 제품을 완성한다:

1. **인증 & 보안** — Clerk OAuth로 사용자 식별, 보호 라우트, 티어 기반 rate limiting
2. **편집 경험** — Monaco Editor 통합으로 생성된 YAML을 실시간 편집·검증
3. **샌드박스** — Managed Agents API 프록시로 에이전트 실행·트레이스 가시화

---

## 2. Scope

### 2.1 Sprint 1 Carryover (미완료 항목)

| # | Item | 근거 | Priority |
|---|------|------|----------|
| C1 | **Clerk Auth** | @clerk/nextjs 설치, ClerkProvider, sign-in/sign-up, 미들웨어, users 테이블 동기화 | P0 |
| C2 | **Monaco Editor** | @monaco-editor/react 설치, forge-light/forge-dark 테마, Zod 실시간 검증 마커, 편집 가능 | P0 |
| C3 | **Rate Limiting** | 미인증 5회/분, 인증 20회/분 (API 미들웨어) | P1 |
| C4 | **API Error Format** | `{ error: string }` → `{ error: { code, message, details? } }` 표준화 | P2 |

### 2.2 Phase 2 신규 기능 (PLAN.md §3.3)

| # | Feature | 설명 | Priority |
|---|---------|------|----------|
| F1 | **Sandbox Runner** | Managed Agents API(`/v1/agents`, `/v1/sessions`)로 ephemeral session 생성, 샘플 입력 실행 | P0 |
| F2 | **Trace Viewer** | react-flow 기반 tool call 시각화 (User → Assistant → Tool calls 노드 그래프) | P0 |
| F3 | **Prompt Linter UI** | 린트 결과 인라인 표시, 자동 수정 제안, 안티패턴별 설명 | P1 |
| F4 | **Cost Estimator** | 모델별 예상 월 비용 그래프 (runs/day × tokens × pricing) | P1 |
| F5 | **Agent Detail Page** | `/gallery/[slug]` — YAML 읽기 전용 뷰, Fork 버튼, Deploy CTA, 메타데이터 | P1 |

---

## 3. Technical Plan

### 3.1 Clerk Auth (C1)

```
apps/web/
├── app/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   └── layout.tsx              ← ClerkProvider 래핑
├── middleware.ts                ← 보호 라우트 (/forge, /api/forge, /api/*/fork)
└── lib/
    └── auth.ts                 ← currentUser 헬퍼, tier 확인
```

- `@clerk/nextjs` 설치
- Webhook: Clerk user.created → `users` 테이블 upsert
- 티어: free (10 agents/mo), pro (100), team (unlimited)

### 3.2 Monaco Editor (C2)

```
apps/web/components/forge/
└── monacoEditor.tsx            ← @monaco-editor/react 래퍼
```

- forge-light 테마: ember keywords, jade strings, iron keys (DESIGN.md §8.3)
- Zod 검증: onChange 시 templateSchema 파싱 → `editor.setModelMarkers()`
- 기존 yamlEditor.tsx의 `<pre>` 뷰를 Monaco로 교체
- dynamic import + Suspense로 번들 분할

### 3.3 Sandbox Runner (F1)

```
apps/web/
├── app/
│   ├── api/sandbox/route.ts        ← POST: create agent + session
│   └── forge/[id]/test/page.tsx    ← Sandbox UI
├── components/sandbox/
│   ├── sandboxPanel.tsx            ← 입력 + 실행 버튼
│   ├── traceViewer.tsx             ← react-flow 노드 그래프
│   └── costCounter.tsx             ← 실시간 토큰/비용 카운터
└── lib/
    └── managedAgents.ts            ← Anthropic Managed Agents API 클라이언트
```

- BYOK: 사용자 API 키를 요청 헤더로 릴레이 (Forge는 키 미저장)
- MVP: 공용 키로 분당 5회 무료, 그 이상 BYOK 요구
- 세션은 실행 직후 파기, 트레이스만 30일 보관

### 3.4 Trace Viewer (F2)

- `@xyflow/react` (react-flow v12) 사용
- 노드 타입: User (ink), Assistant (ember), Tool Call (iron)
- 엣지: 이중선, 데이터 흐름 dot 파티클
- 실행 중인 노드: ember pulse 애니메이션
- 접기/펼치기: 각 노드 클릭 시 상세 콘텐츠 토글

### 3.5 Rate Limiting (C3)

- `apps/web/lib/rateLimit.ts` — 메모리 기반 sliding window
- API 미들웨어: `/api/forge` (5/min unauth, 20/min auth), `/api/*/fork` (10/min auth)
- 429 응답 + `Retry-After` 헤더

---

## 4. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@clerk/nextjs` | ^6.0 | Auth (OAuth, middleware) |
| `@monaco-editor/react` | ^4.6 | Code editor |
| `@xyflow/react` | ^12.0 | Trace viewer (node graph) |
| `@anthropic-ai/sdk` | ^0.32 | Managed Agents API (already installed) |

---

## 5. Sprint Plan

### Week 1: Auth + Editor
- [ ] C1: Clerk Auth 설치 및 전체 통합
- [ ] C2: Monaco Editor 통합 (forge-light 테마, Zod 마커)
- [ ] C3: Rate limiting 미들웨어
- [ ] F5: Agent Detail Page (/gallery/[slug])

### Week 2: Sandbox + Trace
- [ ] F1: Sandbox Runner (Managed Agents API 프록시)
- [ ] F2: Trace Viewer (react-flow 노드 그래프)
- [ ] F3: Prompt Linter UI (인라인 린트 표시)
- [ ] F4: Cost Estimator (모델별 비용 그래프)
- [ ] C4: API Error Format 표준화

---

## 6. Success Criteria

- [ ] GitHub/Google OAuth 로그인 동작
- [ ] Monaco Editor에서 YAML 편집 + 실시간 Zod 검증
- [ ] 샌드박스에서 에이전트 실행 + 트레이스 표시
- [ ] 미인증 사용자 rate limit 적용 (429 응답)
- [ ] typecheck + build 통과
- [ ] Lighthouse Performance > 85

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Managed Agents API 요금/불안정 | BYOK 기본, 공용 키 무료 실행 제한 |
| Monaco 번들 사이즈 (2MB+) | dynamic import + Suspense, code splitting |
| Clerk webhook 지연 | 첫 로그인 시 users 테이블 direct upsert fallback |
| react-flow 학습 곡선 | 단순 노드 그래프로 시작, 복잡한 레이아웃은 Phase 3 |
