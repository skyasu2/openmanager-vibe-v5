# MCP 서버 활용 가이드 (Windows 2025)

> 최종 업데이트: 2025-08-12 23:10  
> Claude Code v1.0.73 | Windows 11 | Git Bash  
> **🎯 핵심**: 11개 MCP 서버 100% 정상 작동 - 실전 활용법

## 📊 현재 MCP 서버 상태 (실제 테스트 완료)

### ✅ 정상 작동 서버 (11/11 = 100%)

| 서버명                  | 도구 상태    | 주요 기능            | 활용도          | 특이사항                   |
| ----------------------- | ------------ | -------------------- | --------------- | -------------------------- |
| **filesystem**          | ✅ 완벽 작동 | 파일/폴더 작업       | ⭐⭐⭐⭐⭐ 필수 | -                          |
| **memory**              | ✅ 완벽 작동 | 지식 그래프 관리     | ⭐⭐⭐⭐⭐ 필수 | -                          |
| **github**              | ✅ 완벽 작동 | GitHub 저장소 작업   | ⭐⭐⭐⭐⭐ 필수 | -                          |
| **sequential-thinking** | ✅ 완벽 작동 | 복잡한 문제 해결     | ⭐⭐⭐⭐ 고급   | -                          |
| **time**                | ✅ 완벽 작동 | 시간/시간대 변환     | ⭐⭐⭐ 유용     | -                          |
| **context7**            | ✅ 완벽 작동 | 라이브러리 문서 검색 | ⭐⭐⭐⭐ 개발   | -                          |
| **shadcn-ui**           | ✅ 완벽 작동 | UI 컴포넌트 개발     | ⭐⭐⭐⭐ 개발   | -                          |
| **tavily-mcp**          | ✅ 완벽 작동 | 웹 검색/크롤링       | ⭐⭐⭐⭐ 연구   | TAVILY_API_KEY 필요        |
| **supabase**            | ✅ 완벽 작동 | PostgreSQL DB 관리   | ⭐⭐⭐⭐⭐ DB   | SUPABASE_ACCESS_TOKEN 필요 |
| **playwright**          | ✅ 완벽 작동 | 브라우저 자동화      | ⭐⭐⭐⭐ 테스트 | -                          |
| **serena**              | ✅ 완벽 작동 | 고급 코드 분석 (LSP) | ⭐⭐⭐⭐⭐ 코드 | 프로젝트 활성화 필요       |

## 🚀 핵심 MCP 서버 활용법 (실전 테스트 완료)

### 1️⃣ Filesystem MCP - 파일/폴더 관리

**가장 중요한 기본 도구 - 모든 파일 작업의 기초**

```typescript
// 주요 도구들
mcp__filesystem__read_text_file; // 텍스트 파일 읽기
mcp__filesystem__write_file; // 파일 쓰기
mcp__filesystem__edit_file; // 파일 편집
mcp__filesystem__list_directory; // 디렉토리 목록
mcp__filesystem__create_directory; // 디렉토리 생성
mcp__filesystem__move_file; // 파일 이동/이름 변경
mcp__filesystem__search_files; // 파일 검색
mcp__filesystem__directory_tree; // 디렉토리 트리 구조
```

**실제 활용 예시:**

```typescript
// 프로젝트 구조 파악
const tree = await mcp__filesystem__directory_tree({
  path: 'D:\\cursor\\openmanager-vibe-v5',
});

// 설정 파일 읽기
const config = await mcp__filesystem__read_text_file({
  path: '.env.local',
});

// 새 컴포넌트 생성
await mcp__filesystem__write_file({
  path: 'src/components/NewComponent.tsx',
  content: 'export const NewComponent = () => { return <div>Hello</div> }',
});

// 파일 검색 (패턴 매칭)
const results = await mcp__filesystem__search_files({
  path: 'src',
  pattern: '*test*',
});
```

### 2️⃣ Memory MCP - 지식 그래프 관리

