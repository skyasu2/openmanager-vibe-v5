# 🚀 MCP 빠른 사용 가이드

> Claude Code에서 MCP 도구를 5분 안에 사용하는 방법

> **📚 공식 문서**: [Claude MCP (Model Control Protocol) 문서](https://docs.anthropic.com/en/docs/claude-code/mcp) - MCP에 대한 자세한 내용은 공식 문서를 참조하세요.

## 📋 현재 사용 가능한 MCP 도구

### 1. 📁 **filesystem** - 파일 작업

```bash
# 파일 읽기
mcp__filesystem__read_file("/path/to/file")

# 파일 쓰기
mcp__filesystem__write_file("/path/to/file", "content")

# 디렉토리 조회
mcp__filesystem__list_directory("/path/to/dir")
```

### 2. 🐙 **github** - GitHub 작업

```bash
# 이슈 생성
mcp__github__create_issue("owner", "repo", "title", "body")

# PR 생성
mcp__github__create_pull_request("owner", "repo", {title: "...", head: "...", base: "..."})

# 파일 조회
mcp__github__get_file_contents("owner", "repo", "path")
```

### 3. 🧠 **memory** - 컨텍스트 저장

```bash
# 정보 저장
mcp__memory__create_entities([{name: "...", entityType: "...", observations: [...]}])

# 정보 조회
mcp__memory__search_nodes("query")
```

### 4. 🤔 **sequential-thinking** - 복잡한 문제 분석

```bash
# 단계별 사고 시작
mcp__sequential-thinking__sequentialthinking({
  thought: "문제 분석...",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5
})
```

### 5. 🚀 **Vercel MCP** - 배포 환경 테스트 (별도 설정 필요)

⚠️ **주의**: Vercel MCP는 배포된 환경에서 실행되므로 별도 설정이 필요합니다.

**설정 방법**:

1. Vercel에 배포된 앱의 URL 확인
2. MCP 클라이언트에서 `https://your-app.vercel.app/api/mcp` 추가
3. 표준 MCP 도구로 호출 (mcp**vercel** 접두사 사용 안함)

**사용 가능한 도구**:

```bash
# 시스템 상태 확인
get_system_status()

# 환경변수 확인
check_env_config()

# API 헬스체크
health_check({ endpoint: "/api/health" })

# 로그 조회 (구현 예정)
get_recent_logs({ limit: 10 })

# 프로젝트 정보
get_project_info()

# 디버깅 가이드
debug_deployment({ issue: "문제 설명" })
```

## 🎯 실제 사용 시나리오

### 시나리오 1: 코드베이스 분석

```bash
# 1. 프로젝트 구조 파악
mcp__filesystem__list_directory("src")

# 2. 중요 파일 읽기
mcp__filesystem__read_file("src/app/page.tsx")

# 3. 발견한 정보 저장
mcp__memory__create_entities([{
  name: "MainPage",
  entityType: "Component",
  observations: ["Next.js 페이지 컴포넌트", "인증 체크 포함"]
}])
```

### 시나리오 2: GitHub 이슈 관리

```bash
# 1. 이슈 목록 확인
mcp__github__list_issues("owner", "repo")

# 2. 새 이슈 생성
mcp__github__create_issue("owner", "repo", "버그: 로그인 실패", "상세 설명...")

# 3. 이슈에 코멘트 추가
mcp__github__add_issue_comment("owner", "repo", 123, "해결 중입니다")
```

### 시나리오 3: 복잡한 버그 해결

```bash
# Sequential thinking으로 문제 분석
mcp__sequential-thinking__sequentialthinking({
  thought: "로그인 버그 분석: 먼저 인증 플로우를 확인해야...",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 3
})
```

### 시나리오 4: 배포 환경 검증 (Vercel MCP)

```bash
# 1. 배포 상태 확인
get_system_status()
# → environment: "production", region: "icn1"

# 2. 환경변수 검증
check_env_config()
# → SUPABASE_CONFIGURED: true, REDIS_CONFIGURED: true

# 3. API 헬스체크
health_check({ endpoint: "/api/auth/session" })
# → Status: 200

# 4. 문제 발생 시 디버깅
debug_deployment({ issue: "OAuth 리다이렉트 실패" })
# → 체크리스트와 해결 방법 제공
```

## ⚡ 핵심 팁

1. **파일 경로는 절대 경로 사용**: `/mnt/d/cursor/project/...`
2. **GitHub 토큰은 환경변수로**: `.env.local`에 저장
3. **Memory는 세션 간 유지 안됨**: 중요한 정보는 파일로 저장
4. **Sequential thinking은 복잡한 문제에만**: 단순 작업엔 과도함
5. **Vercel MCP는 배포 URL 필요**: `https://your-app.vercel.app/api/mcp`

## ❌ 자주하는 실수

- ❌ 상대 경로 사용: `"./src/file.ts"`
- ✅ 절대 경로 사용: `"/mnt/d/cursor/project/src/file.ts"`

- ❌ 한 번에 모든 파일 읽기
- ✅ 필요한 파일만 선택적으로 읽기

- ❌ Memory에 모든 것 저장
- ✅ 핵심 정보만 구조화해서 저장

## 🔧 문제 해결

**"MCP 서버가 연결되지 않았습니다" 오류**
→ `/mcp` 명령으로 상태 확인

**"파일을 찾을 수 없습니다" 오류**
→ 절대 경로 사용 확인

**GitHub 인증 실패**
→ `.env.local`에 `GITHUB_PERSONAL_ACCESS_TOKEN` 설정 확인
→ 권한: repo, workflow, read:org 필요
→ Claude Code 재시작 필요

**Vercel MCP 연결 실패**
→ 배포 URL 확인, `/api/mcp` 엔드포인트 접근 가능 여부 확인
