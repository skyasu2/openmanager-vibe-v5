# 🧪 Testing Guide - OpenManager Vibe v5.44.0 (현행화)

OpenManager Vibe v5의 **AI 엔진 아키텍처 v3.0 완전 구현** 이후 테스트 전략 및 가이드입니다.

## 🎯 **AI 엔진 아키텍처 v3.0 테스트 구조**

### 📁 **최신화된 테스트 폴더 구조**

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
# 빠른 타입 체크 및 린트 실행 (커밋 전 권장)
npm run validate:quick

# 단위 테스트만
npm run test:unit

# 시스템 통합 테스트
npm run test:integration

# 개발 관련 통합 테스트 (Google AI, 환경 설정 등)
npm run test:dev-integration

# 전체 단위/E2E 테스트 실행
npm run test:all

# 커버리지 포함 단위 테스트 실행
npm run test:coverage

# 전체 검증 (커밋 전, 빌드 포함)
npm run validate:all
```

### ⚡ **AI 엔진 아키텍처 v3.0 테스트 철학**

- **3개 운영 모드 완전 지원**: AUTO, LOCAL, GOOGLE_ONLY
- **Supabase RAG 메인 엔진**: 자연어 처리 및 로컬 AI 엔진의 핵심
- **Google AI 모드별 가중치**: 2-80% 동적 조정
- **MCP 표준 서버**: AI 기능 제거, 표준 MCP 도구만 제공
- **하위 AI 도구들**: 모든 모드에서 편리하게 사용 가능

## 🎯 AI 엔진 아키텍처 v3.0 테스트 전략

### 🤖 **3개 운영 모드 테스트**

1. **AUTO 모드** (균형 모드)
   - Supabase RAG (50%) → MCP+하위AI (30%) → 하위AI (18%) → Google AI (2%)
   - 성능: 850ms (다층 폴백)
   - 테스트 포커스: 폴백 시스템, 균형 잡힌 응답

2. **LOCAL 모드** (로컬 우선)
   - Supabase RAG (80%) → MCP+하위AI (20%) → Google AI 제외
   - 성능: 620ms (Google AI 제외)
   - 테스트 포커스: 로컬 AI 엔진, 빠른 응답

3. **GOOGLE_ONLY 모드** (고급 추론)
   - Google AI (80%) → Supabase RAG (15%) → 하위AI (5%)
   - 성능: 1200ms (고급 추론)
   - 테스트 포커스: Google AI 통합, 고급 분석

### 📊 **테스트 커버리지 목표 (v5.44.0 기준)**

```
         /\
        /  \
       /E2E \      <- 10% (사용자 시나리오)
      /______\
     /        \
    /Integration\ <- 20% (AI 엔진 통합)
   /__________\
  /            \
 /   Unit Tests  \ <- 70% (AI 엔진/컴포넌트)
