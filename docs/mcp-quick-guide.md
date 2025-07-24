# 🚀 MCP 빠른 사용 가이드

> Claude Code에서 MCP 도구를 5분 안에 사용하는 방법

## 📋 현재 사용 가능한 MCP 도구 (4개)

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

## ⚡ 핵심 팁

1. **파일 경로는 절대 경로 사용**: `/mnt/d/cursor/project/...`
2. **GitHub 토큰은 환경변수로**: `.env.local`에 저장
3. **Memory는 세션 간 유지 안됨**: 중요한 정보는 파일로 저장
4. **Sequential thinking은 복잡한 문제에만**: 단순 작업엔 과도함

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
→ `.env.local`에 `GITHUB_TOKEN` 설정 확인
