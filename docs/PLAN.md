# Forge — Claude Agent Template Generator

> **"You describe the job. Forge hammers out the agent."**
> 자연어로 의도를 설명하면 프로덕션 레디 Claude Agent YAML을 생성·테스트·공유할 수 있는 서비스.

---

## 1. Why now

### 1.1 문제 정의
- **템플릿 작성이 장인의 일이 되어 있다.** README.md의 10개 예시를 쓰려면 MCP URL 9개, `permission_policy` 문법, `agent_toolset_20260401` 스펙, Anthropic Skills ID, 모델 선택(Opus/Sonnet/Haiku) 트레이드오프를 모두 알아야 함. 대부분의 실무자는 이 중 1-2개만 안다.
- **복붙으로 시작하면 "내 케이스엔 안 맞음" 벽에 부딪힌다.** 템플릿을 그대로 쓰면 안 되고, 커스터마이즈하려면 결국 시스템 프롬프트 엔지니어링이 필요.
- **테스트 루프가 없다.** YAML을 콘솔에 붙여넣고 실행해 봐야 "어, 얘는 Slack 권한 안 줬네"를 알게 됨.
- **공유가 안 된다.** Notion/Gist/회사 위키에 YAML 조각이 파편화되어 있고, 버전·포크·출처가 추적되지 않음.

### 1.2 기회
- Anthropic Managed Agents API(`/v1/agents`, `/v1/sessions`)가 2026년 상반기에 일반 공개되며 "agent-as-a-service" 워크플로가 급증.
- 기존 MCP 서버 카탈로그는 50+개로 성장(notion/slack/linear/sentry/jira/asana/amplitude/hubspot/intercom 등). "어떤 MCP를 물려야 하는가?"가 새로운 병목.
- 경쟁 제품은 없음. 가장 가까운 것은 Vercel v0(UI 생성), CrewAI/LangGraph GUI(복잡하고 무거움), Flowise(노드 에디터, Claude 네이티브 아님).
- 핵심 인사이트: **Claude Agent 설정 파일은 "새로운 `Dockerfile`"이다.** 누군가 `docker init` 같은 1급 생성 UX를 만들어야 한다.

### 1.3 타겟 사용자
1. **Indie dev / Tech founder** — Slack·Notion·Linear를 쓰고, 혼자서 내부 자동화 에이전트를 띄우고 싶음
2. **Platform / DevEx 엔지니어** — 팀 전체용 에이전트 템플릿 카탈로그를 운영하고 싶음
3. **DevRel / Solutions Engineer** — 고객 데모용으로 "10분 안에 데모 에이전트" 필요
4. **PM / Ops 리드** — 코드를 못 쓰지만 반복 업무를 자동화하고 싶음 (자연어 입력만 씀)

---

## 2. Product North Star

> **"From intent to working agent in under 60 seconds."**

성공 지표:
- **Time-to-first-agent (TTFA) < 60초** — 가입 후 첫 에이전트가 샌드박스에서 돌기까지
- **Week-1 retention > 35%** — 한 번 쓴 사용자가 둘째 에이전트를 만듦
- **Public gallery agents ≥ 200** — 런칭 90일 후

---

## 3. Core Product: Forge

### 3.1 핵심 플로우

