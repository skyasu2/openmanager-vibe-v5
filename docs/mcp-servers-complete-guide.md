# MCP (Model Context Protocol) 서버 완전 가이드

> **최종 업데이트**: 2025년 7월 31일 05:56 KST  
> **Claude Code 버전**: v1.16.0+  
> **상태**: 10/10 서버 정상 연결 ✅  
> **마이그레이션**: CLI 기반 설정 완료 ✅

## 📋 목차

1. [개요](#개요)
2. [MCP 서버란?](#mcp-서버란)
3. [CLI 기반 설정 (주요 방법)](#cli-기반-설정-주요-방법)
4. [.mcp.json 파일 기반 설정 (프로젝트 공유용)](#mcpjson-파일-기반-설정-프로젝트-공유용)
5. [환경변수 확장](#환경변수-확장)
6. [OAuth 인증 지원](#oauth-인증-지원)
7. [Scope 설정](#scope-설정)
8. [현재 활성화된 MCP 서버](#현재-활성화된-mcp-서버)
9. [문제 해결](#문제-해결)
10. [추가 MCP 서버 추천](#추가-mcp-서버-추천)

## 개요

Claude Code v1.16.0부터 MCP 서버 설정은 주로 CLI 명령어를 통해 관리됩니다. 프로젝트 설정을 팀원과 공유하려면 추가로 .mcp.json 파일을 생성할 수 있습니다. 이 프로젝트는 이미 CLI 기반으로 마이그레이션이 완료되었습니다.

## MCP 서버란?

MCP(Model Context Protocol) 서버는 Claude가 외부 도구와 데이터 소스에 접근할 수 있게 해주는 확장 기능입니다. 파일 시스템 접근, 데이터베이스 쿼리, 웹 검색 등 다양한 기능을 제공합니다.

## CLI 기반 설정 (주요 방법)

### 기본 명령어

```bash
# MCP 서버 추가
claude mcp add <서버명> <명령어> -- <인자들>

# 서버 목록 확인
claude mcp list

# 서버 제거
claude mcp remove <서버명>

# 서버 정보 확인
claude mcp get <서버명>

# API 재시작
claude api restart
```

### Transport 유형

```bash
# STDIO (기본)
claude mcp add <서버명> npx -- -y <패키지>

# SSE (Server-Sent Events)
claude mcp add --transport sse <서버명> https://example.com/sse-endpoint

# HTTP
claude mcp add --transport http <서버명> https://example.com/mcp
```

### 필수 도구

- **Node.js**: v22.15.1+ (npx 포함)
- **Python**: 3.11+ (uvx 설치 필요)
- **Claude Code**: 최신 버전

### uvx 설치 (Python MCP 서버용)

```bash
# pip로 설치
pip install uv

# 또는 curl로 설치
curl -LsSf https://astral.sh/uv/install.sh | sh

# 설치 확인
uvx --version
```

## .mcp.json 파일 기반 설정 (프로젝트 공유용)

프로젝트 설정을 팀원과 공유하려면 프로젝트 루트에 `.mcp.json` 파일을 생성할 수 있습니다:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem@latest", "."]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

### 환경변수 확장

`.mcp.json`에서 `${VAR}` 또는 `${VAR:-default}` 형식으로 환경 변수를 참조할 수 있어 유연한 설정이 가능합니다.

### Scope 옵션

- `--scope local` (기본): 현재 프로젝트만
- `--scope user`: 모든 프로젝트에서 사용
- `--scope project`: 팀 공유 (.mcp.json 파일로 저장)

## 현재 활성화된 MCP 서버

| 서버명                | 패키지                                                    | 타입    | 용도                   |
| --------------------- | --------------------------------------------------------- | ------- | ---------------------- |
| `filesystem`          | `@modelcontextprotocol/server-filesystem@latest`          | Node.js | 파일 시스템 작업       |
| `memory`              | `@modelcontextprotocol/server-memory@latest`              | Node.js | 지식 그래프 관리       |
| `github`              | `@modelcontextprotocol/server-github@latest`              | Node.js | GitHub 저장소 관리     |
| `supabase`            | `@supabase/mcp-server-supabase@latest`                    | Node.js | 데이터베이스 작업      |
| `tavily-mcp`          | `tavily-mcp@0.2.9`                                        | Node.js | 웹 검색 및 콘텐츠 추출 |
| `sequential-thinking` | `@modelcontextprotocol/server-sequential-thinking@latest` | Node.js | 복잡한 문제 해결       |
| `playwright`          | `@playwright/mcp@latest`                                  | Node.js | 브라우저 자동화        |
| `time`                | `mcp-server-time`                                         | Python  | 시간/시간대 변환       |
| `context7`            | `@upstash/context7-mcp@latest`                            | Node.js | 라이브러리 문서 검색   |
| `serena`              | `git+https://github.com/oraios/serena`                    | Python  | 고급 코드 분석         |

## 설치 가이드

### CLI 명령어로 .mcp.json 파일 생성

```bash
# 프로젝트에 공유 서버 추가
claude mcp add shared-server -s project /path/to/server
```

이 명령을 실행하면 `.mcp.json` 파일이 자동 생성됩니다.

### 주요 MCP 서버 설치 예시

#### 1. Filesystem 서버

```bash
# 프로젝트 디렉토리 지정
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /mnt/d/cursor/openmanager-vibe-v5

# 현재 디렉토리 사용
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest .
```

#### 2. GitHub 서버

```bash
# 개인 액세스 토큰 필요
claude mcp add github npx \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxx \
  -- -y @modelcontextprotocol/server-github@latest
```

#### 3. Supabase 서버

```bash
# 환경변수와 프로젝트 ID를 사용한 설정
claude mcp add supabase npx \
  -e SUPABASE_URL=https://xxxxx.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
  -- -y @supabase/mcp-server-supabase@latest \
  --project-ref=xxxxx
```

**필수 요구사항:**

- `SUPABASE_URL`: 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role 키 (관리자 권한)
- `--project-ref`: 프로젝트 ID (URL에서 추출, 예: vnswjnltnhpsueosfhmw)

**참고:** 일부 버전에서는 Personal Access Token (PAT)를 요구할 수 있습니다.

#### 4. Serena 서버 (Python)

```bash
# IDE 통합용 설정
claude mcp add serena uvx -- \
  --from git+https://github.com/oraios/serena \
  serena-mcp-server \
  --context ide-assistant \
  --project /mnt/d/cursor/openmanager-vibe-v5

# 프로젝트 인덱싱 (대형 프로젝트용)
uvx --from git+https://github.com/oraios/serena index-project /path/to/project
```

#### 5. Context7 서버

```bash
# Upstash Redis 설정 필요
claude mcp add context7 npx \
  -e UPSTASH_REDIS_REST_URL=https://xxx.upstash.io \
  -e UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE... \
  -- -y @upstash/context7-mcp@latest
```

#### 6. Tavily 서버

```bash
# Tavily API 키 필요
claude mcp add tavily-mcp npx \
  -e TAVILY_API_KEY=tvly-xxxxxxxxxxxxx \
  -- -y tavily-mcp@0.2.9
```

#### 7. Playwright 서버

```bash
# Headless Chrome 사용
claude mcp add playwright npx -- \
  @playwright/mcp@latest \
  --browser=chromium \
  --headless

# 특정 브라우저 경로 지정
claude mcp add playwright npx \
  -e PLAYWRIGHT_BROWSERS_PATH=/home/user/.cache/ms-playwright \
  -- @playwright/mcp@latest
```

## 환경변수 설정

### 필수 환경변수 목록

```bash
# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_ANON_KEY=eyJhbGci...

# Tavily
TAVILY_API_KEY=tvly-xxxxx

# Upstash Redis (Context7)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIj...

# Memory 서버
MEMORY_FILE_PATH=/home/user/.claude/memory/knowledge-graph.json
```

### 환경변수 설정 방법

1. **직접 전달** (권장)

```bash
claude mcp add <서버명> npx -e KEY=value -e KEY2=value2 -- -y <패키지>
```

2. **.env.local 파일 사용**

```bash
# .env.local 파일에서 읽기
export $(cat .env.local | xargs) && claude mcp add ...
```

## 문제 해결

### 현재 프로젝트 상태

이 프로젝트는 이미 CLI 기반으로 마이그레이션이 완료되었으며, 10개의 MCP 서버가 모두 정상 연결되어 있습니다:

- filesystem, memory, github, supabase, tavily-mcp
- sequential-thinking, playwright, time, context7, serena

### 일반적인 문제

#### 1. "No MCP servers configured" 오류

```bash
# 서버 목록 확인
claude mcp list

# CLI 기반 설정으로 마이그레이션 필요
```

#### 2. "Failed to connect" 오류

- 패키지가 npm/PyPI에 존재하는지 확인
- 환경변수가 올바르게 설정되었는지 확인
- Claude Code 재시작: `claude api restart`

**Supabase 연결 문제 해결:**

```bash
# 1. 기존 설정 제거
claude mcp remove supabase

# 2. 올바른 환경변수로 재설정
claude mcp add supabase npx \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -- -y @supabase/mcp-server-supabase@latest \
  --project-ref=your-project-id

# 3. API 재시작
claude api restart
```

#### 3. Python 서버 연결 실패

```bash
# uvx 설치 확인
uvx --version

# Python 버전 확인 (3.11+ 필요)
python3 --version
```

### 디버깅 명령어

```bash
# MCP 서버 상태 확인
claude mcp list

# 특정 서버 정보
claude mcp get <서버명>

# 서버 제거 후 재설치
claude mcp remove <서버명>
claude mcp add <서버명> ...

# Claude API 재시작
claude api restart
```

## 추가 MCP 서버 추천

### 1. Brave Search (웹 검색)

```bash
claude mcp add brave-search npx \
  -e BRAVE_API_KEY=your_api_key \
  -- -y @modelcontextprotocol/server-brave-search@latest
```

### 2. Slack 통합

```bash
claude mcp add slack npx \
  -e SLACK_BOT_TOKEN=xoxb-xxxxx \
  -e SLACK_TEAM_ID=T12345 \
  -- -y @modelcontextprotocol/server-slack@latest
```

### 3. PostgreSQL

```bash
claude mcp add postgres npx \
  -e POSTGRES_URL=postgresql://user:pass@host:5432/db \
  -- -y @modelcontextprotocol/server-postgres@latest
```

### 4. Puppeteer (Playwright 대안)

```bash
claude mcp add puppeteer npx -- -y @modelcontextprotocol/server-puppeteer@latest
```

### 5. Google Drive

```bash
claude mcp add gdrive npx \
  -e GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}' \
  -- -y @modelcontextprotocol/server-gdrive@latest
```

## 고급 설정

### Transport 유형

```bash
# STDIO (기본)
claude mcp add <서버명> npx -- -y <패키지>

# SSE (Server-Sent Events)
claude mcp add --transport sse <서버명> https://example.com/sse-endpoint

# HTTP
claude mcp add --transport http <서버명> https://example.com/mcp \
  -H "Authorization: Bearer token"
```

### Scope 설정

```bash
# Local (기본) - 현재 프로젝트만
claude mcp add <서버명> ...

# User - 모든 프로젝트에서 사용
claude mcp add --scope user <서버명> ...

# Project - 팀 공유 (.mcp.json 파일로 저장)
claude mcp add --scope project <서버명> ...
```

## 마이그레이션 가이드

### 구 설정에서 공식 방식으로 전환

1. **기존 .claude/mcp.json 백업**

```bash
cp .claude/mcp.json .claude/mcp.json.backup
```

2. **프로젝트 루트에 새로운 .mcp.json 파일 생성**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem@latest", "."]
    }
  }
}
```

3. **환경변수 마이그레이션**

- 구 설정: `"env": { "KEY": "${KEY}" }`
- 신 설정: `.mcp.json` 파일 내 `"env": { "KEY": "${KEY}" }` 형식 유지

4. **설정 확인**

```bash
claude mcp list
```

## 참고 자료

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP 서버 디렉토리](https://github.com/modelcontextprotocol/servers)
- [커뮤니티 MCP 서버](https://mcp.so)

---

**💡 팁**: MCP 서버 설정 후 반드시 Claude Code를 재시작하거나 `claude api restart`를 실행하세요.
