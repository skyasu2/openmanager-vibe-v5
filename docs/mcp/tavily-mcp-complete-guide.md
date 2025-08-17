# 🚀 Tavily MCP 완전 가이드

> **상태**: ✅ 모든 기능 정상 작동  
> **업데이트**: 2025년 8월 16일  
> **통합 완료**: 고급 활용법 + 문제 해결 통합 문서

## 📋 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [핵심 기능](#핵심-기능)
4. [고급 검색 기법](#고급-검색-기법)
5. [웹 크롤링 전략](#웹-크롤링-전략)
6. [콘텐츠 추출 활용](#콘텐츠-추출-활용)
7. [문제 해결](#문제-해결)
8. [실전 예제](#실전-예제)
9. [성능 최적화](#성능-최적화)

## 🎯 개요

Tavily MCP는 단순 웹 검색을 넘어서는 **강력한 웹 인텔리전스 도구**입니다. WebSearch와 달리 구조적 크롤링, 고급 필터링, 깔끔한 콘텐츠 추출을 제공합니다.

### WebSearch vs Tavily MCP 비교

| 기능          | WebSearch | Tavily MCP             | 활용 시나리오              |
| ------------- | --------- | ---------------------- | -------------------------- |
| 기본 검색     | ✅        | ✅                     | 단순 정보 검색             |
| 시간 필터링   | ❌        | ✅ day/week/month/year | 최신 트렌드 분석           |
| 도메인 필터링 | ❌        | ✅ include/exclude     | 신뢰할 수 있는 소스만 검색 |
| 웹 크롤링     | ❌        | ✅ 깊이별, 카테고리별  | 문서 전체 수집             |
| 콘텐츠 추출   | ❌        | ✅ 마크다운 변환       | 깔끔한 문서화              |
| 사이트 매핑   | ❌        | ✅ URL 구조 분석       | 사이트 아키텍처 파악       |
| 이미지 추출   | ❌        | ✅                     | 비주얼 콘텐츠 수집         |

## ⚙️ 설치 및 설정

### Remote MCP 방식 (권장)

```bash
# 1. 기존 tavily-mcp 제거 (있다면)
claude mcp remove tavily-mcp

# 2. tavily-remote 설치
claude mcp add tavily-remote --env TAVILY_API_KEY="tvly-xxxxxxxxxxxxxxxx" -- npx -y mcp-remote https://mcp.tavily.com/mcp/

# 3. 확인
claude mcp list
```

### NPX 방식 (대안)

```bash
# Local MCP 설치 (환경변수 문제가 있을 수 있음)
claude mcp add tavily-mcp --env TAVILY_API_KEY="tvly-xxxxxxxxxxxxxxxx" -- npx -y @tavily/mcp-server

# WSL에서 환경변수 확인
echo $TAVILY_API_KEY
```

### API 키 유형

- `tvly-dev-`: 개발용 키 (분당 100회 제한)
- `tvly-`: 프로덕션 키 (분당 1,000회 제한)

## 🔧 핵심 기능

### 1. tavily-search (고급 웹 검색)

```typescript
// 기본 검색
mcp__tavily -
  mcp__tavily -
  search({
    query: '검색어',
    max_results: 10,
  });

// 고급 검색 (모든 옵션)
mcp__tavily -
  mcp__tavily -
  search({
    query: 'Next.js 15 performance optimization',
    search_depth: 'advanced', // basic | advanced
    topic: 'general', // general | news
    days: 30, // 최근 30일 내 결과
    max_results: 15, // 최대 결과 수
    include_domains: ['nextjs.org', 'vercel.com'],
    exclude_domains: ['stackoverflow.com'],
    include_answer: true, // AI 답변 포함
    include_raw_content: false, // 원본 HTML 제외 (성능 향상)
    include_images: true, // 이미지 URL 포함
  });
```

### 2. tavily-crawl (웹 크롤링)

```typescript
// 단일 페이지 크롤링
mcp__tavily -
  mcp__tavily -
  crawl({
    url: 'https://nextjs.org/docs',
    max_pages: 20,
    crawl_depth: 2,
    categories: ['documentation', 'guide'],
  });

// 여러 페이지 동시 크롤링
mcp__tavily -
  mcp__tavily -
  crawl({
    url: 'https://docs.anthropic.com',
    max_pages: 50,
    crawl_depth: 3,
    include_subdomains: true,
    categories: ['api', 'tutorial', 'reference'],
  });
```

### 3. tavily-extract (콘텐츠 추출)

```typescript
// 웹 페이지 콘텐츠를 마크다운으로 변환
mcp__tavily -
  mcp__tavily -
  extract({
    url: 'https://vercel.com/blog/nextjs-15',
    format: 'markdown', // markdown | text | html
    include_metadata: true, // 메타데이터 포함
    include_images: true, // 이미지 URL 추출
    clean_content: true, // 광고/내비게이션 제거
  });
```

### 4. tavily-map (사이트 매핑)

```typescript
// 사이트 구조 분석
mcp__tavily -
  mcp__tavily -
  map({
    url: 'https://docs.anthropic.com',
    max_depth: 3,
    include_external_links: false,
  });
```

## 🎯 고급 검색 기법

### 시간 기반 검색

```typescript
// 최신 트렌드 분석
mcp__tavily -
  mcp__tavily -
  search({
    query: 'AI coding assistant market trends',
    days: 7, // 최근 1주일
    topic: 'news',
    search_depth: 'advanced',
  });

// 기간별 비교 분석
const searches = await Promise.all([
  mcp__tavily - mcp__tavily - search({ query: 'React performance', days: 30 }),
  mcp__tavily - mcp__tavily - search({ query: 'React performance', days: 90 }),
  mcp__tavily - mcp__tavily - search({ query: 'React performance', days: 365 }),
]);
```

### 도메인 기반 필터링

```typescript
// 공식 문서만 검색
mcp__tavily -
  mcp__tavily -
  search({
    query: 'TypeScript strict mode best practices',
    include_domains: [
      'typescriptlang.org',
      'microsoft.github.io',
      'devblogs.microsoft.com',
    ],
    max_results: 20,
  });

// 특정 사이트 제외
mcp__tavily -
  mcp__tavily -
  search({
    query: 'React hooks optimization',
    exclude_domains: [
      'w3schools.com',
      'tutorialspoint.com',
      'geeksforgeeks.org',
    ],
  });
```

## 🕷️ 웹 크롤링 전략

### 문서 사이트 크롤링

```typescript
// 기술 문서 전체 수집
mcp__tavily -
  mcp__tavily -
  crawl({
    url: 'https://nextjs.org/docs',
    max_pages: 100,
    crawl_depth: 4,
    categories: ['documentation', 'api-reference', 'guide'],
    include_subdomains: false,
  });
```

### 블로그 포스트 수집

```typescript
// 특정 주제의 블로그 포스트들
mcp__tavily -
  mcp__tavily -
  crawl({
    url: 'https://vercel.com/blog',
    max_pages: 50,
    crawl_depth: 2,
    categories: ['blog', 'news'],
    filter_by_date: '2024-01-01', // 특정 날짜 이후
  });
```

## 📄 콘텐츠 추출 활용

### 마크다운 문서 생성

```typescript
// 웹 페이지를 깔끔한 마크다운으로 변환
const extracted =
  (await mcp__tavily) -
  mcp__tavily -
  extract({
    url: 'https://docs.anthropic.com/claude-code',
    format: 'markdown',
    clean_content: true,
    include_metadata: true,
    include_images: true,
  });

// 파일로 저장
await mcp__filesystem__write_file({
  path: '/docs/claude-code-official.md',
  content: extracted.content,
});
```

### 다중 페이지 문서화

```typescript
// 여러 페이지를 하나의 문서로 통합
const urls = [
  'https://nextjs.org/docs/getting-started',
  'https://nextjs.org/docs/basic-features/pages',
  'https://nextjs.org/docs/api-routes/introduction',
];

const combined = await Promise.all(
  urls.map(
    (url) =>
      mcp__tavily -
      mcp__tavily -
      extract({
        url,
        format: 'markdown',
        clean_content: true,
      })
  )
);

const fullDoc = combined.map((doc) => doc.content).join('\n\n---\n\n');
```

## 🚨 문제 해결

### 일반적인 문제

#### 1. API 키 오류

**증상**: `MCP error -32603: Invalid API key`

**해결법**:

```bash
# API 키 확인
echo $TAVILY_API_KEY

# 올바른 키 형식 확인
# 개발용: tvly-dev-xxxxxxxxxx
# 프로덕션: tvly-xxxxxxxxxx

# MCP 재설정
claude mcp remove tavily-mcp
claude mcp add tavily-mcp --env TAVILY_API_KEY="올바른_키" -- npx -y @tavily/mcp-server
```

#### 2. 환경변수 전달 문제

**증상**: MCP는 연결되지만 도구 사용 시 인증 실패

**해결법**: Remote MCP 사용

```bash
claude mcp add tavily-remote --env TAVILY_API_KEY="tvly-xxxxxxxx" -- npx -y mcp-remote https://mcp.tavily.com/mcp/
```

#### 3. 속도 제한 문제

**증상**: `Rate limit exceeded`

**해결법**:

- 개발용 키 → 프로덕션 키 업그레이드
- `max_results` 값 줄이기
- 요청 간격 늘리기

### 연결 상태 확인

```bash
# MCP 서버 상태 확인
claude mcp list

# 특정 도구 테스트
claude --tool tavily-search "test query"
```

## 💡 실전 예제

### 예제 1: 경쟁사 기술 스택 분석

```typescript
// 1. 경쟁사 기술 블로그 크롤링
const techBlog =
  (await mcp__tavily) -
  mcp__tavily -
  crawl({
    url: 'https://engineering.company.com',
    max_pages: 30,
    categories: ['engineering', 'technology'],
  });

// 2. 특정 기술 관련 포스트 검색
const reactPosts =
  (await mcp__tavily) -
  mcp__tavily -
  search({
    query: 'React architecture site:engineering.company.com',
    days: 365,
    max_results: 20,
  });

// 3. 상세 콘텐츠 추출
const details = await Promise.all(
  reactPosts.results.map(
    (post) =>
      mcp__tavily -
      mcp__tavily -
      extract({
        url: post.url,
        format: 'markdown',
        clean_content: true,
      })
  )
);
```

### 예제 2: 기술 문서 자동 업데이트

```typescript
// 1. 공식 문서 변경사항 체크
const latestDocs =
  (await mcp__tavily) -
  mcp__tavily -
  search({
    query: 'Next.js 15 new features site:nextjs.org',
    days: 30,
    search_depth: 'advanced',
  });

// 2. 새로운 내용 추출
const newFeatures =
  (await mcp__tavily) -
  mcp__tavily -
  extract({
    url: latestDocs.results[0].url,
    format: 'markdown',
    include_metadata: true,
  });

// 3. 로컬 문서 업데이트
await mcp__filesystem__write_file({
  path: '/docs/nextjs-15-features.md',
  content: `# Next.js 15 New Features\n\n${newFeatures.content}`,
});
```

### 예제 3: 시장 트렌드 분석 보고서

```typescript
// 1. 다양한 소스에서 트렌드 데이터 수집
const trendSources = [
  'React state management trends',
  'JavaScript framework adoption 2024',
  'Frontend performance optimization',
];

const trendData = await Promise.all(
  trendSources.map(
    (query) =>
      mcp__tavily -
      mcp__tavily -
      search({
        query,
        days: 90,
        topic: 'news',
        include_domains: ['stackoverflow.com', 'github.com', 'dev.to'],
      })
  )
);

// 2. 결과 분석 및 보고서 생성
const report = trendData.map((data, index) => ({
  topic: trendSources[index],
  insights: data.results.slice(0, 5),
  summary: data.answer,
}));
```

## ⚡ 성능 최적화

### 1. 요청 최적화

```typescript
// ❌ 비효율적
for (const url of urls) {
  (await mcp__tavily) - mcp__tavily - extract({ url });
}

// ✅ 효율적 (배치 처리)
const results = await Promise.all(
  urls.map((url) => mcp__tavily - mcp__tavily - extract({ url }))
);
```

### 2. 결과 필터링

```typescript
// 불필요한 데이터 제외
mcp__tavily -
  mcp__tavily -
  search({
    query: 'search term',
    include_raw_content: false, // 원본 HTML 제외
    include_images: false, // 이미지 URL 제외 (필요시만)
    max_results: 10, // 적정 수준으로 제한
  });
```

### 3. 캐싱 전략

```typescript
// 자주 사용하는 검색 결과 캐싱
const cache = new Map();

async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }

  const result = (await mcp__tavily) - mcp__tavily - search({ query });
  cache.set(query, result);
  return result;
}
```

## 📊 모니터링 및 분석

### API 사용량 추적

```typescript
// 사용량 카운터
let apiCalls = 0;
let dailyLimit = 1000;

async function monitoredSearch(params: any) {
  if (apiCalls >= dailyLimit) {
    throw new Error('Daily API limit reached');
  }

  apiCalls++;
  return (await mcp__tavily) - mcp__tavily - search(params);
}
```

### 성능 벤치마킹

```typescript
async function benchmarkSearch(query: string) {
  const start = Date.now();
  const result = (await mcp__tavily) - mcp__tavily - search({ query });
  const duration = Date.now() - start;

  console.log(`Search completed in ${duration}ms`);
  console.log(`Results: ${result.results.length}`);
  console.log(`Answer quality: ${result.answer ? 'High' : 'Low'}`);

  return result;
}
```

---

## 💡 활용 팁

1. **Remote MCP 우선 사용**: 환경변수 문제 최소화
2. **도메인 필터링 활용**: 신뢰할 수 있는 소스만 검색
3. **시간 필터링**: 최신 정보 우선 수집
4. **배치 처리**: 여러 요청 시 Promise.all 사용
5. **결과 캐싱**: 동일한 검색 반복 방지

이 가이드를 통해 Tavily MCP의 모든 기능을 효율적으로 활용할 수 있습니다. 추가 질문이나 문제가 있다면 언제든 문의하세요.
