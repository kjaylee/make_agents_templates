# Forge — Implementation Plan

> **작성일:** 2026-04-10
> **기준:** PLAN.md (Product Roadmap) + DESIGN.md (Anvil Design System)
> **목표:** Phase 1 MVP를 2주(Sprint 1-2) 내 동작 가능한 상태로 구현

---

## 0. Current State Assessment

### 완료된 작업 (Foundation)

| 영역 | 산출물 | 상태 |
|------|--------|------|
| Product Strategy | `docs/PLAN.md` (313줄) | ✅ 완료 |
| Design System | `docs/DESIGN.md` (524줄, Anvil) | ✅ 완료 |
| Monorepo | pnpm workspaces, 3 패키지 | ✅ 완료 |
| DB Schema | Drizzle ORM 7 테이블 (`packages/forge-schema/src/schema.ts`) | ✅ 완료 |
| Validators | Zod 템플릿 스키마 (`packages/forge-schema/src/validators.ts`) | ✅ 완료 |
| Seed Templates | 10개 YAML (`docs/seeds/01~10-*.yaml`) | ✅ 완료 |
| Landing Skeleton | Next.js 16 + Anvil 토큰 (`apps/web/app/page.tsx`) | ✅ 완료 |
| Tailwind Config | Anvil 디자인 토큰 전체 적용 | ✅ 완료 |
| Forge Engine Types | `ForgeIntent`, `ForgeResult`, `ForgeStage` | ✅ 완료 |
| Seeding Script | `scripts/seed-templates.ts` | ✅ 완료 |

### 미구현 (Stub / TODO)

| 영역 | 파일 | 상태 |
|------|------|------|
| Forge Engine | `packages/forge-engine/src/index.ts` | ❌ `throw Error` stub |
| Intent Composer UI | — | ❌ 없음 |
| YAML Editor (Monaco) | — | ❌ 없음 |
| Template Gallery | — | ❌ 없음 |
| API Routes | `apps/web/app/api/` | ❌ 없음 |
| Auth (Clerk) | — | ❌ 없음 |
| DB Migration | — | ❌ 생성 안 됨 |
| shadcn/ui Components | — | ❌ 미설치 |

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        apps/web                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Landing  │  │ Forge        │  │ Gallery               │  │
│  │ /        │  │ /forge       │  │ /gallery              │  │
│  └──────────┘  └──────┬───────┘  └───────────────────────┘  │
│                       │                                      │
│              ┌────────▼────────┐                             │
│              │ API Routes      │                             │
│              │ /api/forge      │ ← SSE streaming             │
│              │ /api/gallery    │                             │
│              │ /api/agents     │                             │
│              └────────┬────────┘                             │
├───────────────────────┼─────────────────────────────────────┤
│              ┌────────▼────────┐                             │
│              │ forge-engine    │ ← Anthropic SDK              │
│              │ classify → retrieve → generate → lint → render│
│              └────────┬────────┘                             │
│              ┌────────▼────────┐                             │
│              │ forge-schema    │ ← Drizzle + Zod              │
│              │ DB models       │                             │
│              │ Validators      │                             │
│              └─────────────────┘                             │
├─────────────────────────────────────────────────────────────┤
│  External: Supabase (Postgres) · Anthropic API · Clerk      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Sprint Plan

### Sprint 1 (Week 1): Core Pipeline + UI Shell

> **목표:** 자연어 입력 → YAML 생성 → 화면에 스트리밍 표시 (end-to-end)

#### S1-1. 개발 환경 & 의존성 설정
- [ ] shadcn/ui 초기화 (`apps/web`)
  - Button, Card, Input, Textarea, Badge, Tabs, Dialog, Toast, Select
  - Anvil 테마 오버라이드 (bone/ember/ink 적용)
