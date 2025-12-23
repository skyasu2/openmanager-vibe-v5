# MCP 서버 설정

**현재 MCP 환경**: 9개 서버 완벽 연결 (100% 가동률)
**Last Updated**: 2025-12-23

## 📊 MCP 현황

| MCP 서버         | 연결 | 역할                          | 한도          |
| ---------------- | ---- | ----------------------------- | ------------- |
| **vercel**       | ✅   | Vercel 배포 관리              | 무제한        |
| **figma**        | ✅   | Design-to-Code                | **6회/월**    |
| **serena**       | ✅   | 코드 검색/메모리 (심볼 분석)  | 무제한        |
| **supabase**     | ✅   | PostgreSQL DB 관리            | 무제한        |
| **context7**     | ✅   | 라이브러리 공식 문서          | 무제한        |
| **playwright**   | ✅   | E2E 테스트 자동화             | 무제한        |
| **github**       | ✅   | GitHub 저장소 관리            | 무제한        |
| **brave-search** | ✅   | 웹 검색 - 팩트체크/버전확인   | 2,000/월      |
| **tavily**       | ✅   | 웹 검색 - 심층 리서치         | 1,000/월      |

## 🚫 제거된 서버

| 서버                    | 제거 이유                      | 대체 방안               |
| ----------------------- | ------------------------------ | ----------------------- |
| **filesystem**          | Claude Code 내장 도구와 100% 중복 | Read, Write, Edit 도구  |
| **memory**              | Serena write_memory/read_memory로 대체 | Serena MCP 사용     |
| **time**                | 사용 빈도 낮음, 대안 존재      | `date` 명령어 등        |
| **shadcn-ui**           | Context7로 문서 조회 가능      | Context7 MCP 사용       |
| **sequential-thinking** | Claude 자체 추론 + TodoWrite로 대체 | 내장 기능 활용      |

## 🔧 MCP 설정 방식

### 설정 위치
- **프로젝트 설정**: `.mcp.json` (권장)
- **글로벌 설정**: `~/.claude/config.json` (비워둠)

### API 키 관리
- **직접 입력 방식** 사용 (환경변수 참조 X)
- `.mcp.json`에 API 키 직접 기입
- Git에 push되지 않으므로 안전

### 설정 파일 예제 (`.mcp.json`)

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp"],
      "env": { "VERCEL_API_TOKEN": "your_vercel_token" }
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/figma-mcp-server"]
    },
    "serena": {
      "command": "/home/$USER/.local/bin/uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena-mcp-server",
        "--enable-web-dashboard", "false",
        "--enable-gui-log-window", "false",
        "--log-level", "ERROR",
        "--tool-timeout", "30"
      ],
      "env": {
        "PYTHONUNBUFFERED": "1",
        "PYTHONDONTWRITEBYTECODE": "1",
        "TERM": "dumb",
        "NO_COLOR": "1",
        "SERENA_LOG_LEVEL": "ERROR"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": { "SUPABASE_ACCESS_TOKEN": "your_supabase_token" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token" }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server"],
      "env": { "BRAVE_API_KEY": "your_brave_api_key" }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": { "TAVILY_API_KEY": "your_tavily_api_key" }
    }
  }
}
```

## 📋 빠른 명령어

```bash
# MCP 서버 상태 확인
claude mcp list

# Claude Code 재시작 (설정 변경 후)
exit
claude

# 특정 서버 테스트 (대화 중)
# 각 MCP 도구 직접 호출로 테스트
```

## 🔗 관련 문서

- **SSOT**: `config/ai/registry-core.yaml`
- **AI 도구 규칙**: `.claude/rules/ai-tools.md`
- **WSL AI 도구**: `docs/environment/wsl-ai-tools.md`
