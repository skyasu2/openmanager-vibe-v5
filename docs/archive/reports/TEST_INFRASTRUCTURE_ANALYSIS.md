# 테스트 인프라 분석 리포트

> **분석일**: 2025-12-19 (v2 - Co-location 반영)
> **프로젝트**: OpenManager VIBE v5.83.4
> **분석 범위**: 테스트 도구, 설정, 구조 전반

---

## 📊 Executive Summary

| 항목 | 수치 |
|------|------|
| 총 테스트 파일 | 65개 |
| src/ Co-located 테스트 | 35개 (54%) |
| tests/ 폴더 테스트 | 30개 (46%) |
| 테스트 프레임워크 | 2종 (Vitest + Playwright) |
| Vitest 설정 | 3종 (main/minimal/simple) |
| Playwright 설정 | 2종 (local/vercel) |
| CI 최고속 테스트 | 2.2s (92 tests, 6 files) |

### ✅ 최근 변경 (2025-12-19)
- **Co-location 패턴 완료**: 모든 Unit 테스트가 `src/` 내 소스코드 옆에 위치
- **tests/unit/ 폴더 삭제**: 빈 폴더 정리 완료
- **`__tests__/` 폴더 인라인화**: 4개 폴더 내 5개 파일을 인라인으로 이동
- **Import 경로 수정**: 7개 파일의 상대 경로 정규화

---

## 1. 테스트 프레임워크 현황

### 1.1 핵심 프레임워크

| 프레임워크 | 버전 | 역할 | 비고 |
|-----------|------|------|------|
| **vitest** | ^4.0.15 | 단위/통합 테스트 | Vite 기반 고속 러너 |
| **@vitest/coverage-v8** | ^4.0.15 | 커버리지 측정 | V8 엔진 기반 |
| **@vitest/ui** | ^4.0.15 | 테스트 UI | 대시보드 제공 |
| **@playwright/test** | ^1.57.0 | E2E 테스트 | 크로스브라우저 (현재 Chromium만) |

### 1.2 테스트 유틸리티

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| **@testing-library/react** | ^16.3.0 | React 컴포넌트 렌더링 |
| **@testing-library/dom** | ^10.4.0 | DOM 쿼리/상호작용 |
| **@testing-library/jest-dom** | ^6.8.0 | Jest 스타일 matchers |
| **@testing-library/user-event** | ^14.6.1 | 사용자 이벤트 시뮬레이션 |
| **msw** | ^2.12.3 | API 모킹 (Mock Service Worker) |
| **@faker-js/faker** | ^10.1.0 | 더미 데이터 생성 |
| **supertest** | ^7.1.4 | HTTP 서버 테스트 |
| **jest-axe** | ^10.0.0 | 접근성 자동 검사 |
| **pixelmatch** | ^7.1.0 | 시각적 회귀 테스트 |

---

## 2. 설정 파일 상세 분석

### 2.1 Vitest 설정 비교표

| 항목 | main.ts | minimal.ts | simple.ts |
|------|---------|-----------|-----------|
| **경로** | config/testing/ | config/testing/ | config/testing/ |
| **환경** | jsdom | node | node |
| **Pool** | threads (2-4) | vmThreads | vmThreads |
| **격리** | isolate: true | isolate: false | isolate: false |
| **타임아웃** | 30초 | 5초 | 5초 |
| **재시도** | 없음 | retry: 1 | 없음 |
| **커버리지** | 80%+ | 비활성화 | 70%+ |
| **속도** | 느림 (완전) | 최고속 (22ms) | 중간 |
| **용도** | 로컬 개발 | CI/CD | 커버리지 |

### 2.2 Playwright 설정 비교표

| 항목 | playwright.config.ts | playwright.config.vercel.ts |
|------|---------------------|---------------------------|
| **Base URL** | http://localhost:3000 | https://openmanager-vibe-v5.vercel.app |
| **웹서버** | dev 서버 자동 실행 | 없음 (외부 URL) |
| **Workers** | 4-6 | 4 (CI) / 6 (로컬) |
| **브라우저** | Chromium only | Chromium only |
| **타임아웃** | 120초 | 120초 |
| **용도** | 로컬 E2E | 프로덕션 E2E |

### 2.3 MSW 설정