- [ ] Framer Motion 설치 (`apps/web`)
- [ ] Monaco Editor 설치 (`@monaco-editor/react`)
- [ ] Phosphor Icons 설치 (`@phosphor-icons/react`)
- [ ] Clerk 인증 설치 및 기본 설정 (`@clerk/nextjs`)
- [ ] DB 마이그레이션 생성 및 실행 (`pnpm db:generate && pnpm db:migrate`)

#### S1-2. Forge Engine — 핵심 파이프라인 구현
> `packages/forge-engine/src/`

- [ ] **`classifier.ts`** — Haiku 태스크 분류기
  - 입력: `prompt` (자연어)
  - 출력: `TaskType` (research | triage | monitor | extract | notify | analyze)
  - 구현: Haiku 4.5 + 짧은 시스템 프롬프트, JSON 응답 파싱
  
- [ ] **`retriever.ts`** — 시드 템플릿 검색기
  - MVP: pgvector 없이 **키워드 기반 유사도** (TF-IDF 또는 단순 매칭)
  - 10개 시드 YAML을 메모리에 로드하여 top-3 반환
  - 향후: pgvector 임베딩 기반으로 교체
  
- [ ] **`mcp-recommender.ts`** — MCP 자동 매칭
  - `mcp_catalog` 테이블 또는 하드코딩된 카탈로그에서 매칭
  - MVP: 시드에서 사용된 9개 MCP + 주요 10개 추가 = 약 20개 카탈로그
  - 입력: TaskType + prompt keywords → 출력: 추천 MCP 배열
  
- [ ] **`generator.ts`** — Opus 구조화 생성기
  - Opus 4.6 + tool_use로 4개 도구 호출:
    - `generate_system_prompt` — 번호 매긴 단계별 지침, escape hatch, 톤
    - `select_model` — opus/sonnet/haiku + 근거
    - `attach_mcps` — MCP 서버 배열 + permission_policy
    - `attach_skills` — 스킬 배열
  - 출력: `Template` 객체
  
- [ ] **`linter.ts`** — Haiku 린트 검사기
  - 안티패턴 스캔: vague step, no confidence threshold, no escape hatch, 과도한 도구
  - 출력: `lintScore` (0-100) + `LintNote[]`
  
- [ ] **`renderer.ts`** — YAML 렌더러
  - `Template` → YAML 문자열 변환 (`yaml` 패키지)
  - SSE 스트리밍을 위한 character-by-character 청크 생성기
  
- [ ] **`index.ts`** — 파이프라인 오케스트레이터
  - `forge()` 함수를 실제 구현으로 교체
  - `forgeStream()` — SSE 스트리밍 버전 추가
  - 각 단계별 `ForgeProgress` 이벤트 발행

#### S1-3. API Routes
> `apps/web/app/api/`

- [ ] **`POST /api/forge`** — Forge 실행 (SSE 스트리밍)
  - Request: `{ prompt, mcpHints?, modelPreference? }`
  - Response: `text/event-stream` — 단계별 진행률 + YAML 문자 스트림
  - Rate limit: 미인증 5회/분, 인증 20회/분

- [ ] **`GET /api/gallery`** — 갤러리 목록
  - Query: `?q=&model=&mcp=&sort=trending|recent|forks&page=&limit=`
  - Response: 에이전트 카드 배열 + 페이지네이션

- [ ] **`GET /api/agents/[slug]`** — 에이전트 상세
  - Response: 에이전트 YAML + 메타데이터 + 포크 카운트

- [ ] **`POST /api/agents/[slug]/fork`** — 에이전트 포크
  - 인증 필요
  - 원본 복사 → 새 slug 생성 → forks 테이블 기록

#### S1-4. UI — Forge Composer
> `apps/web/app/forge/page.tsx`

- [ ] **좌측 패널: Intent Input**
  - Textarea (6줄) + placeholder "What should your agent do?"
  - MCP 힌트 칩 (선택적 태그)
  - 모델 선호도 라디오 (speed / balance / quality)
  - Forge 버튼 (ember.500, 해머 아이콘)
  
