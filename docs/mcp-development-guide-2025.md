# MCP (Model Context Protocol) 개발 가이드 2025

> **최종 업데이트**: 2025년 8월 10일  
> **Claude Code 버전**: v1.16.0+  
> **현재 상태**: 11개 서버 정상 연결 ✅

## 📋 목차

1. [개요](#개요)
2. [현재 활성 MCP 서버 (11개)](#현재-활성-mcp-서버-11개)
3. [MCP 서버 설치 및 관리](#mcp-서버-설치-및-관리)
4. [MCP 서버별 상세 가이드](#mcp-서버별-상세-가이드)
5. [Serena MCP 고급 활용법](#serena-mcp-고급-활용법)
6. [환경변수 관리](#환경변수-관리)
7. [문제 해결](#문제-해결)
8. [Best Practices](#best-practices)
9. [관련 문서 통합](#관련-문서-통합)

## 개요

MCP(Model Context Protocol)는 Claude Code가 외부 도구와 데이터 소스에 접근할 수 있게 해주는 확장 시스템입니다. 

### 주요 특징
- **CLI 기반 관리**: v1.16.0부터 `claude mcp` 명령어로 관리
- **다양한 도구 통합**: 파일 시스템, 데이터베이스, 웹 검색, AI 분석 등
- **프로젝트별 독립 설정**: 각 프로젝트마다 독립적인 MCP 구성 가능

## 현재 활성 MCP 서버 (11개)

```bash
# 2025년 8월 10일 기준 활성 서버
claude mcp list
```

| 서버명 | 패키지/URL | 용도 | 상태 |
|--------|-----------|------|------|
| **filesystem** | `@modelcontextprotocol/server-filesystem@latest` | 파일 시스템 작업 | ✅ Connected |
| **memory** | `@modelcontextprotocol/server-memory@latest` | 지식 그래프 관리 | ✅ Connected |
| **supabase** | `@supabase/mcp-server-supabase@latest` | PostgreSQL 데이터베이스 | ✅ Connected |
| **github** | `@modelcontextprotocol/server-github@latest` | GitHub 저장소 관리 | ✅ Connected |
| **playwright** | `@playwright/mcp@latest` | 브라우저 자동화 | ✅ Connected |
| **sequential-thinking** | `@modelcontextprotocol/server-sequential-thinking@latest` | 복잡한 문제 해결 | ✅ Connected |
| **context7** | `@upstash/context7-mcp@latest` | 라이브러리 문서 검색 | ✅ Connected |
| **shadcn-ui** | `@jpisnice/shadcn-ui-mcp-server@latest` | UI 컴포넌트 개발 | ✅ Connected |
| **time** | `mcp-server-time` (Python) | 시간대 변환 | ✅ Connected |
| **tavily-remote** | `mcp-remote` (URL 기반) | 웹 검색 및 추출 | ✅ Connected |
| **serena** | `git+https://github.com/oraios/serena` (Python) | 고급 코드 분석 | ✅ Connected |

## MCP 서버 설치 및 관리

### 기본 명령어

```bash
# 서버 추가
claude mcp add <서버명> <명령어> -- <인자들>

# 서버 목록 확인
claude mcp list

# 서버 제거
claude mcp remove <서버명>

# 서버 정보 확인
claude mcp get <서버명>

# Claude API 재시작 (설정 반영)
claude api restart
```

### 설치 전 준비사항

```bash
# Node.js v22.15.1+ 확인
node --version

# Python 3.11+ 확인
python3 --version

# uvx 설치 (Python MCP용)
pip install uv
uvx --version
```

## MCP 서버별 상세 가이드

### 1. Filesystem 서버
파일 읽기, 쓰기, 디렉토리 탐색 등 파일 시스템 작업

```bash
# 설치
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /mnt/d/cursor/openmanager-vibe-v5

# 사용 예시
mcp__filesystem__read_file({ path: "src/app/page.tsx" })
mcp__filesystem__list_directory({ path: "src/components" })
mcp__filesystem__write_file({ path: "test.txt", content: "Hello" })
```

### 2. Memory 서버
프로젝트 지식 그래프 관리, 엔티티와 관계 저장

```bash
# 설치
claude mcp add memory npx -- -y @modelcontextprotocol/server-memory@latest

# 사용 예시
mcp__memory__create_entities({
  entities: [{
    name: "SimplifiedQueryEngine",
    entityType: "class",
    observations: ["AI 쿼리 처리 클래스"]
  }]
})
mcp__memory__search_nodes({ query: "AI" })
```

### 3. Supabase 서버
PostgreSQL 데이터베이스 작업, 마이그레이션, RLS 정책 관리

```bash
# 설치
claude mcp add supabase npx \
  -e SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... \
  -- -y @supabase/mcp-server-supabase@latest \
  --project-ref=vnswjnltnhpsueosfhmw

# 사용 예시
mcp__supabase__execute_sql({ query: "SELECT * FROM servers" })
mcp__supabase__list_tables({ schemas: ["public"] })
mcp__supabase__apply_migration({ 
  name: "add_indexes",
  query: "CREATE INDEX idx_servers_status ON servers(status);"
})
```

### 4. GitHub 서버
저장소 관리, 이슈/PR 생성, 파일 커밋

```bash
# 설치
claude mcp add github npx \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx \
  -- -y @modelcontextprotocol/server-github@latest

# 사용 예시
mcp__github__search_repositories({ query: "language:typescript stars:>1000" })
mcp__github__create_issue({ 
  owner: "user", 
  repo: "project",
  title: "Bug report",
  body: "Description"
})
```

### 5. Playwright 서버
브라우저 자동화, 웹 스크래핑, E2E 테스트

```bash
# 설치
claude mcp add playwright npx -- -y @playwright/mcp@latest

# 브라우저 설치 (필요시)
mcp__playwright__browser_install()

# 사용 예시
mcp__playwright__browser_navigate({ url: "https://example.com" })
mcp__playwright__browser_snapshot()
mcp__playwright__browser_click({ element: "Login button", ref: "button#login" })
```

### 6. Sequential Thinking 서버
복잡한 문제를 단계별로 분석하고 해결

```bash
# 설치
claude mcp add sequential-thinking npx -- -y @modelcontextprotocol/server-sequential-thinking@latest

# 사용 예시
mcp__sequential-thinking__sequentialthinking({
  thought: "문제를 분석해보면...",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5
})
```

### 7. Context7 서버
라이브러리 문서 검색 및 코드 예제

```bash
# 설치 (Upstash 계정 필요)
claude mcp add context7 npx \
  -e UPSTASH_MEMORY_CACHE_REST_URL=https://xxx.upstash.io \
  -e UPSTASH_MEMORY_CACHE_REST_TOKEN=AbYGAAIj... \
  -- -y @upstash/context7-mcp@latest

# 사용 예시
mcp__context7__resolve-library-id({ libraryName: "next.js" })
mcp__context7__get-library-docs({ 
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "app router"
})
```

### 8. Shadcn UI 서버
UI 컴포넌트 소스코드 및 사용법

```bash
# 설치
claude mcp add shadcn-ui npx -- -y @jpisnice/shadcn-ui-mcp-server@latest

# GitHub 토큰으로 API 제한 완화 (선택사항)
claude mcp add shadcn-ui npx -- -y @jpisnice/shadcn-ui-mcp-server@latest --github-api-key ghp_xxxxx

# 사용 예시
mcp__shadcn-ui__list_components()
mcp__shadcn-ui__get_component({ componentName: "button" })
mcp__shadcn-ui__get_component_demo({ componentName: "dialog" })
```

### 9. Time 서버
시간대 변환 및 현재 시간 조회

```bash
# 설치 (Python)
claude mcp add time uvx -- mcp-server-time

# 사용 예시
mcp__time__get_current_time({ timezone: "Asia/Seoul" })
mcp__time__convert_time({ 
  source_timezone: "Asia/Seoul",
  target_timezone: "America/New_York",
  time: "14:30"
})
```

### 10. Tavily Remote 서버
웹 검색, 콘텐츠 추출, 사이트 크롤링

```bash
# 설치 (Remote MCP)
claude mcp add tavily-remote npx -- -y mcp-remote \
  https://mcp.tavily.com/mcp/?tavilyApiKey=tvly-dev-xxxxx

# 사용 예시
mcp__tavily-remote__tavily_search({ 
  query: "Next.js 15 new features",
  max_results: 5
})
mcp__tavily-remote__tavily_extract({ 
  urls: ["https://example.com/article"]
})
```

## Serena MCP 고급 활용법

Serena는 Language Server Protocol 기반의 강력한 코드 분석 도구입니다.

### 설치

```bash
# IDE Assistant 컨텍스트로 설치
claude mcp add serena uvx -- \
  --from git+https://github.com/oraios/serena \
  serena-mcp-server \
  --context ide-assistant \
  --project /mnt/d/cursor/openmanager-vibe-v5
```

### 주요 기능

#### 1. 코드 구조 파악
```typescript
// 파일의 모든 심볼 개요
mcp__serena__get_symbols_overview({
  relative_path: "src/services/ai/SimplifiedQueryEngine.ts"
})
```

#### 2. 심볼 검색 및 분석
```typescript
// 클래스와 메소드 찾기
mcp__serena__find_symbol({
  name_path: "SimplifiedQueryEngine/query",
  relative_path: "src/services/ai/SimplifiedQueryEngine.ts",
  include_body: true,
  depth: 1
})
```

#### 3. 참조 추적
```typescript
// 특정 심볼을 사용하는 모든 위치
mcp__serena__find_referencing_symbols({
  name_path: "SimplifiedQueryEngine",
  relative_path: "src/services/ai/SimplifiedQueryEngine.ts"
})
```

#### 4. 코드 수정
```typescript
// 심볼 본문 교체
mcp__serena__replace_symbol_body({
  name_path: "methodName",
  relative_path: "src/file.ts",
  body: "new implementation"
})

// 새 코드 삽입
mcp__serena__insert_after_symbol({
  name_path: "lastMethod",
  relative_path: "src/file.ts",
  body: "new method() { ... }"
})
```

#### 5. 패턴 검색
```typescript
// TODO 주석 찾기
mcp__serena__search_for_pattern({
  substring_pattern: "TODO|FIXME|HACK",
  restrict_search_to_code_files: true,
  context_lines_before: 2,
  context_lines_after: 2
})
```

#### 6. 프로젝트 메모리
```typescript
// 중요 정보 저장
mcp__serena__write_memory({
  memory_name: "api-endpoints",
  content: "# API 엔드포인트 목록\n..."
})

// 저장된 정보 조회
mcp__serena__read_memory({
  memory_file_name: "api-endpoints"
})
```

## 환경변수 관리

### 필수 환경변수

```bash
# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Tavily
TAVILY_API_KEY=tvly-xxxxx

# Upstash (Context7)
UPSTASH_MEMORY_CACHE_REST_URL=https://xxx.upstash.io
UPSTASH_MEMORY_CACHE_REST_TOKEN=AbYGAAIj...
```

### 환경변수 설정 방법

1. **직접 전달 (권장)**
```bash
claude mcp add <서버명> npx -e KEY=value -- -y <패키지>
```

2. **.env.local 파일 활용**
```bash
export $(cat .env.local | xargs) && claude mcp add ...
```

## 문제 해결

### 일반적인 문제와 해결법

#### 1. "No MCP servers configured" 오류
```bash
# 서버 목록 확인
claude mcp list

# Claude API 재시작
claude api restart
```

#### 2. "Failed to connect" 오류
- 패키지가 npm에 존재하는지 확인
- 환경변수가 올바르게 설정되었는지 확인
- 네트워크 연결 상태 확인

#### 3. Supabase 연결 문제
```bash
# 기존 설정 제거
claude mcp remove supabase

# 올바른 환경변수로 재설정
claude mcp add supabase npx \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -- -y @supabase/mcp-server-supabase@latest \
  --project-ref=...

# API 재시작
claude api restart
```

#### 4. Python 서버 연결 실패
```bash
# uvx 버전 확인 (0.8.0+ 필요)
uvx --version

# Python 버전 확인 (3.11+ 필요)
python3 --version

# 가상환경 충돌 확인
which python
```

### 디버깅 명령어

```bash
# MCP 서버 상태 확인
claude mcp list

# 특정 서버 정보
claude mcp get <서버명>

# 서버 로그 확인 (개발자 도구)
F12 → Console → MCP 관련 로그 확인

# 서버 재설치
claude mcp remove <서버명>
claude mcp add <서버명> ...
```

## Best Practices

### 1. 서버 선택 가이드

| 작업 유형 | 추천 MCP 서버 | 이유 |
|----------|-------------|------|
| 파일 작업 | filesystem | 기본 파일 시스템 작업 |
| 코드 분석 | serena | LSP 기반 정확한 분석 |
| DB 작업 | supabase | PostgreSQL 직접 제어 |
| 웹 정보 | tavily-remote | 실시간 웹 검색 |
| UI 개발 | shadcn-ui | 컴포넌트 템플릿 |
| 복잡한 추론 | sequential-thinking | 단계별 문제 해결 |

### 2. 성능 최적화

```typescript
// ❌ 비효율적: 전체 파일 읽기
const file = await mcp__filesystem__read_file({ path: "large.ts" });

// ✅ 효율적: 필요한 심볼만 읽기
const symbol = await mcp__serena__find_symbol({
  name_path: "targetFunction",
  include_body: true
});
```

### 3. 에러 처리

```typescript
try {
  const result = await mcp__supabase__execute_sql({ 
    query: "SELECT * FROM users" 
  });
} catch (error) {
  // 폴백 처리
  console.log("Supabase 오류, 로컬 데이터 사용");
}
```

### 4. 병렬 처리

```typescript
// 독립적인 작업은 병렬로 실행
const [files, dbData, webSearch] = await Promise.all([
  mcp__filesystem__list_directory({ path: "src" }),
  mcp__supabase__execute_sql({ query: "SELECT * FROM servers" }),
  mcp__tavily-remote__tavily_search({ query: "latest news" })
]);
```

## 관련 문서 통합

이 문서는 다음 문서들을 통합하여 작성되었습니다:

### 기존 문서들 (Deprecated)
- `/docs/mcp-servers-complete-guide.md` → 이 문서로 통합
- `/docs/mcp-cli-migration-summary.md` → CLI 섹션에 통합
- `/docs/serena-mcp-practical-guide.md` → Serena 섹션에 통합
- `/docs/mcp-best-practices-guide.md` → Best Practices 섹션에 통합
- `/docs/sub-agents-mcp-mapping-guide.md` → 서브에이전트 관련은 별도 문서 참조
- `/docs/time-mcp-usage-guide.md` → Time 서버 섹션에 통합
- `/docs/shadcn-ui-mcp-guide.md` → Shadcn UI 섹션에 통합
- `/docs/tavily-mcp-troubleshooting.md` → Tavily 섹션에 통합

### 현재 유효한 문서
- **이 문서**: `/docs/mcp-development-guide-2025.md` - 모든 MCP 관련 정보 통합
- **서브에이전트 가이드**: `.claude/agents/*.md` - 각 서브에이전트별 MCP 활용법
- **프로젝트 가이드**: `/CLAUDE.md` - MCP 섹션 참조

## 추가 리소스

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Model Context Protocol 사양](https://modelcontextprotocol.io)
- [MCP 서버 디렉토리](https://github.com/modelcontextprotocol/servers)
- [커뮤니티 MCP 서버](https://mcp.so)

---

**💡 팁**: MCP 서버 설정 변경 후 반드시 `claude api restart`를 실행하세요.

**📌 주의**: 환경변수에 민감한 정보가 포함되어 있으므로 절대 하드코딩하지 마세요.