# MCP 서버 설정

**현재 MCP 환경**: 9개 서버 완벽 연결 (100% 가동률)

## 📊 MCP 현황 (2025-12-11 정리 완료)

| MCP 서버         | 연결 | 역할                          | 한도          |
| ---------------- | ---- | ----------------------------- | ------------- |
| **vercel**       | ✅   | Vercel 배포 관리              | 무제한        |
| **supabase**     | ✅   | PostgreSQL DB 관리            | 무제한        |
| **serena**       | ✅   | 코드 검색/메모리 (심볼 분석)  | 무제한        |
| **context7**     | ✅   | 라이브러리 공식 문서          | 무제한        |
| **playwright**   | ✅   | E2E 테스트 자동화             | 무제한        |
| **figma**        | ✅   | Design-to-Code                | **6회/월**    |
| **github**       | ✅   | GitHub 저장소 관리            | 무제한        |
| **tavily**       | ✅   | 웹 검색 - 심층 리서치         | 1,000/월      |
| **brave-search** | ✅   | 웹 검색 - 팩트체크/버전확인   | 2,000/월      |

## 🚫 제거된 서버 (2025-12-11)

| 서버                    | 제거 이유                      | 대체 방안               |
| ----------------------- | ------------------------------ | ----------------------- |
| **filesystem**          | Claude Code 내장 도구와 100% 중복 | Read, Write, Edit 도구  |
| **memory**              | Serena write_memory/read_memory로 대체 | Serena MCP 사용     |
| **time**                | 사용 빈도 낮음, 대안 존재      | `date` 명령어 등        |
| **shadcn-ui**           | Context7로 문서 조회 가능      | Context7 MCP 사용       |
| **sequential-thinking** | Claude 자체 추론 + TodoWrite로 대체 | 내장 기능 활용      |

## 🔧 MCP 설정 파일

**전역 설정**: `~/.claude.json`

```json
{
  "mcpServers": {
    "vercel": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@open-mcp/vercel"],
      "env": { "API_KEY": "your_vercel_token" }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase", "--project-ref", "your_project_id"],
      "env": { "SUPABASE_ACCESS_TOKEN": "your_token" }
    },
    "serena": {
      "command": "/home/$USER/.local/bin/serena-mcp-server",
      "args": []
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "figma": {
      "transport": "http",
      "url": "https://mcp.figma.com"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "your_github_token" }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": { "TAVILY_API_KEY": "your_api_key" }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/brave-search-mcp"],
      "env": { "BRAVE_API_KEY": "your_api_key" }
    }
  }
}
```

## 📋 빠른 명령어

```bash
# MCP 서버 상태 확인
claude mcp list

# 특정 서버 테스트
claude mcp test serena

# 환경변수 로드
source .env.local
```

## 🔗 관련 문서

- **SSOT**: `config/ai/registry-core.yaml`
- **상수 파일**: `src/config/constants.ts` (`MCP_SERVERS`)
- **MCP 가이드**: `docs/development/mcp/mcp-priority-guide.md`
