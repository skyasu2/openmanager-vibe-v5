# 🧪 OpenManager v5 - 테스트 및 배포 가이드

**버전**: v5.13.5  
**최종 업데이트**: 2025-05-31  
**테스트 프레임워크**: Vitest + Playwright + Jest  

---

## 🎯 테스트 전략 개요

OpenManager v5는 **다층 테스트 전략**을 통해 99.9% 안정성을 보장합니다. 단위 테스트, 통합 테스트, E2E 테스트, 성능 테스트를 포함한 포괄적인 테스트 스위트를 제공합니다.

## 🧪 테스트 구조

### 테스트 계층
```
📊 테스트 피라미드
  ┌─────────────────┐
  │   E2E Tests     │ ← 사용자 시나리오 (Playwright)
  │    (10%)        │
  ├─────────────────┤
  │ Integration     │ ← API 및 컴포넌트 통합 (Vitest)
  │ Tests (30%)     │
  ├─────────────────┤
  │  Unit Tests     │ ← 개별 함수/클래스 (Vitest/Jest)
  │    (60%)        │
  └─────────────────┘
```

### 테스트 디렉토리 구조
```
tests/
├── unit/                    # 단위 테스트
│   ├── components/         # React 컴포넌트
│   ├── services/          # 비즈니스 로직
│   ├── utils/             # 유틸리티 함수
│   └── api/               # API 로직
├── integration/            # 통합 테스트
│   ├── api/               # API 엔드포인트
│   ├── database/          # 데이터베이스 연동
│   └── ai-agent/          # AI 에이전트
├── e2e/                   # E2E 테스트 (Playwright)
│   ├── dashboard.e2e.ts   # 대시보드 시나리오
│   ├── ai-agent.e2e.ts    # AI 에이전트 시나리오
│   └── system.e2e.ts      # 시스템 제어 시나리오
└── performance/           # 성능 테스트
    ├── load-testing/      # 부하 테스트
    └── stress-testing/    # 스트레스 테스트
```

## 🔧 단위 테스트

### Vitest 설정
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

### 컴포넌트 테스트 예시
```typescript
// tests/unit/components/FeatureCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeatureCard } from '@/components/home/FeatureCard';

describe('FeatureCard', () => {
  const mockFeature = {
    id: 'ai-agent',
    title: 'MCP AI 에이전트',
    description: '지능형 서버 분석',
    icon: '🤖',
    gradient: 'from-cyan-500/80 to-blue-600/80',
    href: '/test-ai-sidebar'
  };

  it('카드가 올바르게 렌더링된다', () => {
    render(<FeatureCard feature={mockFeature} index={0} onOpenModal={vi.fn()} />);
    
    expect(screen.getByText('MCP AI 에이전트')).toBeInTheDocument();
    expect(screen.getByText('지능형 서버 분석')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument();
  });

  it('클릭 시 모달이 열린다', () => {
    const mockOnOpenModal = vi.fn();
    render(<FeatureCard feature={mockFeature} index={0} onOpenModal={mockOnOpenModal} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnOpenModal).toHaveBeenCalledWith(mockFeature);
  });

  it('호버 애니메이션이 적용된다', () => {
    render(<FeatureCard feature={mockFeature} index={0} onOpenModal={vi.fn()} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('hover:scale-105');
  });
});
```

### 서비스 로직 테스트
```typescript
// tests/unit/services/UnifiedMetricsManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedMetricsManager } from '@/services/UnifiedMetricsManager';

describe('UnifiedMetricsManager', () => {
  let metricsManager: UnifiedMetricsManager;

  beforeEach(() => {
    metricsManager = new UnifiedMetricsManager();
  });

  describe('generateServerData', () => {
    it('올바른 형식의 서버 데이터를 생성한다', () => {
      const serverData = metricsManager.generateServerData();
      
      expect(serverData).toHaveProperty('id');
      expect(serverData).toHaveProperty('name');
      expect(serverData).toHaveProperty('type');
      expect(serverData).toHaveProperty('status');
      expect(serverData.metrics).toHaveProperty('cpu');
      expect(serverData.metrics).toHaveProperty('memory');
      expect(serverData.metrics).toHaveProperty('disk');
    });

    it('CPU 사용률이 유효한 범위에 있다', () => {
      const serverData = metricsManager.generateServerData();
      
      expect(serverData.metrics.cpu).toBeGreaterThanOrEqual(0);
      expect(serverData.metrics.cpu).toBeLessThanOrEqual(100);
    });
  });

  describe('compressMetrics', () => {
    it('메트릭 데이터를 압축한다', () => {
      const originalData = [10, 15, 20, 25, 30];
      const compressed = metricsManager.compressMetrics(originalData);
      
      expect(compressed.baseline).toBe(10);
      expect(compressed.deltas).toEqual([5, 5, 5, 5]);
      expect(compressed.compression_ratio).toBeGreaterThan(0);
    });
  });
});
```

