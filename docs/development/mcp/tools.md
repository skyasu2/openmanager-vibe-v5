---
id: mcp-tools
title: 'MCP 도구 레퍼런스'
keywords: ['mcp', 'tools', 'functions', 'api', 'reference']
priority: high
ai_optimized: true
updated: '2025-12-12'
---

# 🛠️ MCP 도구 레퍼런스

**200+ 도구**: 9개 서버별 완전 레퍼런스 (2025-12-11 정리 후)

## 📊 서버별 도구 수

| 서버             | 도구 수 | 주요 기능                                      | 한도         |
| ---------------- | ------- | ---------------------------------------------- | ------------ |
| **vercel**       | 150+    | 배포, 프로젝트, 환경변수, 도메인 관리          | 무제한       |
| **serena**       | 25개    | 코드 분석 (find_file, symbols, refactor, memory) | 무제한       |
| **playwright**   | 18개    | 브라우저 (navigate, snapshot, click, type...)  | 무제한       |
| **supabase**     | 20+     | 데이터베이스 (SQL, tables, schema, RLS...)     | 무제한       |
| **github**       | 20+     | 저장소 (PR, Issues, commits, branches...)      | 무제한       |
| **figma**        | 7개     | 디자인 (screenshot, design_context, metadata)  | **6회/월**   |
| **context7**     | 2개     | 문서 검색 (resolve-library-id, get-library-docs) | 무제한       |
| **tavily**       | 4개     | 웹 검색 (search, extract, crawl, map)          | 1,000/월     |
| **brave-search** | 6개     | 웹 검색 (web, local, video, image, news)       | 2,000/월     |

**총 200+ 도구** | **9개 서버** | **2025-12-11 정리 완료**

### 제거된 서버 (2025-12-11)

| 서버                  | 기존 도구 | 대체 방안                         |
| --------------------- | --------- | --------------------------------- |
| filesystem            | 8개       | Claude Code 내장 (Read, Write, Glob) |
| memory                | 6개       | Serena (`write_memory`, `read_memory`) |
| shadcn-ui             | 46개      | Context7 (`get-library-docs`)     |
| time                  | 2개       | Bash `date` 명령                  |
| sequential-thinking   | 1개       | TodoWrite + Claude 자체 추론      |

## 🐘 Supabase (20+ 도구)

### 핵심 데이터베이스 작업

```typescript
// 1. 직접 SQL 실행 - 가장 강력
await mcp__supabase__run_sql({
  sql: "SELECT * FROM servers WHERE status = 'active' LIMIT 10",
});

// 2. 테이블 구조 확인
await mcp__supabase__list_tables();

// 3. 스키마 검색
await mcp__supabase__search_tables({
  query: 'user',
});
```

### 전체 도구 목록

- `run_sql` - SQL 쿼리 직접 실행
- `list_tables` - 테이블 목록 조회
- `get_table_schema` - 테이블 스키마 정보
- `search_tables` - 테이블 검색
- `create_table` - 테이블 생성
- `insert_data` - 데이터 삽입
- `update_data` - 데이터 수정
- `delete_data` - 데이터 삭제
- `get_table_data` - 테이블 데이터 조회
- `create_index` - 인덱스 생성
- `manage_rls` - RLS 정책 관리
- `get_functions` - DB 함수 조회

## 🎭 Playwright (15개 도구)

### 핵심 브라우저 자동화

```typescript
// 1. 페이지 이동 및 스크린샷
await mcp__playwright__navigate({ url: 'https://example.com' });
await mcp__playwright__screenshot({ filename: 'page.png' });

// 2. DOM 내용 추출
await mcp__playwright__get_page_content();

// 3. 요소 상호작용
await mcp__playwright__click({ selector: 'button.submit' });
await mcp__playwright__fill({
  selector: 'input[name="username"]',
  text: 'admin',
});
```

### 전체 도구 목록

- `navigate` - 페이지 이동
- `screenshot` - 스크린샷 촬영
- `get_page_content` - 페이지 HTML 내용
- `click` - 요소 클릭
- `fill` - 입력 필드 채우기
- `wait_for_element` - 요소 대기
- `get_element_text` - 요소 텍스트 추출
- `scroll` - 페이지 스크롤
- `hover` - 마우스 오버
- `select_option` - 옵션 선택
- `upload_file` - 파일 업로드
- `close_browser` - 브라우저 종료
- `get_cookies` - 쿠키 조회
- `set_viewport` - 화면 크기 설정
- `evaluate_script` - JavaScript 실행