```
┌──────────────────────────────────────────────────────────────┐
│ 1. INTENT    자연어로 "뭐 하는 에이전트가 필요해?"               │
│              ↓                                               │
│ 2. FORGE     Claude Opus 4.6가 의도를 해석 → YAML 해머링         │
│              ↓                                               │
│ 3. PREVIEW   실시간 스트리밍 에디터에 YAML이 character-by-char   │
│              으로 찍힘 (wow factor #1: 장인이 망치질하는 연출)     │
│              ↓                                               │
│ 4. SANDBOX   한 번의 클릭으로 Managed Agents API에 배포          │
│              → 샘플 입력으로 실행 → 트레이스 가시화                │
│              ↓                                               │
│ 5. SHARE     Fork 가능한 URL, OG 카드, "embed in Notion" 버튼    │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 MVP 범위 (Phase 1, 2주)

| 모듈 | 설명 | 우선순위 |
|---|---|---|
| **Intent Composer** | 자연어 입력 + 선택형 프롬프트 카드(빈도·MCP 힌트·톤) | P0 |
| **Forge Engine** | Opus 4.6 + JSON Schema-guided generation → YAML | P0 |
| **MCP Auto-Match** | 50+ MCP 카탈로그에서 의도 기반 자동 매칭 | P0 |
| **YAML Editor** | Monaco + 실시간 검증(Zod 스키마) | P0 |
| **Template Gallery** | README의 10개를 시드로 + 태그/검색/포크 카운트 | P0 |
| **One-click Console Deploy** | `claude.ai/console`로 prefilled 링크 | P0 |
| **Auth** | GitHub OAuth, 10 에이전트/월 무료 | P1 |

### 3.3 Phase 2 (샌드박스, 2주)

- **Sandbox Runner** — Managed Agents API로 ephemeral session 생성, 샘플 입력 실행
- **Trace Viewer** — tool calls를 "storybook" 스타일로 렌더링(노드 그래프, 펼치기/접기)
- **Prompt Lintr** — 시스템 프롬프트 안티패턴 체크 (vague step, no confidence threshold, no escape hatch)
- **Cost Estimator** — 모델별 예상 월 비용 그래프

### 3.4 Phase 3 (Wow factors, 4주)

공개 런칭 드라이버 — 모든 기능이 바이럴 스크린샷이 되도록 설계. 각 wow factor는 담당하는 **퍼널 축**이 직교하도록 배치했다.

**[Launch critical · Week 7-9]**

1. **Conversation → Agent** *(추출)* — Slack/이메일/메모를 붙여넣으면 에이전트 자동 추출. ("우리 PM이 매주 수요일에 하는 일을 자동화해줘" → retro-facilitator 파생)
2. **Agent Battle Mode** *(경쟁)* — 같은 입력으로 두 버전을 나란히 실행, 심판 모델(Opus)이 승자 판정. X/LinkedIn 공유용 "전적표" 이미지 자동 생성.
3. **Prompt Fuzzer** *(진단)* — 에이전트당 50개의 엣지 케이스 자동 생성(adversarial/ambiguous/empty/injection), 실패 목록 CSV 다운로드.
4. **Agent Lineage Tree** *(서사)* — 포크 관계를 git-graph로 시각화. "이 에이전트는 15명이 포크했고 그중 3명이 유의미하게 개선" 같은 신호.
5. **🗣 Voice Forging** *(유입)* — 모바일에서 음성으로 "어떤 에이전트 필요한지" 말하면 해머 애니메이션이 실시간으로 내려찍히며 YAML 스트리밍. 엘리베이터/출퇴근 길 데모가 TikTok·Reels용 바이럴 포맷이 된다. Whisper API + iOS/Android PWA로 구현, 데스크톱 전환 딥링크 제공.
6. **📜 Ember Receipt** *(공유)* — 샌드박스 실행마다 **영수증 스타일 PDF** 자동 생성: 상단 모루 워터마크, 입력/tool calls/출력/토큰/비용 내역, 하단 서명란에 에이전트 slug. Slack unfurl·Notion embed·프린트 3매 출력 지원. *장인의 세금계산서*로 포지셔닝, X 공유 자산으로 설계.

**[Launch important · Week 10]**

7. **🌙 Nocturnal Forge** *(retention)* — 사용자의 활성 에이전트를 **밤사이 카나리 샘플 입력으로 자동 재실행**. 아침 이메일 다이제스트: "Your triage agent correctly caught 3 real incidents · hallucinated in 2/10 runs · Lint score dropped to 78." 잠든 사이 제품이 일한다 = Week-2 retention 직결.

**[Post-launch V2 · D+14~D+45]**

8. **⏳ Time-lapse Replay** *(스토리텔링)* — 모든 edit을 Git log 슬라이더로 scrub → 각 버전을 즉석 재실행 → 성능·비용 변화 차트. Lineage Tree + 시간축 = 독보적 서사 도구.
9. **🎭 Agent Choir** *(확장성)* — 단일 에이전트가 아니라 **오케스트라** 생성. 한 줄 입력("주간 비즈니스 리뷰")으로 Director + 3 Specialist가 handoff 구조로 나온다. CrewAI/LangGraph는 노드 에디터가 무거움 — Forge는 "자연어 한 줄 → 합창단"이 차별점.
10. **Skill Market** *(생태계)* — 커뮤니티가 공유하는 Anthropic Skills(PDF, docx, code-execution 등)을 원클릭 부착. 업로더에게 revenue share. 감사·결제 파이프라인 필요하므로 V2에서 착수.

**퍼널 커버리지 검증:**

| 축 | 담당 wow factor |
|---|---|
| 유입 (acquisition) | 🗣 Voice Forging |
| 전환 (activation) | Conversation→Agent, Fuzzer |
| 공유 (virality) | Battle Mode, 📜 Ember Receipt |
| 유지 (retention) | 🌙 Nocturnal Forge |
| 서사·확장 (moat) | Lineage Tree, ⏳ Replay, 🎭 Choir, Skill Market |

### 3.5 Phase 4 (런칭, 1주)

- Product Hunt 출시, Hacker News Show HN, X 런칭 스레드(agent-battle GIF 위주)
- Anthropic DevRel과 공동 런칭 블로그 1건 — "10 production agents in 10 minutes"
- 초대코드 1,000장 배포 (yc 배치, Hacker News 트래픽 버퍼링)

---

## 4. Technical Architecture

### 4.1 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| **Frontend** | Next.js 16 + Turbopack, TypeScript, Tailwind, shadcn/ui, Framer Motion | Turbopack FS 캐시로 DX 향상, shadcn은 디자인 시스템 커스텀이 쉬움 |
| **Backend** | Next.js Route Handlers + Edge Functions (Vercel) | 간단한 요청은 엣지, 긴 작업은 background function |
| **AI 코어** | Claude Opus 4.6 (생성), Haiku 4.5 (검증·린트), Sonnet 4.6 (에이전트 실행) | 품질·비용·속도 계층화 |
| **샌드박스** | Anthropic Managed Agents API (`/v1/agents`, `/v1/sessions`) | 자체 샌드박스 운영 회피 |
| **DB** | Postgres (Supabase) + Drizzle ORM | 템플릿/포크/실행 메타데이터 |
| **검색** | Postgres FTS + pgvector (임베딩 기반 템플릿 검색) | Algolia 비용 절감 |
| **인증** | Clerk (GitHub/Google OAuth) | 빠른 통합, 조직 계정 지원 |
| **파일/트레이스** | Cloudflare R2 | 샌드박스 로그·트레이스 아티팩트 |
| **결제** | Stripe (구독) | 표준 |
| **옵저버빌리티** | Sentry + PostHog | 에러·퍼널·피처 플래그 |

### 4.2 핵심 데이터 모델 (Drizzle 스키마 개요)

```
users          (id, email, github_id, tier, created_at)
agents         (id, owner_id, slug, title, description, yaml, is_public,
                parent_id, mcp_servers[], model, skill_ids[], version, created_at)
