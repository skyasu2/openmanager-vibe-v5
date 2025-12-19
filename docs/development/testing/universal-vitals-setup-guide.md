# 🎯 Universal Vitals 통합 테스트 가이드

**메인 테스트는 Vitals 기반으로 여러 테스트 도구 활용** - 모든 테스트 도구를 하나의 성능 메트릭 시스템으로 통합

## 🌟 개요

Universal Vitals는 Web Vitals 방법론을 모든 테스트 영역으로 확장한 종합적 성능 측정 시스템입니다.

### 🎯 핵심 철학

- **통합된 메트릭**: 모든 테스트 도구가 동일한 Vitals 시스템 사용
- **실시간 분석**: 임계값 기반 즉시 평가 및 권장사항 제공
- **자동화**: 테스트 실행과 동시에 성능 메트릭 자동 수집
- **확장성**: 8개 Vital 카테고리로 전체 시스템 커버

### 📊 지원하는 Vital 카테고리

| 카테고리                    | 설명                          | 주요 메트릭                   |
| --------------------------- | ----------------------------- | ----------------------------- |
| **🌐 web-performance**      | Web Vitals (LCP, FID, CLS 등) | LCP, FID, CLS, FCP, TTFB      |
| **🧪 test-execution**       | 테스트 실행 성능              | 테스트 시간, 성공률, 커버리지 |
| **🚀 api-performance**      | API 응답 성능                 | 응답시간, 처리량, 오류율      |
| **🏗️ build-performance**    | 빌드 시스템 성능              | 빌드 시간, 번들 크기          |
| **🗃️ database-performance** | 데이터베이스 성능             | 쿼리 시간, 연결 시간          |
| **💾 infrastructure**       | 인프라 리소스                 | 메모리, CPU, 네트워크         |
| **👤 user-experience**      | 사용자 경험                   | 상호작용 지연, 오류율         |
| **🛡️ reliability**          | 시스템 안정성                 | 가동률, MTTR, 알림 노이즈     |

## 🚀 빠른 시작

### 1. Universal Vitals 시스템 초기화

```typescript
// src/test/setup/universal-vitals.setup.ts
import { universalVitals } from '@/lib/testing/universal-vitals';

// 테스트 시작 전 초기화
universalVitals.clearMetrics();
console.log('🎯 Universal Vitals 시스템 초기화 완료');
```

### 2. 통합 테스트 실행

```bash
# 🎯 Universal Vitals 통합 테스트
npm run vitals:universal            # Vitest 기반 통합 테스트
npm run vitals:playwright-integration # Playwright E2E 테스트
npm run vitals:universal-api        # API 엔드포인트 테스트

# 🚀 전체 통합 테스트 (병렬 실행)
npm run vitals:full-integration     # 모든 테스트 도구 동시 실행

# 📊 기존 Web Vitals 테스트와 병행
npm run vitals:all                  # Web Vitals (기존)
npm run vitals:full-integration     # Universal Vitals (신규)
```

## 🧪 Vitest 통합 사용법

### 기본 설정

```typescript
// src/test/setup/vitest-vitals.setup.ts
import { setupVitestVitals } from '@/lib/testing/vitest-vitals-plugin';

setupVitestVitals({
  suiteName: 'my-test-suite',
  autoMemoryTracking: true,
  reportEndpoint: '/api/universal-vitals',
});
```

### 개별 테스트에서 사용

```typescript
import { test, expect } from 'vitest';
import { VitestVitals } from '@/lib/testing/vitest-vitals-plugin';

test('성능 측정이 포함된 테스트', () => {
  // 메모리 사용량 측정
  const beforeMemory = VitestVitals.collectMemoryUsage('test-start');

  // 실제 테스트 로직
  const result = complexCalculation();
  expect(result).toBe(42);

  // 메모리 증가량 확인
  const afterMemory = VitestVitals.collectMemoryUsage('test-end');
  expect(afterMemory - beforeMemory).toBeLessThan(10); // 10MB 미만 증가
});

test('커버리지 메트릭 수집', () => {
  // 테스트 완료 후 커버리지 데이터 수집
  VitestVitals.collectCoverage({
    lines: 95,
    functions: 88,
    branches: 92,
    statements: 94,
  });
});
```

## 🎭 Playwright 통합 사용법

### 기본 설정

```typescript
// tests/setup/playwright-vitals.setup.ts
import { setupPlaywrightVitals } from '@/lib/testing/playwright-vitals-plugin';

setupPlaywrightVitals({
  suiteName: 'e2e-test-suite',
  browserName: 'chromium',
  collectWebVitals: true,
  collectBrowserMetrics: true,
  reportEndpoint: '/api/universal-vitals',
});
```