```typescript
// config/testing/msw-setup.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 3. 테스트 분류 및 분포

### 3.1 전체 분포도 (Co-location 반영)

```
src/ Co-located (35 files, 54%)
├── components/**/*.test.tsx   14개  ████████████████████ 40%
├── hooks/**/*.test.ts          5개  ██████ 14%
├── lib/**/*.test.ts            8개  █████████ 23%
├── utils/**/*.test.ts          6개  ███████ 17%
└── services/**/*.test.ts       2개  ██ 6%

tests/ (30 files, 46%)
├── integration/    10개  █████████████ 33%
├── e2e/             8개  ██████████ 27%
├── api/             3개  ███ 10%
├── performance/     3개  ███ 10%
├── ai-sidebar/      3개  ███ 10%
├── types/           2개  ██ 7%
└── manual/          1개  █ 3%
```

> **Note**: `tests/unit/` 폴더는 삭제됨 (Co-location으로 이전)

### 3.2 Unit Tests 상세 (30개)

| 카테고리 | 파일 수 | 예시 |
|---------|--------|------|
| Components | 10 | AIAssistantButton, ServerCard |
| Hooks | 4 | useAIChatSync, useServerDashboard |
| Config | 3 | config, env, serverConfig |
| Services | 1 | IntelligentMonitoringService |
| Utilities | 9 | time, safe-format, type-guards |
| Cache | 1 | cache-helper |
| Validators | 1 | paginationQuerySchema |
| Other | 1 | environment-security |

### 3.3 Integration Tests (10개)

| 파일 | 목적 |
|------|------|
| ServerDashboard.test.tsx | 대시보드 통합 |
| ai-unified-mode.test.ts | AI 통합 모드 |
| external-services-connection.test.ts | 외부 서비스 연결 |
| universal-vitals-integration.test.ts | Web Vitals |
| security/csp-policy.test.ts | CSP 정책 |
| security/env-encryption.test.ts | 환경 암호화 |
| security/enhanced-security.test.ts | 보안 강화 |

### 3.4 E2E Tests (8개 - Playwright)

| 파일 | 태그 | 우선순위 |
|------|------|---------|
| smoke.spec.ts | - | Critical |
| guest.spec.ts | - | Critical |
| accessibility.spec.ts | - | Critical |
| error-boundary.spec.ts | - | High |
| dashboard-ai-sidebar.spec.ts | @ai-test | Medium |
| dashboard-server-cards.spec.ts | - | Medium |
| system-boot.spec.ts | - | High |
| middleware-critical-bugfix.spec.ts | - | High |

---

## 4. npm 스크립트 맵

### 4.1 Vitest 스크립트

| 스크립트 | 설정 | 용도 | 실행 시간 |
|---------|------|------|----------|
| `test` | main.ts | 전체 테스트 | ~5분 |
| `test:quick` | minimal.ts | CI 초고속 | 22ms |
| `test:coverage` | simple.ts | 커버리지 | ~2분 |
| `test:watch` | simple.ts | Watch 모드 | 지속 |
| `test:ci:fast` | minimal.ts | CI 최적화 | 22ms |

### 4.2 Playwright 스크립트

| 스크립트 | 설정 | 필터 | 실행 시간 |
|---------|------|------|----------|
| `test:e2e` | local | 전체 | ~3분 |
| `test:e2e:critical` | local | smoke/guest/accessibility | ~1분 |
| `test:e2e:ai-only` | local | @ai-test | ~1분 |
| `test:e2e:no-ai` | local | @ai-test 제외 | ~2분 |
| `test:vercel:e2e` | vercel | 전체 | ~3분 |

### 4.3 Web Vitals 스크립트

| 스크립트 | 타입 | 용도 |
|---------|------|------|
| `vitals:integration` | Vitest | 통합 테스트 |
| `vitals:e2e` | Playwright | 실제 측정 |
| `vitals:mock` | Vitest | Mock 기반 |
| `vitals:full-integration` | 조합 | 완전 검증 |

---

## 5. 테스트 실행 전략

### 5.1 개발 단계

```bash
# 1. 개발 중 반복 테스트
npm run test:watch

# 2. 커밋 전 빠른 검증
npm run test:quick     # 22ms

# 3. 전체 검증 필요 시
npm run test           # ~5분
```

### 5.2 CI/CD 파이프라인

```bash
# Stage 1: 최고속 검증 (Gate)
npm run test:ci:fast   # 22ms