forks          (id, source_agent_id, target_agent_id, created_at)
runs           (id, agent_id, user_id, input, output, trace_url,
                tokens_in, tokens_out, cost_cents, verdict, created_at)
battles        (id, agent_a, agent_b, input, winner, judge_notes, created_at)
mcp_catalog    (id, name, url, description, category, popularity)
skills_catalog (id, skill_id, source, description, approved)
```

### 4.3 Forge Engine 내부

```
Intent (자유 서술)
  ↓
[Classifier (Haiku)] — 태스크 타입 분류 (research / triage / monitor / extract / notify / analyze)
  ↓
[Retriever] — pgvector로 유사 템플릿 3개 탐색 (README 10개가 seed)
  ↓
[MCP Recommender] — 태스크에 필요한 데이터 소스 추정 → MCP 카탈로그 매칭
  ↓
[Generator (Opus)] — Tool use로 구조화 생성:
    - generate_system_prompt (numbered steps, escape hatch, tone guide)
    - select_model (opus/sonnet/haiku with rationale)
    - attach_mcps (with permission_policy)
    - attach_skills
  ↓
[Linter (Haiku)] — 안티패턴 스캔, 점수 0-100
  ↓
[Renderer] — YAML 스트림 출력 (character-by-character, SSE)
```

### 4.4 샌드박스 보안

- Managed Agents API를 프록시로 감싸고 사용자 API 키는 "bring your own key"(BYOK)로 받음 — Forge는 키를 저장하지 않고 요청 헤더로만 릴레이
- MVP는 Forge의 공용 키로 분당 5회 무료 실행 제공, 그 이상은 BYOK
- 샌드박스 세션은 실행 직후 영속화하지 않음 (트레이스만 R2에 30일 보관)

---

## 5. Business Model

| Tier | 가격 | 내용 |
|---|---|---|
| **Free** | $0 | 월 10 에이전트 생성, 갤러리 열람·포크, 샌드박스 분당 5회 |
| **Pro** | $19/월 | 월 100 에이전트, 비공개 템플릿, Battle/Fuzzer 무제한, 샌드박스 60분/일, BYOK |
| **Team** | $99/월 (5석) | 팀 워크스페이스, 역할 권한, Skill Market 비공개 게시, 사용량 대시보드 |
| **Enterprise** | 상담 | SSO, 감사 로그, 온프레 MCP 연동, SLA |

**런칭 180일 목표**: 500 Pro (월 MRR $9,500) + 30 Team (월 MRR $2,970) = **$12.4K MRR**

---

## 6. Go-to-Market

### 6.1 포지셔닝
> "Claude agent를 YAML로 직접 쓰는 건 Dockerfile을 어셈블리로 쓰는 것과 같다. **Forge는 claude agent의 `docker init`이다.**"

### 6.2 런칭 시퀀스

| D-일 | 액션 | 채널 |
|---|---|---|
| D-30 | 랜딩 페이지 + 웨이팅 리스트 | 도메인 `forge.agents.sh` 확보 |
| D-21 | 비공개 알파 (본인 네트워크 30명) | X DM, 디스코드 |
| D-14 | Anthropic DevRel 연결, 공동 블로그 초안 | anthropic.com/customers |
| D-7 | 오픈 베타 (초대 코드 1,000장) | X 런칭 영상 (30초, Battle Mode 데모) |
| **D-0** | **Product Hunt + Show HN + X 스레드** | 아침 9am PST 동시 발사 |
| D+1 | 스레드 바이럴 부스트 — 실제 사용자 템플릿 리트윗 | |
| D+7 | 기능 업데이트 블로그 — fuzzer 결과 통계 공개 | |
| D+30 | "첫 달 통계" 인포그래픽 (몇 개 에이전트 생성됐고, 어떤 MCP가 인기인지) | HN second wave |

### 6.3 바이럴 장치
1. **모든 에이전트에 자동 OG 이미지** — Notion/Slack에 붙이면 예쁜 카드로 렌더
2. **Battle 결과 공유 이미지** — 트위터용 2048x1080, 승패·점수·트레이스 요약 포함
3. **"Made with Forge" 뱃지** — 임베드 시 뱃지 표시 → 역유입
4. **Weekly trending** — 매주 월요일 Top 10 에이전트 X 스레드

---

## 7. Risks & Mitigations

| 리스크 | 영향 | 대응 |
|---|---|---|
| Anthropic이 자체 agent builder 출시 | High | 우리는 "커뮤니티 + 갤러리 + 포크"에 승부. 마켓플레이스는 1급 시민으로 |
| Managed Agents API 요금이 비싸거나 불안정 | Med | BYOK 기본, 자체 샌드박스(Firecracker+Daytona) Phase 4 대비책 |
| 시스템 프롬프트 생성 품질 편차 | High | Phase 1 동안 10개 템플릿을 베이스라인으로 정량 평가 (eval harness) |
| MCP 서버 신뢰성(외부 의존) | Med | 카탈로그 상태를 주기 체크, 비정상 서버는 경고 배너 |
| 스팸/악성 템플릿 | Med | 공개 전 Haiku 자동 모더레이션, 사용자 신고 |

---

## 8. 12-Week Roadmap

```
Week 1-2   Foundation
           - 모노레포 셋업 (pnpm workspaces)
           - Drizzle 스키마 + 마이그레이션
           - Clerk 인증, Stripe 구독 설정
           - README 10개 템플릿을 시드 YAML로 파싱·로딩

