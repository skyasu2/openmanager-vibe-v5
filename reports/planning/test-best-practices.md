# 테스트 베스트 프랙티스 분석

**작성일**: 2026-01-10
**환경**: WSL + Windows FS, Next.js 16.1.1, React 19, Vitest 4.0.16

---

## 1. 현재 환경 분석

### 1.1 환경 특성

| 항목 | 현재 상태 | 영향 |
|-----|----------|------|
| **OS** | WSL + Windows 파일시스템 | I/O 지연, 테스트 속도 저하 |
| **Next.js** | 16.1.1 (App Router) | 서버 컴포넌트 테스트 제한 |
| **React** | 19.2.3 | jsdom 호환성 이슈 |
| **Vitest** | 4.0.16 | 최신, coverage.all deprecated |
| **Test Runner** | Vitest (threads pool) | 병렬 실행 지원 |

### 1.2 주요 제약사항

```
WSL + Windows FS 성능 이슈:
├── 파일 감시(watch) 느림
├── 테스트 격리(isolation) 오버헤드
└── 대용량 테스트 실행 시 메모리 문제
```

---

## 2. Vitest 베스트 프랙티스 (2026)

### 2.1 설정 최적화

**권장 설정** (Next.js + React 19):

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // 환경 설정
    environment: 'jsdom',  // React 컴포넌트용
    globals: true,          // describe, it, expect 전역 사용

    // 성능 최적화 (WSL 환경)
    pool: 'vmThreads',      // threads 대신 vmThreads 사용 (4배 빠름)
    isolate: false,         // 격리 비활성화 (속도 우선)

    // 타임아웃
    testTimeout: 10000,
    hookTimeout: 10000,

    // Mock 자동 정리
    clearMocks: true,
    restoreMocks: true,

    // 커버리지
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.d.ts'],
    },
  },
});
```

### 2.2 테스트 분리 전략

**3-Tier 테스트 구조**:

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Unit Tests (순수 함수)                          │
│  - 환경: node                                           │
│  - 속도: ~2-3초                                         │
│  - 실행: npm run test:quick                             │
│  - 예: type-guards, validators, formatters              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Tier 2: Component Tests (React 컴포넌트)                │
│  - 환경: jsdom                                          │
│  - 속도: ~30-60초                                       │
│  - 실행: npm test (로컬 선택적)                          │
│  - 예: UI 컴포넌트, 훅                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Tier 3: E2E Tests (통합/브라우저)                       │
│  - 환경: Playwright                                     │
│  - 속도: ~2-5분                                         │
│  - 실행: CI/CD 또는 Vercel                              │
│  - 예: 사용자 플로우, API 통합                           │
└─────────────────────────────────────────────────────────┘
```

### 2.3 WSL 환경 최적화

```typescript
// vitest.config.minimal.ts (WSL 최적화)
export default defineConfig({
  test: {
    environment: 'node',     // DOM 불필요 시 node 사용
    pool: 'vmThreads',       // 가장 빠른 pool
    isolate: false,          // 격리 비활성화
    watch: false,            // watch 모드 비활성화 (CI용)
    reporters: ['default'],  // 간단한 리포터만
    retry: 1,                // 실패 시 1회 재시도
  },
});
```

---

## 3. 테스트 작성 베스트 프랙티스

### 3.1 AAA 패턴 (Arrange-Act-Assert)

```typescript
test('When adding valid order, Then returns 200', async () => {
  // Arrange - 테스트 데이터 준비
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };

  // Act - 테스트 대상 실행
  const response = await api.post('/order', orderToAdd);

  // Assert - 결과 검증
  expect(response.status).toBe(200);
  expect(response.data).toMatchObject({
    userId: 1,
    productId: 2,
  });
});
```

### 3.2 Mock 관리 (Vitest 방식)

```typescript
import { vi, beforeEach, afterAll } from 'vitest';

// ✅ 좋은 예: 테스트 파일 내에서 Mock 정의
beforeEach(() => {
  vi.restoreAllMocks();
  // 공통 Mock 설정
  vi.spyOn(emailService, 'send').mockResolvedValue({ succeeded: true });
});

afterAll(() => {
  vi.restoreAllMocks();
});

test('Premium user gets 10% discount', async () => {
  // 테스트 특화 Mock은 테스트 내부에 정의
  vi.spyOn(usersService, 'getUser').mockResolvedValue({
    id: 1,
    status: 'premium'
  });
  // ...
});
```

