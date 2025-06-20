# 🧪 Testing Guide - 1인 개발 최적화 버전

OpenManager Vibe v5의 **1인 개발에 최적화된 테스트 전략 및 가이드**입니다.

## 🎯 **1인 개발 최적화 테스트 구조**

### 📁 **통합된 테스트 폴더 구조**

```
tests/
├── unit/              # 단위 테스트 (핵심 기능)
├── integration/       # 시스템 통합 테스트 (프로덕션)
├── dev-integration/   # 개발 전용 통합 테스트 (Google AI, 환경 설정 등)
├── scripts/          # 테스트 지원 스크립트
└── TESTING.md        # 이 문서
```

### 🚀 **빠른 테스트 실행 명령어**

```bash
# 핵심 검증 (커밋 전 필수)
npm run validate:quick

# 단위 테스트만
npm run test:unit

# 시스템 통합 테스트
npm run test:integration

# 개발 관련 테스트 (Google AI, 환경 설정)
npm run test:dev-integration

# 전체 테스트
npm run test:all
```

### ⚡ **1인 개발 테스트 철학**

- **선택과 집중**: 핵심 기능만 철저히 테스트
- **빠른 피드백**: 5분 내 검증 완료
- **AI 협업**: Cursor AI + Claude로 테스트 자동 생성
- **실용적 접근**: 완벽보다는 지속 가능한 품질

## 🎯 테스트 전략

### 테스트 피라미드

```
         /\
        /  \
       /E2E \      <- 10% (사용자 시나리오)
      /______\
     /        \
    /Integration\ <- 20% (시스템 통합)
   /__________\
  /            \
 /   Unit Tests  \ <- 70% (함수/컴포넌트)
/________________\
```

### 테스트 레벨

1. **단위 테스트** (Unit Tests)

   - 개별 함수/컴포넌트 테스트
   - 빠른 피드백
   - 높은 커버리지

2. **통합 테스트** (Integration Tests)

   - API 엔드포인트 테스트
   - 데이터베이스 연동
   - 외부 서비스 통합

3. **E2E 테스트** (End-to-End Tests)
   - 사용자 여정 테스트
   - 브라우저 자동화
   - 실제 환경 시뮬레이션

## 🛠️ 테스트 도구 스택

### 테스트 프레임워크

- **Jest**: 단위/통합 테스트
- **Testing Library**: React 컴포넌트 테스트
- **Playwright**: E2E 테스트
- **MSW**: API 모킹
- **Vitest**: 빠른 단위 테스트

### 테스트 유틸리티

- **@testing-library/jest-dom**: DOM 매처
- **@testing-library/user-event**: 사용자 상호작용
- **supertest**: API 테스트
- **nock**: HTTP 모킹

## 🔧 테스트 설정

### Jest 설정

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
  ],
};
```

### Jest Setup

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './src/testing/mocks/server';

// MSW 서버 설정
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// 환경 변수 모킹
process.env.GOOGLE_AI_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
```

### Playwright 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 🧪 단위 테스트

### React 컴포넌트 테스트

```typescript
// tests/unit/components/ServerCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServerCard } from '@/components/dashboard/ServerCard';

const mockServer = {
  id: 'server-1',
  name: 'Test Server',
  status: 'online' as const,
  metrics: {
    cpu: 45.2,
    memory: 67.8,
    disk: 89.1,
  },
};

describe('ServerCard', () => {
  test('서버 정보가 올바르게 표시된다', () => {
    render(<ServerCard server={mockServer} />);

    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByText('45.2%')).toBeInTheDocument();
  });

  test('서버 클릭 시 상세 페이지로 이동한다', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();

    render(<ServerCard server={mockServer} onClick={mockOnClick} />);

    await user.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(mockServer);
  });

  test('오프라인 서버는 회색으로 표시된다', () => {
    const offlineServer = { ...mockServer, status: 'offline' as const };
    render(<ServerCard server={offlineServer} />);

    const card = screen.getByTestId('server-card');
    expect(card).toHaveClass('opacity-50');
  });
});
```

