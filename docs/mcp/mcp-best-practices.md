# 🏆 MCP 베스트 프랙티스 가이드

> MCP 서버 최적 활용 및 성능 최적화

## 🎯 개요

Claude Code에서 12개 MCP 서버를 효과적으로 활용하기 위한 베스트 프랙티스 모음입니다.

## 📊 MCP 서버 우선순위

### 🥇 핵심 서버 (매일 사용)

1. **filesystem** - 파일 시스템 조작
2. **github** - GitHub API 통합
3. **supabase** - 데이터베이스 작업
4. **tavily** - 웹 검색 및 정보 수집

### 🥈 보조 서버 (주간 사용)

5. **gcp** - Google Cloud Platform 관리
6. **playwright** - 브라우저 자동화
7. **memory** - 컨텍스트 기억
8. **thinking** - 고급 추론

### 🥉 특화 서버 (필요시)

9. **serena** - 코드 분석 (호환성 문제 있음)
10. **time** - 시간대 변환
11. **shadcn** - UI 컴포넌트
12. **context7** - 문서 검색

## 🚀 활용 패턴

### 1. 통합 워크플로우

```typescript
// 프로젝트 분석 → 구현 → 테스트 → 배포
1. mcp__filesystem__read_file  // 코드 분석
2. mcp__github__search_repositories  // 레퍼런스 검색
3. mcp__supabase__execute_sql  // DB 스키마 확인
4. mcp__filesystem__write_file  // 구현
5. mcp__playwright__screenshot  // 테스트
6. mcp__github__create_pull_request  // 배포
```

### 2. 성능 최적화 패턴

```bash
# 빠른 작업부터 순서대로
filesystem (즉시) → memory (빠름) → supabase (보통) → tavily (느림)

# 동시 실행 최소화
한 번에 하나의 무거운 MCP 서버만 사용
```

### 3. 에러 회복 패턴

```typescript
// 주 서버 실패시 보조 서버 활용
if (serena_failed) {
  use filesystem + manual_analysis;
}

if (tavily_rate_limit) {
  use context7 + manual_search;
}
```

## 🛡️ 보안 베스트 프랙티스

### 1. API 키 관리

```bash
# .env.local에서만 관리
GITHUB_TOKEN=your_token
SUPABASE_SERVICE_ROLE_KEY=your_key
TAVILY_API_KEY=your_key
GCP_SERVICE_ACCOUNT_KEY=path/to/key.json
```

### 2. 권한 최소화

```typescript
// GitHub: 필요한 최소 권한만
scope: ["repo", "read:user"]

// Supabase: RLS 활성화
CREATE POLICY "user_data" ON users FOR ALL USING (auth.uid() = id);
```

### 3. 데이터 검증

```typescript
// 입력 데이터 검증
const validateInput = (data: unknown) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input data');
  }
};
```

## ⚡ 성능 최적화

### 1. 캐싱 전략

```typescript
// 메모리 캐시 활용
const cache = new Map();
const getCachedResult = (key: string) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  // MCP 호출
  const result = mcp_call();
  cache.set(key, result);
  return result;
};
```

### 2. 배치 작업

```typescript
// 여러 파일을 한 번에 처리
const files = ['file1.ts', 'file2.ts', 'file3.ts'];
const results = await Promise.all(
  files.map((file) => mcp__filesystem__read_file({ path: file }))
);
```

### 3. 타임아웃 설정

```typescript
// MCP 호출에 타임아웃 적용
const withTimeout = async (mcpCall: Promise<any>, timeout: number) => {
  return Promise.race([
    mcpCall,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MCP timeout')), timeout)
    ),
  ]);
};
```

## 🧪 테스트 전략

### 1. MCP 서버 헬스 체크

