# 📋 Vitest 테스트 시스템 개선 계획 (2025)

## 🎯 Executive Summary

OpenManager VIBE v5 프로젝트의 테스트 시스템을 종합적으로 분석한 결과, 주요 개선이 필요한 영역을 식별했습니다. 웹 검색과 Gemini CLI를 활용한 분석을 통해 구체적인 해결 방안을 수립했습니다.

### 현재 상태
- **테스트 결과**: 2개 실패 / 3개 성공 / 39개 파일 중 대부분 스킵
- **주요 문제**: 타임아웃, hanging process, Mock 불완전성
- **성능 이슈**: 테스트 실행 시간 과다 (43.78초)

### 목표
- **테스트 성공률**: 100% 달성
- **실행 시간**: 50% 단축 (43초 → 20초)
- **안정성**: Flaky 테스트 제거

## 🔍 문제 분석

### 1. 타임아웃 이슈 (Priority: Critical)
```
Error: Test timed out in 30000ms
Location: UnifiedAIEngineRouter.test.ts:247
```

**근본 원인**:
- Fake timers와 실제 비동기 작업의 충돌
- MSW (Mock Service Worker)와 fake timers 호환성 문제
- Thread pool 리소스 경쟁

### 2. Mock 불완전성 (Priority: High)
```
Error: query.range is not a function
Location: servers/all.test.ts:113
```

**근본 원인**:
- Supabase Mock이 모든 Query Builder 메서드를 구현하지 않음
- 체이닝 메서드 누락

### 3. Hanging Process (Priority: Medium)
```
Tests closed successfully but something prevents Vite server from exiting
```

**근본 원인**:
- 비동기 작업 미완료
- 글로벌 타이머 정리 실패
- WebSocket/EventSource 연결 미해제

## 🛠️ 개선 방안

### Phase 1: 즉시 적용 (1-2일)

#### 1.1 Vitest 설정 최적화

```typescript
// config/testing/vitest.config.ts
export default defineConfig({
  test: {
    // 타임아웃 설정 개선
    testTimeout: 15000,  // 10s → 15s
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    // Pool 최적화
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: true,  // 테스트 격리 활성화
        minThreads: 2,
        maxThreads: 4,  // CPU 코어에 맞게 조정
      }
    },
    
    // Hanging 방지
    reporters: process.env.CI 
      ? ['github-actions'] 
      : ['default', 'hanging-process'],
    
    // Mock 정리 강화
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
```

#### 1.2 Supabase Mock 수정

```typescript
// src/test/mocks/supabase-enhanced.ts
const createMockQueryBuilder = (data: any[]) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    
    // 누락된 range 메서드 추가
    range: vi.fn((start: number, end: number) => {
      const slicedData = data.slice(start, end + 1);
      return Promise.resolve({
        data: slicedData,
        error: null,
        count: slicedData.length,
      });
    }),
    
    // then 메서드로 Promise 지원
    then: (callback: Function) => {
      return Promise.resolve({
        data,
        error: null,
        count: data.length,
      }).then(callback);
    },
  };
  
  return builder;
};
```

#### 1.3 AI Router 테스트 타이머 수정

```typescript
// tests/unit/services/ai/UnifiedAIEngineRouter.test.ts
describe('UnifiedAIEngineRouter Tests', () => {
  beforeEach(() => {
    // Fake timers 제거 - 실제 타이머 사용
    // vi.useFakeTimers(); ❌
    
    // 빠른 Mock 응답 설정
    vi.mock('@/services/ai/engines/GoogleAIEngine', () => ({
      GoogleAIEngine: {
        query: vi.fn().mockImplementation(async () => {
          // setImmediate로 빠른 비동기 처리
          await new Promise(resolve => setImmediate(resolve));
          return { success: true, response: 'Mock response' };
        }),
      },
    }));
  });
  
  afterEach(() => {
    // vi.useRealTimers(); ❌ 불필요
    vi.clearAllMocks();
  });
  
  it('should handle complex queries', async () => {
    const result = await router.route({
      query: 'Complex query',
      mode: 'auto',
    });
    
    expect(result.success).toBe(true);
  }, 10000); // 명시적 타임아웃 설정
});
```

### Phase 2: 구조 개선 (3-5일)

#### 2.1 테스트 카테고리화

```typescript
// Test Suites 분류
const TEST_CATEGORIES = {
  UNIT: 'unit',         // 빠른 단위 테스트 (<100ms)
  INTEGRATION: 'int',   // 통합 테스트 (<1000ms)  
  API: 'api',          // API 엔드포인트 테스트
  SLOW: 'slow',        // 느린 테스트 (>1000ms)
  FLAKY: 'flaky',      // 불안정한 테스트
};

// 카테고리별 실행
// package.json
{
  "scripts": {
    "test:unit": "vitest run --grep=\"^\\[unit\\]\"",
    "test:integration": "vitest run --grep=\"^\\[int\\]\"",
    "test:fast": "vitest run --exclude=\"**/slow/**\"",
    "test:ci": "vitest run --coverage --reporter=github-actions"
  }
}
```

#### 2.2 테스트 디렉토리 재구성