Week 3-4   MVP (Phase 1)
           - Intent Composer UI
           - Forge Engine (Opus + tool use)
           - MCP Auto-Match
           - Monaco 에디터 + Zod 검증
           - 갤러리 기본 뷰 + 포크

Week 5-6   Sandbox (Phase 2)
           - Managed Agents API 프록시
           - Trace Viewer (react-flow 기반)
           - Prompt Lintr
           - Cost Estimator

Week 7-9   Wow Factors (Phase 3 · Launch critical)
           - Conversation → Agent (extractor + classifier)
           - Battle Mode + 판정 모델 (Opus judge + OG 카드)
           - Prompt Fuzzer + CSV export
           - Agent Lineage Tree (react-flow)
           - 🗣 Voice Forging (PWA + Whisper API, 모바일 딥링크)
           - 📜 Ember Receipt (PDF pipeline + Slack unfurl + Notion embed)

Week 10    Nocturnal Forge + Polish
           - 🌙 Nocturnal canary runner (cron → 이메일 다이제스트)
           - 디자인 QA, 모션 디테일 (DESIGN.md 참조)
           - 성능 최적화 (TTFA < 60s 검증)
           - 접근성 감사 (WCAG AA)

Week 11    Pre-launch
           - 오픈 베타 (초대 1,000장)
           - Anthropic 공동 블로그 준비
           - 바이럴 자산 (런칭 영상, OG 이미지, 트레일러 GIF)