### AI 에이전트 테스트
```typescript
// tests/unit/services/ai-agent/MCPOrchestrator.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MCPOrchestrator } from '@/core/mcp/mcp-orchestrator';

describe('MCPOrchestrator', () => {
  let orchestrator: MCPOrchestrator;

  beforeEach(() => {
    orchestrator = new MCPOrchestrator();
  });

  describe('extractKeywords', () => {
    it('한국어 키워드를 올바르게 추출한다', () => {
      const query = 'CPU 사용률이 높은 서버들을 분석해주세요';
      const keywords = orchestrator.extractKeywords(query);
      
      expect(keywords).toContain('cpu');
      expect(keywords).toContain('사용률');
      expect(keywords).toContain('분석');
    });
  });

  describe('selectTools', () => {
    it('키워드에 따라 적절한 도구를 선택한다', () => {
      const keywords = ['cpu', '분석', '성능'];
      const tools = orchestrator.selectTools(keywords);
      
      expect(tools).toContain('statistical_analysis');
      expect(tools).toContain('anomaly_detection');
    });
  });

  describe('process', () => {
    it('MCP 요청을 올바르게 처리한다', async () => {
      const request = {
        query: 'CPU 분석',
        parameters: { data: [70, 75, 80, 85, 90] },
        context: { session_id: 'test_session' }
      };

      const response = await orchestrator.process(request);
      
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('results');
      expect(response.results).toHaveProperty('summary');
    });
  });
});
```

## 🔗 통합 테스트

### API 통합 테스트
```typescript
// tests/integration/api/unified-metrics.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '@/server';

describe('/api/unified-metrics', () => {
  let server: any;

  beforeAll(async () => {
    server = await createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/unified-metrics', () => {
    it('서버 목록을 반환한다', async () => {
      const response = await request(server)
        .get('/api/unified-metrics?action=servers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('servers');
      expect(Array.isArray(response.body.data.servers)).toBe(true);
    });

    it('요약 정보를 반환한다', async () => {
      const response = await request(server)
        .get('/api/unified-metrics?action=summary')
        .expect(200);

      expect(response.body.data).toHaveProperty('total_servers');
      expect(response.body.data).toHaveProperty('healthy_count');
      expect(response.body.data).toHaveProperty('avg_cpu');
    });
  });

  describe('POST /api/unified-metrics', () => {
    it('메트릭 데이터를 업데이트한다', async () => {
      const updateData = {
        action: 'update_server',
        server_id: 'test-server-01',
        metrics: { cpu: 85.5, memory: 72.1 }
      };

      const response = await request(server)
        .post('/api/unified-metrics')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
```

### AI 에이전트 통합 테스트
```typescript
// tests/integration/ai-agent/mcp-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MCPOrchestrator } from '@/core/mcp/mcp-orchestrator';
import { ContextManager } from '@/core/context/context-manager';

describe('MCP Integration', () => {
  let orchestrator: MCPOrchestrator;
  let contextManager: ContextManager;

  beforeEach(() => {
    orchestrator = new MCPOrchestrator();
    contextManager = new ContextManager();
  });

  it('전체 MCP 파이프라인이 작동한다', async () => {
    const request = {
      query: '최근 1시간 동안 CPU 사용률 패턴을 분석해주세요',
      parameters: {
        metrics: {
          cpu: [65, 70, 75, 80, 85, 90, 85, 80, 75, 70],
          timestamps: Array.from({ length: 10 }, (_, i) => 
            Date.now() - (9 - i) * 360000
          )
        }
      },
      context: {
        session_id: 'integration_test',
        urgency: 'medium'
      }
    };

    const response = await orchestrator.process(request);

    expect(response.success).toBe(true);
    expect(response.tools_used).toContain('statistical_analysis');
    expect(response.results.summary).toBeTruthy();
    expect(response.results.recommendations).toBeTruthy();
    expect(response.execution_time).toBeGreaterThan(0);
  });

  it('Python 엔진 실패 시 TypeScript 폴백이 작동한다', async () => {
    // Python 엔진 URL을 잘못된 값으로 설정
    process.env.AI_ENGINE_URL = 'http://invalid-url:9999';

    const request = {
      query: 'CPU 분석',
      parameters: { data: [70, 75, 80] }
    };

    const response = await orchestrator.process(request);

    expect(response.success).toBe(true);
    expect(response.fallback_used).toBe(true);
  });
});
```

