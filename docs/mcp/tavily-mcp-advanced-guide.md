ARCHIVED

> **최신 업데이트**: 2025년 8월 12일
> **상태**: ✅ 모든 기능 정상 작동

## 📋 목차

1. [개요](#개요)
2. [핵심 기능](#핵심-기능)
3. [고급 검색 기법](#고급-검색-기법)
4. [웹 크롤링 전략](#웹-크롤링-전략)
5. [콘텐츠 추출 활용](#콘텐츠-추출-활용)
6. [사이트 매핑](#사이트-매핑)
7. [통합 워크플로우](#통합-워크플로우)
8. [실전 예제](#실전-예제)
9. [성능 최적화](#성능-최적화)
10. [트러블슈팅](#트러블슈팅)

## 🎯 개요

Tavily MCP는 단순 웹 검색을 넘어서는 **강력한 웹 인텔리전스 도구**입니다. WebSearch와 달리 구조적 크롤링, 고급 필터링, 깔끔한 콘텐츠 추출을 제공합니다.

### 왜 Tavily MCP를 사용해야 하나?

| 기능          | WebSearch | Tavily MCP             | 활용 시나리오              |
| ------------- | --------- | ---------------------- | -------------------------- |
| 기본 검색     | ✅        | ✅                     | 단순 정보 검색             |
| 시간 필터링   | ❌        | ✅ day/week/month/year | 최신 트렌드 분석           |
| 도메인 필터링 | ❌        | ✅ include/exclude     | 신뢰할 수 있는 소스만 검색 |
| 웹 크롤링     | ❌        | ✅ 깊이별, 카테고리별  | 문서 전체 수집             |
| 콘텐츠 추출   | ❌        | ✅ 마크다운 변환       | 깔끔한 문서화              |
| 사이트 매핑   | ❌        | ✅ URL 구조 분석       | 사이트 아키텍처 파악       |
| 이미지 추출   | ❌        | ✅                     | 비주얼 콘텐츠 수집         |

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
    time_range: 'week', // day | week | month | year
    max_results: 20, // 최대 20
    include_domains: ['nextjs.org', 'vercel.com'],
    exclude_domains: ['reddit.com'],
    include_raw_content: true, // HTML 원본 포함
    include_images: true, // 이미지 URL 포함
    include_image_descriptions: true,
    country: 'korea', // 국가별 부스팅
  });
```

### 2. tavily-crawl (체계적 웹 크롤링)

```typescript
// 문서 사이트 전체 크롤링
mcp__tavily -
  mcp__tavily -
  crawl({
    url: 'https://docs.example.com',
    max_depth: 3, // 최대 깊이
    limit: 100, // 최대 페이지 수
    max_breadth: 20, // 각 레벨당 최대 링크
    categories: ['Documentation', 'API', 'Blog'],
    select_paths: ['/docs/.*', '/api/.*'],
    select_domains: ['^docs\\.example\\.com$'],
    format: 'markdown', // markdown | text
    extract_depth: 'advanced', // basic | advanced
    instructions: 'Focus on React hooks and performance sections',
  });
```

### 3. tavily-extract (콘텐츠 추출)

```typescript
// 여러 URL에서 구조화된 콘텐츠 추출
mcp__tavily -
  mcp__tavily -
  extract({
    urls: ['https://example.com/article1', 'https://example.com/article2'],
    format: 'markdown',
    extract_depth: 'advanced', // 테이블, 임베드 콘텐츠 포함
    include_images: true,
    include_favicon: true,
  });
```

### 4. tavily-map (사이트 구조 매핑)

```typescript
// 웹사이트 URL 구조 분석
mcp__tavily -
  mcp__tavily -
  map({
    url: 'https://example.com',
    max_depth: 2,
    limit: 50,
    categories: ['Documentation', 'Blog', 'API'],
    select_paths: ['/docs/.*'],
    instructions: 'Map all documentation and API reference pages',
  });
```

## 🎨 고급 검색 기법

### 시간 기반 검색 전략

```typescript
// 최신 보안 취약점 모니터링
async function checkLatestVulnerabilities() {
  return (
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: 'Next.js security vulnerability CVE',
      time_range: 'week',
      topic: 'news',
      search_depth: 'advanced',
      max_results: 10,
    })
  );
}

// 기술 트렌드 분석
async function analyzeTechTrends(tech: string) {
  const periods = ['day', 'week', 'month'];
  const results = [];

  for (const period of periods) {
    results.push(
      (await mcp__tavily) -
        mcp__tavily -
        search({
          query: `${tech} new features announcement`,
          time_range: period,
          max_results: 5,
        })
    );
  }

  return results;
}
```

### 도메인 필터링 전략

```typescript
// 공식 문서만 검색
async function searchOfficialDocs(framework: string) {
  const officialDomains = {
    'Next.js': ['nextjs.org', 'vercel.com'],
    React: ['react.dev', 'beta.reactjs.org'],
    Vue: ['vuejs.org', 'v3.vuejs.org'],
    Angular: ['angular.io', 'angular.dev'],
  };

  return (
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: `${framework} best practices 2025`,
      include_domains: officialDomains[framework],
      search_depth: 'advanced',
      max_results: 15,
    })
  );
}

// 소셜 미디어 제외 검색
async function searchWithoutSocial(query: string) {
  return (
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query,
      exclude_domains: [
        'reddit.com',
        'twitter.com',
        'facebook.com',
        'instagram.com',
        'tiktok.com',
      ],
      search_depth: 'advanced',
    })
  );
}
```

## 🕷️ 웹 크롤링 전략

### 문서 사이트 완전 크롤링

```typescript
// Next.js 문서 전체 수집
async function crawlNextjsDocs() {
  const result =
    (await mcp__tavily) -
    mcp__tavily -
    crawl({
      url: 'https://nextjs.org/docs',
      max_depth: 4,
      limit: 200,
      categories: ['Documentation'],
      select_paths: [
        '/docs/app/.*', // App Router
        '/docs/pages/.*', // Pages Router
        '/docs/api-reference/.*', // API Reference
      ],
      format: 'markdown',
      extract_depth: 'advanced',
      instructions:
        'Focus on Next.js 15 specific features and App Router patterns',
    });

  // 수집된 페이지 저장
  for (const page of result.pages) {
    await saveDocumentation(page.url, page.content);
  }
}
```

### 블로그 포스트 수집

```typescript
// 기술 블로그 크롤링
async function crawlTechBlog(blogUrl: string) {
  return (
    (await mcp__tavily) -
    mcp__tavily -
    crawl({
      url: blogUrl,
      max_depth: 2,
      limit: 50,
      categories: ['Blog'],
      select_paths: ['/blog/.*', '/posts/.*', '/articles/.*'],
      format: 'markdown',
      instructions: 'Extract blog posts about React, Next.js, and TypeScript',
    })
  );
}
```

## 📄 콘텐츠 추출 활용

### 멀티 소스 콘텐츠 수집

```typescript
// 여러 문서에서 핵심 정보 추출
async function extractMultiSourceContent() {
  // 1단계: 관련 URL 검색
  const searchResults =
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: 'React Server Components best practices',
      max_results: 10,
      include_domains: ['react.dev', 'nextjs.org', 'vercel.com'],
    });

  // 2단계: URL 추출
  const urls = searchResults.results.map((r) => r.url);

  // 3단계: 콘텐츠 추출
  const extractedContent =
    (await mcp__tavily) -
    mcp__tavily -
    extract({
      urls: urls.slice(0, 5), // 상위 5개만
      format: 'markdown',
      extract_depth: 'advanced',
      include_images: true,
    });

  return extractedContent;
}
```

### LinkedIn 프로필 추출 (advanced 필수)

```typescript
// LinkedIn은 extract_depth: "advanced" 필요
async function extractLinkedInProfile(profileUrl: string) {
  return (
    (await mcp__tavily) -
    mcp__tavily -
    extract({
      urls: [profileUrl],
      format: 'markdown',
      extract_depth: 'advanced', // LinkedIn은 advanced 필수
      include_images: true,
    })
  );
}
```

## 🗺️ 사이트 매핑

### 사이트 구조 분석

```typescript
// 웹사이트 전체 구조 파악
async function analyzeSiteStructure(siteUrl: string) {
  const siteMap =
    (await mcp__tavily) -
    mcp__tavily -
    map({
      url: siteUrl,
      max_depth: 3,
      limit: 100,
      instructions: 'Identify main sections and navigation structure',
    });

  // URL 패턴 분석
  const urlPatterns = analyzePattterns(siteMap.urls);

  // 섹션별 분류
  const sections = {
    docs: siteMap.urls.filter((url) => url.includes('/docs/')),
    api: siteMap.urls.filter((url) => url.includes('/api/')),
    blog: siteMap.urls.filter((url) => url.includes('/blog/')),
    examples: siteMap.urls.filter((url) => url.includes('/examples/')),
  };

  return { siteMap, urlPatterns, sections };
}
```

## 🔄 통합 워크플로우

### 완전한 연구 워크플로우

```typescript
async function completeResearchWorkflow(topic: string) {
  console.log(`🔍 Researching: ${topic}`);

  // 1. 초기 검색 - 최신 정보 우선
  const latestInfo =
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: topic,
      time_range: 'week',
      search_depth: 'advanced',
      max_results: 10,
    });

  // 2. 주요 사이트 식별
  const topSites = identifyTopSites(latestInfo.results);

  // 3. 각 사이트 크롤링
  const crawlResults = [];
  for (const site of topSites.slice(0, 3)) {
    const crawled =
      (await mcp__tavily) -
      mcp__tavily -
      crawl({
        url: site,
        max_depth: 2,
        limit: 30,
        format: 'markdown',
        instructions: `Find information about ${topic}`,
      });
    crawlResults.push(crawled);
  }

  // 4. 핵심 페이지 상세 추출
  const importantUrls = selectImportantUrls(crawlResults);
  const detailedContent =
    (await mcp__tavily) -
    mcp__tavily -
    extract({
      urls: importantUrls,
      format: 'markdown',
      extract_depth: 'advanced',
      include_images: true,
    });

  // 5. 사이트 구조 매핑 (선택적)
  const siteMaps = [];
  for (const site of topSites.slice(0, 2)) {
    const map =
      (await mcp__tavily) -
      mcp__tavily -
      map({
        url: site,
        max_depth: 2,
        limit: 50,
      });
    siteMaps.push(map);
  }

  return {
    searchResults: latestInfo,
    crawledContent: crawlResults,
    detailedContent,
    siteMaps,
    summary: generateSummary(detailedContent),
  };
}
```

## 💼 실전 예제

### 1. 경쟁사 분석

```typescript
async function analyzeCompetitor(competitorUrl: string) {
  // 사이트 구조 파악
  const siteStructure =
    (await mcp__tavily) -
    mcp__tavily -
    map({
      url: competitorUrl,
      max_depth: 3,
      limit: 100,
    });

  // 주요 페이지 크롤링
  const content =
    (await mcp__tavily) -
    mcp__tavily -
    crawl({
      url: competitorUrl,
      categories: ['Products', 'Pricing', 'About'],
      max_depth: 2,
      limit: 50,
      format: 'markdown',
    });

  // 최근 뉴스 검색
  const news =
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: `site:${competitorUrl} OR "${extractCompanyName(competitorUrl)}"`,
      time_range: 'month',
      topic: 'news',
    });

  return { siteStructure, content, news };
}
```

### 2. 기술 문서 업데이트 모니터링

```typescript
async function monitorDocUpdates(framework: string) {
  const docSites = {
    'Next.js': 'https://nextjs.org/docs',
    React: 'https://react.dev',
    Vue: 'https://vuejs.org',
  };

  // 최근 변경사항 검색
  const recentChanges =
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: `site:${docSites[framework]} "updated" OR "new" OR "deprecated"`,
      time_range: 'week',
      search_depth: 'advanced',
    });

  // 변경된 페이지 상세 추출
  if (recentChanges.results.length > 0) {
    const urls = recentChanges.results.map((r) => r.url);
    const details =
      (await mcp__tavily) -
      mcp__tavily -
      extract({
        urls: urls.slice(0, 10),
        format: 'markdown',
        extract_depth: 'advanced',
      });

    return { recentChanges, details };
  }
}
```

### 3. 학습 자료 수집

```typescript
async function collectLearningResources(topic: string) {
  // 공식 문서 검색
  const officialDocs =
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: `${topic} official documentation tutorial`,
      include_domains: ['dev', 'org', 'io'],
      exclude_domains: ['medium.com', 'dev.to'],
      search_depth: 'advanced',
    });

  // 튜토리얼 블로그 검색
  const tutorials =
    (await mcp__tavily) -
    mcp__tavily -
    search({
      query: `${topic} tutorial step by step 2025`,
      time_range: 'month',
      max_results: 15,
    });

  // 상위 튜토리얼 콘텐츠 추출
  const topTutorials = tutorials.results.slice(0, 5).map((r) => r.url);
  const tutorialContent =
    (await mcp__tavily) -
    mcp__tavily -
    extract({
      urls: topTutorials,
      format: 'markdown',
      extract_depth: 'advanced',
      include_images: true,
    });

  return {
    officialDocs,
    tutorials,
    tutorialContent,
    learningPath: generateLearningPath(tutorialContent),
  };
}
```

## ⚡ 성능 최적화

### 요청 최적화 전략

```typescript
// ❌ 비효율적: 순차 실행
async function inefficientApproach(queries: string[]) {
  const results = [];
  for (const query of queries) {
    const result = (await mcp__tavily) - mcp__tavily - search({ query });
    results.push(result);
  }
  return results;
}