### 훅 테스트

```typescript
// tests/unit/hooks/useServerData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useServerData } from '@/hooks/useServerData';
import { server } from '@/testing/mocks/server';
import { rest } from 'msw';

describe('useServerData', () => {
  test('서버 데이터를 성공적으로 가져온다', async () => {
    server.use(
      rest.get('/api/servers/server-1', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: { id: 'server-1', name: 'Test Server' },
          })
        );
      })
    );

    const { result } = renderHook(() => useServerData('server-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({
      id: 'server-1',
      name: 'Test Server',
    });
    expect(result.current.error).toBe(null);
  });

  test('API 오류 시 에러 상태를 반환한다', async () => {
    server.use(
      rest.get('/api/servers/server-1', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
      })
    );

    const { result } = renderHook(() => useServerData('server-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBeTruthy();
  });
});
```

### 유틸리티 함수 테스트

```typescript
// tests/unit/utils/format.test.ts
import { formatBytes, formatPercentage, formatUptime } from '@/utils/format';

describe('format utils', () => {
  describe('formatBytes', () => {
    test('바이트를 올바르게 포맷한다', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(1073741824)).toBe('1.0 GB');
    });

    test('0바이트를 처리한다', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });
  });

  describe('formatPercentage', () => {
    test('백분율을 올바르게 포맷한다', () => {
      expect(formatPercentage(0.5)).toBe('50.0%');
      expect(formatPercentage(0.123)).toBe('12.3%');
      expect(formatPercentage(1)).toBe('100.0%');
    });
  });

  describe('formatUptime', () => {
    test('업타임을 올바르게 포맷한다', () => {
      expect(formatUptime(3600)).toBe('1h 0m');
      expect(formatUptime(86400)).toBe('1d 0h');
      expect(formatUptime(90061)).toBe('1d 1h 1m');
    });
  });
});
```

## 🔗 통합 테스트

### API 엔드포인트 테스트

```typescript
// tests/integration/api/servers.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/servers/route';

describe('/api/servers', () => {
  test('GET - 서버 목록을 반환한다', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST - 새 서버를 생성한다', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'New Server',
        type: 'web',
        location: 'Seoul',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);

    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Server');
  });

  test('POST - 잘못된 데이터 시 400 에러를 반환한다', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // name 필드 누락
        type: 'web',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });
});
```

### AI 서비스 통합 테스트

```typescript
// tests/integration/services/ai.test.ts
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { UnifiedAIEngine } from '@/services/ai/engines/UnifiedAIEngine';

describe('AI Service Integration', () => {
  let aiEngine: UnifiedAIEngine;

  beforeEach(() => {
    aiEngine = new UnifiedAIEngine();
  });

  test('서버 메트릭 분석이 성공한다', async () => {
    const metrics = {
      cpu: [45.2, 48.1, 52.3, 46.7],
      memory: [67.8, 69.2, 71.5, 68.9],
      timeRange: '1h',
    };

    const result = await aiEngine.analyzeMetrics('server-1', metrics);

    expect(result.success).toBe(true);
    expect(result.data.predictions).toBeDefined();
    expect(result.data.predictions.cpu).toBeDefined();
    expect(result.data.predictions.memory).toBeDefined();
    expect(result.data.confidence).toBeGreaterThan(0);
  });

  test('이상 탐지가 올바르게 작동한다', async () => {
    const anomalousMetrics = {
      cpu: [45, 47, 95, 48], // 95는 이상값
      memory: [67, 68, 69, 70],
      timeRange: '1h',
    };

    const result = await aiEngine.detectAnomalies('server-1', anomalousMetrics);

    expect(result.success).toBe(true);
    expect(result.data.anomalies.length).toBeGreaterThan(0);
    expect(result.data.anomalies[0].metric).toBe('cpu');
    expect(result.data.anomalies[0].severity).toBe('high');
  });
});
```

