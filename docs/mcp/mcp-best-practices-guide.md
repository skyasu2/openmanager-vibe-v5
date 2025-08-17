# MCP (Model Context Protocol) 베스트 프랙티스 가이드 (아카이브)

> **⚠️ 이 문서는 구버전입니다.**  
> **👉 최신 정보는 [MCP-GUIDE.md](../../MCP-GUIDE.md)를 참조하세요.**

**아카이브 이유**: 구버전 MCP 설정 기반 (CLI 전환)  
**대체 문서**: [MCP-GUIDE.md](../../MCP-GUIDE.md) - 통합 MCP 가이드

## 🎯 개요

이 문서는 Claude Code와 서브 에이전트에서 MCP를 효과적으로 활용하기 위한 베스트 프랙티스를 제공합니다.

## 📋 목차

1. [MCP 기본 개념](#mcp-기본-개념)
2. [MCP 서버별 활용 가이드](#mcp-서버별-활용-가이드)
3. [통합 패턴](#통합-패턴)
4. [성능 최적화](#성능-최적화)
5. [에러 처리](#에러-처리)
6. [보안 고려사항](#보안-고려사항)

## 🔧 MCP 기본 개념

### MCP란?

MCP(Model Context Protocol)는 LLM이 외부 도구와 데이터 소스에 접근할 수 있게 하는 개방형 프로토콜입니다.

### ⚠️ 설정 충돌 방지 (중요!)

**글로벌 vs 로컬 설정 분리 원칙**:

```bash
# ❌ 위험: 전역 설정과 프로젝트 설정이 충돌
~/.claude.json projects 섹션에 mcpServers 정의
+ .claude/mcp.json에도 mcpServers 정의
= 4개 vs 10개 서버 혼란 발생

# ✅ 올바른 방식: 명확한 분리
~/.claude.json - 개인 설정, 빈 mcpServers: {}
.claude/mcp.json - 프로젝트별 10개 MCP 서버 정의
```

**설정 우선순위**:

1. **프로젝트 로컬**: `.claude/mcp.json` (최우선)
2. **전역 프로젝트**: `~/.claude.json` projects 섹션 (충돌 시 제거)
3. **사용자 전역**: `~/.claude/settings.json` (기본값)

### 핵심 구성요소

- **Server**: 도구와 리소스를 제공하는 프로세스
- **Client**: MCP 서버와 통신하는 LLM 애플리케이션
- **Transport**: stdio, SSE, HTTP 등의 통신 방식
- **Tools**: 서버가 노출하는 실행 가능한 함수
- **Resources**: 서버가 제공하는 데이터

## 📚 MCP 서버별 활용 가이드

### 1. **filesystem MCP**

파일 시스템 작업에 최적화된 서버입니다.

```typescript
// ✅ 좋은 예: 병렬로 여러 파일 읽기
const [appConfig, dbConfig, authConfig] = await Promise.all([
  mcp__filesystem__read_file({ path: '/src/config/app.ts' }),
  mcp__filesystem__read_file({ path: '/src/config/database.ts' }),
  mcp__filesystem__read_file({ path: '/src/config/auth.ts' }),
]);

// ✅ 좋은 예: 디렉토리 검색
const tsFiles = await mcp__filesystem__search_files({
  path: '/src',
  pattern: '**/*.ts',
  exclude_patterns: ['**/*.test.ts', '**/node_modules/**'],
});

// ❌ 나쁜 예: 개별 파일 순차 읽기
for (const path of paths) {
  const file = await mcp__filesystem__read_file({ path });
}
```

**베스트 프랙티스:**

- 대량 파일 작업 시 batch 연산 활용
- 디렉토리 구조 파악 후 필요한 파일만 읽기
- 정규식 패턴으로 효율적인 파일 검색

### 2. **github MCP**

GitHub 저장소 관리와 협업을 위한 서버입니다.

```typescript
// ✅ 좋은 예: 구조화된 PR 생성
await mcp__github__create_pull_request({
  owner: 'openmanager',
  repo: 'vibe-v5',
  title: 'feat: pgvector 통합으로 검색 성능 개선',
  body: `## 변경사항
- pgvector extension 활성화
- 384차원 임베딩 적용
- 하이브리드 검색 구현

## 성능 개선
- 검색 정확도: +40%
- 응답 속도: < 100ms`,
  head: 'feature/pgvector-integration',
  base: 'main',
});

// ❌ 나쁜 예: 설명 없는 PR
await mcp__github__create_pull_request({
  title: 'update',
  body: 'fixed stuff',
});
```

**베스트 프랙티스:**

- 명확한 커밋 메시지와 PR 설명
- 이슈와 PR 연결
- 코드 리뷰 요청 전 자체 검토

### 3. **memory MCP**

지식 그래프 기반 영구 메모리 관리 서버입니다.

```typescript
// ✅ 좋은 예: 구조화된 지식 저장
await mcp__memory__add_memory({
  content:
    'pgvector 최적화 결과: 384차원 임베딩으로 75% 저장 공간 절약, IVFFlat 인덱스로 100만 벡터에서도 50ms 검색',
  metadata: {
    type: 'optimization',
    date: new Date().toISOString(),
    impact: 'high',
  },
});

// 메모리 검색
const relatedMemories = await mcp__memory__search_memories({
  query: 'pgvector performance',
  limit: 5,
});

// 메모리 업데이트
await mcp__memory__update_memory({
  id: 'memory-id',
  content: '업데이트된 내용',
  metadata: { updated: true },
});
```

**베스트 프랙티스:**

- 의미 있는 엔티티와 관계 생성
- 중복 엔티티 생성 방지
- 주기적인 메모리 정리

### 4. **supabase MCP**

Supabase 데이터베이스 관리를 위한 서버입니다.

```typescript
// ✅ 좋은 예: 안전한 쿼리 실행
const result = await mcp__supabase__query({
  query: `
    SELECT s.*, 
           array_agg(m.created_at ORDER BY m.created_at DESC) as metric_history
    FROM servers s
    LEFT JOIN metrics m ON s.id = m.server_id
    WHERE s.status = $1
    GROUP BY s.id
    LIMIT $2
  `,
  params: ['active', 10],
});

// ✅ 좋은 예: 트랜잭션 처리
await mcp__supabase__execute_sql({
  sql: `
    BEGIN;
    UPDATE servers SET last_check = NOW() WHERE id = $1;
    INSERT INTO metrics (server_id, cpu, memory) VALUES ($1, $2, $3);
    COMMIT;
  `,
  params: [serverId, cpuUsage, memoryUsage],
});

// ❌ 나쁜 예: SQL 인젝션 위험
await mcp__supabase__execute_sql({
  query: 'DROP TABLE users;', // 위험!
});
```

**베스트 프랙티스:**

- 마이그레이션으로 스키마 변경 관리
- 실행 전 쿼리 검증
- 백업 후 중요 작업 수행

### 5. **context7 MCP**

라이브러리 문서와 코드 예제 검색 서버입니다.

```typescript
// ✅ 좋은 예: 구체적인 토픽 검색
const docs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/vercel/next.js',
  topic: 'app-router-middleware',
  tokens: 5000,
});

// 라이브러리 ID 검색
const libraries = await mcp__context7__resolve_library_id({
  libraryName: 'next.js app router',
});
```

**베스트 프랙티스:**

- 구체적인 토픽으로 검색 범위 좁히기
- 적절한 토큰 수 설정 (기본 10000)
- 버전별 문서 확인

### 6. **sequential-thinking MCP**

복잡한 문제 해결을 위한 단계별 사고 서버입니다.

```typescript
// ✅ 좋은 예: 복잡한 문제 분해
await mcp__sequential_thinking__sequentialthinking({
  thought: 'pgvector 최적화 전략을 단계별로 분석',
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true,
});
```

**베스트 프랙티스:**

- 복잡한 문제를 작은 단계로 분해
- 각 단계의 검증 포함
- 필요시 사고 과정 수정

## 🔄 통합 패턴

### 1. **다중 MCP 조합**

```typescript
// 파일 읽기 → 분석 → 메모리 저장
async function analyzeAndStore(filePath: string) {
  // 1. 파일 읽기
  const content = await mcp__filesystem__read_file({
    path: filePath,
  });

  // 2. 복잡한 분석
  const analysis = await mcp__sequential_thinking__sequentialthinking({
    thought: `파일 ${filePath}의 구조와 패턴 분석`,
    totalThoughts: 3,
    nextThoughtNeeded: true,
  });

  // 3. 결과 저장
  await mcp__memory__create_entities({
    entities: [
      {
        name: `analysis_${filePath}`,
        entityType: 'code_analysis',
        observations: [analysis.thought],
      },
    ],
  });
}
```

### 2. **에러 핸들링 패턴**

```typescript
async function safeExecute<T>(
  mcpCall: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await mcpCall();
  } catch (error) {
    console.error('MCP 호출 실패:', error);

    // 에러 로깅
    await mcp__memory__create_entities({
      entities: [
        {
          name: `error_${Date.now()}`,
          entityType: 'error',
          observations: [error.message],
        },
      ],
    });

    return fallback;
  }
}
```

### 3. **배치 처리 패턴**

```typescript
async function batchProcess<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  batchSize = 10
) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processor(item))
    );
    results.push(...batchResults);

    // 레이트 리미팅
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

## ⚡ 성능 최적화

### 1. **캐싱 전략**

```typescript
class MCPCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 300000; // 5분

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });

    return data;
  }
}

const cache = new MCPCache();

// 사용 예
const docs = await cache.get('next-docs', () =>
  mcp__context7__get_library_docs({
    context7CompatibleLibraryID: '/vercel/next.js',
  })
);
```

### 2. **병렬 처리**

```typescript
// ✅ 좋은 예: 독립적인 작업 병렬 처리
const [files, dbStats, memories] = await Promise.all([
  mcp__filesystem__list_directory({ path: '/src' }),
  mcp__supabase__execute_sql({
    query: 'SELECT COUNT(*) FROM knowledge_base',
  }),
  mcp__memory__read_graph({}),
]);

// ❌ 나쁜 예: 순차 처리
const files = await mcp__filesystem__list_directory({ path: '/src' });
const dbStats = await mcp__supabase__execute_sql({
  query: 'SELECT COUNT(*) FROM knowledge_base',
});
const memories = await mcp__memory__read_graph({});
```

## 🛡️ 보안 고려사항

### 1. **입력 검증**

```typescript
function validatePath(path: string): boolean {
  // 경로 탐색 공격 방지
  if (path.includes('..') || path.includes('~')) {
    throw new Error('Invalid path');
  }

  // 허용된 디렉토리만 접근
  const allowedPaths = ['/src', '/docs', '/tests'];
  return allowedPaths.some((allowed) => path.startsWith(allowed));
}
```

### 2. **민감한 정보 보호**

```typescript
// 환경 변수나 시크릿 필터링
function sanitizeContent(content: string): string {
  const patterns = [
    /SUPABASE_KEY=[\w-]+/g,
    /API_KEY=[\w-]+/g,
    /password\s*=\s*['"][\w-]+['"]/gi,
  ];

  let sanitized = content;
  patterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}
```

### 3. **권한 관리**

```typescript
// Supabase RLS 정책 확인
async function checkPermissions(userId: string, resource: string) {
  const { data, error } = await mcp__supabase__execute_sql({
    query: `
      SELECT has_access($1, $2) as authorized
    `,
    project_id: 'your-project',
    params: [userId, resource],
  });

  if (error || !data?.[0]?.authorized) {
    throw new Error('Unauthorized access');
  }
}
```

## 📊 모니터링과 디버깅

### 1. **MCP 사용량 추적**

```typescript
class MCPMonitor {
  private metrics = new Map<string, number>();

  async track<T>(
    serverName: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    const key = `${serverName}.${operation}`;

    try {
      const result = await fn();
      this.recordSuccess(key, Date.now() - start);
      return result;
    } catch (error) {
      this.recordError(key, error);
      throw error;
    }
  }

  private recordSuccess(key: string, duration: number) {
    this.metrics.set(
      `${key}.count`,
      (this.metrics.get(`${key}.count`) || 0) + 1
    );
    this.metrics.set(
      `${key}.avg_duration`,
      duration // 실제로는 이동 평균 계산
    );
  }

  private recordError(key: string, error: any) {
    this.metrics.set(
      `${key}.errors`,
      (this.metrics.get(`${key}.errors`) || 0) + 1
    );
    console.error(`MCP Error [${key}]:`, error);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
```

### 2. **디버그 로깅**

```typescript
const DEBUG = process.env.MCP_DEBUG === 'true';

function debugLog(server: string, operation: string, data?: any) {
  if (!DEBUG) return;

  console.log(`[MCP:${server}] ${operation}`, {
    timestamp: new Date().toISOString(),
    data: data ? JSON.stringify(data, null, 2) : undefined,
  });
}

// 사용 예
debugLog('filesystem', 'read_file', { path: '/src/app.ts' });
```

## 🚀 고급 활용 팁

### 1. **조건부 MCP 사용**

```typescript
async function smartSearch(query: string) {
  // 쿼리 복잡도에 따라 적절한 MCP 선택
  const isComplex = query.split(' ').length > 10;

  if (isComplex) {
    // 복잡한 쿼리는 sequential thinking 사용
    return await mcp__sequential_thinking__sequentialthinking({
      thought: query,
      totalThoughts: 5,
      nextThoughtNeeded: true,
    });
  } else {
    // 단순 쿼리는 직접 검색
    return await mcp__memory__search_nodes({ query });
  }
}
```

### 2. **MCP 체이닝**

```typescript
async function documentWorkflow(topic: string) {
  // 1. 문서 검색
  const docs = await mcp__context7__get_library_docs({
    context7CompatibleLibraryID: '/vercel/next.js',
    topic,
  });

  // 2. 분석 및 요약
  const analysis = await mcp__sequential_thinking__sequentialthinking({
    thought: `다음 문서의 핵심 내용 분석: ${docs.substring(0, 1000)}`,
    totalThoughts: 3,
    nextThoughtNeeded: true,
  });

  // 3. 지식 저장
  await mcp__memory__create_entities({
    entities: [
      {
        name: `doc_analysis_${topic}`,
        entityType: 'documentation',
        observations: [analysis.thought],
      },
    ],
  });

  // 4. 마크다운 파일 생성
  await mcp__filesystem__write_file({
    path: `/docs/analysis/${topic}.md`,
    content: `# ${topic} 분석\n\n${analysis.thought}`,
  });
}
```

## 📚 참고 자료

- [Claude Code MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP 프로토콜 명세](https://github.com/anthropics/mcp)
- [서브 에이전트 협업 패턴](./sub-agent-collaboration-patterns.md)
- [pgvector 최적화 가이드](./pgvector-optimization-guide.md)

## 🎯 체크리스트

MCP 통합 시 확인 사항:

- [ ] 적절한 MCP 서버 선택
- [ ] 입력값 검증 구현
- [ ] 에러 처리 및 폴백 전략
- [ ] 캐싱 및 성능 최적화
- [ ] 보안 고려사항 검토
- [ ] 모니터링 및 로깅 설정
- [ ] 문서화 및 예제 코드 작성

---

💡 **핵심 원칙**: MCP는 강력한 도구이지만, 적절한 사용법과 보안 고려사항을 준수해야 합니다. 항상 최소 권한 원칙을 따르고, 에러 처리를 철저히 하며, 성능을 모니터링하세요.
