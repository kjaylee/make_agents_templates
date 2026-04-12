# Forge Design Language — "Anvil"

> **Selected awesome-DESIGN.md direction:** a hand-picked blend of Anthropic's warm editorial aesthetic, Vercel/Linear's developer-tool precision, and Raycast's kinetic delight — reimagined as a **blacksmith's workshop**.
>
> **Tagline for the brand voice:** *"Crafted in fire. Deployed in a click."*

---

## 1. Why this direction

경쟁 제품들의 디자인 빈도를 보면 세 가지 흐름이 지배적이다:
1. **Notion/Linear 뉴트럴** — 안전하지만 기억되지 않음
2. **Vercel 모노크롬 + 네온** — 세련됐지만 포화 상태
3. **CrewAI/Flowise 노드 에디터** — 복잡해 보이고 차갑다

Forge는 **"에이전트를 단조(forge)한다"**는 은유를 제품명부터 일관되게 밀기 때문에, 디자인도 그 은유를 물리적으로 구현해야 한다. 결과물은:
- **따뜻함** — Anthropic 크림 베이지 계열 배경 + 종이 그레인 텍스처
- **장인정신** — 폰트·아이콘·모션이 전부 "수작업 도구" 느낌
- **정확함** — 코드 에디터·CLI·트레이스 뷰는 개발자 표준(모노스페이스·고밀도·키보드 우선)

즉 **"Stripe 문서의 편집 디자인 + Linear의 인터랙션 예리함 + 손으로 두드린 금속의 질감"**이 목표.

---

## 2. Brand Identity

### 2.1 Logotype
- 워드마크: `Forge` — 커스텀 세리프, 'F'의 수평 바가 망치의 손잡이처럼 살짝 아래로 기울어 있음
- 심볼: 모루(anvil) 실루엣 + 그 위에 떠오른 불꽃 하나. 단일 컬러 스탬프로도 동작
- 사용처:
  - 다크 배경에서는 `#FFFFFF` 단색
  - 라이트 배경에서는 `#1A1613` (딥 소울) 단색
  - 마케팅 히어로에서만 이펙트(스파크·잔열) 허용

### 2.2 Voice & Tone
- **간결하고 장인스럽게.** "Generate" 대신 **"Forge"**, "Delete" 대신 **"Discard"**, "Save" 대신 **"Temper"**, "Deploy" 대신 **"Ship"**.
- **겸손하되 자신 있게.** "This prompt has 3 weak spots" 같은 직설적인 진단. 꾸밈말 금지.
- **코드처럼 정확하게.** "약 2분 후" 대신 "ETA 01:47".

---

## 3. Color System

### 3.1 Core palette
| 토큰 | Hex | 용도 |
|---|---|---|
| `ink.900` (Forge Ink) | `#1A1613` | 최고 강조 텍스트, 로고 단색 |
| `ink.700` | `#2F2722` | 본문 |
| `ink.500` | `#6B5E54` | 보조 텍스트 |
| `ink.300` | `#B8A99C` | 힌트, placeholder |
| `bone.100` (Paper) | `#FAF7F1` | 라이트 모드 배경 (주) |
| `bone.50` | `#FFFDF8` | 카드 표면 |
| `bone.200` | `#F0EBE0` | 보조 배경, 구분선 |
| `ember.500` (Forge Ember) | `#D9541F` | 주 액션, Forge 버튼, 강조 |
| `ember.600` | `#B63F0E` | hover/pressed |
| `ember.100` | `#FCE8DC` | 배지 배경 |
| `iron.600` (Cool Iron) | `#3D4D58` | 트레이스 노드, 보조 액션 |
| `gold.500` (Molten Gold) | `#E8A13A` | Battle 승자, warning |
| `jade.500` | `#4A9B7F` | 성공, 린트 통과 |
| `rust.500` | `#A63A1A` | 에러, 린트 실패 |