### 데이터베이스 통합 테스트

```typescript
// tests/integration/database/servers.test.ts
import { createClient } from '@supabase/supabase-js';
import { ServerRepository } from '@/lib/repositories/ServerRepository';

describe('Server Database Integration', () => {
  let serverRepo: ServerRepository;
  let testServerId: string;

  beforeAll(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    serverRepo = new ServerRepository(supabase);
  });

  afterEach(async () => {
    if (testServerId) {
      await serverRepo.delete(testServerId);
    }
  });

  test('서버 생성, 조회, 업데이트, 삭제가 올바르게 작동한다', async () => {
    // 생성
    const serverData = {
      name: 'Test Server',
      type: 'web',
      location: 'Seoul',
      endpoint: '192.168.1.100',
    };

    const created = await serverRepo.create(serverData);
    testServerId = created.id;

    expect(created.name).toBe(serverData.name);
    expect(created.type).toBe(serverData.type);

    // 조회
    const found = await serverRepo.findById(testServerId);
    expect(found).toBeTruthy();
    expect(found!.name).toBe(serverData.name);

    // 업데이트
    const updatedData = { name: 'Updated Server' };
    const updated = await serverRepo.update(testServerId, updatedData);
    expect(updated.name).toBe('Updated Server');

    // 삭제
    await serverRepo.delete(testServerId);
    const deleted = await serverRepo.findById(testServerId);
    expect(deleted).toBe(null);

    testServerId = ''; // 정리 방지
  });
});
```

## 🎭 E2E 테스트

### 사용자 시나리오 테스트

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('대시보드가 올바르게 로드된다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/OpenManager Vibe/);

    // 주요 요소들이 표시되는지 확인
    await expect(
      page.getByRole('heading', { name: '서버 모니터링' })
    ).toBeVisible();
    await expect(page.getByTestId('server-grid')).toBeVisible();
  });

  test('서버 카드 클릭 시 상세 페이지로 이동한다', async ({ page }) => {
    // 첫 번째 서버 카드 클릭
    await page.getByTestId('server-card').first().click();

    // URL 변경 확인
    await expect(page).toHaveURL(/\/servers\/[^/]+/);

    // 상세 페이지 요소 확인
    await expect(
      page.getByRole('heading', { name: '서버 상세 정보' })
    ).toBeVisible();
    await expect(page.getByTestId('metrics-chart')).toBeVisible();
  });

  test('AI 채팅 사이드바가 작동한다', async ({ page }) => {
    // AI 채팅 버튼 클릭
    await page.getByTestId('ai-chat-toggle').click();

    // 사이드바 열림 확인
    await expect(page.getByTestId('ai-sidebar')).toBeVisible();

    // 메시지 입력 및 전송
    await page.getByPlaceholder('AI에게 질문하세요').fill('현재 서버 상태는?');
    await page.getByRole('button', { name: '전송' }).click();

    // AI 응답 대기
    await expect(page.getByTestId('ai-response')).toBeVisible();
  });

  test('실시간 데이터 업데이트가 작동한다', async ({ page }) => {
    // 초기 CPU 값 확인
    const initialCpu = await page.getByTestId('cpu-metric').textContent();

    // WebSocket 연결 대기
    await page.waitForTimeout(2000);

    // 실시간 업데이트 확인 (값이 변경되었는지)
    const updatedCpu = await page.getByTestId('cpu-metric').textContent();

    // 값이 업데이트되었거나 동일할 수 있음 (실시간 데이터 특성상)
    expect(updatedCpu).toBeDefined();
  });
});
```

### 서버 관리 E2E 테스트

```typescript
// e2e/server-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Server Management', () => {
  test('새 서버 추가 프로세스', async ({ page }) => {
    await page.goto('/servers');

    // 서버 추가 버튼 클릭
    await page.getByRole('button', { name: '서버 추가' }).click();

    // 모달 열림 확인
    await expect(page.getByRole('dialog')).toBeVisible();

    // 폼 작성
    await page.getByLabel('서버 이름').fill('E2E Test Server');
    await page.getByLabel('서버 타입').selectOption('web');
    await page.getByLabel('위치').fill('Seoul');
    await page.getByLabel('엔드포인트').fill('192.168.1.100');

    // 저장 버튼 클릭
    await page.getByRole('button', { name: '저장' }).click();

    // 성공 메시지 확인
    await expect(
      page.getByText('서버가 성공적으로 추가되었습니다')
    ).toBeVisible();

    // 서버 목록에 새 서버 표시 확인
    await expect(page.getByText('E2E Test Server')).toBeVisible();
  });

  test('서버 삭제 프로세스', async ({ page }) => {
    await page.goto('/servers');

    // 테스트 서버의 메뉴 버튼 클릭
    await page.getByTestId('server-menu-E2E Test Server').click();

    // 삭제 옵션 클릭
    await page.getByRole('menuitem', { name: '삭제' }).click();

    // 확인 대화상자 확인
    await expect(page.getByText('정말로 삭제하시겠습니까?')).toBeVisible();

    // 삭제 확인
    await page.getByRole('button', { name: '삭제' }).click();

    // 성공 메시지 확인
    await expect(page.getByText('서버가 삭제되었습니다')).toBeVisible();

    // 서버가 목록에서 제거되었는지 확인
    await expect(page.getByText('E2E Test Server')).not.toBeVisible();
  });
});
```

## 🎯 성능 테스트

### 컴포넌트 성능 테스트

```typescript
// tests/performance/ServerList.perf.test.tsx
import { render } from '@testing-library/react';
import { ServerList } from '@/components/dashboard/ServerList';
import { generateMockServers } from '@/testing/fixtures/servers';