// ✅ 효율적: 병렬 실행
async function efficientApproach(queries: string[]) {
  const promises = queries.map(
    (query) => mcp__tavily - mcp__tavily - search({ query })
  );
  return await Promise.all(promises);
}
```

### 캐싱 전략

```typescript
// 결과 캐싱
const searchCache = new Map();

async function cachedSearch(query: string, options = {}) {
  const cacheKey = JSON.stringify({ query, ...options });

  if (searchCache.has(cacheKey)) {
    const cached = searchCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 3600000) {
      // 1시간 캐시
      return cached.data;
    }
  }

  const result =
    (await mcp__tavily) - mcp__tavily - search({ query, ...options });
  searchCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}
```

### API 제한 관리

```typescript
// Rate limiting
class TavilyRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute = 60; // Tavily 제한에 맞춤

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.requestsPerMinute);

      await Promise.all(batch.map((fn) => fn()));

      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }

    this.processing = false;
  }
}

const rateLimiter = new TavilyRateLimiter();

// 사용 예
async function rateLimitedSearch(query: string) {
  return rateLimiter.execute(
    () => mcp__tavily - mcp__tavily - search({ query })
  );
}
```

## 🔧 트러블슈팅

### 일반적인 문제와 해결

| 문제        | 원인                | 해결 방법                          |
| ----------- | ------------------- | ---------------------------------- |
| API 키 오류 | 잘못된 키 또는 만료 | `claude mcp list`로 확인 후 재설정 |
| 빈 결과     | 너무 구체적인 쿼리  | 쿼리 단순화, 도메인 필터 제거      |
| 타임아웃    | 너무 큰 크롤링 범위 | `limit`과 `max_depth` 축소         |
| 콘텐츠 누락 | `basic` depth 사용  | `extract_depth: "advanced"` 사용   |
| 속도 제한   | API 한도 초과       | Rate limiting 구현, 캐싱 활용      |

### 디버깅 팁

```typescript
// 디버그 모드로 실행
async function debugSearch(query: string) {
  console.log(`🔍 Searching for: ${query}`);

  try {
    const result =
      (await mcp__tavily) -
      mcp__tavily -
      search({
        query,
        max_results: 3, // 작은 수로 테스트
        search_depth: 'basic', // 먼저 basic으로 테스트
      });

    console.log(`✅ Found ${result.results.length} results`);
    console.log(`📊 First result:`, result.results[0]);

    return result;
  } catch (error) {
    console.error(`❌ Search failed:`, error);
    throw error;
  }
}
```

## 📚 추가 리소스

- [Tavily 공식 문서](https://docs.tavily.com)
- [MCP 개발 가이드](/docs/mcp-development-guide-2025.md)
- [문제 해결 가이드](/docs/tavily-mcp-troubleshooting.md)

## 💡 Pro Tips

1. **search_depth**: 정확도가 중요하면 `advanced`, 속도가 중요하면 `basic`
2. **extract_depth**: LinkedIn, 동적 사이트는 반드시 `advanced`
3. **time_range**: 트렌드 분석은 `week`, 역사적 자료는 `year`
4. **categories**: 크롤링 시 관련 카테고리만 지정하면 효율 향상
5. **instructions**: 자연어로 구체적인 지시사항 제공 가능

---

**작성일**: 2025년 8월 12일  
**작성자**: Claude Code + OpenManager VIBE 팀  
**버전**: 1.0.0
