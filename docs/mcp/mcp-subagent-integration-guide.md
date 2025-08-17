# 서브에이전트 MCP 통합 가이드

> **업데이트**: 2025년 7월 29일  
> **버전**: Claude Code v1.16.0+ (CLI 기반 MCP)

## 🚀 개요

이 문서는 서브에이전트가 CLI 기반 MCP(Model Context Protocol) 서버를 활용하는 방법을 설명합니다.

### MCP 설정 방식 변경사항

| 구분      | 이전 방식 (v1.15.x 이하) | 현재 방식 (v1.16.0+)           |
| --------- | ------------------------ | ------------------------------ |
| 설정 파일 | `.claude/mcp.json`       | CLI 명령어로 관리              |
| 설정 위치 | 프로젝트 로컬 파일       | `~/.claude.json` projects 섹션 |
| 설정 방법 | 파일 직접 편집           | `claude mcp add/remove/list`   |
| 환경 변수 | `${ENV_VAR}` 참조        | `-e KEY=value` 플래그          |

## 📋 서브에이전트별 MCP 활용 현황

### 1. filesystem MCP 사용 서브에이전트

**주요 사용자:**

- `mcp-server-admin`
- `code-review-specialist`
- `doc-writer-researcher`
- `test-automation-specialist`
- `security-auditor`
- `doc-structure-guardian`
- `debugger-specialist`

**활용 예시:**

```typescript
// 파일 시스템 작업
mcp__filesystem__list_directory({ path: '/src' });
mcp__filesystem__read_file({ path: '/src/index.ts' });
mcp__filesystem__write_file({ path: '/docs/new.md', content: '...' });
```

### 2. github MCP 사용 서브에이전트

**주요 사용자:**

- `doc-writer-researcher`
- `security-auditor`
- `debugger-specialist`

**활용 예시:**

```typescript
// GitHub 통합 작업
mcp__github__search_repositories({ query: 'topic:mcp' });
mcp__github__get_file_contents({
  owner: 'anthropics',
  repo: 'claude-code',
  path: 'README.md',
});
mcp__github__create_issue({ owner: 'myorg', repo: 'myrepo', title: 'Bug fix' });
```

### 3. supabase MCP 전담 서브에이전트

**전담 사용자:**

- `database-administrator`

**활용 예시:**

```typescript
// Supabase 데이터베이스 작업
mcp__supabase__list_tables({ schemas: ['public'] });
mcp__supabase__execute_sql({ query: 'SELECT * FROM servers LIMIT 10' });
mcp__supabase__apply_migration({
  name: 'add_indexes',
  query: 'CREATE INDEX...',
});
```

### 4. 웹 검색 MCP 사용 서브에이전트

**주요 사용자:**

- `doc-writer-researcher` (tavily-remote, context7)

**활용 예시:**

```typescript
// 웹 검색 및 문서 조회
mcp__tavily - remote__tavily_search({ query: 'Next.js 15 best practices' });
mcp__context7__get -
  library -
  docs({ context7CompatibleLibraryID: '/vercel/next.js' });
```

### 5. 고급 분석 MCP 사용 서브에이전트

**주요 사용자:**

- `debugger-specialist` (sequential-thinking)
- `test-automation-specialist` (playwright)
- `ux-performance-optimizer` (playwright)

**활용 예시:**

```typescript
// 복잡한 추론
mcp__sequential -
  thinking__sequentialthinking({
    thought: '버그의 근본 원인 분석...',
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 5,
  });

// 브라우저 자동화
mcp__playwright__browser_navigate({ url: 'http://localhost:3000' });
mcp__playwright__browser_snapshot();
```

## 🔧 서브에이전트에서 MCP 활용 방법

### 1. MCP 서버 가용성 확인

서브에이전트는 작업 시작 전에 필요한 MCP 서버가 활성화되어 있는지 확인해야 합니다:

```bash
# 현재 연결된 MCP 서버 확인
claude mcp list
```

### 2. MCP 도구 호출 패턴

**기본 패턴:**

```typescript
// MCP 도구 호출: mcp__<서버명>__<기능명>
const result = await mcp__filesystem__read_file({
  path: '/path/to/file.ts',
});
```

**에러 처리:**