### E2E 테스트에서 사용

```typescript
import { test, expect } from '@playwright/test';
import { PlaywrightVitals } from '@/lib/testing/playwright-vitals-plugin';

test('페이지 성능 측정', async ({ page }) => {
  // 페이지 네비게이션 성능 측정
  PlaywrightVitals.startNavigation(page, '/dashboard');
  await page.goto('/dashboard');
  const navVital = await PlaywrightVitals.endNavigation(page, '/dashboard');

  expect(navVital.value).toBeLessThan(3000); // 3초 미만 로딩

  // API 호출 성능 측정
  const apiVital = await PlaywrightVitals.measureAPICall(page, '/api/servers');
  expect(apiVital.value).toBeLessThan(1000); // 1초 미만 응답

  // 브라우저 메모리 사용량 확인
  const metrics = await PlaywrightVitals.collectBrowserMetrics(
    page,
    'dashboard-test'
  );
  expect(metrics?.usedJSHeapSize).toBeLessThan(100); // 100MB 미만
});

test('실제 Web Vitals 수집', async ({ page }) => {
  await page.goto('/');

  // Web Vitals 자동 수집 (네비게이션 완료 후)
  await PlaywrightVitals.endNavigation(page, '/');

  // 사용자 상호작용 시뮬레이션
  await page.click('#main-button');

  // 브라우저 성능 메트릭 확인
  const finalMetrics = await PlaywrightVitals.collectBrowserMetrics(
    page,
    'final-check'
  );

  expect(finalMetrics).toBeDefined();
});
```

## 🔗 API 테스트 통합

### API 성능 측정

```typescript
import {
  universalVitals,
  startAPI,
  endAPI,
} from '@/lib/testing/universal-vitals';

async function testAPIPerformance() {
  // API 호출 시작
  startAPI('user-login', { method: 'POST', endpoint: '/api/auth/login' });

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
  });

  // API 호출 완료
  const apiVital = endAPI('user-login', response.status);

  console.log(`API 성능: ${apiVital.value}ms (${apiVital.rating})`);

  // 오류율 추적
  if (!response.ok) {
    universalVitals.collectVital(
      'api-error-rate',
      'api-performance',
      1,
      'count',
      { endpoint: '/api/auth/login', statusCode: response.status }
    );
  }
}
```

### 빌드 성능 측정

```typescript
import { startBuild, endBuild } from '@/lib/testing/universal-vitals';

// 빌드 시작
startBuild('production-build');

// 빌드 실행 (시뮬레이션)
await execBuildProcess();

// 빌드 완료
const buildVital = endBuild('production-build', true);

console.log(`빌드 성능: ${(buildVital.value / 1000).toFixed(1)}초`);
```

## 📊 Universal Vitals API 사용

### API 엔드포인트

#### GET /api/universal-vitals

```bash
curl -X GET http://localhost:3000/api/universal-vitals
```

**응답 예시:**

```json
{
  "success": true,
  "service": "Universal Vitals Collection API",
  "runtime": "edge",
  "features": [
    "Multi-tool vitals collection (Vitest, Playwright, API, Build)",
    "Real-time performance analysis",
    "Automated regression detection",
    "Smart recommendations engine"
  ],
  "supportedCategories": [
    "web-performance", "test-execution", "api-performance",
    "build-performance", "database-performance", "infrastructure",
    "user-experience", "reliability"
  ],
  "thresholds": { ... }
}
```

#### POST /api/universal-vitals

```typescript
const response = await fetch('/api/universal-vitals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: 'vitest',
    sessionId: 'test-session-123',
    timestamp: Date.now(),
    metrics: [
      {
        name: 'unit-test-time',
        category: 'test-execution',
        value: 45,
        unit: 'ms',
        rating: 'good',
        timestamp: Date.now(),
        context: { testName: 'sample-test' },
      },
    ],
    metadata: {
      environment: 'test',
      branch: 'feature/vitals-integration',
    },
  }),
});
```

**응답 예시:**

```json
{
  "success": true,
  "timestamp": 1640995200000,
  "data": {
    "processed": 1,
    "analysis": {
      "overall": "good",
      "score": 95,
      "breakdown": {
        "test-execution": {
          "count": 1,
          "good": 1,
          "needsImprovement": 0,
          "poor": 0,
          "avgValue": 45
        }
      }
    },
    "recommendations": [],
    "regressions": []
  }
}
```

## 🔧 고급 설정

### 1. 커스텀 임계값 설정