### 3.2 Dark mode palette (Smithy Night)
| 토큰 | Hex |
|---|---|
| `bg.900` | `#0F0C0A` — 거의 검정, 살짝 붉은 기 |
| `bg.800` | `#1A1512` |
| `bg.700` | `#26201B` — 카드 표면 |
| `fg.100` | `#F5EFE6` |
| `fg.300` | `#BFB4A6` |
| `ember.400` | `#F27049` — 다크에서 약간 더 밝게 |

### 3.3 사용 원칙
- **한 화면에 ember는 하나의 액션에만.** 페이지당 primary CTA 1개 원칙
- **Battle Mode만 gold를 허용** — 승패 강조가 브랜드의 시그니처 순간이 되도록
- **Gradient 금지.** 단색 평면 + 미세한 종이 텍스처 오버레이만 사용

---

## 4. Typography

| 역할 | 서체 | 이유 |
|---|---|---|
| Display (hero) | **Tiempos Headline** | Anthropic과 동일 계열, 세리프가 "장인" 느낌 |
| UI body | **Inter Variable** | 중립적, 다국어 지원, 타이트 커닝 |
| Code / YAML | **Berkeley Mono** (대체: JetBrains Mono) | 숫자·기호가 선명 |
| Numeric KPI | **Söhne Mono** (대체: Inter Tabular) | 대시보드 수치의 정렬 |

### 4.1 스케일
```
Display XL  72/76  Tiempos    -2%  (랜딩 히어로 한 줄)
Display L   56/60  Tiempos    -2%
Display M   40/48  Tiempos    -1%
H1          32/40  Inter 600  -1%
H2          24/32  Inter 600  -0.5%
H3          20/28  Inter 600
Body L      18/28  Inter 400
Body M      15/24  Inter 400   (기본)
Body S      13/20  Inter 400
Caption     12/16  Inter 500  +2%  uppercase tracking
Code        14/22  Berkeley Mono
```

### 4.2 규칙
- 한 뷰 안에 세리프는 **타이틀 한 번만**. 본문은 항상 Inter.
- 긴 시스템 프롬프트는 항상 모노스페이스로 렌더 — "이건 코드다"라는 시각적 시그널

---

## 5. Texture & Surface

Forge의 디자인 차별화는 **표면의 질감**에서 온다:
- **Paper grain overlay** — bone.100 배경 위에 2% opacity의 노이즈 SVG
- **Anvil stamp** — 카드 우상단에 미세한 모루 엠보싱 (1% opacity)
- **Scribe divider** — 섹션 구분선은 얇은 이중선 (`0.5px + 1px gap + 0.5px`), 고서 느낌
- **Ember glow** — primary CTA 주변에 5px blur 15% ember 그림자

**금지:** 드롭 섀도우 남발, 네온 글로우, 유리 모피즘, 그라데이션 배경

---

## 6. Iconography

- **Phosphor Icons (Duotone)** 기본 세트 — 두꺼운 선 + 채움으로 "장인의 도구" 톤
- 브랜드 커스텀 12개:
  - `hammer` — Forge 액션
  - `anvil` — 로고/홈
  - `bellows` — 샌드박스 실행
  - `quench` — 저장/Temper
  - `sparks` — 성공 토스트
  - `tongs` — 편집
  - `crucible` — 갤러리
  - `ingot` — 템플릿 아이템
  - `chain` — 포크 관계
  - `rivet` — 설정 핀
  - `flame` — AI 생성 중
  - `ember-circle` — 상태 배지

---

## 7. Motion Language

> **철학: "무게가 있는 것이 찍힌다"** — 물리적 은유를 지키되 깔끔함을 훼손하지 않음