**프로젝트 정보 영구 저장 및 AI 학습**

```typescript
// 주요 도구들
mcp__memory__create_entities; // 엔티티 생성
mcp__memory__create_relations; // 관계 생성
mcp__memory__add_observations; // 관찰 내용 추가
mcp__memory__search_nodes; // 노드 검색
mcp__memory__read_graph; // 전체 그래프 읽기
mcp__memory__delete_entities; // 엔티티 삭제
```

**실제 활용 예시:**

```javascript
// 프로젝트 정보 저장
await mcp__memory__create_entities({
  entities: [
    {
      name: 'OpenManager VIBE v5',
      entityType: 'project',
      observations: [
        'Next.js 15 기반 서버 모니터링 플랫폼',
        'Vercel + GCP + Supabase 무료 티어 아키텍처',
        '실시간 모니터링, AI 분석, 알림 시스템 포함',
      ],
    },
  ],
});

// 기술 스택 관계 생성
await mcp__memory__create_relations({
  relations: [
    {
      from: 'OpenManager VIBE v5',
      to: 'Next.js 15',
      relationType: 'uses',
    },
    {
      from: 'OpenManager VIBE v5',
      to: 'TypeScript',
      relationType: 'written_in',
    },
  ],
});

// 정보 검색
const results = await mcp__memory__search_nodes({
  query: '모니터링',
});
```

### 3️⃣ GitHub MCP - 저장소 관리

**GitHub 작업 자동화 및 협업**

```typescript
// 주요 도구들
mcp__github__search_repositories; // 저장소 검색
mcp__github__get_file_contents; // 파일 내용 가져오기
mcp__github__push_files; // 파일 푸시
mcp__github__create_issue; // 이슈 생성
mcp__github__create_pull_request; // PR 생성
mcp__github__list_commits; // 커밋 목록
```

**실제 활용 예시:**

```javascript
// 저장소 검색
const repos = await mcp__github__search_repositories({
  query: 'openmanager language:typescript',
});

// 파일 내용 가져오기
const content = await mcp__github__get_file_contents({
  owner: 'username',
  repo: 'openmanager-vibe-v5',
  path: 'README.md',
});

// 이슈 생성
await mcp__github__create_issue({
  owner: 'username',
  repo: 'openmanager-vibe-v5',
  title: 'MCP 서버 11개 모두 정상 작동 확인',
  body: '모든 MCP 서버가 정상 작동합니다!',
});
```

### 4️⃣ Sequential Thinking MCP - 복잡한 문제 해결

**단계별 사고 프로세스로 복잡한 문제 분석**

```typescript
// 주요 도구
mcp__sequential - thinking__sequentialthinking;
```

**실제 활용 예시:**

```javascript
// 복잡한 아키텍처 문제 해결
(await mcp__sequential) -
  thinking__sequentialthinking({
    thought: '무료 티어로 엔터프라이즈급 성능을 내는 방법 분석',
    thoughtNumber: 1,
    totalThoughts: 5,
    nextThoughtNeeded: true,
  });

// 가설 생성 및 검증
(await mcp__sequential) -
  thinking__sequentialthinking({
    thought: '캐싱 전략: 메모리 기반 LRU Cache가 최선인가?',
    thoughtNumber: 2,
    totalThoughts: 5,
    nextThoughtNeeded: true,
    isRevision: false,
  });
```

### 5️⃣ Time MCP - 시간/시간대 관리

**정확한 시간 기록 및 변환**

```typescript
// 주요 도구들
mcp__time__get_current_time; // 현재 시간 조회
mcp__time__convert_time; // 시간대 변환
```

**실제 활용 예시:**

```javascript
// 한국 시간 조회
const krTime = await mcp__time__get_current_time({
  timezone: 'Asia/Seoul',
});
// 결과: "2025-08-12T23:10:00+09:00"

// 시간대 변환 (한국 → 미국 서부)
const converted = await mcp__time__convert_time({
  source_timezone: 'Asia/Seoul',
  target_timezone: 'America/Los_Angeles',
  time: '23:10',
});
// 결과: "07:10 (이전 날짜)"
```

