# Forge — 배포 & 런치 설정 가이드

## 1. 도메인 설정

### Option A: agents.sh 도메인 구매
1. Cloudflare Registrar 또는 Namecheap에서 `agents.sh` 구매
2. Cloudflare DNS에 zone 추가
3. Cloudflare Dashboard → Pages → forge-web → Custom domains → `forge.agents.sh` 추가
4. CNAME 레코드 자동 생성됨

### Option B: 기존 도메인 사용
1. Cloudflare Dashboard → Pages → forge-web → Custom domains
2. 원하는 도메인/서브도메인 입력
3. DNS 레코드 안내에 따라 CNAME 추가

### Option C: pages.dev 그대로 사용
- Production: https://forge-web-85v.pages.dev/
- 즉시 사용 가능, SSL 자동

---

## 2. 환경변수 설정

### Cloudflare Pages 환경변수
Dashboard → Pages → forge-web → Settings → Environment variables

| Variable | Required | Where to Get |
|----------|:--------:|-------------|
| `ANTHROPIC_API_KEY` | Yes | console.anthropic.com → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | dashboard.clerk.com → API Keys |
| `CLERK_SECRET_KEY` | Yes | dashboard.clerk.com → API Keys |
| `CLERK_WEBHOOK_SECRET` | Yes | dashboard.clerk.com → Webhooks → Signing Secret |
| `CRON_SECRET` | Yes | 직접 생성: `openssl rand -hex 32` |
| `DATABASE_URL` | No (MVP) | Supabase/Neon → Connection string |
| `RESEND_API_KEY` | No (MVP) | resend.com → API Keys |

### 설정 순서

#### Step 1: Anthropic API Key
```
1. https://console.anthropic.com 접속
2. API Keys → Create Key
3. 이름: "forge-production"
4. Cloudflare Pages에 ANTHROPIC_API_KEY로 추가
```

#### Step 2: Clerk 설정
```
1. https://dashboard.clerk.com 접속
2. Create Application → "Forge"
3. Social connections: GitHub + Google 활성화
4. API Keys에서 Publishable Key + Secret Key 복사
5. Webhooks → Add Endpoint:
   - URL: https://forge-web-85v.pages.dev/api/webhook/clerk
   - Events: user.created
   - Signing Secret 복사
6. 모두 Cloudflare Pages 환경변수에 추가
```

#### Step 3: Cron Secret
```bash
openssl rand -hex 32
# 결과를 CRON_SECRET으로 설정
```

### 로컬 개발용 (.env.local)
```bash
cp .env.example .env.local
# 각 값을 채워넣기
```

---

## 3. SSR 배포 (API Routes 동작)

현재 Cloudflare Pages에는 정적 자산만 배포됨. API Routes를 동작시키려면:

### Option A: Vercel (권장)
```bash
vercel login
vercel link
vercel env add ANTHROPIC_API_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_WEBHOOK_SECRET
vercel env add CRON_SECRET
vercel deploy --prod
```

### Option B: Cloudflare Pages GitHub Integration
1. Dashboard → Pages → forge-web → Settings → Builds & deployments
2. Connect to Git → GitHub → kjaylee/make_agents_templates
3. Build settings:
   - Framework: Next.js
   - Root directory: apps/web
   - Build command: npx @cloudflare/next-on-pages
   - Build output: .vercel/output/static
4. Environment variables 설정 (위 표 참조)

### Option C: Docker (Self-hosted)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "--filter", "@forge/web", "start"]
```
→ fly.io, Railway, Render 등에 배포

---

## 4. Private Alpha (D-21)

### 테스터 선정 (30명)
- 카테고리별 10명씩:
  1. **Indie dev / Tech founder** — 혼자서 내부 자동화 에이전트를 만드는 사람
  2. **Platform / DevEx 엔지니어** — 팀용 에이전트 카탈로그 관리자
  3. **PM / Ops 리드** — 코드 없이 반복 업무 자동화하려는 사람

### 초대 템플릿

**X DM:**
```
Hi! I'm building Forge — a tool that generates Claude agents from plain English.

You describe the job, Forge hammers out the agent in under 60 seconds.

I'd love for you to be one of our 30 alpha testers. Would you try it out and give feedback?

Link: https://forge-web-85v.pages.dev
Feedback form: [Tally form URL]

Takes 5 minutes to try. Battle Mode is especially fun.
```

**Discord:**
```
🔨 Forge Alpha — Claude Agent Generator

Hey! Looking for 30 alpha testers for Forge.

What it does: describe what you need in plain English → get a production-ready Claude agent YAML in 60 seconds.

Cool features: Battle Mode (pit 2 agents head-to-head), Ember Receipt (thermal-printer-style run reports), Prompt Fuzzer (50 edge cases auto-tested).

Try it: https://forge-web-85v.pages.dev
Feedback: [Tally form URL]

DM me if you want an invite!
```

### 피드백 수집
1. Tally 또는 Typeform 폼 생성:
   - "What agent did you create?"
   - "How long did it take? (1-5 scale)"
   - "What was confusing?"
   - "What feature did you like most?"
   - "Would you recommend Forge? (NPS 0-10)"
2. GitHub Issues 라벨: `alpha-feedback`
3. Discord 채널: #forge-alpha-feedback

### 성공 기준 (D-21 → D-14)
- [ ] 30명 중 20명+ 가입
- [ ] 50+ 에이전트 생성
- [ ] NPS 40+
- [ ] Critical bugs 0개
- [ ] "가장 좋았던 기능" 1위 확인 (마케팅 메시지 조정용)

---

## 5. Timeline

```
D-30 (완료): Landing page + Cloudflare Pages 배포
D-21: Private alpha 시작 (30명, X DM + Discord)
D-14: Anthropic DevRel 연결, 공동 블로그 초안
D-7:  Open beta (초대 코드 1,000장), X 티저 영상
D-0:  Product Hunt + Show HN + X 동시 발사 (9 AM PST)
D+1:  Anthropic 공동 블로그 게시
D+7:  Week 1 통계 블로그
D+30: First month 인포그래픽
```