/________________\
```

### 🧪 **현재 테스트 현황 (YYYY.MM.DD 기준 - 실제 실행 후 업데이트 필요)**

- **총 테스트 파일**: (실행 후 업데이트)
- **총 테스트**: (실행 후 업데이트)
- **실행 시간**: (실행 후 업데이트)
- **AI 엔진 테스트**: (실행 후 업데이트)
- **한국어 형태소 분석**: (실행 후 업데이트)
- **주요 성과**:
  - AUTO 모드에서 Google AI 제외 확인
  - MONITORING 모드 완전 제거 검증
  - Sharp 모듈 폴백 정상 작동 (vitest.config.ts에서 `SHARP_DISABLED: 'true'` 확인 필요)
  - Redis 목업 모드 안정적 동작

## 🛠️ AI 엔진 테스트 도구 스택

### 테스트 프레임워크

- **Vitest**: 메인 테스트 프레임워크 (Jest 대체)
- **Testing Library**: React 컴포넌트 테스트
- **Playwright**: E2E 테스트
- **MSW**: API 모킹
- **Supertest**: API 테스트

### AI 엔진 테스트 유틸리티

- **UnifiedAIEngineRouter**: 통합 AI 엔진 라우터 테스트
- **SupabaseRAGEngine**: RAG 엔진 테스트
- **KoreanNLPEngine**: 한국어 처리 테스트
- **GoogleAIService**: Google AI 통합 테스트 (dev-integration)

## 🔧 최신화된 테스트 설정

### Vitest 설정 (v5.44.0 기준, vitest.config.ts 참조)

```typescript
// vitest.config.ts (요약)
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],

    // 현재 아키텍처에 맞는 테스트만 실행
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/ai-router.test.ts',
      'tests/integration/korean-nlp.test.ts',
      'tests/integration/supabase-rag.test.ts',
      'tests/integration/env-backup.test.ts',
      // 'tests/e2e/**/*.test.ts' // E2E는 Playwright로 실행, Vitest 설정에서는 제외하는 것을 검토.
                                // 현재 vitest.config.ts에는 포함되어 있음.
    ],

    // 레거시 테스트 및 불필요한 파일 완전 제외
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // 레거시 AI 엔진 테스트 제외
      'tests/**/*legacy*.test.ts',
      'tests/**/*deprecated*.test.ts',
      'tests/**/*sharp*.test.ts',
      'tests/**/*old*.test.ts',
      'tests/**/*unified-ai-engine-v1*.test.ts',
      'tests/**/*optimized-engine*.test.ts',
      // 스토리북 관련 제외
      '**/*.stories.ts',
      '**/*.stories.tsx',
      '**/storybook-static/**',
      '**/.storybook/**',
    ],

    // AI 엔진 테스트 환경
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      AI_ENGINE_MODE: 'test',
      SUPABASE_RAG_ENABLED: 'true',
      GOOGLE_AI_ENABLED: 'false', // 테스트에서는 비활성화
      KOREAN_NLP_ENABLED: 'true',
      SHARP_DISABLED: 'true',     // Sharp 모듈 비활성화
      TEST_ISOLATION: 'true',   // 테스트 격리 환경
    },
  },
});
```

### Playwright 설정 (playwright.config.ts 참조)
E2E 테스트는 Playwright를 사용하며, `playwright.config.ts` 파일에 상세 설정이 정의되어 있습니다.
- **테스트 디렉토리**: `./tests/e2e`
- **리포터**: HTML, JSON, JUnit 등 다수 설정
- **타임아웃**: 전역 60초, expect 15초, 액션 45초, 네비게이션 60초
- **CI 최적화**: 재시도 횟수 증가, 워커 수 제한, 순차 실행 등
- **웹 서버**: `npm run dev` (포트 3002) 사용, 타임아웃 3분

### 테스트 환경 설정

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';

// AI 엔진 모킹
beforeAll(() => {
  // UnifiedAIEngineRouter 모킹
  vi.mock('@/core/ai/engines/UnifiedAIEngineRouter');

  // Supabase RAG 엔진 모킹
  vi.mock('@/core/ai/engines/SupabaseRAGEngine');

  // Google AI 서비스 모킹 (테스트에서 실제 호출 방지)
  vi.mock('@/services/ai/GoogleAIService');
});
```

## 🧪 AI 엔진별 단위 테스트

### 1. UnifiedAIEngineRouter 테스트

```typescript
// tests/unit/ai/unified-ai-engine-router.test.ts
describe('UnifiedAIEngineRouter', () => {
  test('AUTO 모드에서 다층 폴백 시스템 동작', async () => {
    const router = new UnifiedAIEngineRouter('AUTO');
    const result = await router.processQuery('서버 상태 확인');

    expect(result.mode).toBe('AUTO');
    expect(result.responseTime).toBeLessThan(1000);
    expect(result.fallbackChain).toBeDefined();
  });

  test('LOCAL 모드에서 Google AI 제외', async () => {
    const router = new UnifiedAIEngineRouter('LOCAL');
    const result = await router.processQuery('성능 분석');

    expect(result.mode).toBe('LOCAL');
    expect(result.responseTime).toBeLessThan(700);
    expect(result.usedEngines).not.toContain('GoogleAI');
  });

  test('GOOGLE_ONLY 모드에서 고급 추론', async () => {
    const router = new UnifiedAIEngineRouter('GOOGLE_ONLY');
    const result = await router.processQuery('복잡한 장애 분석');

    expect(result.mode).toBe('GOOGLE_ONLY');
    expect(result.primaryEngine).toBe('GoogleAI');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

### 2. Supabase RAG Engine 테스트

```typescript
// tests/unit/ai/supabase-rag-engine.test.ts
describe('SupabaseRAGEngine', () => {
  test('벡터 검색 기능 동작', async () => {
    const ragEngine = new SupabaseRAGEngine();
    const result = await ragEngine.search('서버 모니터링');

    expect(result.documents).toBeDefined();
    expect(result.similarity).toBeGreaterThan(0.7);
    expect(result.responseTime).toBeLessThan(500);
  });

  test('한국어 쿼리 처리', async () => {
    const ragEngine = new SupabaseRAGEngine();
    const result = await ragEngine.processKoreanQuery('CPU 사용률 확인');

    expect(result.language).toBe('ko');
    expect(result.processed).toBe(true);
    expect(result.tokens).toBeDefined();
  });
});
```

### 3. 한국어 형태소 분석기 테스트

```typescript
// tests/unit/ai/korean-nlp-engine.test.ts
describe('KoreanNLPEngine', () => {
  test('22개 한국어 형태소 분석 테스트 통과', async () => {
    const nlpEngine = new KoreanNLPEngine();
    const testCases = [
      '서버가 다운되었습니다',
      'CPU 사용률이 높습니다',
      '메모리 부족 현상이 발생했습니다',
      // ... 22개 테스트 케이스
    ];

    for (const testCase of testCases) {
      const result = await nlpEngine.analyze(testCase);
      expect(result.morphemes).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.8);
    }
  });
});
```

## 🔗 통합 테스트

### AI 엔진 통합 테스트

```typescript
// tests/integration/ai-engine-integration.test.ts
describe('AI Engine Integration', () => {
  test('3개 모드 간 전환 테스트', async () => {
    const modes = ['AUTO', 'LOCAL', 'GOOGLE_ONLY'];

    for (const mode of modes) {
      const response = await fetch('/api/ai/unified-query', {
        method: 'POST',
        body: JSON.stringify({
          query: '서버 상태 확인',
          mode: mode,
        }),
      });

      const data = await response.json();
      expect(data.mode).toBe(mode);
      expect(data.success).toBe(true);
    }
  });

  test('폴백 시스템 동작 확인', async () => {
    // 메인 엔진 실패 시뮬레이션
    const response = await fetch('/api/ai/unified-query', {
      method: 'POST',
      body: JSON.stringify({
        query: '복잡한 분석 요청',
        simulateFailure: true,
      }),
    });

    const data = await response.json();
    expect(data.fallbackUsed).toBe(true);
    expect(data.success).toBe(true);
  });
});
```

## 📊 테스트 커버리지 리포트

### 현재 커버리지 (v5.44.0 기준 - 실제 실행 후 업데이트 필요)

- **전체 커버리지**: (실행 후 업데이트, 목표: 90% 이상)
- **AI 엔진 커버리지**: (실행 후 업데이트, 목표: 95%)
- **API 엔드포인트**: (실행 후 업데이트, 목표: 88%)
- **React 컴포넌트**: (실행 후 업데이트, 목표: 85%)

### 커버리지 생성 명령어

```bash
# 전체 커버리지 리포트
npm run test:coverage