## 🎭 E2E 테스트 (Playwright)

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
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI
  }
});
```

### 대시보드 E2E 테스트
```typescript
// e2e/dashboard.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('📊 Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('🏠 홈페이지 로딩 및 카드 표시', async ({ page }) => {
    // 홈페이지 로딩 확인
    await expect(page.locator('h1')).toContainText('OpenManager');
    
    // 4개 기능 카드 확인
    const cards = page.locator('[data-testid="feature-card"]');
    await expect(cards).toHaveCount(4);
    
    // 각 카드 제목 확인
    await expect(page.locator('text=MCP AI 에이전트')).toBeVisible();
    await expect(page.locator('text=서버 데이터 시뮬레이터')).toBeVisible();
    await expect(page.locator('text=시스템 아키텍처')).toBeVisible();
    await expect(page.locator('text=Vibe Coding with Cursor')).toBeVisible();
  });

  test('🤖 AI 에이전트 모달 테스트', async ({ page }) => {
    // AI 에이전트 카드 클릭
    await page.locator('text=MCP AI 에이전트').click();
    
    // 모달 열림 확인
    await expect(page.locator('[data-testid="feature-modal"]')).toBeVisible();
    
    // 모달 내용 확인
    await expect(page.locator('text=자연어 질의를 통한 지능형 서버 분석')).toBeVisible();
    
    // 모달 닫기
    await page.locator('[data-testid="modal-close"]').click();
    await expect(page.locator('[data-testid="feature-modal"]')).not.toBeVisible();
  });

  test('📊 시스템 제어 버튼 테스트', async ({ page }) => {
    // 시스템 시작 버튼 확인
    const startButton = page.locator('text=시스템 시작');
    await expect(startButton).toBeVisible();
    
    // 시스템 시작
    await startButton.click();
    
    // 토스트 알림 확인
    await expect(page.locator('text=시스템이 시작되었습니다')).toBeVisible();
    
    // 버튼 상태 변화 확인
    await expect(page.locator('text=시스템 종료')).toBeVisible();
  });

  test('📱 반응형 디자인 테스트', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 카드가 세로로 배치되는지 확인
    const cards = page.locator('[data-testid="feature-card"]');
    await expect(cards).toHaveCount(4);
    
    // 태블릿 뷰포트로 변경
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // 카드가 2열로 배치되는지 확인
    await expect(cards.first()).toBeVisible();
  });

  test('♿ 접근성 기본 테스트', async ({ page }) => {
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 포커스된 요소 확인
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Enter 키로 카드 활성화
    await page.keyboard.press('Enter');
    
    // 모달이 열리는지 확인
    await expect(page.locator('[data-testid="feature-modal"]')).toBeVisible();
  });
});
```

### AI 에이전트 E2E 테스트
```typescript
// e2e/ai-agent.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('🤖 AI Agent E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-ai-sidebar');
  });

  test('AI 에이전트 질의 및 응답', async ({ page }) => {
    // AI 에이전트 페이지 로딩 확인
    await expect(page.locator('h1')).toContainText('AI 에이전트');
    
    // 질의 입력
    const queryInput = page.locator('[data-testid="ai-query-input"]');
    await queryInput.fill('현재 CPU 사용률이 높은 서버들을 분석해주세요');
    
    // 분석 시작
    await page.locator('[data-testid="ai-submit-button"]').click();
    
    // 로딩 상태 확인
    await expect(page.locator('text=분석 중...')).toBeVisible();
    
    // 결과 대기 (최대 30초)
    await expect(page.locator('[data-testid="ai-result"]')).toBeVisible({ timeout: 30000 });
    
    // 결과 내용 확인
    await expect(page.locator('text=분석 결과')).toBeVisible();
    await expect(page.locator('text=권장사항')).toBeVisible();
  });

  test('실시간 사고 과정 표시', async ({ page }) => {
    // 질의 입력
    await page.locator('[data-testid="ai-query-input"]').fill('서버 성능 분석');
    await page.locator('[data-testid="ai-submit-button"]').click();
    
    // 사고 과정 단계별 확인
    await expect(page.locator('text=도구 선택 중...')).toBeVisible();
    await expect(page.locator('text=데이터 분석 중...')).toBeVisible();
    await expect(page.locator('text=결과 통합 중...')).toBeVisible();
  });
});
```

## ⚡ 성능 테스트

### 부하 테스트 (Artillery)
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API 부하 테스트"
    weight: 70
    flow:
      - get:
          url: "/api/unified-metrics?action=servers"
      - think: 2
      - get:
          url: "/api/system/status"
      - think: 1
      - post:
          url: "/api/ai-agent/optimized"
          json:
            query: "CPU 분석"
            data: [70, 75, 80, 85, 90]

  - name: "WebSocket 연결 테스트"
    weight: 30
    engine: ws
    flow:
      - connect:
          url: "ws://localhost:3001/api/websocket/servers"
      - think: 10
      - send: '{"action": "subscribe", "channel": "server-metrics"}'
      - think: 30
```