## 🔍 Serena (25개 도구)

### 필수: 프로젝트 활성화

```typescript
// 1. 반드시 먼저 실행 필요
await mcp__serena__activate_project({
  project: 'openmanager-vibe-v5',
});

// 2. 이후 25개 도구 사용 가능
await mcp__serena__list_dir({
  relative_path: 'src', // ⚠️ 루트(.) 대신 특정 디렉토리 지정
  skip_ignored_files: true, // 필수: 48배 빠름
});
await mcp__serena__find_file({ file_mask: '*.tsx', relative_path: 'src' });
```

### 핵심 코드 분석 도구

```typescript
// 파일 검색
await mcp__serena__find_file({ file_mask: '*.ts', relative_path: 'src' });

// 심볼 분석
await mcp__serena__get_symbols_overview({ relative_path: 'src/lib/auth.ts' });

// 패턴 검색
await mcp__serena__search_for_pattern({
  substring_pattern: 'useState',
  relative_path: 'src',
});

// 코드 리팩토링
await mcp__serena__replace_symbol_body({
  symbol_name: 'handleLogin',
  new_body: '// Updated implementation...',
});
```

### 25개 도구 요약

- **파일 관리**: `list_dir`, `find_file`, `read_file`, `create_text_file`
- **코드 분석**: `get_symbols_overview`, `find_symbol`, `find_referencing_symbols`
- **검색**: `search_for_pattern`, 다양한 패턴 매칭
- **리팩토링**: `replace_regex`, `replace_symbol_body`, `insert_before_symbol`
- **실행**: `execute_shell_command`
- **메모리**: `write_memory`, `read_memory`, `list_memories`

## 🔍 Context7 (2개 도구)

### 라이브러리 공식 문서 검색

```typescript
// 1. 라이브러리 ID 검색
await mcp__context7__resolve_library_id({ libraryName: 'next.js' });
// 결과: '/vercel/next.js'

// 2. 공식 문서 조회
await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/vercel/next.js',
  topic: 'server-actions',
});
```

### 전체 도구 목록

- `resolve-library-id` - 라이브러리 ID 검색
- `get-library-docs` - 공식 문서 조회

## 🐙 GitHub (20+ 도구)

### 저장소 및 PR 관리

```typescript
// 1. PR 목록 조회
await mcp__github__list_pull_requests({
  owner: 'your-org',
  repo: 'your-repo',
  state: 'open',
});

// 2. Issue 댓글 추가
await mcp__github__add_issue_comment({
  owner: 'your-org',
  repo: 'your-repo',
  issue_number: 123,
  body: '작업 완료했습니다.',
});

// 3. 커밋 목록 조회
await mcp__github__list_commits({
  owner: 'your-org',
  repo: 'your-repo',
});
```

### 주요 도구 목록

- **PR**: `list_pull_requests`, `get_pull_request`, `create_pull_request`, `merge_pull_request`
- **Issues**: `list_issues`, `get_issue`, `create_issue`, `add_issue_comment`
- **Repository**: `list_commits`, `get_file_contents`, `search_code`

## 🎨 Figma (7개 도구) ⚠️ 6회/월 한도

### Design-to-Code 워크플로우

```typescript
// 1. 디자인 컨텍스트 추출 (가장 효율적)
await mcp__figma__get_design_context({
  nodeId: '123:456',
  fileKey: 'abc123',
});

// 2. 스크린샷 생성
await mcp__figma__get_screenshot({
  nodeId: '123:456',
  fileKey: 'abc123',
});

// 3. 메타데이터 조회
await mcp__figma__get_metadata({
  nodeId: '123:456',
  fileKey: 'abc123',
});
```

### 전체 도구 목록

- `get_design_context` - UI 코드 생성용 컨텍스트 (권장)
- `get_screenshot` - 디자인 스크린샷
- `get_metadata` - 노드 구조 정보
- `get_variable_defs` - 변수 정의 조회
- `get_code_connect_map` - Code Connect 매핑
- `create_design_system_rules` - 디자인 시스템 규칙
- `whoami` - 계정 정보 확인