```typescript
// 정기적인 상태 확인
const healthCheck = async () => {
  const servers = ['filesystem', 'github', 'supabase', 'tavily'];
  const results = await Promise.all(
    servers.map(async (server) => {
      try {
        await mcp_call(server, 'health');
        return { server, status: 'healthy' };
      } catch (error) {
        return { server, status: 'error', error: error.message };
      }
    })
  );
  return results;
};
```

### 2. 모킹 테스트

```typescript
// 테스트 환경에서 MCP 모킹
const mockMCP = {
  filesystem: {
    read_file: jest.fn().mockResolvedValue('mock content'),
    write_file: jest.fn().mockResolvedValue(true),
  },
  github: {
    search_repositories: jest.fn().mockResolvedValue([]),
  },
};
```

## 📊 모니터링

### 1. 사용량 추적

```typescript
// MCP 호출 통계
const mcpStats = {
  calls: 0,
  errors: 0,
  avgResponseTime: 0,
  topServers: new Map(),
};

const trackMCPCall = (server: string, responseTime: number) => {
  mcpStats.calls++;
  mcpStats.avgResponseTime = (mcpStats.avgResponseTime + responseTime) / 2;
  mcpStats.topServers.set(server, (mcpStats.topServers.get(server) || 0) + 1);
};
```

### 2. 에러 로깅

```typescript
// 상세한 에러 로깅
const logMCPError = (server: string, error: Error, context: any) => {
  console.error(`MCP Error [${server}]:`, {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};
```

## 🔄 CI/CD 통합

### 1. GitHub Actions

```yaml
# MCP 서버 상태 확인
- name: Check MCP Health
  run: |
    npm run mcp:health-check
    npm run mcp:validate-config
```

### 2. 배포 전 검증

```bash
# 배포 전 MCP 연결 테스트
#!/bin/bash
echo "Testing MCP connections..."
npm run test:mcp-integration
if [ $? -eq 0 ]; then
  echo "✅ MCP connections healthy"
  npm run deploy
else
  echo "❌ MCP connection failed"
  exit 1
fi
```

## 🎯 실제 사용 사례

### 1. 코드 리뷰 자동화

```typescript
// 1. 변경된 파일 읽기
const changedFiles = await mcp__github__get_pull_request_files({
  owner: 'user',
  repo: 'project',
  pull_number: 123,
});

// 2. 파일 내용 분석
const analysis = await Promise.all(
  changedFiles.map((file) =>
    mcp__filesystem__read_file({ path: file.filename })
  )
);

// 3. 리뷰 코멘트 작성
await mcp__github__create_review_comment({
  body: '코드 리뷰 결과...',
  path: file.filename,
  line: issueLineNumber,
});
```

### 2. 데이터베이스 스키마 동기화

```typescript
// 1. 로컬 스키마 읽기
const localSchema = await mcp__filesystem__read_file({
  path: './database/schema.sql',
});

// 2. Supabase 스키마 비교
const remoteSchema = await mcp__supabase__execute_sql({
  query: 'SELECT * FROM information_schema.tables',
});

// 3. 차이점 분석 및 마이그레이션
const diff = analyzeSchema(localSchema, remoteSchema);
if (diff.length > 0) {
  await mcp__supabase__execute_sql({
    query: generateMigrationSQL(diff),
  });
}
```

## 📚 관련 문서

### MCP 설정 및 활용

- **[MCP 종합 가이드](../MCP-GUIDE.md)** - 12개 서버 완전 활용 가이드
- **[Tavily MCP 가이드](tavily-mcp-complete-guide.md)** - 웹 검색 및 정보 수집
- **[Serena MCP 가이드](serena-mcp-complete-guide.md)** - 고급 코드 분석 도구

### 개발 가이드

- **[개발 환경 설정](../development/development-guide.md)**
- **[API 최적화](../performance/api-optimization-guide.md)**

---

> **MCP 관련 문제가 있나요?** [MCP 문제 해결](../TROUBLESHOOTING.md#mcp-관련-문제)을 확인해주세요.