### 7.1 핵심 모션
| 트리거 | 애니메이션 | 듀레이션 / 이징 |
|---|---|---|
| **Forge 버튼 클릭** | 해머가 화면 중앙에서 1회 내려찍힘 → 스파크 파티클 12개 방사 → YAML 에디터가 character-by-character로 스트림 | 망치: 380ms `cubic-bezier(.35,1.6,.64,1)` / 스파크: 600ms ease-out |
| **YAML 스트리밍** | 타이핑처럼 한 글자씩, 키 입력음(subtle 'tink') | 약 60 chars/sec, 사용자 prefer-reduced-motion 시 즉시 표시 |
| **샌드박스 실행** | 풀무(bellows) 아이콘이 한 번 펌프되고 ember.500 진행 바 | 800ms, loop |
| **카드 hover** | Y-1px 살짝 떠오름 + ember 그림자 0 → 6% | 180ms ease-out |
| **Battle 승자 발표** | gold.500 빛이 왼→오 sweep, 텍스트 `WINNER`가 slightly bold로 | 900ms, 일회성 |
| **토스트(성공)** | 하단 중앙에서 페이퍼 슬립이 위로 페이드인 | 220ms ease-out |
| **🗣 Voice orb 누름** | ember.500 오브가 heartbeat pulse, 내부 파형 bar 5개가 실시간 amplitude 반영, 상단 live transcript fade-in | pulse 600ms loop, transcript 120ms fade |
| **🗣 Voice 해제 → Forge** | orb가 하단 모루 실루엣으로 0.5s 슬라이드 → 해머 1회 임팩트 → haptic 1회 → YAML 스트리밍 | slide 500ms `cubic-bezier(.32,0,.67,1)`, 해머 380ms |
| **📜 Ember Receipt 생성** | 페이퍼 슬립이 위→아래로 unroll (마치 영수증이 프린트되듯), 하단 끝단 ember 잉크 자국 dab | unroll 900ms ease-out, dab 200ms |
| **🌙 Nocturnal 달 오픈** | 이메일 클릭 시 히어로 상단 이모지 달이 좌상→우상으로 천천히 tilt-up, ember 달무리(halo) 15% bloom | 1200ms ease-out, 일회성 |

### 7.2 사운드 (선택적, 토글 가능)
- `tink.wav` — 메탈 가벼운 접촉, YAML 생성 시 문장부호마다
- `hammer.wav` — 굵은 임팩트, Forge 버튼
- `temper.wav` — 물 담금 소리, Save 성공
- 기본 음량: 20%, 사용자 첫 Forge 후 "사운드 켤래요?" 토스트 한 번만

### 7.3 접근성
- `prefers-reduced-motion: reduce` — 모든 물리 애니메이션 → opacity fade로 대체, 사운드 비활성
- 모든 상태 변화는 색 + 아이콘 + 텍스트 **3중 신호**

---

## 8. Component Library

shadcn/ui를 포크해 **"Anvil UI"**로 리브랜딩. 핵심 컴포넌트:

### 8.1 Button
```
Primary    : ember.500 bg, bone.50 text, 망치 아이콘 + "Forge"
Secondary  : transparent bg, ink.700 text, ink.300 border 1.5px
Ghost      : transparent, hover 시 bone.200
Destructive: rust.500 bg, bone.50 text, "Discard"
```
코너: `4px` (도구 느낌), 패딩: `14px 24px`, 폰트: Inter 500 15px

### 8.2 Card
- `bone.50` 표면, `1px bone.200` 테두리, `4px` 코너
- 우상단 anvil 엠보싱 (1% opacity)
- hover 시 `translateY(-1px)` + ember.500 15% 그림자

### 8.3 Editor (Monaco custom)
- 테마: `forge-light` / `forge-dark`
- 라인 넘버: `ink.300`, 활성 라인: `ember.100` bg
- 키워드: `ember.600`, 문자열: `jade.500`, 키: `iron.600`
- 린트 경고: 라인 좌측에 ember 물방울 배지

### 8.4 Trace Viewer
- react-flow 기반 방향 그래프
- 노드: `bone.50` 카드, 타입별 border 색 (tool call = iron, user = ink, assistant = ember)
- 엣지: 이중 세리프 라인, 데이터 흐름은 파티클 dot이 천천히 흐름