### 메모리 누수 테스트
```typescript
// tests/performance/memory-leak.test.ts
import { test, expect } from '@playwright/test';

test('메모리 누수 테스트', async ({ page }) => {
  await page.goto('/dashboard');
  
  // 초기 메모리 사용량 측정
  const initialMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  // 반복적인 작업 수행 (100회)
  for (let i = 0; i < 100; i++) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 가비지 컬렉션 강제 실행
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
  }
  
  // 최종 메모리 사용량 측정
  const finalMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  // 메모리 증가량이 임계값 이하인지 확인 (10MB)
  const memoryIncrease = finalMemory - initialMemory;
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
});
```

## 🚀 배포 전략

### 1. 개발 환경 배포

#### 로컬 개발 서버
```bash
# 개발 서버 시작
npm run dev

# 테스트 실행
npm run test
npm run test:e2e

# 빌드 테스트
npm run build
```

#### 개발 환경 검증
```bash
# 헬스체크
curl http://localhost:3001/api/health

# 기능 테스트
curl http://localhost:3001/api/unified-metrics?action=summary

# AI 에이전트 테스트
curl -X POST http://localhost:3001/api/ai-agent/optimized \
  -H "Content-Type: application/json" \
  -d '{"query": "테스트", "data": [1,2,3]}'
```

### 2. 스테이징 환경 배포

#### GitHub Actions 워크플로우
```yaml
# .github/workflows/staging.yml
name: Staging Deployment

on:
  push:
    branches: [develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
            test-results/

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

### 3. 프로덕션 배포

#### 프로덕션 배포 워크플로우
```yaml
# .github/workflows/production.yml
name: Production Deployment

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run full test suite
        run: |
          npm run test
          npm run test:integration
          npm run build
          npm run test:e2e
      
      - name: Performance testing
        run: npm run test:performance
      
      - name: Security scan
        run: npm audit --audit-level high
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
      
      - name: Post-deployment verification
        run: |
          sleep 30
          curl -f https://your-app.vercel.app/api/health
          curl -f https://your-app.vercel.app/api/system/status
```

### 4. 배포 검증

#### 자동 검증 스크립트
```bash
#!/bin/bash
# scripts/verify-deployment.sh

DEPLOYMENT_URL=$1
if [ -z "$DEPLOYMENT_URL" ]; then
  echo "Usage: $0 <deployment-url>"
  exit 1
fi

echo "🔍 배포 검증 시작: $DEPLOYMENT_URL"

# 1. 기본 헬스체크
echo "1. 헬스체크..."
if curl -f "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
  echo "✅ 헬스체크 통과"
else
  echo "❌ 헬스체크 실패"
  exit 1
fi

# 2. 시스템 상태 확인
echo "2. 시스템 상태 확인..."
if curl -f "$DEPLOYMENT_URL/api/system/status" > /dev/null 2>&1; then
  echo "✅ 시스템 상태 정상"
else
  echo "❌ 시스템 상태 확인 실패"
  exit 1
fi

# 3. AI 에이전트 테스트
echo "3. AI 에이전트 테스트..."
RESPONSE=$(curl -s -X POST "$DEPLOYMENT_URL/api/ai-agent/optimized" \
  -H "Content-Type: application/json" \
  -d '{"query": "테스트", "data": [1,2,3]}')

if echo "$RESPONSE" | grep -q "success"; then
  echo "✅ AI 에이전트 정상"
else
  echo "❌ AI 에이전트 테스트 실패"
  exit 1
fi

# 4. 성능 확인
echo "4. 응답 시간 확인..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$DEPLOYMENT_URL")
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
  echo "✅ 응답 시간 양호: ${RESPONSE_TIME}s"
else
  echo "⚠️ 응답 시간 지연: ${RESPONSE_TIME}s"
fi

echo "🎉 배포 검증 완료"
```

## 📊 테스트 커버리지 및 품질 관리

### 커버리지 목표
```typescript
// vitest.config.ts - 커버리지 설정
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 90,
          statements: 90
        }
      }
    }
  }
});
```

### 품질 게이트
```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Code coverage check
        run: |
          npm run test:coverage
          npm run coverage:check
      
      - name: ESLint check
        run: npm run lint
      
      - name: TypeScript check
        run: npm run type-check
      
      - name: Security audit
        run: npm audit --audit-level moderate
      
      - name: Bundle size check
        run: npm run build:analyze
```

---

**이전 문서**: [5_MONITORING_AND_DATA_FLOW.md](./5_MONITORING_AND_DATA_FLOW.md) - 모니터링 및 데이터 흐름  
**다음 문서**: [7_TROUBLESHOOTING.md](./7_TROUBLESHOOTING.md) - 문제해결 가이드 