```typescript
// src/lib/testing/custom-vitals-config.ts
import { UNIVERSAL_THRESHOLDS } from '@/lib/testing/universal-vitals';

// 프로젝트 특화 임계값 오버라이드
const customThresholds = {
  ...UNIVERSAL_THRESHOLDS,
  'test-execution': {
    ...UNIVERSAL_THRESHOLDS['test-execution'],
    'unit-test-time': { good: 30, poor: 100 }, // 더 엄격한 기준
    'e2e-test-time': { good: 3000, poor: 10000 },
  },
};
```

### 2. 멀티 환경 설정

```typescript
// 환경별 다른 설정
const getVitalsConfig = (env: string) => {
  switch (env) {
    case 'production':
      return {
        reportEndpoint: 'https://your-app.vercel.app/api/universal-vitals',
        collectBrowserMetrics: true,
        autoMemoryTracking: false, // 프로덕션에서는 메모리 추적 비활성화
      };
    case 'development':
      return {
        reportEndpoint: 'http://localhost:3000/api/universal-vitals',
        collectBrowserMetrics: true,
        autoMemoryTracking: true,
      };
    default:
      return {
        reportEndpoint: undefined, // Mock 응답 사용
        collectBrowserMetrics: false,
        autoMemoryTracking: false,
      };
  }
};
```

### 3. 실시간 대시보드 연동

```typescript
// 실시간 메트릭 스트리밍
import { universalVitals } from '@/lib/testing/universal-vitals';

class VitalsDashboard {
  private wsConnection: WebSocket;

  constructor(dashboardUrl: string) {
    this.wsConnection = new WebSocket(dashboardUrl);
  }

  // 실시간 메트릭 전송
  streamMetrics() {
    setInterval(() => {
      const currentMetrics = universalVitals.getAllMetrics();
      const summary = universalVitals.getSummary();

      this.wsConnection.send(
        JSON.stringify({
          type: 'vitals-update',
          metrics: currentMetrics,
          summary,
          timestamp: Date.now(),
        })
      );
    }, 5000); // 5초마다 업데이트
  }
}
```

## 📈 성능 회귀 감지

### 자동화된 회귀 감지

```typescript
// scripts/vitals-regression-check.ts
import { universalVitals } from '@/lib/testing/universal-vitals';

async function checkPerformanceRegression() {
  // 이전 성능 기준선 로드
  const baseline = await loadPerformanceBaseline();

  // 현재 성능 메트릭 수집
  await runAllTests();
  const currentMetrics = universalVitals.getAllMetrics();

  // 회귀 분석
  const regressions = detectRegressions(baseline, currentMetrics);

  if (regressions.length > 0) {
    console.error('🚨 성능 회귀 감지:');
    regressions.forEach((regression) => {
      console.error(
        `- ${regression.metric}: ${regression.regressionPercent.toFixed(1)}% 저하`
      );
    });

    process.exit(1); // CI/CD 파이프라인에서 빌드 실패
  }

  console.log('✅ 성능 회귀 없음 - 모든 메트릭 정상');
}

function detectRegressions(baseline: any[], current: any[]) {
  const regressions = [];

  current.forEach((metric) => {
    const baselineMetric = baseline.find(
      (b) => b.name === metric.name && b.category === metric.category
    );

    if (baselineMetric && metric.value > baselineMetric.value * 1.2) {
      // 20% 임계값
      regressions.push({
        metric: metric.name,
        baseline: baselineMetric.value,
        current: metric.value,
        regressionPercent:
          ((metric.value - baselineMetric.value) / baselineMetric.value) * 100,
      });
    }
  });

  return regressions;
}
```

### GitHub Actions 통합

```yaml
# .github/workflows/vitals-check.yml
name: Universal Vitals Check

on:
  pull_request:
    branches: [main]

jobs:
  vitals-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run Universal Vitals Tests
        run: npm run vitals:full-integration

      - name: Check Performance Regression
        run: npm run vitals:regression-check

      - name: Upload Vitals Report
        uses: actions/upload-artifact@v3
        with:
          name: vitals-report
          path: reports/vitals-report.json
```

## 🎯 모범 사례

### 1. 테스트 분류별 접근법

```typescript
// 🧪 Unit Tests - 빠른 피드백 중심
describe('Unit Tests with Vitals', () => {
  it('should complete within performance budget', () => {
    const vital = VitestVitals.passTest('fast-calculation');
    expect(vital.value).toBeLessThan(50); // 50ms 미만
    expect(vital.rating).toBe('good');
  });
});

// 🎭 E2E Tests - 사용자 경험 중심
describe('E2E Tests with Vitals', () => {
  test('should load page within user experience budget', async ({ page }) => {
    const navVital = await PlaywrightVitals.endNavigation(page, '/dashboard');
    expect(navVital.value).toBeLessThan(3000); // 3초 미만
  });
});

// 🔗 Integration Tests - 시스템 전체 성능
describe('Integration Tests with Vitals', () => {
  it('should handle API calls efficiently', async () => {
    const apiVital = await measureAPICall('/api/complex-query');
    expect(apiVital.value).toBeLessThan(1000); // 1초 미만
  });
});
```