### 8.5 Gallery card
- 16:10 비율, 상단 60%는 에이전트의 모델 + MCP 아이콘이 큰 그리드로, 하단 40%는 제목 + description + 포크 카운트
- 포크 카운트는 `🔨 47 forks` 식으로 브랜드 아이콘 사용

---

## 9. Key Screens (Storyboard)

### 9.1 Landing (`/`)
```
[HEADER]  Forge  ·  Gallery  ·  Docs  ·  Pricing              [Sign in] [Start forging]

[HERO, 종이 질감 배경, 중앙정렬]
    Display XL:   "Forge Claude agents
                   the way you brief a teammate."
    Body L:       "Describe the job in plain English.
                   Ship a production agent in under a minute."

    [입력 박스, 60% 너비, placeholder "What should your agent do?"]
    [Forge 버튼 — 해머 아이콘 + 주황 ember]

    하단: "Powered by Claude Opus 4.6" 미니 배지

[SCROLL ▼]
[섹션 1] 10 seed templates from the community — 갤러리 카드 그리드
[섹션 2] How Forge works — 3단 스토리보드, 장인이 단조하는 일러스트 SVG
[섹션 3] Battle Mode 데모 GIF (자동재생)
[섹션 4] Pricing (3 티어 카드, ember가 Pro에만)
[FOOTER] 미니멀, bone.200 background
```

### 9.2 Forge Composer (`/forge`)
```
좌측 패널 (40%): Intent 입력
    ┌─────────────────────────────┐
    │ Describe the job            │
    │ [textarea, 6줄]              │
    ├─────────────────────────────┤
    │ Tags (optional)              │
    │ [chip picker]                │
    ├─────────────────────────────┤
    │ MCP hints                    │
    │ [notion] [slack] [+ add]     │
    ├─────────────────────────────┤
    │     [🔨 Forge agent]         │
    └─────────────────────────────┘

우측 패널 (60%): YAML 에디터 (처음에는 anvil 일러스트 + "Your agent
will appear here" 플레이스홀더)

Forge 클릭 시:
1. 해머 애니메이션 내려찍힘
2. YAML이 문자 스트리밍으로 찍힘 (tink 소리)
3. 린트 스코어 배지가 오른쪽 상단에 페이드인 (예: "92 / 100 · 1 suggestion")
4. 하단 "Test in sandbox" CTA 활성화
```

### 9.3 Sandbox (`/forge/:id/test`)
```
상단: 에이전트 메타 (이름, 모델, MCP 칩)
중앙: Trace Viewer (react-flow)
    - 좌측에서 User 노드부터 시작, 우측으로 tool calls가 branch
    - 실행 중인 노드는 ember pulse
좌측 드로어: 입력 sample picker
우측 드로어: 토큰/비용 실시간 카운터
하단: [Ship to Claude Console] primary CTA
```

### 9.4 Battle Mode (`/battle/:id`)
```
┌──── Agent A ────┐  ┌──── Agent B ────┐
│  trace view     │  │  trace view     │
│                 │  │                 │
│  output preview │  │  output preview │
│                 │  │                 │
│  4,210 tokens   │  │  5,105 tokens   │
└─────────────────┘  └─────────────────┘

하단: 심판 Opus의 Verdict 카드
    🏆 WINNER: Agent A
    점수: 8.6 vs 7.1
    근거: "A는 user 의도를 3번째 스텝에서 confirm했고..."
    [Share this battle] — OG 카드 생성
```

### 9.5 Gallery (`/gallery`)
```
상단: 검색 바 + 필터 (Model, MCP, Category, Trending, New)
본문: 3열 카드 그리드, 인피니트 스크롤
우측 사이드: "Trending this week" 1-10 리스트
```

### 9.6 Voice Forging — Mobile PWA (`/forge/voice`)

Portrait 전용. 엘리베이터·출퇴근 길 원샷 데모 포맷으로 설계.