## 🔎 Tavily (4개 도구) - 심층 리서치

### 웹 검색 및 콘텐츠 추출

```typescript
// 1. 심층 웹 검색
await mcp__tavily__tavily_search({
  query: 'Next.js 16 migration guide',
  search_depth: 'advanced',
});

// 2. 웹 페이지 콘텐츠 추출
await mcp__tavily__tavily_extract({
  urls: ['https://nextjs.org/docs'],
});

// 3. 웹사이트 크롤링
await mcp__tavily__tavily_crawl({
  url: 'https://docs.example.com',
  max_depth: 2,
});
```

### 전체 도구 목록

- `tavily-search` - 심층 웹 검색
- `tavily-extract` - 콘텐츠 추출
- `tavily-crawl` - 웹사이트 크롤링
- `tavily-map` - 사이트 구조 매핑

## 🦁 Brave Search (6개 도구) - 빠른 팩트체크

### 실시간 웹 검색

```typescript
// 1. 일반 웹 검색
await mcp__brave_search__brave_web_search({
  query: 'React 19 latest version',
  count: 10,
});

// 2. 뉴스 검색
await mcp__brave_search__brave_news_search({
  query: 'TypeScript 5.9 release',
});

// 3. 이미지 검색
await mcp__brave_search__brave_image_search({
  query: 'Next.js architecture diagram',
});
```

### 전체 도구 목록

- `brave_web_search` - 일반 웹 검색
- `brave_local_search` - 지역 검색
- `brave_news_search` - 뉴스 검색
- `brave_video_search` - 비디오 검색
- `brave_image_search` - 이미지 검색
- `brave_summarizer` - AI 요약

## 💡 활용 패턴

### 1. 프로젝트 초기 분석

```typescript
// Serena로 프로젝트 구조 분석
await mcp__serena__activate_project({ project: 'my-project' });
const files = await mcp__serena__find_file({ file_mask: '*.tsx' });

// Serena 메모리에 프로젝트 정보 저장
await mcp__serena__write_memory({
  memory_file_name: 'project-structure.md',
  content: '# 프로젝트 구조\n...',
});
```

### 2. UI 개발 워크플로

```typescript
// Figma에서 디자인 컨텍스트 추출 (6회/월 한도 주의)
const design = await mcp__figma__get_design_context({
  nodeId: '123:456',
  fileKey: 'abc123',
});

// Context7로 컴포넌트 문서 조회
const docs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/shadcn-ui/ui',
  topic: 'button',
});

// Playwright로 UI 테스트
await mcp__playwright__browser_navigate({ url: 'http://localhost:3000' });
await mcp__playwright__browser_snapshot();
```

### 3. 데이터베이스 작업

```typescript
// Supabase로 스키마 확인
const tables = await mcp__supabase__list_tables();

// 쿼리 실행
const results = await mcp__supabase__execute_sql({
  query: 'SELECT COUNT(*) FROM active_servers',
});
```

### 4. 웹 리서치 워크플로

```typescript
// Brave Search로 빠른 버전 확인
const version = await mcp__brave_search__brave_web_search({
  query: 'React 19 latest version',
});

// Tavily로 상세 마이그레이션 가이드 검색
const guide = await mcp__tavily__tavily_search({
  query: 'React 19 migration guide',
  search_depth: 'advanced',
});
```

## 🚀 성능 최적화

### 도구 호출 최적화

- **병렬 실행**: 독립적 도구들은 Promise.all 사용
- **캐싱**: Serena memory로 반복 조회 결과 저장
- **선택적 호출**: @-mention으로 필요한 서버만 활성화 (18% 절약)

### 자주 사용하는 조합

1. **Serena + Context7**: 코드 분석 → 공식 문서 참조
2. **Figma + Playwright**: 디자인 추출 → UI 테스트
3. **Supabase + GitHub**: DB 스키마 → PR 생성
4. **Brave + Tavily**: 빠른 검색 → 심층 리서치

**200+ 도구로 개발 효율성 극대화** | **82-85% 토큰 절약**