```typescript
try {
  const data = await mcp__supabase__execute_sql({
    query: 'SELECT * FROM users',
  });
} catch (error) {
  console.error('MCP 호출 실패:', error);
  // 폴백 로직 실행
}
```

### 3. 서브에이전트 정의에서 MCP 명시

각 서브에이전트의 `.md` 파일에서 사용하는 MCP 도구를 명시:

```markdown
---
name: my-agent
description: My specialized agent
tools: mcp__filesystem__*, mcp__github__*, Read, Write
---
```

## 🚨 중요 고려사항

### 1. MCP 서버 설치 확인

서브에이전트가 특정 MCP를 필요로 할 때:

```bash
# 필요한 MCP 서버 설치 (사용자가 직접 실행)
claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /path/to/project
```

### 2. 환경 변수 처리

CLI 기반 시스템에서는 환경 변수를 `-e` 플래그로 전달:

```bash
# GitHub MCP with token
claude mcp add github npx -e GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx -- -y @modelcontextprotocol/server-github@latest
```

### 3. 프로젝트별 격리

- 각 프로젝트의 MCP 설정은 `~/.claude.json`의 projects 섹션에서 독립적으로 관리
- 서브에이전트는 현재 프로젝트 컨텍스트의 MCP만 사용 가능

## 📚 실전 예시

### 코드 리뷰 서브에이전트 워크플로우

```typescript
// 1. 파일 시스템 탐색
const files = await mcp__filesystem__list_directory({
  path: '/src/services',
});

// 2. 코드 읽기
const content = await mcp__filesystem__read_file({
  path: '/src/services/ai/engine.ts',
});

// 3. GitHub에서 관련 이슈 확인
const issues = await mcp__github__search_issues({
  q: 'repo:myorg/myrepo is:issue is:open label:bug',
});

// 4. 리뷰 결과 작성
await mcp__filesystem__write_file({
  path: '/reports/code-review-2025-01-29.md',
  content: reviewReport,
});
```

### 문서 작성 서브에이전트 워크플로우

```typescript
// 1. 기술 문서 검색
const docs =
  (await mcp__tavily) -
  remote__tavily_search({
    query: 'Upstash Memory Cache best practices 2025',
    max_results: 10,
  });

// 2. 라이브러리 문서 조회
const libDocs =
  (await mcp__context7__get) -
  library -
  docs({
    context7CompatibleLibraryID: '/upstash/memory cache',
    topic: 'caching strategies',
  });

// 3. 문서 생성
await mcp__filesystem__write_file({
  path: '/docs/memory cache-integration-guide.md',
  content: compiledDocumentation,
});
```

## 🔄 마이그레이션 가이드

### 구버전 코드 업데이트

**이전 (파일 기반):**

```typescript
// .claude/mcp.json 참조
const config = readMcpConfig();
```

**현재 (CLI 기반):**

```typescript
// MCP 도구 직접 호출
const result = await mcp__filesystem__read_file({ path: '...' });
```

### 서브에이전트 업데이트 체크리스트

- [ ] MCP 도구 호출 방식이 `mcp__<서버>__<기능>` 형식인지 확인
- [ ] 환경 변수 참조(`${VAR}`) 제거
- [ ] `.claude/mcp.json` 파일 참조 제거
- [ ] CLI 명령어 사용법 문서화
- [ ] 에러 처리 로직 추가

## 🔗 관련 문서

- [MCP 서버 완전 가이드](/docs/mcp-servers-complete-guide.md)
- [서브에이전트 MCP 사용 현황](/docs/subagents-mcp-usage-summary.md)
- [Serena MCP 실전 활용 가이드](/docs/serena-mcp-practical-guide.md)
- [CLAUDE.md](/CLAUDE.md) - 프로젝트 가이드

## 📝 요약

1. **MCP는 이제 CLI로 관리**: `claude mcp add/remove/list`
2. **서브에이전트는 MCP 도구 직접 호출**: `mcp__<서버>__<기능>`
3. **프로젝트별 독립 설정**: `~/.claude.json` projects 섹션
4. **환경 변수는 설치 시 전달**: `-e KEY=value`
5. **구버전 참조 제거 필요**: `.claude/mcp.json` 사용 중단

---

💡 **팁**: 서브에이전트 개발 시 필요한 MCP 서버가 설치되어 있는지 항상 확인하고, 사용자에게 설치 명령어를 안내하세요.