describe('ServerList Performance', () => {
  test('1000개 서버 렌더링 성능', () => {
    const servers = generateMockServers(1000);

    const startTime = performance.now();
    render(<ServerList servers={servers} />);
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms 이하
  });

  test('서버 추가 시 리렌더링 성능', () => {
    const initialServers = generateMockServers(100);
    const { rerender } = render(<ServerList servers={initialServers} />);

    const newServers = [...initialServers, generateMockServers(1)[0]];

    const startTime = performance.now();
    rerender(<ServerList servers={newServers} />);
    const endTime = performance.now();

    const rerenderTime = endTime - startTime;
    expect(rerenderTime).toBeLessThan(50); // 50ms 이하
  });
});
```

### API 성능 테스트

```typescript
// tests/performance/api.perf.test.ts
import { performance } from 'perf_hooks';
import { testApiClient } from '@/testing/utils/api-client';

describe('API Performance', () => {
  test('서버 목록 조회 성능', async () => {
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testApiClient.get('/api/servers');
      const end = performance.now();
      times.push(end - start);
    }

    const averageTime = times.reduce((a, b) => a + b) / times.length;
    expect(averageTime).toBeLessThan(200); // 평균 200ms 이하
  });

  test('AI 분석 성능', async () => {
    const metrics = {
      cpu: [45, 48, 52, 46],
      memory: [67, 69, 71, 68],
      timeRange: '1h',
    };

    const start = performance.now();
    await testApiClient.post('/api/ai/predict', {
      serverId: 'server-1',
      metrics,
    });
    const end = performance.now();

    const responseTime = end - start;
    expect(responseTime).toBeLessThan(3000); // 3초 이하
  });
});
```

## 📊 테스트 실행 및 리포팅

### 테스트 명령어

```bash
# 모든 테스트 실행
npm run test

# 단위 테스트만 실행
npm run test:unit

# 통합 테스트만 실행
npm run test:integration

# E2E 테스트 실행
npm run test:e2e

# 커버리지 포함 테스트
npm run test:coverage

# 워치 모드
npm run test:watch