```
[HEADER]
    좌: Forge 미니 로고 (hammer + anvil)
    우: ×  close

[BODY, bone.100 + paper-grain, vertical center stack]
    Caption S  (tracking +2%):   "HOLD TO SPEAK"
    Display M  (Tiempos):         "Describe the job,
                                   we'll forge it."

    ┌───────────────────────────┐
    │   ◎ Voice Orb  (ember.500) │   ← 120px radius
    │       ▁▂▅▇▃   waveform     │      paper-grain 2% overlay
    │                            │      누르면 heartbeat pulse
    └───────────────────────────┘

    [Live transcript]
    ink.500 18pt, 최대 3줄, 말꼬리 캐럿 blink

[FOOTER, caption]
    "Tap to stop · Swipe up to cancel"

── 해제 시퀀스 (§7.1 motion 참조) ──
1. Voice Orb가 하단으로 슬라이드 → 모루 실루엣 위에 안착 (500ms)
2. 화면 밖에서 해머가 1회 내려찍힘 (380ms, haptic 1회)
3. YAML이 character-by-character로 찍힘 (tink 사운드, 60 chars/sec)
4. 완료 → 하단 CTA 카드:
     [Continue here]  내장 모바일 에디터 (읽기 전용 + Fork 버튼)
     [Open on desktop ↗]  딥링크 QR + SMS 전송 옵션

── Fallback & 접근성 ──
- STT 실패 → 텍스트 입력 토글로 즉시 전환, Voice Orb가 키보드 아이콘으로 morph
- prefers-reduced-motion: 해머 → 간단한 페이드, 파형 → 고정 3-bar 평균선
- 파형은 color + motion + dB 수치 (3중 신호)
- 음성 권한 거부 → 풀블리드 페이퍼 카드에 "Enable mic to forge with your voice" + 권한 재요청 CTA
```

### 9.7 Ember Receipt (`/run/:id/receipt`)

샌드박스 실행 종료 즉시 생성. 화면 + PDF + Slack unfurl + Notion embed 4형태 동일 소스.

```
비율: 4:5 (X 공유 인덱스 카드) / 또는 A4 portrait (인쇄)
배경: bone.100 + paper-grain 2% + 상하단 Scribe divider (이중 세리프)

[HEADER, 중앙정렬, 상단에 anvil watermark 12% opacity]
    Tiempos L:   "Ember Receipt"
    Caption:     2026-04-09T14:32:17Z  ·  run/9f3a…b412

[DIVIDER]

[AGENT META — 2열 데피니션 리스트, Label=caption, Value=Berkeley Mono]
    Agent      incident-commander v3        Cost     $0.38
    Model      Opus 4.6                      Duration 00:01:47
    MCP        sentry · linear · slack · gh  Tokens   12,350 / 4,210

[DIVIDER]

[INPUT BLOCK]
    CAPTION "Input"
    Code:   Berkeley Mono, 4줄 프리뷰, 접힘 가능

[TRACE TIMELINE]
    iron.600 버티컬 라인 + inline Phosphor duotone 아이콘
    ■ 00:00.12  🔨 sentry.get_issue(id=#8827)           ✓ 210ms
    ■ 00:00.34  🔨 repo.search("PaymentController.rb")  ✓ 480ms
    ■ 00:01.02  🔨 linear.create_incident(sev="S1")     ✓ 720ms
    ■ 00:01.47  💬 assistant reply                       ✓ 15 tokens

[OUTPUT BLOCK]
    ink.700 본문, 최대 300자 프리뷰 + "Expand ↓" 토글

[FOOTER, 서명란 — 3열]
    좌:  "Forged by @alice"
    중앙: ember-circle 아이콘 + "Real run · not a mock"
    우:  QR → run.forge.sh/r/<id>
    하단: "Made with Forge" 뱃지, 워드마크 mono로

── Sharing surfaces ──
- **Slack unfurl**: anvil 아이콘 + 에이전트 이름 + 1줄 duration/cost + "Open full receipt"
- **Notion embed**: `/embed` 블록, 하이라이트 trace + cost gauge 위젯
- **PDF export**: print: portrait A4, 프린터 친화 모노크롬 fallback (ember → 60% gray)
- **OG image**: 2048x1080, 상단 anvil watermark + 에이전트 제목 + "Ember Receipt" 띠

── 접근성 ──
- 모든 아이콘은 aria-label + 텍스트 레이블 동반 (iconography never alone)
- 트레이스 타임라인은 `<ol>` 시맨틱, 스크린리더는 "Step 1 of 4" 방식으로 읽음
```