### 2. 성능 예산 관리

```typescript
// 성능 예산 설정
const PERFORMANCE_BUDGETS = {
  'unit-test': { max: 100, target: 50 }, // ms
  'e2e-test': { max: 10000, target: 5000 }, // ms
  'api-call': { max: 2000, target: 500 }, // ms
  'page-load': { max: 5000, target: 2000 }, // ms
  'memory-usage': { max: 100, target: 50 }, // MB
};

// 예산 초과 검증
function validatePerformanceBudget(metric: string, value: number) {
  const budget = PERFORMANCE_BUDGETS[metric];
  if (!budget) return;

  if (value > budget.max) {
    throw new Error(`⚠️ 성능 예산 초과: ${metric} ${value} > ${budget.max}`);
  }

  if (value > budget.target) {
    console.warn(
      `⚡ 성능 개선 필요: ${metric} ${value} > ${budget.target} (목표)`
    );
  }
}
```

### 3. 점진적 도입 전략

```typescript
// Phase 1: 기존 테스트에 Vitals 추가 (사이드이펙트 없음)
test('existing test with vitals monitoring', () => {
  VitestVitals.startTest('existing-test');

  // 기존 테스트 로직 그대로 유지
  const result = existingFunction();
  expect(result).toBe(expectedValue);

  // Vitals만 추가 (테스트 성공/실패에 영향 없음)
  VitestVitals.passTest('existing-test');
});

// Phase 2: 성능 검증을 테스트에 통합
test('new test with performance validation', () => {
  const vital = VitestVitals.passTest('performance-test');

  // 기본 기능 검증
  expect(result).toBe(expectedValue);

  // 성능 검증 추가
  expect(vital.value).toBeLessThan(100);
  expect(vital.rating).toBeOneOf(['good', 'needs-improvement']);
});
```

## 🔍 트러블슈팅

### 일반적인 문제들

#### 1. "web-vitals 모듈 로드 실패"

```typescript
// 해결책: 동적 import 사용
async function loadWebVitals() {
  try {
    return await import('web-vitals');
  } catch (error) {
    console.warn('Web-vitals fallback to mock');
    return mockWebVitals; // Fallback 구현
  }
}
```

#### 2. "API 연결 타임아웃"

```typescript
// 해결책: 환경별 조건부 API 호출
if (process.env.NODE_ENV === 'test' && !process.env.VERCEL_URL) {
  // Mock 응답 사용
  return mockApiResponse;
} else {
  // 실제 API 호출
  return await fetch(apiEndpoint);
}
```

#### 3. "메모리 메트릭 수집 실패"

```typescript
// 해결책: Node.js 환경 체크
function collectMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  return 0; // 브라우저 환경에서는 0 반환
}
```

## 📋 체크리스트

### 설정 완료 체크리스트

- [ ] Universal Vitals 시스템 초기화 완료
- [ ] Vitest 플러그인 설정 완료
- [ ] Playwright 플러그인 설정 완료
- [ ] API 엔드포인트 테스트 완료
- [ ] package.json 스크립트 추가 완료
- [ ] 성능 임계값 설정 완료
- [ ] 회귀 감지 시스템 설정 완료
- [ ] CI/CD 파이프라인 통합 완료

### 운영 체크리스트

- [ ] 일일 성능 메트릭 모니터링
- [ ] 주간 성능 트렌드 분석
- [ ] 월간 성능 개선 리뷰
- [ ] 성능 회귀 알림 시스템 동작 확인
- [ ] 팀 성능 목표 대비 진척도 확인

---

## 🎉 결론

Universal Vitals 통합으로 이제 **모든 테스트 도구가 하나의 통합된 성능 메트릭 시스템**을 사용합니다:

- **🧪 Vitest**: 유닛 테스트 성능 + 메모리 사용량 + 커버리지
- **🎭 Playwright**: E2E 성능 + 실제 Web Vitals + 브라우저 메트릭
- **🔗 API Tests**: API 응답시간 + 처리량 + 오류율
- **🏗️ Build Tests**: 빌드 시간 + 번들 크기 + TypeScript 컴파일

모든 메트릭은 **실시간으로 분석**되고 **자동 권장사항**이 제공되며, **성능 회귀 감지**로 품질을 보장합니다.

**🎯 핵심 가치**: "테스트 도구별 분산된 메트릭" → "통합된 Universal Vitals 기반 성능 관리"