### 3.3 고유 데이터로 충돌 방지

```typescript
import { randomUUID } from 'crypto';

// ✅ 좋은 예: 고유 식별자 사용
test('Create order with unique ID', async () => {
  const order = {
    externalId: `order-${randomUUID().slice(0, 8)}`,
    // ...
  };
});

// ❌ 나쁜 예: 하드코딩된 값
test('Create order', async () => {
  const order = {
    externalId: 'order-123',  // 다른 테스트와 충돌 가능
  };
});
```

### 3.4 순수 함수 테스트 우선

```typescript
// ✅ 우선순위 높음: 순수 함수 (외부 의존성 없음)
// src/utils/formatters.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}

// 테스트 (빠르고 안정적)
test('formatCurrency formats Korean Won', () => {
  expect(formatCurrency(1000)).toBe('₩1,000');
  expect(formatCurrency(0)).toBe('₩0');
});
```

---

## 4. Next.js 16 + React 19 특화 패턴

### 4.1 서버 컴포넌트 테스트 제한

```typescript
// ⚠️ 서버 컴포넌트는 직접 테스트하기 어려움
// 대안: 로직을 순수 함수로 분리

// ❌ 테스트하기 어려움
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await fetchData();
  return <Dashboard data={data} />;
}

// ✅ 로직 분리 후 테스트
// lib/dashboard-utils.ts
export function transformDashboardData(raw: RawData): DashboardData {
  // 순수 함수로 분리
}

// 테스트
test('transformDashboardData handles empty data', () => {
  expect(transformDashboardData([])).toEqual({ items: [] });
});
```

### 4.2 클라이언트 컴포넌트 테스트

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServerCard } from '@/components/dashboard/ServerCard';

test('ServerCard shows warning on high CPU', async () => {
  render(<ServerCard server={{ cpu: 95, status: 'warning' }} />);

  expect(screen.getByText(/warning/i)).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveClass('warning');
});
```

### 4.3 커스텀 훅 테스트

```typescript
import { renderHook, act } from '@testing-library/react';
import { useServerStatus } from '@/hooks/useServerStatus';

test('useServerStatus updates on interval', async () => {
  vi.useFakeTimers();

  const { result } = renderHook(() => useServerStatus('server-1'));

  expect(result.current.loading).toBe(true);

  await act(async () => {
    vi.advanceTimersByTime(5000);
  });

  expect(result.current.loading).toBe(false);
  expect(result.current.data).toBeDefined();

  vi.useRealTimers();
});
```

---

## 5. 현재 프로젝트 적용 권장사항

### 5.1 즉시 적용 가능

| 항목 | 현재 | 권장 | 효과 |
|-----|------|------|------|
| **pool** | threads | vmThreads | 4배 속도 향상 |
| **isolate** | true | false (minimal) | 오버헤드 감소 |
| **environment** | jsdom (전체) | node (unit) | 테스트 분리 |

### 5.2 설정 파일 개선

```
config/testing/
├── vitest.config.minimal.ts  # Tier 1: 순수 함수 (node)
├── vitest.config.main.ts     # Tier 2: 컴포넌트 (jsdom)
└── vitest.config.ci.ts       # CI 전용 (전체 실행)
```

### 5.3 테스트 우선순위

```
높음 (즉시 추가):
├── AI 유틸리티 순수 함수
│   ├── context-compressor.ts
│   ├── query-complexity.ts
│   └── message-normalizer.ts (일부)
├── 서버 데이터 변환
│   └── UnifiedServerDataSource.ts (순수 함수 부분)
└── 보안 유틸리티
    └── security.ts (quickSanitize)

중간 (단기):
├── API 라우트 핸들러
└── 캐시 유틸리티

낮음 (CI 전용):
├── 컴포넌트 테스트 (jsdom 의존)
└── 통합 테스트 (서버 필요)
```

---

## 6. 요약

### 핵심 원칙

1. **테스트 분리**: Unit → Component → E2E 3계층
2. **순수 함수 우선**: 외부 의존성 없는 함수부터 테스트
3. **WSL 최적화**: vmThreads + isolate:false + node 환경
4. **Mock 최소화**: 테스트 내부에서 정의, 자동 정리
5. **CI 분리**: 무거운 테스트는 CI에서만 실행

### 다음 단계

1. `vitest.config.minimal.ts` 최적화 적용
2. AI 유틸리티 순수 함수 테스트 추가
3. 테스트 분류 및 커버리지 목표 설정
