---
id: mcp-tools
title: 'MCP 도구 레퍼런스'
keywords: ['mcp', 'tools', 'functions', 'api', 'reference']
priority: high
ai_optimized: true
updated: '2025-09-09'
---

# 🛠️ MCP 도구 레퍼런스

**110개 도구**: 9개 서버별 완전 레퍼런스

## 📊 서버별 도구 수

| 서버                    | 도구 수 | 주요 기능                                    |
| ----------------------- | ------- | -------------------------------------------- |
| **shadcn-ui**           | 46개    | UI 컴포넌트 (button, card, dialog, table...) |
| **serena**              | 25개    | 코드 분석 (find_file, symbols, refactor...)  |
| **playwright**          | 15개    | 브라우저 (navigate, screenshot, content...)  |
| **supabase**            | 12개    | 데이터베이스 (SQL, tables, schema...)        |
| **memory**              | 6개     | 지식 그래프 (entities, relations, search...) |
| **context7**            | 3개     | 문서 검색 (libraries, documentation...)      |
| **time**                | 2개     | 시간 처리 (current_time, convert_time)       |
| **sequential-thinking** | 1개     | 순차적 사고 처리                             |

**총 110개 도구** | **9개 서버**

## 🧠 Memory (6개 도구)

### 핵심 지식 관리

```typescript
// 1. 엔티티 생성 - 프로젝트 지식 저장
await mcp__memory__create_entities({
  entities: [
    {
      name: 'ProjectArchitecture',
      entityType: 'Knowledge',
      observations: [
        'Next.js 15 기반',
        'TypeScript strict 모드',
        '9개 MCP 서버 통합',
      ],
    },
  ],
});

// 2. 지식 검색 - 컨텍스트 기반
await mcp__memory__search({ query: 'MCP 서버 설정' });

// 3. 관계 설정 - 엔티티 간 연결
await mcp__memory__add_relations({
  relations: [
    {
      from: 'ProjectArchitecture',
      to: 'MCPServers',
      relationType: 'uses',
    },
  ],
});
```

### 전체 도구 목록

- `create_entities` - 지식 엔티티 생성
- `search` - 지식 검색
- `add_relations` - 엔티티 관계 설정
- `get_entities` - 엔티티 조회
- `delete_entities` - 엔티티 삭제
- `list_entities` - 전체 엔티티 목록

## 🐘 Supabase (12개 도구)

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

## ⏰ Time (2개 도구)

### 시간 처리

```typescript
// 1. 특정 시간대 현재 시간
await mcp__time__get_current_time({
  timezone: 'Asia/Seoul',
});
// 결과: "2025-09-09T14:30:00+09:00"

// 2. 시간대 간 변환
await mcp__time__convert_time({
  time: '2025-09-09 14:30:00',
  from_timezone: 'UTC',
  to_timezone: 'Asia/Seoul',
});
```

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

## 🎨 ShadCN UI (46개 도구)

### 46개 컴포넌트 + 55개 블록

```typescript
// 1. 컴포넌트 목록 (46개)
await mcp__shadcn_ui__list_components();
// 결과: accordion, alert, button, card, checkbox, dialog, input, table...

// 2. 특정 컴포넌트 소스
await mcp__shadcn_ui__get_component({ name: 'button' });

// 3. 블록 목록 (55개)
await mcp__shadcn_ui__list_blocks();

// 4. 특정 블록 소스
await mcp__shadcn_ui__get_block({ name: 'authentication-01' });
```

### 주요 컴포넌트 카테고리

- **Form**: button, input, textarea, checkbox, radio, select
- **Layout**: card, sheet, dialog, popover, tooltip, tabs
- **Data**: table, pagination, data-table, calendar
- **Feedback**: alert, toast, progress, skeleton
- **Navigation**: menubar, navigation-menu, breadcrumb

## 🔍 Context7 (3개 도구)

### 라이브러리 문서 검색

```typescript
// 1. 라이브러리 검색
await mcp__context7__search_libraries({ query: 'react hooks' });

// 2. 문서 내용 조회
await mcp__context7__get_documentation({ library: 'react', section: 'hooks' });

// 3. 예제 코드 검색
await mcp__context7__search_examples({ topic: 'useEffect cleanup' });
```

## 🧠 Sequential Thinking (1개 도구)

### 순차적 사고 처리

```typescript
// 복잡한 문제를 단계별로 분해
await mcp__sequential_thinking__think({
  problem: 'MCP 서버 최적화 전략',
  steps: ['현재 상태 분석', '병목점 파악', '개선 방안 도출', '실행 계획'],
});
```

## 💡 활용 패턴

### 1. 프로젝트 초기 분석

```typescript
// Serena로 프로젝트 구조 분석
await mcp__serena__activate_project({ project: 'my-project' });
const files = await mcp__serena__find_file({ file_mask: '*.tsx' });

// Memory에 프로젝트 정보 저장
await mcp__memory__create_entities({
  entities: [{ name: 'ProjectStructure', entityType: 'Analysis', observations: [...] }]
});
```

### 2. UI 개발 워크플로

```typescript
// ShadCN UI 컴포넌트 선택
const components = await mcp__shadcn_ui__list_components();
const buttonCode = await mcp__shadcn_ui__get_component({ name: 'button' });

// Playwright로 UI 테스트
await mcp__playwright__navigate({ url: 'http://localhost:3000' });
await mcp__playwright__screenshot({ filename: 'ui-test.png' });
```

### 3. 데이터베이스 작업

```typescript
// Supabase로 스키마 확인
const tables = await mcp__supabase__list_tables();
const schema = await mcp__supabase__get_table_schema({ table_name: 'users' });

// 쿼리 실행
const results = await mcp__supabase__run_sql({
  sql: 'SELECT COUNT(*) FROM active_servers',
});
```

## 🚀 성능 최적화

### 도구 호출 최적화

- **병렬 실행**: 독립적 도구들은 Promise.all 사용
- **캐싱**: Memory MCP로 반복 조회 결과 저장
- **선택적 호출**: 필요한 도구만 활성화

### 자주 사용하는 조합

1. **Serena + Memory**: 코드 분석 → 지식 저장
2. **ShadCN + Playwright**: UI 생성 → 자동 테스트
3. **Supabase + Time**: 데이터 쿼리 → 시간 처리
4. **Context7 + Sequential Thinking**: 문서 검색 → 체계적 분석

**110개 도구로 개발 효율성 극대화** | **27% 토큰 절약**
