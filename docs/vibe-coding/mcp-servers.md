# MCP 서버 가이드

> Model Context Protocol로 AI 능력 확장

## MCP란?

**MCP (Model Context Protocol)**는 AI 모델에 외부 도구와 데이터를 연결하는 프로토콜입니다.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude Code │ ←→  │ MCP Server  │ ←→  │ External    │
│             │     │             │     │ Service     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 설정된 MCP 서버 (8개)

| MCP | 용도 | 우선순위 |
|-----|------|:--------:|
| **serena** | 코드 검색, 심볼 분석 | 높음 |
| **context7** | 라이브러리 문서 | 높음 |
| **sequential-thinking** | 복잡한 추론 | 높음 |
| **supabase** | PostgreSQL 관리 | 중간 |
| **vercel** | 배포 상태 | 중간 |
| **playwright** | E2E 테스트 | 중간 |
| **github** | 저장소/PR 관리 | 중간 |
| **tavily** | 웹 검색/리서치 | 낮음 |

## Serena (코드 분석)

### 기능
- 심볼 기반 코드 검색
- 참조 추적
- 메모리 (프로젝트 지식)

### 주요 도구

```bash
# 심볼 찾기
mcp__serena__find_symbol("useServerStatus")

# 참조 찾기
mcp__serena__find_referencing_symbols("MetricData")

# 파일 개요
mcp__serena__get_symbols_overview("src/hooks/useMetrics.ts")

# 패턴 검색
mcp__serena__search_for_pattern("TODO|FIXME")
```

### 사용 예시

```
You: "useServerStatus 훅을 사용하는 곳 찾아줘"
Claude: [serena로 참조 검색]
        → 5개 파일에서 사용 중
```

## Context7 (문서 검색)

### 기능
- 라이브러리 공식 문서 검색
- 최신 API 레퍼런스
- 코드 예제

### 사용법

```bash
# 라이브러리 ID 조회
mcp__context7__resolve-library-id("next.js")

# 문서 검색
mcp__context7__query-docs("/vercel/next.js", "App Router data fetching")
```

### 사용 예시

```
You: "Next.js 16 Server Actions 문서 확인해줘"
Claude: [context7로 최신 문서 검색]
        → 공식 문서 기반 답변
```

## Sequential Thinking (추론)

### 기능
- 단계별 문제 해결
- 복잡한 리팩토링 계획
- 아키텍처 설계

### 사용 예시

```
You: "이 모듈을 마이크로서비스로 분리하는 방법 분석해줘"
Claude: [sequential-thinking으로 단계별 분석]
        → Step 1: 의존성 분석
        → Step 2: 경계 식별
        → Step 3: 분리 계획
```

## Supabase (데이터베이스)

### 기능
- SQL 실행
- 마이그레이션 관리
- 테이블 조회

### 주요 도구

```bash
# SQL 실행
mcp__supabase__execute_sql("SELECT * FROM servers LIMIT 10")

# 테이블 목록
mcp__supabase__list_tables()

# 마이그레이션 적용
mcp__supabase__apply_migration("add_index", "CREATE INDEX...")
```

## Vercel (배포)

### 기능
- 배포 상태 확인
- 프로젝트 관리
- 로그 조회

### 주요 도구

```bash
# 프로젝트 목록
mcp__vercel__list_projects()

# 배포 상태
mcp__vercel__list_deployments("project-id")

# 빌드 로그
mcp__vercel__get_deployment_build_logs("deployment-id")
```

## Playwright (E2E)

### 기능
- 브라우저 자동화
- 스크린샷 캡처
- 테스트 실행

### 주요 도구

```bash
# 페이지 이동
mcp__playwright__browser_navigate("http://localhost:3000")

# 스냅샷 (접근성 트리)
mcp__playwright__browser_snapshot()

# 클릭
mcp__playwright__browser_click("Login button", "ref123")
```

## GitHub (저장소)

### 기능
- PR 생성/관리
- 이슈 관리
- 파일 조회

### 주요 도구

```bash
# PR 생성
mcp__github__create_pull_request(...)

# 이슈 목록
mcp__github__list_issues("owner", "repo")

# 파일 내용
mcp__github__get_file_contents("owner", "repo", "path")
```

## Tavily (웹 검색)

### 기능
- 심층 웹 검색
- 콘텐츠 추출
- 사이트 크롤링

### 주요 도구

```bash
# 검색
mcp__tavily__tavily-search("React 19 new features 2026")

# URL 추출
mcp__tavily__tavily-extract(["https://example.com"])
```

## MCP 설정

### 설정 파일 위치

```bash
~/.claude/settings.json
# 또는
.claude/settings.local.json (프로젝트별)
```

### 설정 예시

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["serena-mcp"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"]
    }
  }
}
```

## 권한 설정

```json
{
  "permissions": {
    "allow": [
      "mcp__serena__*",
      "mcp__context7__*",
      "mcp__supabase__execute_sql",
      "mcp__supabase__list_tables"
    ],
    "deny": [
      "mcp__supabase__apply_migration"
    ]
  }
}
```

## 트러블슈팅

### MCP 서버 연결 실패

```
증상: "MCP server not available"
해결:
1. 서버 프로세스 확인
2. 설정 파일 경로 확인
3. 의존성 설치 확인
```

### 느린 응답

```
증상: MCP 호출이 10초 이상
해결:
1. 쿼리 범위 축소
2. 캐시 활용
3. 불필요한 MCP 비활성화
```

## 관련 문서

- [Claude Code](./claude-code.md)
- [Skills](./skills.md)
- [워크플로우](./workflows.md)
