# Gap Analysis Report — web-sprint2

> **Date:** 2026-04-10
> **Feature:** web-sprint2 (Auth, Editor, Sandbox)
> **Design:** docs/02-design/features/web-sprint2.design.md
> **Overall Match Rate: 77%**

---

## Score Summary

| Category | Score | Status |
|----------|:-----:|:------:|
| Architecture | 100% | PASS |
| Monaco Editor | 95% | PASS |
| Sandbox / Trace | 90% | PASS |
| API Error Format | 83% | WARN |
| Acceptance Criteria | 70% | WARN |
| Environment Variables | 50% | FAIL |
| Rate Limiting | 12% | FAIL |
| **Overall** | **77%** | **WARN** |

---

## Critical Gaps (HIGH)

### 1. Rate Limiting 미적용 — /api/forge
- `rateLimit.ts` 존재하지만 `/api/forge/route.ts`에서 import하지 않음
- Design: 5/min unauth, 20/min free, 60/min pro

### 2. Fork Route 인증 없음
- `/api/agents/[slug]/fork`에 `requireAuth()` 없음
- Middleware가 `/api/agents/(.*)`를 public으로 설정 → fork도 public

### 3. Middleware 라우트 패턴 오류
- `/api/agents/(.*)`가 fork 포함하여 전부 public
- fork는 protected여야 함

### 4. Webhook 서명 미검증
- Clerk webhook에 svix 검증 없음 → 보안 취약

### 5. Auto-fix 미연결
- `lintPanel.tsx`의 `onAutoFix` prop이 부모에서 전달되지 않음
- Haiku API 호출, Monaco diff 뷰 미구현

---

## Medium Gaps

| # | Item |
|---|------|
| 6 | Sandbox rate limit: 하드코딩 max:5 → 티어별로 변경 필요 |
| 7 | Sign-in 후 /forge 리다이렉트 미설정 |
| 8 | Clerk 환경변수 optional → required 변경 필요 |
| 9 | /api/gallery, fork에도 rate limiting 적용 필요 |

---

## Low Gaps

| # | Item |
|---|------|
| 10 | 에러 코드 `INTERNAL_ERROR` → `INTERNAL` 통일 |
| 11 | Sandbox route에 `handleApiError` 래퍼 적용 |
| 12 | Agent Detail 페이지 Monaco 읽기 전용 교체 |
| 13 | Trace Viewer 더블클릭 접기 기능 |

---

## Positive Findings

- forge-light Monaco 테마: 100% 스펙 일치
- Trace Viewer 노드 4종: 정확한 Anvil 컬러
- Sandbox SSE 스트리밍: 이벤트 타입 일치
- ClerkProvider 래핑: 정상
- Zod 검증 마커: 정상 동작
- Cost Estimator: 정확한 가격 계산
- API 에러 포맷: 5/6 라우트 표준화

---

## Fix Priority

1. /api/forge rate limiting 적용
2. Fork route auth + middleware 패턴 수정
3. Webhook svix 검증 추가
4. Auto-fix onAutoFix 연결
5. Sandbox rate limit 티어별 적용
6. Sign-in redirect 설정
7. Clerk env vars required 변경