- [ ] **우측 패널: YAML Editor**
  - 초기 상태: Anvil 일러스트 + "Your agent will appear here" 플레이스홀더
  - Forge 실행 시: Monaco Editor에 YAML 문자 스트리밍
  - 린트 스코어 배지 (우상단)
  - 편집 가능 (사용자가 직접 수정)
  - Zod 실시간 검증 (에디터 내 에러 마커)

- [ ] **Forge 모션 시퀀스** (DESIGN.md §7.1)
  - 해머 내려찍힘 애니메이션 (380ms cubic-bezier)
  - 스파크 파티클 12개 방사 (600ms ease-out)
  - YAML character-by-character 스트리밍 표시

---

### Sprint 2 (Week 2): Gallery + Auth + Polish

> **목표:** 갤러리 탐색, 인증, 랜딩 페이지 완성, 배포 가능 상태

#### S2-1. UI — Template Gallery
> `apps/web/app/gallery/page.tsx`

- [ ] **갤러리 그리드**
  - 3열 반응형 카드 레이아웃
  - Gallery Card 컴포넌트 (DESIGN.md §8.5: 16:10, 모델+MCP 아이콘 상단, 제목+설명+포크 하단)
  - 인피니트 스크롤 또는 페이지네이션
  
- [ ] **검색 & 필터**
  - 검색 바 (Postgres FTS)
  - 필터: Model (opus/sonnet/haiku), MCP, Category, Sort (trending/recent/forks)
  
- [ ] **에이전트 상세 페이지** (`/gallery/[slug]`)
  - YAML 읽기 전용 뷰 (Monaco, forge-light 테마)
  - Fork 버튼
  - "Deploy to Claude Console" CTA
  - 메타데이터: 모델, MCP, 포크 수, 생성일

#### S2-2. Auth (Clerk)
- [ ] Clerk Provider 설정 (`apps/web/app/layout.tsx`)
- [ ] Sign In / Sign Up 페이지
- [ ] 미들웨어: 보호 라우트 설정 (`/forge`, `/api/forge`, `/api/agents/*/fork`)
- [ ] 사용자 동기화: Clerk webhook → `users` 테이블
- [ ] 티어 기반 rate limiting (free: 10 agents/mo)

#### S2-3. Landing Page 완성
> `apps/web/app/page.tsx` 확장

- [ ] **섹션 1: Hero** (현재 스켈레톤 → 완성)
  - Tiempos Headline 폰트 로드
  - Paper grain 배경 텍스처
  - Forge 버튼 → `/forge` 라우팅
  
- [ ] **섹션 2: Seed Templates 갤러리** (10개 카드 그리드)
- [ ] **섹션 3: How Forge Works** (3단 스토리보드)
- [ ] **섹션 4: Pricing** (3 티어 카드, ember가 Pro에만)
- [ ] **Footer** (bone.200 배경, 미니멀)
- [ ] **반응형** (모바일: 1열, 태블릿: 2열, 데스크톱: 3열)

#### S2-4. Anvil UI 컴포넌트 커스텀
- [ ] Button — 4 variants (Primary/Secondary/Ghost/Destructive)
- [ ] Card — bone.50 표면, anvil 엠보싱, hover 리프트
- [ ] Badge — ember.100 배경, 린트 스코어용
- [ ] Toast — 하단 중앙, 페이퍼 슬립 페이드인
- [ ] Input / Textarea — bone.50 bg, ember.500 포커스 링

#### S2-5. DB Seeding & 배포 준비
- [ ] 시드 템플릿 DB 로드 검증 (`pnpm db:seed`)
- [ ] MCP 카탈로그 시드 데이터 (20개)
- [ ] 환경 변수 검증 스크립트
- [ ] Vercel 배포 설정 (환경 변수, 빌드 커맨드)
- [ ] OG 이미지 기본 생성 (`/api/og`)

