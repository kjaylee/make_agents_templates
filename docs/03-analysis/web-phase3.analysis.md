# Gap Analysis Report — web-phase3

> **Date:** 2026-04-12
> **Feature:** web-phase3 (Wow Factors)
> **Design:** docs/02-design/features/web-phase3.design.md
> **Overall Match Rate: 88%**

---

## Score Summary

| Category | Score | Status |
|----------|:-----:|:------:|
| Architecture | 95% | PASS |
| Conventions | 92% | PASS |
| Design Match | 86% | WARN |
| **Overall** | **88%** | **WARN** |

---

## Checklist (Design §7)

| # | Criterion | Status |
|---|-----------|:------:|
| 1 | W1 Battle traces + judge | ✅ |
| 2 | W1 Share card 2048x1080 OG | ⚠️ preview only |
| 3 | W2 Ember Receipt Anvil | ✅ |
| 4 | W2 PDF download | ⚠️ PNG instead |
| 5 | W2 OG image endpoint | ✅ |
| 6 | W3 Conversation → YAML | ✅ |
| 7 | W4 Fuzzer 50 cases | ✅ (정확 분배 12+13+13+12) |
| 8 | W4 CSV export | ✅ |
| 9 | W5 Lineage Tree react-flow | ✅ |
| 10 | W6 Canary + cron + email | ⚠️ 이메일 없음 |

---

## Critical Gaps

### Bug 1. Battle page per-agent done 이벤트 미구현
- 서버는 `verdict` 이벤트만 emit하고 per-agent done 이벤트는 보내지 않음
- 클라이언트는 `agent_a_done`, `agent_b_done`을 listen → dead code
- **결과:** 사이드 패널의 토큰/비용이 항상 0으로 표시
- **수정:** 서버에서 `agent_a_done`, `agent_b_done` 이벤트 emit

### Gap 2. Battle OG 엔드포인트 부재
- `/api/battle/[id]/og` 라우트 없음
- 현재는 `BattleOgCard`로 미리보기만 가능
- "Share this battle" 바이럴 자산 생성 불가
- **수정:** next/og로 2048x1080 OG 이미지 엔드포인트 추가

### Gap 3. Receipt PDF vs PNG
- 디자인: "Download PDF (puppeteer 또는 html2canvas fallback)"
- 현재: `ember-receipt-{id}.png` 다운로드
- **수정:** 버튼 라벨을 "Download PNG"로 명시 또는 PDF 라우트 추가

---

## Medium Gaps

| # | Item |
|---|------|
| 4 | `/api/receipt/[id]/route.ts` 부재 — 페이지가 조회 시 404, mock으로 fallback |
| 5 | Battle page 에이전트 picker 미구현 — 하드코딩된 slug |
| 6 | `lib/nocturnal/email.ts` 디제스트 템플릿 부재 |
| 7 | Nocturnal cron 스텁 — 실제 실행 로직 없음 |

---

## Accepted as MVP (Not blocking)

- Voice Forging W7 (optional)
- Real Opus judge (mock 명시)
- Real Haiku fuzzer synthesis (static templates)
- Real Drizzle canary tables (in-memory Map)
- Slack unfurl oEmbed
- Real forks DB query (hashed mock)

---

## Positive Findings

- Fuzzer 카테고리 정확한 배분 (12+13+13+12 = 50)
- 모든 SSE 이벤트 포맷 디자인 스펙과 일치
- Anvil 디자인 토큰 일관 적용
- `@anthropic-ai/sdk` 의존성 정상 (QA 추가)
- `handleApiError`, `requireAuth`, `checkRateLimit` 헬퍼 일관 사용
- Fuzzer CSV export 동작
- Lineage Tree react-flow 정상

---

## Fix Priority

1. Battle done 이벤트 버그 수정 (크리티컬)
2. Battle OG 엔드포인트 추가
3. Receipt PNG → 라벨 명시 또는 PDF 라우트
4. `/api/receipt/[id]/route.ts` 구현 (mock 데이터라도)
5. Battle page 에이전트 picker
6. Nocturnal 이메일 템플릿
