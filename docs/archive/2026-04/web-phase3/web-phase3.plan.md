# Plan — web-phase3 (Wow Factors)

> **Feature:** Forge Phase 3 — Launch-Critical Wow Factors
> **Created:** 2026-04-12
> **Priority:** P0 (Launch drivers)
> **Depends on:** web (Sprint 1), web-sprint2 (Sprint 2)
> **Reference:** docs/PLAN.md §3.4

---

## 1. Overview

Sprint 1, 2에서 MVP (Intent → Forge → Edit → Test → Share)를 완성했다. Phase 3는 **런칭 바이럴 드라이버** — 각 기능이 Product Hunt, Show HN, X 스레드에서 스크린샷으로 퍼지도록 설계된 6가지 wow factor 구현이다.

각 기능은 **직교하는 퍼널 축**을 담당한다:

| 축 | 담당 Feature |
|---|---|
| 유입 (acquisition) | Voice Forging |
| 전환 (activation) | Conversation→Agent, Prompt Fuzzer |
| 공유 (virality) | Battle Mode, Ember Receipt |
| 유지 (retention) | Nocturnal Forge |

---

## 2. Scope

### 2.1 Launch Critical (우선순위 높음)

| # | Feature | Funnel | Priority | Effort |
|---|---------|--------|:--------:|:------:|
| W1 | **Battle Mode** | 공유 | P0 | M |
| W2 | **Ember Receipt** | 공유 | P0 | M |
| W3 | **Conversation → Agent** | 전환 | P0 | S |
| W4 | **Prompt Fuzzer** | 전환 | P1 | M |
| W5 | **Agent Lineage Tree** | 서사 | P1 | S |

### 2.2 Launch Important (우선순위 중간)

| # | Feature | Funnel | Priority | Effort |
|---|---------|--------|:--------:|:------:|
| W6 | **Nocturnal Forge** | 유지 | P1 | M |
| W7 | **Voice Forging** *(PWA)* | 유입 | P2 | L |

### 2.3 Out of Scope (Phase 4+)

- Time-lapse Replay (Post-launch)
- Agent Choir (V2)
- Skill Market (V2)

---

## 3. Feature Details

### 3.1 Battle Mode (W1) — P0

**Why:** X/LinkedIn 공유용 "전적표" 이미지가 바이럴 자산.

**핵심 플로우:**
1. `/battle/:id` — 두 에이전트 A/B 선택 (Gallery에서 다중 선택)
2. 공통 입력 제공 → 양쪽 에이전트 동시 실행
3. Judge Opus 4.6가 JSON 응답으로 판정 (점수 A/B + 근거)
4. 승자에 gold sweep 애니메이션 + "WINNER" 배너
5. "Share this battle" → OG 카드 2048x1080 생성

**API:** POST /api/battle — SSE 스트리밍 (양쪽 동시 실행)
**UI:** 좌우 분할 트레이스 뷰어 + 하단 심판 카드

### 3.2 Ember Receipt (W2) — P0

**Why:** 샌드박스 실행 후 즉시 생성되는 "장인의 세금계산서". 브랜드 전달력 극대화.

**핵심 플로우:**
1. 샌드박스 실행 완료 → `/run/:id/receipt` 자동 생성
2. 4:5 비율 (X 공유) 또는 A4 세로 (인쇄)
3. Anvil 워터마크 + Scribe divider + 메타 + input + 트레이스 + output
4. Slack unfurl (oEmbed) / Notion embed / PDF 다운로드 / OG 이미지

**렌더링:** HTML → html2canvas / puppeteer (PDF) / OG 이미지 생성기
**접근성:** aria 구조화, 스크린리더 호환

### 3.3 Conversation → Agent (W3) — P0

**Why:** "우리 PM이 매주 수요일에 하는 일을 자동화해줘" → 즉시 에이전트 생성.

**핵심 플로우:**
1. `/forge/extract` — 대화 텍스트 붙여넣기 (Slack export, 이메일, 노트)
2. Haiku 분류기가 대화에서 반복 작업 추출
3. Opus 4.6가 추출된 작업을 기반으로 에이전트 생성 (기존 generator.ts 재사용)
4. /forge 페이지로 redirect + 생성된 YAML 표시

**API:** POST /api/extract — 대화 → 의도 추출 → forge() 호출

### 3.4 Prompt Fuzzer (W4) — P1

