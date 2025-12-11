---
id: mcp-servers
title: 'MCP 서버 관리 가이드'
keywords: ['mcp', 'servers', 'management', 'configuration']
priority: high
ai_optimized: true
updated: '2025-12-12'
---

# 🔧 MCP 서버 관리 가이드

**9개 서버 완전 관리**: 설정, 최적화, 문제 해결

## 📊 활성 서버 현황 (2025-12-11 정리 완료)

### 🏆 Tier 1: 핵심 서버 (5개)

| 서버         | 유형  | 상태 | 역할                 | 한도     |
| ------------ | ----- | ---- | -------------------- | -------- |
| **vercel**   | HTTP  | ✅   | 배포 관리            | 무제한   |
| **supabase** | NPM   | ✅   | PostgreSQL DB        | 무제한   |
| **serena**   | Local | ✅   | 코드 검색/메모리     | 무제한   |
| **context7** | NPM   | ✅   | 라이브러리 문서      | 무제한   |
| **github**   | NPM   | ✅   | 저장소 관리          | 무제한   |

### 🥈 Tier 2: 전문 서버 (4개)

| 서버            | 유형 | 상태 | 역할               | 한도        |
| --------------- | ---- | ---- | ------------------ | ----------- |
| **playwright**  | NPM  | ✅   | E2E 테스트 자동화  | 무제한      |
| **figma**       | HTTP | ✅   | Design-to-Code     | **6회/월**  |
| **tavily**      | NPM  | ✅   | 심층 웹 리서치     | 1,000/월    |
| **brave-search**| NPM  | ✅   | 팩트체크/버전확인  | 2,000/월    |

## 🚫 제거된 서버 (2025-12-11)

| 서버                    | 제거 이유                      | 대체 방안               |
| ----------------------- | ------------------------------ | ----------------------- |
| **filesystem**          | Claude Code 내장 도구와 100% 중복 | Read, Write, Edit 도구  |
| **memory**              | Serena write_memory/read_memory로 대체 | Serena MCP 사용     |
| **time**                | 사용 빈도 낮음, 대안 존재      | `date` 명령어 등        |
| **shadcn-ui**           | Context7로 문서 조회 가능      | Context7 MCP 사용       |
| **sequential-thinking** | Claude 자체 추론 + TodoWrite로 대체 | 내장 기능 활용      |

**결과**: 토큰 27% 절약, 안정성 향상, 관리 복잡성 감소

## 🔧 서버별 설정

### Vercel MCP (HTTP)

```json
{
  "vercel": {
    "transport": "http",
    "url": "https://mcp.vercel.com"
  }
}
```

**특징**: HTTP 기반, OAuth 인증, 배포/로그/사용량 모니터링

### Supabase MCP

```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase", "--project-ref", "${SUPABASE_PROJECT_ID}"],
    "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }
  }
}
```

**필수 환경변수**: `SUPABASE_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`

### Serena MCP (Local)

```json
{
  "serena": {
    "command": "/home/$USER/.local/bin/serena-mcp-server",
    "args": []
  }
}
```

**특징**: 25개 코드 분석 도구, `activate_project` 먼저 호출 필요

### Context7 MCP

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  }
}
```

**특징**: 라이브러리 공식 문서 조회, 환경변수 불필요

### Playwright MCP

```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@executeautomation/playwright-mcp-server"]
  }
}
```

**의존성**: `npx playwright install chromium` 필요

### Figma MCP (HTTP)

```json
{
  "figma": {
    "transport": "http",
    "url": "https://mcp.figma.com"
  }
}
```

**주의**: Starter 플랜 **6회/월** 한도, 신중하게 사용

### GitHub MCP

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
  }
}
```

**필수 환경변수**: `GITHUB_TOKEN`

### Tavily MCP

```json
{
  "tavily": {
    "command": "npx",
    "args": ["-y", "tavily-mcp"],
    "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" }
  }
}
```

**특징**: 심층 리서치, 1,000회/월

### Brave Search MCP

```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@anthropic-ai/brave-search-mcp"],
    "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
  }
}
```

**특징**: 팩트체크/버전 확인, 2,000회/월

## 🔄 서버 관리 명령어

```bash
# 전체 서버 상태 확인
claude mcp list

# 개별 서버 테스트
claude mcp test serena

# Claude Code 재시작
pkill -f claude && claude

# 환경변수 로드
source .env.local
```

## 🔧 문제 해결

### 1. 연결 실패 (일반)

```bash
source .env.local
cat .mcp.json | jq .
claude --reload
```

### 2. Serena 타임아웃

```bash
# 프로젝트 활성화 필수
mcp__serena__activate_project({ project: 'openmanager-vibe-v5' })
```

### 3. Playwright 브라우저 에러

```bash
npx playwright install --with-deps chromium
```

## 🔗 관련 문서

- **SSOT**: `config/ai/registry-core.yaml`
- **상수 파일**: `src/config/constants.ts` (`MCP_SERVERS`)
- **설정 가이드**: `docs/development/mcp/mcp-configuration.md`
- **우선순위 가이드**: `docs/development/mcp/mcp-priority-guide.md`

**9개 서버 완전 관리** | **27% 토큰 절약** | **안정적 운영**
