# 🌐 MCP 웹 & 브라우저 도구 레퍼런스

> **2025년 8월 18일 기준**  
> **환경**: Claude Code v1.0.81 + MCP 서버  
> **카테고리**: 웹 검색 + 브라우저 자동화 + AI 사고 + 문서 검색

## 📋 목차

1. [개요](#개요)
2. [Tavily MCP 도구](#tavily-mcp-도구)
3. [Playwright MCP 도구](#playwright-mcp-도구)
4. [Thinking MCP 도구](#thinking-mcp-도구)
5. [Context7 MCP 도구](#context7-mcp-도구)
6. [실전 활용 예시](#실전-활용-예시)
7. [문제 해결](#문제-해결)

---

## 🎯 개요

웹 검색, 브라우저 자동화, AI 사고 처리, 문서 검색을 위한 **21개 핵심 도구**를 제공합니다.

### 📊 도구 개요

| 서버 | 도구 수 | 주요 기능 |
|------|---------|-----------|
| `tavily` | 2개 | 웹 검색 & 콘텐츠 추출 |
| `playwright` | 15개 | 브라우저 자동화 |
| `thinking` | 1개 | AI 순차적 사고 |
| `context7` | 3개 | 라이브러리 문서 검색 |

**총 도구 수**: 21개  
**응답 속도**: 평균 200ms-5초

---

## 🔍 Tavily MCP 도구

**목적**: 웹 검색 및 콘텐츠 추출

### `mcp__tavily__tavily_search`

**웹 검색**

```typescript
await mcp__tavily__tavily_search({
  query: string,                    // 검색 쿼리
  max_results?: number,             // 최대 결과 수 (기본: 5)
  search_depth?: 'basic' | 'advanced',  // 검색 깊이
  include_images?: boolean,         // 이미지 포함
  include_answer?: boolean,         // AI 요약 포함
  include_raw_content?: boolean,    // 원본 HTML 포함
  include_domains?: string[],       // 포함할 도메인
  exclude_domains?: string[],       // 제외할 도메인
  topic?: 'general' | 'news'        // 검색 주제
});

// 예시
await mcp__tavily__tavily_search({
  query: 'Next.js 15 새로운 기능',
  max_results: 5,
  search_depth: 'advanced',
  include_answer: true,
  topic: 'general'
});

// 반환값 예시
{
  "answer": "Next.js 15의 주요 새로운 기능...",
  "results": [{
    "title": "Next.js 15 공식 발표",
    "url": "https://nextjs.org/blog/next-15",
    "content": "Next.js 15에서는...",
    "score": 0.98,
    "published_date": "2024-10-21"
  }],
  "query": "Next.js 15 새로운 기능",
  "response_time": 2.3
}
```

### `mcp__tavily__tavily_extract`

**웹 페이지 추출**

```typescript
await mcp__tavily__tavily_extract({
  urls: string[],                   // 추출할 URL 목록
  format?: 'markdown' | 'html'      // 출력 형식
});

// 예시
await mcp__tavily__tavily_extract({
  urls: [
    'https://docs.anthropic.com/en/docs/claude-code',
    'https://nextjs.org/docs'
  ],
  format: 'markdown'
});

// 반환값: URL별 추출된 컨텐츠
```

---

## 🎭 Playwright MCP 도구

**목적**: 브라우저 자동화 및 E2E 테스트

### `mcp__playwright__playwright_navigate`

**페이지 이동**

```typescript
await mcp__playwright__playwright_navigate({
  url: string,                      // 이동할 URL
  browserType?: 'chromium' | 'firefox' | 'webkit',  // 브라우저 타입
  headless?: boolean,               // 헤드리스 모드
  timeout?: number                  // 타임아웃 (ms)
});

// 예시
await mcp__playwright__playwright_navigate({
  url: 'http://localhost:3000',
  browserType: 'chromium',
  headless: true,
  timeout: 30000
});
```

### `mcp__playwright__playwright_screenshot`

**스크린샷 캡처**

```typescript
await mcp__playwright__playwright_screenshot({
  name: string,        // 파일명
  fullPage?: boolean,  // 전체 페이지
  savePng?: boolean,   // PNG 저장
  path?: string        // 저장 경로
});

// 예시
await mcp__playwright__playwright_screenshot({
  name: 'homepage-test',
  fullPage: true,
  savePng: true,
  path: './screenshots/'
});
```

### `mcp__playwright__playwright_click`

**요소 클릭**

```typescript
await mcp__playwright__playwright_click({
  selector: string,     // CSS 선택자
  timeout?: number,     // 타임아웃
  force?: boolean       // 강제 클릭
});

// 예시
await mcp__playwright__playwright_click({
  selector: '[data-testid="login-button"]',
  timeout: 5000
});
```

### `mcp__playwright__playwright_fill`

**입력 필드 채우기**

```typescript
await mcp__playwright__playwright_fill({
  selector: string,  // CSS 선택자
  value: string,     // 입력값
  clear?: boolean    // 기존 값 삭제
});

// 예시
await mcp__playwright__playwright_fill({
  selector: '#email',
  value: 'test@example.com',
  clear: true
});
```

### `mcp__playwright__playwright_evaluate`

**JavaScript 실행**

```typescript
await mcp__playwright__playwright_evaluate({
  script: string  // 실행할 JavaScript 코드
});

// 예시
await mcp__playwright__playwright_evaluate({
  script: 'document.title'
});

// 반환값: 스크립트 실행 결과
```

### `mcp__playwright__playwright_get_visible_text`

**보이는 텍스트 가져오기**

```typescript
await mcp__playwright__playwright_get_visible_text({
  selector?: string  // CSS 선택자 (기본: body)
});

// 예시
await mcp__playwright__playwright_get_visible_text({
  selector: '.main-content'
});
```

### 추가 Playwright 도구들

- `mcp__playwright__playwright_hover`: 요소 호버
- `mcp__playwright__playwright_press`: 키 입력
- `mcp__playwright__playwright_select_option`: 옵션 선택
- `mcp__playwright__playwright_check`: 체크박스 체크
- `mcp__playwright__playwright_uncheck`: 체크박스 해제
- `mcp__playwright__playwright_get_attribute`: 속성 가져오기
- `mcp__playwright__playwright_console_logs`: 콘솔 로그 조회
- `mcp__playwright__playwright_wait_for_selector`: 선택자 대기
- `mcp__playwright__playwright_close`: 브라우저 종료

---

## 🤔 Thinking MCP 도구

**목적**: 순차적 사고 처리

### `mcp__thinking__sequentialthinking`

**순차적 사고 실행**

```typescript
await mcp__thinking__sequentialthinking({
  thought: string,              // 현재 생각
  thoughtNumber: number,        // 생각 번호
  totalThoughts?: number,       // 총 생각 수
  nextThoughtNeeded?: boolean   // 다음 생각 필요 여부
});

// 예시
await mcp__thinking__sequentialthinking({
  thought: 'MCP 서버 통합 최적화 방안을 분석해보자',
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
});

// 반환값: 사고 처리 결과 및 다음 단계 안내
```

---

## 📚 Context7 MCP 도구

**목적**: 라이브러리 문서 검색

### `mcp__context7__resolve_library_id`

**라이브러리 ID 해결**

```typescript
await mcp__context7__resolve_library_id({
  libraryName: string  // 라이브러리명
});

// 예시
await mcp__context7__resolve_library_id({
  libraryName: 'Next.js'
});

// 반환값 예시
{
  "library_id": "/vercel/next.js",
  "description": "The React Framework for Production"
}
```

### `mcp__context7__get_library_docs`

**라이브러리 문서 가져오기**

```typescript
await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: string,  // 라이브러리 ID
  topic: string,                        // 주제
  tokens?: number                       // 토큰 수 제한
});

// 예시
await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/vercel/next.js',
  topic: 'app router',
  tokens: 5000
});

// 반환값: 해당 주제의 문서 내용
```

### `mcp__context7__search_library_docs`

**라이브러리 문서 검색**

```typescript
await mcp__context7__search_library_docs({
  context7CompatibleLibraryID: string,
  query: string,
  maxResults?: number
});

// 예시
await mcp__context7__search_library_docs({
  context7CompatibleLibraryID: '/vercel/next.js',
  query: 'middleware',
  maxResults: 10
});
```

---

## 🚀 실전 활용 예시

### E2E 테스트 자동화

```typescript
// 1. 브라우저 시작 및 페이지 이동
await mcp__playwright__playwright_navigate({
  url: 'http://localhost:3000/login',
  browserType: 'chromium',
  headless: true
});

// 2. 로그인 양식 작성
await mcp__playwright__playwright_fill({
  selector: '#email',
  value: 'test@example.com'
});

await mcp__playwright__playwright_fill({
  selector: '#password',
  value: 'password123'
});

// 3. 로그인 버튼 클릭
await mcp__playwright__playwright_click({
  selector: '[data-testid="login-button"]'
});

// 4. 대시보드 로딩 대기
await mcp__playwright__playwright_wait_for_selector({
  selector: '[data-testid="dashboard"]',
  timeout: 10000
});

// 5. 스크린샷 캡처
await mcp__playwright__playwright_screenshot({
  name: 'dashboard-after-login',
  fullPage: true,
  savePng: true
});

// 6. 브라우저 종료
await mcp__playwright__playwright_close();
```

### 기술 조사 자동화

```typescript
// 1. 최신 기술 동향 검색
const searchResults = await mcp__tavily__tavily_search({
  query: 'React 19 새로운 기능 2024',
  max_results: 10,
  search_depth: 'advanced',
  include_answer: true,
  topic: 'general'
});

// 2. 주요 페이지 내용 추출
const extractedContent = await mcp__tavily__tavily_extract({
  urls: searchResults.results.slice(0, 3).map(r => r.url),
  format: 'markdown'
});

// 3. React 공식 문서에서 상세 정보 확인
const libraryId = await mcp__context7__resolve_library_id({
  libraryName: 'React'
});

const reactDocs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: libraryId.library_id,
  topic: 'React 19 features',
  tokens: 8000
});

// 4. 결과 종합 분석
const analysis = await mcp__thinking__sequentialthinking({
  thought: `검색 결과와 공식 문서를 종합하여 React 19의 핵심 변화점을 분석하자`,
  thoughtNumber: 1,
  totalThoughts: 3,
  nextThoughtNeeded: true
});
```

### 문서 사이트 검증

```typescript
// 1. 문서 사이트 접속
await mcp__playwright__playwright_navigate({
  url: 'https://docs.example.com'
});

// 2. 모든 링크 검사
const links = await mcp__playwright__playwright_evaluate({
  script: `
    Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(href => href.startsWith('http'))
  `
});

// 3. 각 링크 상태 확인
for (const link of links.slice(0, 10)) {
  try {
    await mcp__playwright__playwright_navigate({
      url: link,
      timeout: 5000
    });
    
    const title = await mcp__playwright__playwright_evaluate({
      script: 'document.title'
    });
    
    console.log(`✅ ${link}: ${title}`);
  } catch (error) {
    console.log(`❌ ${link}: 링크 실패`);
  }
}

// 4. 전체 사이트 스크린샷
await mcp__playwright__playwright_screenshot({
  name: 'docs-site-overview',
  fullPage: true
});
```

---

## 🚨 문제 해결

### Tavily 검색 오류

**증상**: `Rate limit exceeded` 또는 `Search failed`

**해결책**:
```typescript
// 검색 빈도 조절 및 파라미터 최적화
const results = await mcp__tavily__tavily_search({
  query: 'simple query',
  max_results: 3,  // 결과 수 줄이기
  search_depth: 'basic',  // 기본 검색 사용
  include_raw_content: false  // 불필요한 데이터 제외
});
```

### Playwright 브라우저 오류

**증상**: `Browser launch failed` 또는 `Selector not found`

**해결책**:
```typescript
// 1. 브라우저 재시작
await mcp__playwright__playwright_close();

// 2. 헤드리스 모드로 시작
await mcp__playwright__playwright_navigate({
  url: 'http://localhost:3000',
  browserType: 'chromium',
  headless: true,
  timeout: 30000
});

// 3. 요소 대기 후 조작
await mcp__playwright__playwright_wait_for_selector({
  selector: '#target-element',
  timeout: 10000,
  state: 'visible'
});
```

### Context7 문서 검색 오류

**증상**: `Library not found` 또는 `Invalid library ID`

**해결책**:
```typescript
// 1. 라이브러리 이름 확인
const resolved = await mcp__context7__resolve_library_id({
  libraryName: 'Next.js'  // 정확한 이름 사용
});

console.log('해결된 ID:', resolved.library_id);

// 2. 유효한 ID로 재검색
const docs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: resolved.library_id,
  topic: 'getting started',
  tokens: 3000
});
```

### Thinking 도구 활용 최적화

**증상**: 생각이 너무 길거나 반복됨

**해결책**:
```typescript
// 명확한 목표와 제한 설정
await mcp__thinking__sequentialthinking({
  thought: '구체적이고 명확한 문제 정의: MCP 도구 성능 분석',
  thoughtNumber: 1,
  totalThoughts: 3,  // 제한된 단계 수
  nextThoughtNeeded: true
});
```

---

## ⚡ 성능 최적화 팁

### Tavily 검색 최적화
- `max_results`: 3-5개로 제한
- `search_depth`: 'basic' 우선 사용
- `include_raw_content`: 필요시만 true

### Playwright 성능 향상
- `headless: true` 항상 사용
- 불필요한 리소스 로딩 차단
- 스크린샷은 필요한 경우만

### Context7 효율적 사용
- 라이브러리 ID 캐싱
- `tokens` 파라미터로 응답 크기 제한
- 구체적인 `topic` 지정

---

## 📚 관련 문서

- [MCP 파일시스템 & 메모리 도구](./mcp-tools-filesystem-memory.md)
- [MCP 데이터베이스 & 클라우드 도구](./mcp-tools-database-cloud.md)
- [MCP AI & 유틸리티 도구](./mcp-tools-ai-utility.md)
- [Playwright E2E 테스트 가이드](../testing/e2e-test-guide.md)
- [Tavily 검색 고급 가이드](../mcp/tavily-mcp-advanced-guide.md)

---

**💡 팁**: 웹 검색과 브라우저 자동화를 조합하면 완전한 웹 모니터링 및 테스트 시스템을 구축할 수 있습니다!