# 🚀 MCP (Model Context Protocol) 통합 가이드

> **⚠️ 이 문서는 구 버전입니다**
> 
> **최신 Claude Code MCP 설정 가이드는 [claude-code-mcp-setup-2025.md](./claude-code-mcp-setup-2025.md)를 참조하세요.**
>
> 이 문서는 기존 설정 참조용으로만 유지됩니다.

## 📋 현재 MCP 설정 상태

### ✅ 활성화된 MCP 서버 (7개)

| 서버 | 용도 | 함수 프리픽스 | 필요 환경변수 |
|------|------|--------------|--------------|
| **filesystem** | 파일 시스템 접근 | `mcp__filesystem__*` | - |
| **github** | GitHub API 통합 | `mcp__github__*` | GITHUB_TOKEN |
| **memory** | 컨텍스트 메모리 저장 | `mcp__memory__*` | - |
| **supabase** | 데이터베이스 통합 | `mcp__supabase__*` | SUPABASE_ACCESS_TOKEN (Personal Access Token 필요) |
| **context7** | 라이브러리 문서 검색 | `mcp__context7__*` | - |
| **tavily** | AI 웹 검색 | `mcp__tavily__*` | TAVILY_API_KEY |

### ❌ 제외된 MCP 서버
- **gemini-cli-bridge**: MCP 지원 중단, 직접 실행 도구로 전환

## 🔧 MCP 설정 방법 (공식)

### 1. Claude Code CLI 사용 (권장) ✅

```bash
# MCP 서버 추가 (로컬 범위)
claude mcp add <서버명> [옵션] -- <명령어>

# 환경변수와 함께 추가
claude mcp add <서버명> -e KEY=VALUE -- <명령어>

# 목록 확인
claude mcp list

# 서버 제거
claude mcp remove <서버명>
```

### 2. 실제 설정 명령어

```bash
# Filesystem MCP
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .

# GitHub MCP (토큰 필요)
claude mcp add github -e GITHUB_TOKEN="YOUR_TOKEN" -- npx -y @modelcontextprotocol/server-github

# Memory MCP
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory

# Supabase MCP (Personal Access Token 필요)
# 1. https://supabase.com/dashboard/account/tokens 에서 토큰 생성
# 2. 아래 명령어에서 YOUR_TOKEN과 PROJECT_REF 교체
claude mcp add supabase -e SUPABASE_ACCESS_TOKEN="YOUR_TOKEN" -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=PROJECT_REF

# Context7 MCP
claude mcp add context7 -- npx -y @modelcontextprotocol/server-context7

# Tavily MCP
claude mcp add tavily-mcp -e TAVILY_API_KEY="API_KEY" -- npx -y tavily-mcp@0.2.8
```

## 📁 설정 파일 위치

### 현재 방식 (Claude Code CLI)
- **전역 설정**: `~/.claude.json`
- **프로젝트별 설정**: `~/.claude.json` 내 projects 섹션
- **권한 설정**: `.claude/settings.local.json`

### ⚠️ 구 방식 (더 이상 사용하지 않음)
- ~~`.claude/mcp.json`~~ - JSON 직접 편집
- ~~`.claude/settings.json`~~ - MCP 서버 정의

## 🚀 MCP 도구 사용 예시

### 파일시스템 작업
```typescript
// 파일 읽기
mcp__filesystem__read_file({ path: "src/app/page.tsx" })

// 파일 쓰기  
mcp__filesystem__write_file({ path: "src/new.ts", content: "..." })

// 디렉토리 목록
mcp__filesystem__list_directory({ path: "src" })
```

### GitHub 작업
```typescript
// 이슈 생성
mcp__github__create_issue({ owner, repo, title, body })

// PR 생성
mcp__github__create_pull_request({ owner, repo, title, head, base })

// 코드 검색
mcp__github__search_code({ q: "function auth" })
```

### 메모리 작업
```typescript
// 엔티티 생성
mcp__memory__create_entities({
  entities: [{
    name: "프로젝트명",
    entityType: "Project",
    observations: ["설명"]
  }]
})

// 검색
mcp__memory__search_nodes({ query: "키워드" })
```

### Supabase 작업
```typescript
// 데이터 조회
mcp__supabase__select({
  table: "users",
  columns: ["id", "email"]
})

// 데이터 삽입
mcp__supabase__insert({
  table: "logs",
  data: { message: "..." }
})
```

### Context7 문서 검색
```typescript
// 1단계: 라이브러리 ID 찾기
mcp__context7__resolve-library-id({ libraryName: "next.js" })

// 2단계: 문서 가져오기
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "app router"
})
```

### Tavily 웹 검색
```typescript
// 웹 검색
mcp__tavily__search({
  query: "Next.js 15 features",
  max_results: 10
})

// 페이지 추출
mcp__tavily__extract({
  url: "https://example.com",
  include_images: true
})
```


## 🔐 환경변수 설정

### .env.local 파일
```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# Supabase (Personal Access Token 필요)
# 환경변수 대신 MCP 설정에 직접 추가하는 것을 권장
# SUPABASE_ACCESS_TOKEN=sbat_xxxxxxxxxxxxx

# Tavily
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```

### WSL 환경변수 설정
```bash
# .env.local에서 자동 로드
source .claude/setup-env.sh

# 또는 직접 export
export GITHUB_TOKEN="your_token"
```

## 🚨 문제 해결

### Supabase MCP 연결 문제
1. **Personal Access Token 생성 필요**
   - Service Role Key가 아닌 Personal Access Token 사용
   - https://supabase.com/dashboard/account/tokens 에서 생성
2. **프로젝트 참조 ID 추가**
   - `--project-ref=YOUR_PROJECT_ID` 옵션 필수
3. **Windows 사용자**
   - `cmd /c` 래퍼 추가 필요
4. **상세 가이드**: `.claude/fix-supabase-mcp.md` 참조

### MCP 서버가 표시되지 않을 때
1. Claude Code 완전 종료 후 재시작
2. `claude mcp list` 명령으로 설정 확인
3. 환경변수 설정 확인

### 권한 오류 발생 시
`.claude/settings.local.json`에 필요한 권한 추가:
```json
{
  "permissions": {
    "allow": [
      "mcp__서버명__함수명",
      "mcp__supabase__select",
      "mcp__supabase__insert",
      "mcp__supabase__update",
      "mcp__supabase__get_schema"
    ]
  }
}
```

### 설정 초기화
```bash
# 백업 생성
cp ~/.claude.json ~/.claude.json.backup

# MCP 서버 전체 제거
claude mcp remove --all

# 다시 설정
./scripts/setup-claude-code-wsl.sh
```

## 📊 모니터링

### MCP 서버 상태 확인
```bash
# 현재 설정된 서버 목록
claude mcp list

# 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY)"

# 패키지 설치 상태
npm list | grep modelcontextprotocol
```

## 🔄 마이그레이션 가이드

### 구 설정에서 새 설정으로
1. 기존 `.claude/mcp.json` 백업
2. Claude Code CLI로 서버 재설정
3. 구 설정 파일 제거

### 주의사항
- JSON 파일 직접 편집 방식은 더 이상 권장되지 않음
- 모든 설정은 Claude Code CLI를 통해 관리
- 환경변수는 `.env.local`에서 중앙 관리

## 📚 참고 문서
- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io)
- [Claude Code 설정 가이드](https://docs.anthropic.com/claude-code/settings)
- 프로젝트별 설정: `CLAUDE.md`