```
tests/
├── __fixtures__/           # 테스트 데이터
│   ├── servers.json
│   ├── ai-responses.json
│   └── user-data.json
├── __helpers__/           # 테스트 헬퍼
│   ├── performance.ts     # 성능 측정
│   ├── async.ts          # 비동기 유틸
│   └── cleanup.ts        # 정리 함수
├── __mocks__/            # 중앙 Mock 관리
│   ├── supabase/
│   ├── google-ai/
│   └── mcp/
├── unit/                 # 단위 테스트
├── integration/          # 통합 테스트
├── api/                  # API 테스트
└── performance/          # 성능 테스트
```

#### 2.3 성능 도구 구현

```typescript
// tests/__helpers__/performance.ts
export class TestPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure(name: string, fn: () => Promise<any>) {
    return async () => {
      const start = performance.now();
      try {
        return await fn();
      } finally {
        const duration = performance.now() - start;
        this.record(name, duration);
        
        // 느린 테스트 경고
        if (duration > 1000) {
          console.warn(`⚠️ Slow test: ${name} took ${duration}ms`);
        }
      }
    };
  }
  
  record(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }
  
  getReport() {
    const report: any = {};
    for (const [name, durations] of this.metrics) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      
      report[name] = { avg, max, min, count: durations.length };
    }
    return report;
  }
}
```

### Phase 3: 장기 개선 (1-2주)

#### 3.1 병렬 실행 최적화

```typescript
// vitest.workspace.ts - 워크스페이스 설정
export default defineWorkspace([
  {
    extends: './config/testing/vitest.config.ts',
    test: {
      name: 'unit',
      include: ['tests/unit/**/*.test.ts'],
      pool: 'threads',
      poolOptions: {
        threads: {
          maxThreads: 8,
        }
      }
    }
  },
  {
    extends: './config/testing/vitest.config.ts',
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts'],
      pool: 'forks',  // 프로세스 격리 필요한 테스트
    }
  },
  {
    extends: './config/testing/vitest.config.ts',
    test: {
      name: 'api',
      include: ['tests/api/**/*.test.ts'],
      pool: 'threads',
      setupFiles: ['./tests/__helpers__/api-setup.ts'],
    }
  }
]);
```

#### 3.2 Flaky 테스트 감지

```typescript
// scripts/detect-flaky-tests.ts
import { execSync } from 'child_process';

const ITERATIONS = 10;
const results = new Map<string, number>();

for (let i = 0; i < ITERATIONS; i++) {
  console.log(`Running iteration ${i + 1}/${ITERATIONS}...`);
  
  try {
    const output = execSync('npm test -- --reporter=json', {
      encoding: 'utf-8',
    });
    
    const testResults = JSON.parse(output);
    
    for (const test of testResults.tests) {
      const key = `${test.file}:${test.name}`;
      results.set(key, (results.get(key) || 0) + (test.passed ? 1 : 0));
    }
  } catch (error) {
    // Test failure
  }
}

// Flaky 테스트 식별
const flakyTests = [];
for (const [test, passCount] of results) {
  const passRate = passCount / ITERATIONS;
  if (passRate > 0 && passRate < 1) {
    flakyTests.push({ test, passRate });
  }
}

console.log('Flaky Tests:', flakyTests);
```

#### 3.3 CI/CD 통합

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, api]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}
        timeout-minutes: 10
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.test-type }}
          path: test-results/
```

## 📊 예상 성과

### 단기 (1주)
- ✅ 테스트 성공률: 60% → 95%
- ✅ 실행 시간: 43초 → 30초
- ✅ Hanging process 문제 해결

### 중기 (1개월)
- ✅ 테스트 성공률: 95% → 100%
- ✅ 실행 시간: 30초 → 20초
- ✅ 테스트 커버리지: 40% → 70%

### 장기 (3개월)
- ✅ Flaky 테스트: 0%
- ✅ CI/CD 시간: 10분 → 5분
- ✅ 테스트 유지보수 시간: 50% 감소

## 🔄 실행 계획

### Week 1
- [ ] Vitest 설정 업데이트
- [ ] Supabase Mock 수정
- [ ] AI Router 테스트 타이머 수정
- [ ] 성능 모니터링 도구 구현

### Week 2
- [ ] 테스트 디렉토리 재구성
- [ ] 테스트 카테고리화 구현
- [ ] 병렬 실행 최적화
- [ ] CI/CD 파이프라인 개선

### Week 3-4
- [ ] Flaky 테스트 감지 시스템 구축
- [ ] 테스트 성능 대시보드 구현
- [ ] 문서화 및 가이드 작성
- [ ] 팀 교육 및 워크샵

## 📚 참고 자료

- [Vitest Configuration Guide](https://vitest.dev/config/)
- [MSW and Fake Timers Conflict Resolution](https://dheerajmurali.com/blog/vitest-usefaketimer-and-msw/)
- [Vitest Performance Optimization](https://vitest.dev/guide/performance)
- [Test Organization Best Practices](https://testingjavascript.com/)

## 🏆 성공 지표

1. **테스트 안정성**: 모든 테스트가 10회 연속 성공
2. **실행 시간**: 전체 테스트 스위트 20초 이내 완료
3. **커버리지**: 코드 커버리지 70% 이상
4. **개발자 경험**: 테스트 작성 시간 30% 단축

---

*Last Updated: 2025-08-07*
*Created by: Claude Code + Gemini CLI Analysis*