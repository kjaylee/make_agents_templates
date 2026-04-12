# Forge — Seed Templates

README.md의 10개 예제를 개별 YAML 파일로 분리한 **시드 템플릿** 카탈로그.
Forge MVP 런칭 시 갤러리의 초기 콘텐츠이며, `scripts/seed-templates.ts`가 이 디렉토리를 스캔해 DB에 인서트한다.

## 파일 목록

| # | Slug | Name | Model | MCPs | Skills |
|---|---|---|---|---|---|
| 01 | `blank` | Untitled agent | sonnet-4-6 | — | — |
| 02 | `deep-research` | Deep researcher | sonnet-4-6 | — | — |
| 03 | `structured-extractor` | Structured extractor | sonnet-4-6 | — | — |
| 04 | `field-monitor` | Field monitor | sonnet-4-6 | notion | — |
| 05 | `support-agent` | Support agent | sonnet-4-6 | notion, slack | — |
| 06 | `incident-commander` | Incident commander | **opus-4-6** | sentry, linear, slack, github | — |
| 07 | `feedback-miner` | Feedback miner | sonnet-4-6 | slack, notion, asana | — |
| 08 | `sprint-retro-facilitator` | Sprint retro facilitator | sonnet-4-6 | linear, slack | docx |
| 09 | `support-to-eng-escalator` | Support-to-eng escalator | sonnet-4-6 | intercom, atlassian, slack | — |
| 10 | `data-analyst` | Data analyst | sonnet-4-6 | amplitude | — |

## 카탈로그 통계

- **모델 분포**: sonnet-4-6 × 9, opus-4-6 × 1
- **MCP 커버리지 (unique 9종)**: notion, slack, linear, sentry, github, asana, intercom, atlassian, amplitude
- **Anthropic Skills**: docx × 1
- **Tool shapes**: agent_toolset_20260401 (all) + mcp_toolset (6개 템플릿)

## 네이밍 규칙

- 파일명: `{2-digit order}-{slug}.yaml`
- `slug` = `metadata.template`과 동일
- 순서는 README.md 등장 순서를 보존 (역사적 출처 추적 목적)

## 스키마

각 파일은 Anthropic Managed Agents API의 YAML 스펙을 따른다:

```yaml
name: string               # UI 표시명
description: string        # 1줄 설명
model: string              # claude-{opus|sonnet|haiku}-N-M
system: string | string[]  # 시스템 프롬프트 (block scalar 권장)
mcp_servers?: McpServer[]  # 선택적, MCP 연결
tools: Tool[]              # 필수, 최소 agent_toolset
skills?: Skill[]           # 선택적, Anthropic Skills
metadata:
  template: string         # slug, 소스 추적용
```

## 검증

```bash
# 모든 YAML 파일이 파싱 가능한지 확인
for f in *.yaml; do
  yq . "$f" > /dev/null && echo "✓ $f" || echo "✗ $f"
done
```

## 출처

이 시드들은 저장소 루트의 `README.md`에서 추출됐다. 원본 갱신 시 이 디렉토리도 함께 동기화한다 (향후 `scripts/sync-seeds.ts` 예정).

## 다음 단계

- [ ] `scripts/seed-templates.ts` — 이 디렉토리를 읽어 Drizzle로 `agents` 테이블에 upsert
- [ ] Zod 스키마 — 각 파일이 Forge 내부 에이전트 타입과 일치하는지 런타임 검증
- [ ] MCP catalog cross-reference — 각 `mcp_server.url`이 `mcp_catalog` 테이블에 등록되어 있는지 확인