# Stage 2: 필수 E2E
npm run test:e2e:critical  # ~1분

# Stage 3: 커버리지 확인
npm run test:coverage  # ~2분
```

### 5.3 배포 전 최종 검증

```bash
# 1. 전체 검증
npm run validate:all   # type + lint + test

# 2. 프로덕션 E2E
npm run test:vercel:e2e

# 3. Web Vitals
npm run vitals:full-integration
```

---

## 6. 성능 최적화 현황

### 6.1 Vitest 최적화

- **vmThreads Pool**: minimal.ts에서 4배 성능 향상
- **isolate: false**: CI 환경에서 상태 공유로 속도 증가
- **node 환경**: DOM 불필요 시 순수 Node.js로 실행

### 6.2 Playwright 최적화

- **Chromium Only**: Firefox/WebKit 제거
  - 속도: 3배 향상
  - 용량: 1.6GB 절약
- **병렬 Workers**: 4-6개 동시 실행
- **스마트 타임아웃**: action 30초, navigation 60초

---

## 7. 개선 필요 사항

### 7.1 현재 이슈

| 이슈 | 상태 | 우선순위 |
|------|------|---------|
| path alias (@/) 해결 미완료 | tests/integration/ai-metrics-integration.test.ts describe.skip | Medium |
| E2E 안정성 | 간헐적 타임아웃 | Low |
| 커버리지 목표 미달 | 70% 목표, 현재 ~65% | Medium |

### 7.2 향후 개선 계획

1. **path alias 완전 해결**: Vitest alias 설정 보완
2. **E2E 안정화**: retry 로직 강화
3. **커버리지 향상**: 핵심 로직 테스트 추가
4. **Visual Regression**: pixelmatch 활용 확대

---

## 8. 파일 구조 요약 (Co-location 반영)

```
openmanager-vibe-v5/
├── config/testing/
│   ├── vitest.config.main.ts      # 전체 테스트 (jsdom)
│   ├── vitest.config.minimal.ts   # CI 초고속 (node, 순수함수만)
│   ├── vitest.config.simple.ts    # 커버리지
│   ├── msw-setup.ts               # API 모킹
│   └── playwright-vitals.config.ts # Vitals 전용
├── playwright.config.ts           # 로컬 E2E
├── playwright.config.vercel.ts    # Vercel E2E
├── src/                           # Co-located Tests (35)
│   ├── components/**/*.test.tsx   # UI 컴포넌트 테스트
│   ├── hooks/**/*.test.ts         # Hook 테스트
│   ├── lib/**/*.test.ts           # 라이브러리 테스트
│   ├── utils/**/*.test.ts         # 유틸리티 테스트
│   └── services/**/*.test.ts      # 서비스 테스트
└── tests/                         # 전용 테스트 폴더 (30)
    ├── integration/    (10)       # 시스템 통합
    ├── e2e/            (8)        # Playwright E2E
    ├── api/            (3)        # API 엔드포인트
    ├── performance/    (3)        # 성능 벤치마크
    ├── ai-sidebar/     (3)        # AI 사이드바
    ├── types/          (2)        # 타입 테스트
    └── manual/         (1)        # 수동 테스트
```

---

## 9. 문서 경로 정리 완료

문서 중복 분석 및 정리가 완료되었습니다:

| 이전 위치 | 새 위치 | 상태 |
|-----------|---------|------|
| `docs/ops/testing/TESTING.md` | `docs/development/testing/co-location-guide.md` | ✅ 완료 |
| `docs/development/wsl-setup-guide.md` | `docs/environment/wsl/wsl-setup-guide.md` | ✅ 완료 |
| `docs/architecture/hybrid_split.md` | `docs/core/architecture/hybrid_split.md` | ✅ 완료 |
| `docs/architecture/cloud_run_cost_analysis.md` | `docs/core/architecture/infrastructure/` | ✅ 완료 |
| `docs/architecture/RUST_ML_SERVICE.md` | `docs/core/architecture/infrastructure/rust-ml-service.md` | ✅ 완료 |

### 삭제된 빈 폴더
- `docs/ops/testing/` → 삭제
- `docs/ops/` → 삭제
- `docs/architecture/` → 삭제 (core/architecture로 통합)

---

_Last Updated: 2025-12-19 (v2)_