---

## 3. 기술 의존성 그래프

```
S1-1 개발환경 설정
  ├── S1-2 Forge Engine ──┐
  │     ├── classifier    │
  │     ├── retriever     │
  │     ├── mcp-recommender│
  │     ├── generator ────┤  (Anthropic API Key 필요)
  │     ├── linter        │
  │     └── renderer      │
  │                       │
  ├── S1-3 API Routes ◄───┘
  │     └── /api/forge (SSE)
  │
  └── S1-4 Forge Composer UI
        └── SSE 클라이언트 ◄── /api/forge

S2-1 Gallery UI ◄── S1-3 /api/gallery
S2-2 Auth ◄── S1-1 Clerk 설치
S2-3 Landing ◄── S2-4 Anvil Components
S2-5 배포 ◄── 모든 Sprint 2 태스크
```

---

## 4. 파일 구조 (목표)

```
apps/web/
├── app/
│   ├── api/
│   │   ├── forge/route.ts              ← SSE 스트리밍 엔드포인트
│   │   ├── gallery/route.ts            ← 갤러리 목록 API
│   │   ├── agents/[slug]/route.ts      ← 에이전트 상세 API
│   │   └── agents/[slug]/fork/route.ts ← 포크 API
│   ├── forge/page.tsx                  ← Forge Composer (좌우 패널)
│   ├── gallery/
│   │   ├── page.tsx                    ← 갤러리 그리드
│   │   └── [slug]/page.tsx             ← 에이전트 상세
│   ├── sign-in/[[...sign-in]]/page.tsx ← Clerk Sign In
│   ├── sign-up/[[...sign-up]]/page.tsx ← Clerk Sign Up
│   ├── globals.css
│   ├── layout.tsx                      ← Clerk Provider 추가
│   └── page.tsx                        ← Landing (확장)
├── components/
│   ├── ui/                             ← shadcn/ui Anvil 커스텀
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── forge/
│   │   ├── intentPanel.tsx             ← 좌측 입력 패널
│   │   ├── yamlEditor.tsx              ← 우측 Monaco 에디터
│   │   ├── hammerAnimation.tsx         ← 해머 모션
│   │   └── lintBadge.tsx               ← 린트 스코어
│   ├── gallery/
│   │   ├── galleryCard.tsx             ← 16:10 카드
│   │   ├── galleryGrid.tsx             ← 3열 그리드
│   │   └── searchBar.tsx               ← 검색+필터
│   └── landing/
│       ├── heroSection.tsx
│       ├── templateShowcase.tsx
│       ├── howItWorks.tsx
│       └── pricingSection.tsx
├── hooks/
│   ├── useForgeStream.ts               ← SSE 클라이언트 훅
│   └── useGallery.ts                   ← 갤러리 데이터 훅
├── lib/
│   ├── db.ts                           ← Drizzle 클라이언트
│   ├── utils.ts                        ← (기존)
│   └── clerk.ts                        ← Clerk 헬퍼
└── public/
    └── textures/grain-2pct.svg         ← (기존)

packages/forge-engine/src/
├── index.ts                            ← 파이프라인 오케스트레이터 (재구현)
├── types.ts                            ← (기존, 확장)
├── classifier.ts                       ← Haiku 태스크 분류
├── retriever.ts                        ← 시드 검색
├── mcpRecommender.ts                   ← MCP 자동 매칭
├── generator.ts                        ← Opus 구조화 생성
├── linter.ts                           ← Haiku 린트
├── renderer.ts                         ← YAML 렌더러
└── mcpCatalog.ts                       ← MCP 카탈로그 데이터

packages/forge-schema/src/
├── index.ts                            ← (기존)
├── schema.ts                           ← (기존)
└── validators.ts                       ← (기존)
```

---

## 5. 핵심 기술 결정