### 6️⃣ Context7 MCP - 라이브러리 문서 검색

**최신 라이브러리 문서 및 예제 코드 검색**

```typescript
// 주요 도구들
mcp__context7__resolve - library - id; // 라이브러리 ID 검색
mcp__context7__get - library - docs; // 문서 가져오기
```

**실제 활용 예시:**

```javascript
// Next.js 라이브러리 검색
const libs =
  (await mcp__context7__resolve) -
  library -
  id({
    libraryName: 'Next.js',
  });
// 결과: /vercel/next.js (Trust Score: 10)

// 문서 가져오기
const docs =
  (await mcp__context7__get) -
  library -
  docs({
    context7CompatibleLibraryID: '/vercel/next.js',
    topic: 'app router',
    tokens: 10000,
  });
```

### 7️⃣ shadcn-ui MCP - UI 컴포넌트 개발

**shadcn/ui 컴포넌트 검색 및 활용**

```typescript
// 주요 도구들
mcp__shadcn - ui__list_shadcn_components; // 컴포넌트 목록
mcp__shadcn - ui__get_component_details; // 컴포넌트 상세
mcp__shadcn - ui__get_component_examples; // 사용 예제
mcp__shadcn - ui__search_components; // 컴포넌트 검색
```

**실제 활용 예시:**

```javascript
// 모든 컴포넌트 목록 조회
const components = (await mcp__shadcn) - ui__list_shadcn_components();
// 결과: 50+ 컴포넌트 (button, card, dialog, ...)

// 특정 컴포넌트 상세 정보
const details =
  (await mcp__shadcn) -
  ui__get_component_details({
    componentName: 'button',
  });

// 사용 예제 가져오기
const examples =
  (await mcp__shadcn) -
  ui__get_component_examples({
    componentName: 'dialog',
  });
```

### 8️⃣ Tavily MCP - 웹 검색 및 크롤링

**강력한 웹 인텔리전스 도구** (TAVILY_API_KEY 필요)

```typescript
// 주요 도구들
mcp__tavily - mcp__tavily - search; // 웹 검색
mcp__tavily - mcp__tavily - extract; // 콘텐츠 추출
mcp__tavily - mcp__tavily - crawl; // 사이트 크롤링
mcp__tavily - mcp__tavily - map; // 사이트 매핑
```

**실제 활용 예시:**

```javascript
// 최신 기술 트렌드 검색
const results =
  (await mcp__tavily) -
  mcp__tavily -
  search({
    query: 'Next.js 15 new features',
    time_range: 'week',
    search_depth: 'advanced',
    max_results: 10,
  });

// 문서 사이트 크롤링
const crawled =
  (await mcp__tavily) -
  mcp__tavily -
  crawl({
    url: 'https://nextjs.org/docs',
    max_depth: 3,
    categories: ['Documentation'],
  });

// 콘텐츠 추출 (마크다운)
const content =
  (await mcp__tavily) -
  mcp__tavily -
  extract({
    urls: ['https://example.com/article'],
    format: 'markdown',
    extract_depth: 'advanced',
  });
```

### 9️⃣ Supabase MCP - PostgreSQL 데이터베이스

**Supabase DB 관리** (SUPABASE_ACCESS_TOKEN 필요)

```typescript
// 주요 도구들
mcp__supabase__list_projects; // 프로젝트 목록
mcp__supabase__list_tables; // 테이블 목록
mcp__supabase__execute_sql; // SQL 실행
mcp__supabase__apply_migration; // 마이그레이션 적용
mcp__supabase__generate_typescript_types; // TypeScript 타입 생성
mcp__supabase__search_docs; // 문서 검색
```

**실제 활용 예시:**

