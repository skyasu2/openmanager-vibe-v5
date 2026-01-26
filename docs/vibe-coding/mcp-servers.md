# MCP 서버 가이드

> Model Context Protocol로 AI 능력 확장 - 설치, 설정, 사용법 통합 가이드

## 개요

**MCP (Model Context Protocol)**는 Claude Code에 외부 도구와 데이터를 연결하는 프로토콜입니다.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude Code │ ←→  │ MCP Server  │ ←→  │ External    │
│             │     │             │     │ Service     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 현재 사용 중인 MCP 서버 (9개)

| MCP | 용도 | 패키지 | 우선순위 |
|-----|------|--------|:--------:|
| **serena** | 코드 검색, 심볼 분석, 메모리 | `serena-mcp-server` (uvx) | 높음 |
| **context7** | 라이브러리 공식 문서 | `@upstash/context7-mcp` | 높음 |
| **sequential-thinking** | 복잡한 추론, 아키텍처 설계 | `@modelcontextprotocol/server-sequential-thinking` | 높음 |
| **stitch** | Google Stitch AI UI 디자인 | `@_davideast/stitch-mcp` | 중간 |
| **supabase** | PostgreSQL 관리 | `@supabase/mcp-server-supabase` | 중간 |
| **vercel** | 배포 상태 확인 | `vercel-mcp` | 중간 |
| **playwright** | E2E 테스트, 브라우저 자동화 | `@playwright/mcp` | 중간 |
| **github** | 저장소/PR 관리 | `@modelcontextprotocol/server-github` | 중간 |
| **tavily** | 심층 웹 검색, 리서치 | `tavily-mcp` | 낮음 |

---

## 설정 파일 구조

### 파일 위치 및 우선순위

```
~/.claude/settings.json           # 글로벌 설정 (모든 프로젝트)
.claude/settings.json             # 프로젝트 공용 설정 (Git 추적)
.claude/settings.local.json       # 프로젝트 로컬 설정 (Git 제외) ← 권한
.mcp.json                         # MCP 서버 실제 구성 (Git 제외) ← 토큰
```

| 파일 | 용도 | Git 추적 |
|------|------|:--------:|
| `.claude/settings.json` | Hooks, 출력 스타일 | ✅ |
| `.claude/settings.local.json` | 권한, MCP 활성화 목록 | ❌ |
| `.mcp.json` | MCP 서버 실제 토큰/경로 | ❌ |

### 현재 적용된 설정 방식

**Pragmatic 방식** (현재 프로젝트):
- `.mcp.json` 파일에 직접 토큰 저장
- `.gitignore`로 파일 보호
- 장점: 한눈에 설정 파악, WSL 환경변수 문제 해결
- 단점: 파일 유출 시 보안 위험

**Best Practice** (참고용):
- 환경변수로 토큰 분리
- `claude mcp add` CLI 사용
- 장점: 보안성, 이식성
- 단점: 설정 복잡, WSL 환경변수 누락 이슈

---

## 현재 설정 백업 (2026-01-27 Updated)

