# 🔧 Claude Code MCP 상세 설정 가이드

> **최종 업데이트**: 2025년 1월 28일  
> **문서 용도**: MCP 고급 설정 및 문제 해결  
> **빠른 사용법**: `docs/mcp-quick-guide.md` 참조
> **공식 문서**: [Claude MCP (Model Control Protocol) 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)

## 📋 프로젝트 MCP 서버 현황

현재 프로젝트에서 사용 중인 MCP 서버: **9개** (100% 정상 작동 목표)

1. **filesystem** - 파일 시스템 작업 ✅
2. **github** - GitHub 통합 ✅
3. **memory** - 컨텍스트 메모리 ✅
4. **sequential-thinking** - 단계별 문제 분석 ✅
5. **context7** - 라이브러리 문서 조회 ✅
6. **tavily-mcp** - 웹 검색 및 콘텐츠 추출 ⚠️
7. **supabase** - 데이터베이스 작업 및 관리 ❓
8. **playwright** - 브라우저 자동화 및 테스트 ✅
9. **serena** - 코드 분석 및 리팩토링 (Python 기반) ✅

## 🔧 설정 파일 구조

### 프로젝트 설정 (.mcp.json)

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/mnt/d/cursor/openmanager-vibe-v5"
      ],
      "env": {}
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    },
    "tavily-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "tavily-mcp@0.2.8"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"],
      "env": {}
    },
    "serena": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena-mcp-server"
      ],
      "env": {}
    }
  }
}
```

## 🚀 MCP 서버 설치

### 기본 명령어

```bash
# 프로젝트 레벨 설치 (권장)
claude mcp add <서버명> -s project npx -y <패키지명>

# 사용자 레벨 설치
claude mcp add <서버명> -s user npx -y <패키지명>
```

### 실제 설치 예시

```bash
# Filesystem
claude mcp add filesystem -s project npx -y @modelcontextprotocol/server-filesystem .

# GitHub (토큰 필요)
claude mcp add github -s project -e GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}" npx -y @modelcontextprotocol/server-github

# Memory
claude mcp add memory -s project npx -y @modelcontextprotocol/server-memory

# Sequential Thinking
claude mcp add sequential-thinking -s project npx -y @modelcontextprotocol/server-sequential-thinking

# Context7
claude mcp add context7 -s project npx -y @upstash/context7-mcp

# Tavily (API 키 필요)
claude mcp add tavily-mcp -s project -e TAVILY_API_KEY="${TAVILY_API_KEY}" npx -y tavily-mcp@0.2.8

# Supabase (여러 환경변수 필요)
claude mcp add supabase -s project \
  -e SUPABASE_URL="${SUPABASE_URL}" \
  -e SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  -e SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}" \
  npx -y @supabase/mcp-server-supabase

# Playwright
claude mcp add playwright -s project npx -y @modelcontextprotocol/server-playwright

# Serena (Python 기반, uvx 필요)
# .mcp.json에 직접 추가 권장 (위 설정 참조)
```

## 🔑 환경 변수 설정

### 필수 환경변수 목록

```bash
# GitHub Token (Personal Access Token)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_YOUR_GITHUB_TOKEN_HERE

# Tavily API Key (웹 검색용)
TAVILY_API_KEY=tvly-YOUR_TAVILY_KEY_HERE

# Supabase 설정 (3개 모두 필요)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ACCESS_TOKEN=sbp_...
```

### GitHub Token 설정

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 필요한 권한 선택:
   - `repo` (전체 저장소 접근)
   - `read:org` (조직 읽기)
   - `write:discussion` (이슈/PR 작성)

### Tavily API Key 설정

1. [Tavily](https://tavily.com) 가입
2. API Keys 섹션에서 키 생성
3. 무료 플랜: 월 1,000회 검색 제공

### Supabase 설정

1. Supabase 프로젝트 대시보드 접속
2. Settings → API에서 URL과 Service Role Key 복사
3. Account → Access Tokens에서 Personal Access Token 생성

## 🔍 MCP 서버 관리

### 상태 확인

```bash
# Claude Code 내에서
/mcp

# CLI에서
claude mcp list
```

### 서버 재시작

```bash
# 특정 서버만 재시작
claude mcp restart <서버명>

# 모든 서버 재시작
claude mcp restart --all
```

### 서버 제거

```bash
# 설정 파일 직접 편집 (권장)
# .mcp.json에서 해당 서버 블록 삭제

# 또는 CLI 사용
claude mcp remove <서버명> -s project
```

## 🐛 문제 해결

### 일반적인 문제

#### 1. "MCP 서버가 연결되지 않았습니다"

```bash
# 디버그 모드 실행
claude --mcp-debug

# 로그 확인
tail -f ~/.claude/logs/mcp-server-*.log
```

#### 2. "Permission denied" 오류

```bash
# npx 캐시 정리
npx clear-npx-cache

# 권한 확인
ls -la ~/.npm
```

#### 3. GitHub 인증 실패

```bash
# 토큰 유효성 확인
curl -H "Authorization: token ${GITHUB_PERSONAL_ACCESS_TOKEN}" https://api.github.com/user

# 환경 변수 확인
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

### 고급 디버깅

#### MCP 서버 수동 실행

```bash
# 문제가 있는 서버 직접 실행
npx -y @modelcontextprotocol/server-filesystem /path/to/project

# 출력 확인으로 문제 진단
```

#### 설정 파일 검증

```bash
# JSON 구문 검증
cat .mcp.json | python -m json.tool
```

## 🚨 알려진 문제 및 해결 방법

### Serena MCP (Python 기반)

```bash
# uvx가 없는 경우 설치
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Python 3.10+ 필요
python3 --version
```

### Tavily API 키 오류

```bash
# API 키 유효성 확인
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TAVILY_API_KEY" \
  -d '{"query": "test"}'
```

### Supabase MCP 도구 인식 문제

- Claude Code 재시작 필요
- 환경변수가 올바르게 설정되었는지 확인
- `.env.local`과 시스템 환경변수 동기화

## 📝 Best Practices

### 1. 보안

- API 토큰은 절대 코드에 하드코딩하지 않기
- `.env.local` 파일은 반드시 `.gitignore`에 포함
- 필요한 최소 권한만 부여

### 2. 성능

- 불필요한 MCP 서버는 비활성화
- 대용량 파일 작업 시 주의
- Memory 서버는 세션 간 데이터 유지 안 됨

### 3. 협업

- `.mcp.json`은 Git에 커밋 (토큰 제외)
- 팀원들과 동일한 MCP 설정 공유
- README에 필요한 환경 변수 문서화

## 🔗 추가 리소스

- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [프로젝트 빠른 가이드](./mcp-quick-guide.md)
- [GitHub Token 설정 가이드](./setup/github-mcp-token-setup.md)
- [MCP 서버 상태 점검](./mcp-server-status-check.md)
- [MCP 문제 해결 가이드](./mcp-troubleshooting-guide.md)