```javascript
// 테이블 목록 조회
const tables = await mcp__supabase__list_tables({
  project_id: 'your-project-id',
  schemas: ['public'],
});

// SQL 쿼리 실행
const result = await mcp__supabase__execute_sql({
  project_id: 'your-project-id',
  query: 'SELECT * FROM servers LIMIT 10',
});

// TypeScript 타입 생성
const types = await mcp__supabase__generate_typescript_types({
  project_id: 'your-project-id',
});
```

### 🔟 Playwright MCP - 브라우저 자동화

**E2E 테스트 및 웹 자동화**

```typescript
// 주요 도구들
mcp__playwright__browser_navigate; // 페이지 이동
mcp__playwright__browser_snapshot; // 페이지 스냅샷
mcp__playwright__browser_click; // 클릭
mcp__playwright__browser_type; // 텍스트 입력
mcp__playwright__browser_take_screenshot; // 스크린샷
```

**실제 활용 예시:**

```javascript
// 페이지 열기
await mcp__playwright__browser_navigate({
  url: 'https://example.com',
});

// 페이지 스냅샷 (접근성 트리)
const snapshot = await mcp__playwright__browser_snapshot();

// 버튼 클릭
await mcp__playwright__browser_click({
  element: '로그인 버튼',
  ref: "button[type='submit']",
});

// 텍스트 입력
await mcp__playwright__browser_type({
  element: '검색 입력 필드',
  ref: "input[name='search']",
  text: 'MCP 서버',
});
```

### 1️⃣1️⃣ Serena MCP - 고급 코드 분석

**LSP 기반 심볼릭 코드 분석** (프로젝트 활성화 필요)

```typescript
// 주요 도구들
mcp__serena__activate_project; // 프로젝트 활성화
mcp__serena__find_symbol; // 심볼 찾기
mcp__serena__find_referencing_symbols; // 참조 찾기
mcp__serena__replace_symbol_body; // 심볼 교체
mcp__serena__search_for_pattern; // 패턴 검색
mcp__serena__get_symbols_overview; // 심볼 개요
```

**실제 활용 예시:**

```javascript
// 프로젝트 활성화 (필수!)
await mcp__serena__activate_project({
  project: 'openmanager-vibe-v5',
});

// 파일의 심볼 개요
const overview = await mcp__serena__get_symbols_overview({
  relative_path: 'src/app/page.tsx',
});

// 특정 심볼 찾기
const symbol = await mcp__serena__find_symbol({
  name_path: 'HomePage',
  relative_path: 'src/app/page.tsx',
  include_body: true,
});

// 심볼 참조 찾기
const refs = await mcp__serena__find_referencing_symbols({
  name_path: 'ServerMetrics',
  relative_path: 'src/types/server.ts',
});
```

## 🔧 환경변수 설정 (필수)

일부 MCP 서버는 API 키가 필요합니다:

### 1. Tavily MCP (웹 검색)

```bash
# .env.local 또는 시스템 환경변수
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
```

### 2. Supabase MCP (데이터베이스)

```bash
# Supabase 대시보드에서 Access Token 생성
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxx
```

## 📊 MCP 서버 활용 통계

| 카테고리            | 서버                | 사용 빈도          | 중요도     |
| ------------------- | ------------------- | ------------------ | ---------- |
| **파일 작업**       | filesystem          | 매우 높음 (90%+)   | ⭐⭐⭐⭐⭐ |
| **코드 분석**       | serena              | 높음 (70%+)        | ⭐⭐⭐⭐⭐ |
| **지식 관리**       | memory              | 중간 (50%+)        | ⭐⭐⭐⭐⭐ |
| **버전 관리**       | github              | 높음 (60%+)        | ⭐⭐⭐⭐⭐ |
| **데이터베이스**    | supabase            | 프로젝트별         | ⭐⭐⭐⭐⭐ |
| **UI 개발**         | shadcn-ui           | 프론트엔드 작업 시 | ⭐⭐⭐⭐   |
| **문서 검색**       | context7            | 개발 시            | ⭐⭐⭐⭐   |
| **웹 검색**         | tavily-mcp          | 연구/조사 시       | ⭐⭐⭐⭐   |
| **문제 해결**       | sequential-thinking | 복잡한 작업 시     | ⭐⭐⭐⭐   |
| **브라우저 테스트** | playwright          | E2E 테스트 시      | ⭐⭐⭐⭐   |
| **시간 관리**       | time                | 문서 작성 시       | ⭐⭐⭐     |