### .mcp.json 구조

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "vercel-mcp", "VERCEL_API_KEY=<your-token>"]
    },
    "serena": {
      "command": "/home/<user>/.local/bin/uvx",
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
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-token>"
      }
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
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
      }
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "<your-token>"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_USE_SYSTEM_GCLOUD": "1",
        "STITCH_PROJECT_ID": "<your-gcp-project-id>"
      }
    }
  }
}
```

### .claude/settings.local.json 권한 설정

```json
{
  "permissions": {
    "allow": [
      "mcp__serena__*",
      "mcp__context7__*",
      "mcp__supabase__*",
      "mcp__vercel__*",
      "mcp__playwright__*",
      "mcp__github__*",
      "mcp__tavily__*",
      "mcp__sequential-thinking__*",
      "mcp__stitch__*"
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "vercel", "serena", "supabase", "context7",
    "playwright", "github", "tavily", "sequential-thinking", "stitch"
  ]
}
```

---

## 토큰 발급 URL

| 서비스 | 발급 URL | 필요 권한 |
|--------|---------|----------|
| **Vercel** | https://vercel.com/account/tokens | - |
| **Supabase** | https://supabase.com/dashboard/account/tokens | - |
| **GitHub** | https://github.com/settings/tokens | `repo`, `read:org` |
| **Tavily** | https://tavily.com | API Key |

---

## 각 서버별 상세

### Serena (코드 분석) - 우선순위: 높음

심볼 기반 코드 검색, 참조 추적, 프로젝트 메모리 기능.

**설치 (uvx 필요)**:
```bash
pip3 install uvx
```

**주요 도구**:
```bash
mcp__serena__find_symbol("useServerStatus")      # 심볼 찾기
mcp__serena__find_referencing_symbols("MetricData")  # 참조 찾기
mcp__serena__get_symbols_overview("src/hooks/useMetrics.ts")  # 파일 개요
mcp__serena__search_for_pattern("TODO|FIXME")    # 패턴 검색
```

**사용 예시**:
```
You: "useServerStatus 훅을 사용하는 곳 찾아줘"
Claude: [serena로 참조 검색] → 5개 파일에서 사용 중
```

**WSL 최적화 옵션**:
- `--enable-web-dashboard false` - 웹 대시보드 비활성화
- `--log-level ERROR` - 로그 최소화
- `--tool-timeout 30` - 타임아웃 설정

---

### Context7 (문서 검색) - 우선순위: 높음

라이브러리 공식 문서 검색, 최신 API 레퍼런스.

**주요 도구**:
```bash
mcp__context7__resolve-library-id("next.js")     # 라이브러리 ID 조회
mcp__context7__query-docs("/vercel/next.js", "App Router")  # 문서 검색
```

**사용 예시**:
```
You: "Next.js 16 Server Actions 문서 확인해줘"
Claude: [context7로 최신 문서 검색] → 공식 문서 기반 답변
```

---

### Sequential Thinking (추론) - 우선순위: 높음

단계별 문제 해결, 복잡한 리팩토링 계획, 아키텍처 설계.

**사용 예시**:
```
You: "이 모듈을 마이크로서비스로 분리하는 방법 분석해줘"
Claude: [sequential-thinking으로 단계별 분석]
        → Step 1: 의존성 분석
        → Step 2: 경계 식별
        → Step 3: 분리 계획
```

---

### Stitch (UI 디자인) - 우선순위: 중간

Google Stitch AI로 UI 디자인 생성, Figma 연동.

**사전 요구사항**:
- gcloud CLI 설치 및 인증
- GCP 프로젝트에 Stitch API 활성화

**설치**:
```bash
# Stitch API 활성화
gcloud services enable stitch.googleapis.com --project=YOUR_PROJECT_ID

# 상태 확인
npx @_davideast/stitch-mcp doctor
```

**사용 예시**:
```
You: "로그인 페이지 UI 디자인해줘"
Claude: [stitch로 UI 생성] → Figma로 복사 가능
```

**환경변수**:
- `STITCH_USE_SYSTEM_GCLOUD`: 시스템 gcloud 사용 (1)
- `STITCH_PROJECT_ID`: GCP 프로젝트 ID

---

### Supabase (데이터베이스) - 우선순위: 중간

SQL 실행, 마이그레이션 관리, 테이블 조회.

**주요 도구**:
```bash
mcp__supabase__execute_sql("SELECT * FROM servers LIMIT 10")
mcp__supabase__list_tables()
mcp__supabase__apply_migration("add_index", "CREATE INDEX...")
```

---

### Vercel (배포) - 우선순위: 중간

배포 상태 확인, 프로젝트 관리, 로그 조회.

**주요 도구**:
```bash
mcp__vercel__getDeployments()
mcp__vercel__getDeployment("deployment-id")
```

---

### Playwright (E2E) - 우선순위: 중간

브라우저 자동화, 스크린샷 캡처, 테스트 실행.

**주요 도구**:
```bash
mcp__playwright__browser_navigate("http://localhost:3000")
mcp__playwright__browser_snapshot()      # 접근성 트리
mcp__playwright__browser_click("Login button", "ref123")
mcp__playwright__browser_take_screenshot()
```

---

### GitHub (저장소) - 우선순위: 중간

PR 생성/관리, 이슈 관리, 파일 조회.

**주요 도구**:
```bash
mcp__github__create_pull_request(...)
mcp__github__list_issues("owner", "repo")
mcp__github__list_pull_requests("owner", "repo")
mcp__github__get_file_contents("owner", "repo", "path")
```

---

### Tavily (웹 검색) - 우선순위: 낮음

심층 웹 검색, 콘텐츠 추출, 사이트 크롤링.

**주요 도구**:
```bash
mcp__tavily__tavily-search("React 19 new features 2026")
mcp__tavily__tavily-extract(["https://example.com"])
```

---

## 신규 설정 가이드

### 1. uvx 설치 (Serena용)

```bash
pip3 install uvx
```

### 2. .mcp.json 생성

프로젝트 루트에 `.mcp.json` 파일 생성 후 위의 설정 백업 내용을 복사하고 토큰 입력.

### 3. .claude/settings.local.json 생성

```bash
mkdir -p .claude
cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "mcp__serena__*",
      "mcp__context7__*",
      "mcp__supabase__*",
      "mcp__vercel__*",
      "mcp__playwright__*",
      "mcp__github__*",
      "mcp__tavily__*",
      "mcp__sequential-thinking__*",
      "mcp__stitch__*"
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "vercel", "serena", "supabase", "context7",
    "playwright", "github", "tavily", "sequential-thinking", "stitch"
  ]
}
EOF
```

### 4. .gitignore 확인

```gitignore
.mcp.json
.mcp.json.backup*
.claude/settings.local.json
```

### 5. 확인

Claude Code 실행 후:
```
You: "MCP 서버 상태 확인해줘"
Claude: [serena, context7, supabase 등 사용 가능 여부 표시]
```

---

## 트러블슈팅

### MCP 서버 연결 실패

```
증상: "MCP server not available"
해결:
1. .mcp.json 파일 존재 및 JSON 구문 확인
2. 토큰 값 확인
3. 의존성 설치: npm install / pip3 install uvx
4. claude --debug로 로그 확인
```

### Serena 타임아웃

```
증상: 대규모 코드베이스에서 응답 없음
해결:
1. --tool-timeout 값 증가 (기본 30초)
2. --log-level ERROR로 로그 최소화
3. 쿼리 범위 축소
```

### WSL 환경변수 누락

```
증상: 환경변수 기반 설정 동작 안 함
해결:
1. .mcp.json에 직접 토큰 입력 (Pragmatic 방식)
2. 또는 .bashrc에 export 추가 후 source ~/.bashrc
```

### 느린 응답

```
증상: MCP 호출이 10초 이상
해결:
1. 쿼리 범위 축소
2. 불필요한 MCP 비활성화 (enabledMcpjsonServers 수정)
3. Serena: --enable-web-dashboard false
```

---

## 관련 문서

- [Claude Code](./claude-code.md)
- [AI 도구 설치](./setup.md) - Claude Code, Codex, Gemini 설치
- [Skills](./skills.md)
- [워크플로우](./workflows.md)

---

_Last Updated: 2026-01-27_