# AI 엔진만 커버리지
npm run test:unit -- --coverage src/core/ai/

# HTML 리포트 생성
npm run test:coverage -- --reporter=html
```

## 🚀 성능 테스트

### AI 엔진 성능 벤치마크

```typescript
// tests/performance/ai-engine-benchmark.test.ts
describe('AI Engine Performance', () => {
  test('AUTO 모드 성능: 850ms 이내', async () => {
    const startTime = Date.now();
    await processQuery('서버 분석', 'AUTO');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(850);
  });

  test('LOCAL 모드 성능: 620ms 이내', async () => {
    const startTime = Date.now();
    await processQuery('서버 분석', 'LOCAL');
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(620);
  });
});
```

## 🛡️ 테스트 모범 사례

### 1. AI 엔진 테스트 작성 가이드

```typescript
// ✅ 좋은 예시
test('Supabase RAG 엔진이 한국어 쿼리를 정확히 처리한다', async () => {
  const query = 'CPU 사용률 확인해줘';
  const result = await ragEngine.processQuery(query);

  expect(result.language).toBe('ko');
  expect(result.confidence).toBeGreaterThan(0.8);
  expect(result.responseTime).toBeLessThan(500);
});

// ❌ 나쁜 예시
test('테스트', async () => {
  const result = await someFunction();
  expect(result).toBeTruthy();
});
```

### 2. 모킹 전략

```typescript
// AI 엔진 모킹
vi.mock('@/core/ai/engines/UnifiedAIEngineRouter', () => ({
  UnifiedAIEngineRouter: vi.fn(() => ({
    processQuery: vi.fn(() =>
      Promise.resolve({
        success: true,
        mode: 'AUTO',
        responseTime: 500,
      })
    ),
  })),
}));
```

### 3. 테스트 격리

```typescript
beforeEach(() => {
  // 각 테스트 전 상태 초기화
  vi.clearAllMocks();
  vi.resetModules();
});
```

## 📈 지속적 개선

### 테스트 메트릭 모니터링

- **테스트 실행 시간**: (실행 후 업데이트, 목표: 60초 이내)
- **테스트 성공률**: (실행 후 업데이트, 목표: 99% 이상)
- **커버리지 트렌드**: 지속적 90% 이상 유지

### 자동화된 테스트 파이프라인

```bash
# 커밋 전 빠른 검증
npm run validate:quick

# 커밋 전 전체 검증 (빌드 포함)
npm run validate:all

# CI/CD 파이프라인 (예시)
npm run test:all && npm run build
```

## 🎯 다음 단계

### 테스트 개선 로드맵

1. **E2E 테스트 확장**: AI 엔진 사용자 시나리오 추가
2. **성능 테스트 자동화**: CI 연동 및 지속적 성능 모니터링
3. **시각적 회귀 테스트 도입 검토**: UI 컴포넌트 변경 감지
4. **부하 테스트 환경 구축 및 실행**: 다중 AI 엔진 동시 요청 처리 능력 검증

---

**마지막 업데이트**: YYYY.MM.DD (현행화 작업일) - AI 엔진 아키텍처 v3.0 완전 구현 반영 및 `vitest.config.ts`, `playwright.config.ts` 내용 반영.