Week 12    LAUNCH
           - Product Hunt + Show HN + X
           - 실시간 사용자 지원
           - D+7 피처 릴리즈 블로그
```

---

## 9. Success Criteria (D+90)

- [ ] 활성 사용자 2,000명
- [ ] Pro 구독자 300+
- [ ] 공개 갤러리 템플릿 200+
- [ ] TTFA 중앙값 < 60초
- [ ] Week-1 retention > 35%
- [ ] Battle Mode를 사용한 사용자 비율 > 20% (wow factor 검증)
- [ ] 📜 Ember Receipt 주간 공유 > 500회 (바이럴 검증)
- [ ] 🌙 Nocturnal Forge 다이제스트 이메일 오픈율 > 50% (retention 검증)
- [ ] 🗣 Voice Forging 유입 비율 > 15% (모바일 채널 검증)
- [ ] NPS > 45
- [ ] MRR $6K+

---

## 10. Open Questions

1. **BYOK를 MVP에서 강제할 것인가?** — 단순성 vs. 비용. 현재 플랜은 "공용 키 분당 5회 무료, 그 이상 BYOK".
2. **MCP 카탈로그 큐레이션** — Anthropic 공식 목록만 쓸지, 커뮤니티 등록을 받을지. MVP는 공식 + 검증된 20개로 시작 권장.
3. **오픈소스 vs 클로즈드** — 갤러리 UI만 OSS로 공개하면 커뮤니티 성장이 빠를 수 있음. 결정 필요.
4. **모바일 반응형** — MVP는 데스크톱만 대응할지. 답: 갤러리·뷰어는 모바일, 에디터는 데스크톱 전용.
5. **Enterprise 온프레 MCP 연동** — 몇 번째 분기에 착수할지.

---

## 11. 참고

- 디자인 방향은 `docs/DESIGN.md` 참조 (선택된 awesome-DESIGN: **"Anvil" — Warm Workshop × Dev-Tool Precision**)
- 시드 템플릿 출처: `README.md` (10개)
- 벤치마크 경쟁사: Vercel v0, Flowise, CrewAI Studio, LangGraph Studio, Relevance AI