### 5.1 YAML 스트리밍 방식
- **SSE (Server-Sent Events)** 채택
- Opus generator가 tool_use로 구조화 응답 → YAML 렌더링 → 문자 단위 청크
- 클라이언트: `EventSource` 또는 `fetch` + `ReadableStream`
- 이유: WebSocket보다 단순, Edge Function 호환, 자동 재연결

### 5.2 시드 검색 (MVP)
- **Phase 1:** 메모리 내 키워드 매칭 (10개 시드는 적으므로 충분)
- **Phase 2:** pgvector 임베딩으로 교체 (갤러리 200+ 시)
- 이유: MVP에서 pgvector 인프라 복잡도 회피

### 5.3 Monaco Editor 통합
- `@monaco-editor/react` — React wrapper
- 커스텀 YAML 테마: `forge-light` / `forge-dark` (DESIGN.md §8.3)
- Zod 검증 → Monaco `setModelMarkers`로 실시간 에러 표시
- 이유: VS Code 동일 엔진, YAML 문법 하이라이팅 내장

### 5.4 인증 전략
- **Clerk** — GitHub/Google OAuth
- 미들웨어로 보호 라우트 관리
- `users` 테이블과 `clerkId`로 동기화
- MVP는 webhook 기반, 향후 Clerk organization → Team 티어

---

## 6. 리스크 & 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| Opus tool_use 응답 품질 편차 | High | 시드 10개로 few-shot 예시 제공, Zod 검증으로 재시도 |
| Monaco 번들 사이즈 (2MB+) | Med | dynamic import + Suspense, Turbopack 코드 분할 |
| SSE 타임아웃 (Vercel 30s edge limit) | High | Vercel background function (최대 5분) 사용 |
| Clerk 무료 티어 MAU 제한 | Low | MVP 트래픽은 충분, 런칭 전 Pro 업그레이드 |
| Supabase cold start | Low | connection pooling (Supavisor), Drizzle 커넥션 재사용 |

---

## 7. 성공 기준 (Sprint 2 종료 시)

- [ ] 자연어 입력 → YAML 생성 end-to-end 동작
- [ ] YAML이 Monaco Editor에 실시간 스트리밍 표시
- [ ] 10개 시드 템플릿이 갤러리에 표시
- [ ] 갤러리에서 에이전트 검색/필터 가능
- [ ] GitHub OAuth 로그인 동작
- [ ] 포크 기능 동작
- [ ] Vercel 배포 성공
- [ ] Lighthouse Performance > 90 (Landing)
- [ ] 린트 스코어가 생성된 YAML에 표시
- [ ] 해머 애니메이션이 Forge 버튼 클릭 시 재생

---

## 8. Phase 2+ Preview (Sprint 3-4)

Sprint 1-2 완료 후 진행할 기능 (우선순위 순):

1. **Sandbox Runner** — Managed Agents API 프록시, 에이전트 실행
2. **Trace Viewer** — react-flow 기반 tool call 시각화
3. **Prompt Linter UI** — 린트 결과 인라인 표시, 자동 수정 제안
4. **Cost Estimator** — 모델별 예상 비용 그래프
5. **One-click Console Deploy** — `claude.ai/console` prefilled 링크

---

## 9. 즉시 실행 가능한 다음 단계

```bash
# 1. 의존성 설치
cd apps/web
pnpm add @clerk/nextjs @monaco-editor/react @phosphor-icons/react framer-motion
pnpm dlx shadcn@latest init

# 2. DB 마이그레이션
pnpm db:generate
pnpm db:migrate

# 3. 시드 로딩
DATABASE_URL=<url> pnpm db:seed

# 4. 개발 서버
pnpm dev
```

---

*이 문서는 PLAN.md(제품 로드맵)과 DESIGN.md(디자인 시스템)의 Phase 1 MVP를 실행 가능한 스프린트 태스크로 분해한 것이다. 각 태스크는 독립적으로 PR 가능한 단위로 설계했다.*