### 9.8 Nocturnal Digest — Morning Email

매일 06:30 로컬 타임에 발송. 잠든 사이 실행된 카나리 결과를 요약.

```
Subject:      🌙 Nocturnal Forge — your agents ran 12 canaries overnight
Preheader:    3 agents watched · 7 shipped changes observed · 1 needs attention
From:         "Forge" <forge@agents.sh>
width:        600px, single-column, dark-mode 호환

[HERO CARD — 상단]
    배경: bg.800 (다크 우선) / bone.100 (라이트 폴백)
    이모지 🌙 (달)  — §7.1 tilt-up 애니 (클라이언트 지원 시)
    Display M serif:   "Forged through the night."
    Body M:            "3 agents · 12 canary runs · 7 shipped changes observed."

[AGENTS SECTION — 카드 스택, 세로]
    per-agent card (3개 내외):
    ┌────────────────────────────────────────────┐
    │ [ember tile]  incident-commander v3        │
    │ 모델 아이콘    Canary pass: 8/10  ↑2         │
    │ + ember glow  Health: ■■■■■■■■■□ 82         │
    ├────────────────────────────────────────────┤
    │ ✓ alert from Sentry (prod-api) → triaged   │
    │   720ms · $0.04                            │
    │ ✓ ambiguous bug report → escalated         │
    │   correctly to on-call                     │
    │ ✗ hallucinated incident owner              │
    │   (canary #11) · $0.03                     │
    │ ↗ lint score 78 → 82 after @alice's edit   │
    ├────────────────────────────────────────────┤
    │ [Review full trace →]                      │
    └────────────────────────────────────────────┘

[FOOTER CTA]
    [View all runs]     ember.500 primary button, 전폭
    [Pause night runs]  텍스트 링크, ink.500

    하단 마이크로카피:
    "You'll get this only on days we catch something worth telling."
    "Forge · Forged in fire · Shipped in a click"
    unsubscribe · preferences · privacy

── 다크 모드 ──
- fg.100 텍스트 on bg.800 배경, ember는 `#F27049`로 약간 밝게
- 이미지: light/dark 자동 스와프 (CSS `@media (prefers-color-scheme)`)

── 접근성 ──
- Health gauge = 색(jade/gold/rust) + 숫자 + 텍스트 등급(Healthy/Watch/Fail)
- ✓/✗/↗는 전부 aria-hidden, 실제 의미는 텍스트로 동반
- 이메일은 평문 대체본 자동 생성 (정확히 같은 구조)

── 모바일 ──
- 600px → 100% responsive, 타일은 vertical stack
- 탭 타겟 44x44 이상
```

---

## 10. Marketing Assets

- **런칭 영상 30초** — 해머 애니메이션 클로즈업 → YAML 스트리밍 → 샌드박스 실행 → Product Hunt 로고
- **OG 이미지 템플릿** — 2048x1080, ember 망치 + 에이전트 이름 + 포크 카운트
- **Battle 카드 템플릿** — 트위터용, 양쪽 얼굴 카드 + gold WINNER 띠
- **Docs 일러스트** — hand-drawn 스타일 장인 도구 아이콘 세트 (Phosphor + 자체 커스텀)

---

## 11. Design Tokens (Tailwind Config 발췌)

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        ink: { 900: '#1A1613', 700: '#2F2722', 500: '#6B5E54', 300: '#B8A99C' },
        bone: { 50: '#FFFDF8', 100: '#FAF7F1', 200: '#F0EBE0' },
        ember: { 100: '#FCE8DC', 500: '#D9541F', 600: '#B63F0E' },
        iron: { 600: '#3D4D58' },
        gold: { 500: '#E8A13A' },
        jade: { 500: '#4A9B7F' },
        rust: { 500: '#A63A1A' },
      },
      fontFamily: {
        display: ['Tiempos Headline', 'Georgia', 'serif'],
        body: ['Inter Variable', 'system-ui', 'sans-serif'],
        mono: ['Berkeley Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: { DEFAULT: '4px', lg: '6px', xl: '10px' },
      backgroundImage: {
        'paper-grain': "url('/textures/grain-2pct.svg')",
      },
      boxShadow: {
        ember: '0 6px 20px -8px rgba(217, 84, 31, 0.15)',
      },
    },
  },
}
```