**Why:** "이 에이전트 얼마나 견고해?" 증명용. CSV 다운로드로 공유 자산.

**핵심 플로우:**
1. Agent Detail 페이지에 "Run Fuzzer" 버튼
2. Haiku가 50개 엣지 케이스 자동 생성 (adversarial, ambiguous, empty, injection)
3. 각 케이스를 샌드박스에서 실행 → 성공/실패 판정
4. 결과: 점수 + 실패 목록 CSV 다운로드
5. 히스토그램 UI (성공률 %)

**API:** POST /api/fuzz — 비동기 작업, 진행률 SSE

### 3.5 Agent Lineage Tree (W5) — P1

**Why:** "이 에이전트는 15명이 포크했고 그중 3명이 유의미하게 개선" — 신뢰 시그널.

**핵심 플로우:**
1. Agent Detail 페이지에 "View Lineage" 버튼
2. `/gallery/:slug/lineage` — react-flow 기반 git-graph 스타일 시각화
3. 노드 클릭 → 해당 포크로 이동
4. 포크 깊이, 변경된 필드 하이라이트

**데이터:** forks 테이블에서 재귀 쿼리

### 3.6 Nocturnal Forge (W6) — P1

**Why:** Week-2 retention 직결. "잠든 사이 제품이 일한다".

**핵심 플로우:**
1. 사용자가 활성 에이전트에 "카나리 모드" 토글
2. 매일 02:00 UTC, 저장된 샘플 입력으로 자동 재실행 (cron)
3. 06:30 로컬, 이메일 다이제스트 전송
4. 히어로 카드: "Your triage agent caught 3 real incidents · hallucinated in 2/10 · Lint score 78"

**인프라:** Vercel Cron Jobs + Resend/Postmark 이메일 + 사용자 timezone 저장

### 3.7 Voice Forging (W7) — P2

**Why:** 모바일/엘리베이터 데모 포맷 = TikTok/Reels 바이럴.

**핵심 플로우:**
1. `/forge/voice` — 모바일 PWA (portrait)
2. Voice orb 홀드 → Whisper API로 transcription
3. 해제 시 해머 애니메이션 → YAML 스트리밍
4. "Open on desktop" 딥링크 QR

**API:** OpenAI Whisper API 또는 Anthropic voice (아직 없음 → Whisper)

---

## 4. Sprint Plan

### Week 1: Battle + Receipt + Extract (런치 핵심)
- W1 Battle Mode (3일)
- W2 Ember Receipt (2일)
- W3 Conversation → Agent (2일)

### Week 2: Fuzzer + Lineage (차별화)
- W4 Prompt Fuzzer (3일)
- W5 Agent Lineage Tree (1일)
- W6 Nocturnal Forge (3일)

### Week 3 (Optional): Voice Forging
- W7 Voice Forging PWA (5일)

---

## 5. Technical Dependencies

| Package | Purpose |
|---------|---------|
| `html2canvas` | Ember Receipt → PDF/PNG |
| `@vercel/og` | OG 이미지 생성 (이미 Next.js 내장) |
| `resend` or `postmark` | Nocturnal Forge 이메일 |
| `react-flow` (already) | Lineage Tree |
| `csv-stringify` | Fuzzer CSV export |

---

## 6. Success Criteria

- [ ] Battle Mode 완료 — A/B 결과 + Judge + 공유 카드 렌더링
- [ ] Ember Receipt — 샌드박스 실행 후 자동 생성, PDF 다운로드 가능
- [ ] Conversation → Agent — 대화 붙여넣기 → 에이전트 YAML 생성
- [ ] Prompt Fuzzer — 50 케이스 자동 실행 + CSV 다운로드
- [ ] Lineage Tree — 포크 관계 react-flow 시각화
- [ ] Nocturnal Forge — cron job 동작 + 이메일 전송 (Resend)
- [ ] Voice Forging — Optional, 시간 허용 시 PWA 기본 구현

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| 6개 기능 동시 구현 → 품질 저하 | P0만 먼저 완성 후 P1, P2 순차 |
| html2canvas 렌더링 이슈 | Server-side PDF 생성 (puppeteer) fallback |
| Whisper API 비용/지연 | BYOK 정책, Voice Forging P2로 유지 |
| Nocturnal cron 신뢰성 | Vercel Cron + 로그 모니터링 |
| Battle Mode Judge 편향 | Judge prompt를 중립화 + 확장성 고려 |