## 🎯 베스트 프랙티스

### 1. 프로젝트 시작 시

```javascript
// 1. Serena 프로젝트 활성화
await mcp__serena__activate_project({ project: 'project-name' });

// 2. 프로젝트 구조 파악
await mcp__filesystem__directory_tree({ path: '.' });

// 3. 기존 지식 확인
await mcp__memory__read_graph();
```

### 2. 개발 작업 시

```javascript
// 1. 코드 심볼 분석
await mcp__serena__get_symbols_overview({ relative_path: 'file.ts' });

// 2. 문서 검색
(await mcp__context7__get) -
  library -
  docs({
    context7CompatibleLibraryID: '/vercel/next.js',
    topic: 'routing',
  });

// 3. 컴포넌트 참조
(await mcp__shadcn) - ui__get_component_examples({ componentName: 'card' });
```

### 3. 문제 해결 시

```javascript
// 1. 복잡한 문제 분석
(await mcp__sequential) -
  thinking__sequentialthinking({
    thought: '문제 분석 시작',
    thoughtNumber: 1,
    totalThoughts: 10,
    nextThoughtNeeded: true,
  });

// 2. 웹 검색으로 해결책 찾기
(await mcp__tavily) -
  mcp__tavily -
  search({
    query: 'error solution',
    search_depth: 'advanced',
  });
```

### 4. 테스트 시

```javascript
// 1. E2E 테스트
await mcp__playwright__browser_navigate({ url: 'http://localhost:3000' });
await mcp__playwright__browser_snapshot();

// 2. DB 검증
await mcp__supabase__execute_sql({
  project_id: 'project-id',
  query: 'SELECT COUNT(*) FROM users',
});
```

## 🚀 빠른 시작 체크리스트

✅ **설치 확인**

```bash
claude mcp list  # 11개 서버 모두 표시되어야 함
```

✅ **환경변수 설정**

- [ ] TAVILY_API_KEY 설정 (웹 검색용)
- [ ] SUPABASE_ACCESS_TOKEN 설정 (DB 관리용)

✅ **첫 테스트**

```javascript
// 시간 확인 (가장 간단한 테스트)
await mcp__time__get_current_time({ timezone: 'Asia/Seoul' });

// 메모리 그래프 읽기
await mcp__memory__read_graph();

// 파일 시스템 확인
await mcp__filesystem__list_directory({ path: '.' });
```

## 📚 관련 문서

- [Windows MCP 완전 설치 가이드](/docs/windows-mcp-complete-installation-guide.md)
- [MCP 서버 상태 리포트](/docs/mcp-setup-status.md)
- [Tavily MCP 고급 활용](/docs/tavily-mcp-advanced-guide.md)
- [Serena MCP 설정 가이드](/docs/serena-mcp-setup-guide-2025.md)
- [MCP 개발 가이드 2025](/docs/mcp-development-guide-2025.md)

## 💡 트러블슈팅

### 문제: MCP 서버 연결 실패

```bash
# 해결: API 재시작
claude api restart
claude mcp list
```

### 문제: 도구가 표시되지 않음

```bash
# 해결: 환경변수 확인
echo $TAVILY_API_KEY
echo $SUPABASE_ACCESS_TOKEN
```

### 문제: Serena 도구 없음

```javascript
// 해결: 프로젝트 활성화
await mcp__serena__activate_project({
  project: 'your-project-name',
});
```

---

**🎉 축하합니다!** 11개 MCP 서버가 모두 정상 작동 중입니다.  
이제 Claude Code의 모든 기능을 100% 활용할 수 있습니다! 🚀