---

## 12. 왜 이 디자인이 WOW factor인가?

1. **은유가 제품 곳곳에 박혀 있다.** 이름(Forge), CTA(Hammer button), 사운드(tink/hammer), 모션(해머 임팩트) — 사용자가 "아, 이 서비스는 진짜로 에이전트를 단조한다는 느낌이구나"를 몸으로 느낀다.
2. **스크린샷이 스크롤을 멈춘다.** 경쟁 제품들이 죄다 Linear/Vercel 파생인 시장에서, bone.100 배경 + ember.500 액센트는 피드에서 즉시 식별된다.
3. **바이럴 스크린샷이 설계되어 있다.** Battle 카드, 포크 그래프, Trace Viewer 전부 그대로 공유 가능한 시각 자산. 제품이 곧 마케팅.
4. **개발자의 손에 익는다.** Monaco + 키보드 단축키 + YAML 모노스페이스 — 장식은 따뜻하지만 작업 영역은 Linear만큼 정밀.
5. **디자인 시스템이 확장 가능하다.** Anvil UI 토큰은 그대로 CLI 도구(`forge-cli`), VS Code 확장, Raycast 커맨드까지 확장 이식 가능.

---

## 13. 채택 근거 (awesome-DESIGN 비교)

| 후보 | 장점 | 단점 | 결정 |
|---|---|---|---|
| **Linear 미니멀** | 안전·성숙 | 차별화 없음, 은유 부재 | ❌ |
| **Vercel 모노 + 네온** | 현대적 | 과포화, 에이전트 도메인과 톤 불일치 | ❌ |
| **Stripe 그라데이션** | 프리미엄 | 기업 SaaS 느낌, indie dev에 과함 | ❌ |
| **Raycast 밀도감** | 키보드 친화 | 브랜드 개성 약함 | 부분 차용 (핫키) |
| **Arc 플레이풀** | 대담함 | 개발자 도구로는 산만 | ❌ |
| **🔨 Anvil (본 문서)** | 은유·개성·개발자 정밀도 동시에 | 커스텀 폰트/사운드 구현 비용 | ✅ **채택** |

---

## 14. 다음 액션

- [ ] Figma에 core tokens 파일 셋업 (bone/ember/ink)
- [ ] Tiempos Headline 라이선스 확인 (대체: Playfair Display)
- [ ] Berkeley Mono 라이선스 확인 (대체: JetBrains Mono)
- [ ] Anvil UI 컴포넌트 10개 shadcn 포크 (Button / Card / Input / Badge / Tabs / Toast / Dialog / Tooltip / Select / Checkbox)
- [ ] 해머 임팩트 모션 프로토타입 (Framer Motion + Rive 검토)
- [ ] 사운드 팩 제작 의뢰 (3개 wav, 총 예산 $300 이내)
- [ ] 랜딩 페이지 와이어프레임 → 하이파이 진행
- [ ] 접근성 감사 체크리스트 작성 (WCAG 2.2 AA)

---

**요약:** Forge의 디자인은 *Anthropic의 따뜻함 + Linear의 정밀 + 장인의 물리성*. 이름이 은유이고, 은유가 인터랙션이고, 인터랙션이 마케팅 자산이다. 런칭 영상 한 편이면 "그 망치 누르는 거 뭐야?"가 X 피드에 뜰 수 있도록 설계했다.