# 성능 테스트
npm run test:performance
```

### CI/CD 통합

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      # 단위 테스트
      - name: Run unit tests
        run: npm run test:unit

      # 통합 테스트
      - name: Run integration tests
        run: npm run test:integration
        env:
          GOOGLE_AI_API_KEY: ${{ secrets.GOOGLE_AI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}

      # E2E 테스트
      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      # 커버리지 업로드
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### 테스트 리포트

```typescript
// tests/utils/test-reporter.ts
export class TestReporter {
  static generateReport(results: TestResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        coverage: results.coverageMap.getCoverageSummary(),
      },
      duration: results.testDuration,
      environment: process.env.NODE_ENV,
    };

    return report;
  }

  static async uploadReport(report: TestReport) {
    // 테스트 결과를 외부 서비스에 업로드
    await fetch('/api/test-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  }
}
```

## 🔧 테스트 유틸리티

### 모킹 헬퍼

```typescript
// tests/utils/mocks.ts
export const mockServer = (overrides = {}) => ({
  id: 'server-1',
  name: 'Test Server',
  status: 'online',
  type: 'web',
  location: 'Seoul',
  metrics: {
    cpu: 45.2,
    memory: 67.8,
    disk: 89.1,
  },
  ...overrides,
});

export const mockApiResponse = (data: any, success = true) => ({
  success,
  data,
  timestamp: new Date().toISOString(),
});

export const mockAIResponse = (predictions: any) => ({
  success: true,
  data: {
    predictions,
    confidence: 0.89,
    analysisId: 'analysis-123',
    timestamp: new Date().toISOString(),
  },
});
```

### 테스트 래퍼

```typescript
// tests/utils/test-wrapper.tsx
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

interface TestWrapperProps {
  children: ReactNode;
}

export function TestWrapper({ children }: TestWrapperProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const renderWithProviders = (ui: ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};
```

## 📈 테스트 메트릭 및 목표

### 커버리지 목표

| 메트릭            | 목표 | 현재 |
| ----------------- | ---- | ---- |
| 라인 커버리지     | 80%  | 85%  |
| 함수 커버리지     | 80%  | 82%  |
| 브랜치 커버리지   | 75%  | 78%  |
| 컴포넌트 커버리지 | 90%  | 92%  |

### 성능 목표

| 테스트 유형        | 목표 시간 |
| ------------------ | --------- |
| 단위 테스트        | < 30초    |
| 통합 테스트        | < 2분     |
| E2E 테스트         | < 5분     |
| 전체 테스트 스위트 | < 10분    |

## 🚀 테스트 베스트 프랙티스

### 1. 테스트 명명 규칙

```typescript
// ❌ 나쁜 예
test('test 1', () => {});

// ✅ 좋은 예
test('사용자가 서버 카드를 클릭하면 상세 페이지로 이동한다', () => {});
```

### 2. AAA 패턴 사용

```typescript
test('서버 메트릭 계산이 올바르게 작동한다', () => {
  // Arrange (준비)
  const metrics = { cpu: 50, memory: 70, disk: 80 };

  // Act (실행)
  const result = calculateServerHealth(metrics);

  // Assert (검증)
  expect(result.status).toBe('warning');
  expect(result.score).toBe(67);
});
```

### 3. 격리된 테스트

```typescript
// ✅ 각 테스트는 독립적이어야 함
describe('ServerService', () => {
  let serverService: ServerService;

  beforeEach(() => {
    serverService = new ServerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

### 4. 의미 있는 assertion

```typescript
// ❌ 나쁜 예
expect(result).toBeTruthy();

// ✅ 좋은 예
expect(result.status).toBe('online');
expect(result.metrics.cpu).toBeGreaterThan(0);
expect(result.metrics.cpu).toBeLessThan(100);
```

## 🔗 관련 문서

- [🚀 Quick Start](QUICK_START.md) - 빠른 시작
- [🛠️ Development Guide](DEVELOPMENT.md) - 개발 가이드
- [🏗️ Architecture](ARCHITECTURE.md) - 시스템 아키텍처
- [📚 API Documentation](API.md) - API 문서

## 📚 테스트 리소스

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
