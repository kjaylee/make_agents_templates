# Gap Analysis Report — web

> **Date:** 2026-04-10
> **Feature:** web (Phase 1 MVP)
> **Design Docs:** PLAN.md, DESIGN.md, IMPLEMENTATION-PLAN.md
> **Overall Match Rate: 63%**

---

## Score Summary

| Category | Score | Status |
|----------|:-----:|:------:|
| Forge Engine Pipeline | 95% | PASS |
| API Implementation | 78% | WARN |
| UI / Forge Composer | 72% | WARN |
| Design System Compliance | 75% | WARN |
| SSE Streaming Protocol | 40% | FAIL |
| Auth & Infrastructure | 15% | FAIL |
| **Overall** | **63%** | **WARN** |

---

## Critical Gaps

### 1. SSE Protocol Mismatch (Critical)
- **Server** emits: `{ type: 'yaml', data: '<char>' }` (nested `.data`)
- **Client** expects: `{ type: 'yaml_chunk', content: '<char>' }` (flat)
- **Impact:** YAML 스트리밍이 동작하지 않음 — 핵심 기능 불능

### 2. Gallery UI Missing (Critical)
- `/gallery` 페이지 없음, gallery 컴포넌트 없음
- API (`/api/gallery`)는 구현됨, UI만 부재

### 3. Auth (Clerk) Missing (Critical)
- `@clerk/nextjs` 미설치, ClerkProvider/미들웨어/로그인 페이지 없음

---

## High Priority Gaps

| # | Item | Detail |
|---|------|--------|
| 4 | Monaco Editor 미사용 | `<pre>` 기반 읽기 전용 뷰어, 편집/Zod 검증 마커 불가 |
| 5 | Landing 페이지 미완성 | Hero만 존재, 템플릿 그리드/How it works/Pricing 섹션 없음 |
| 6 | Console Deploy 없음 | "Ship to Claude Console" CTA 미구현 |
| 7 | 폰트 미로드 | Tiempos/Inter/Berkeley Mono 선언만 있고 실제 로드 없음 |

---

## Medium Priority Gaps

| # | Item |
|---|------|
| 8 | Gallery sort: `name/model/tools` → `trending/recent/forks` 로 변경 필요 |
| 9 | Input/Textarea: shadcn 기본 CSS vars → Anvil 토큰 직접 적용 필요 |
| 10 | API 에러 포맷 표준화: `{ error: string }` → `{ error: { code, message } }` |
| 11 | Rate limiting 미구현 |
| 12 | 환경변수 Zod 검증 (`lib/env.ts`) 미구현 |

---

## Low Priority Gaps

| # | Item |
|---|------|
| 13 | Card anvil embossing (1% opacity) 누락 |
| 14 | Tags chip picker (Intent panel) 누락 |
| 15 | LintBadge 별도 컴포넌트 분리 |

---

## Positive Findings

- Forge Engine 6-stage 파이프라인: 완벽 구현 (95%)
- Color tokens: 100% 일치 (ink/bone/ember/iron/gold/jade/rust)
- Hammer animation: 정확한 스펙 구현 (380ms bezier, 12 sparks)
- MCP 카탈로그: 20개 하드코딩, 키워드 매칭 정상
- Tailwind Anvil 토큰: 완전 적용

---

## Recommended Fix Order

1. **SSE 프로토콜 수정** — useForgeStream.ts를 서버 이벤트 포맷에 맞게 수정
2. **Gallery UI 구축** — galleryCard, galleryGrid, searchBar + /gallery 페이지
3. **Clerk Auth 설치** — @clerk/nextjs, Provider, 미들웨어, 로그인 페이지
4. **Monaco Editor** — @monaco-editor/react 설치, forge-light 테마, Zod 마커
5. **Landing 완성** — 4개 섹션 추가
6. **폰트 로딩** — Next.js font import
7. **API 정규화** — sort 옵션, 에러 포맷, rate limiting
