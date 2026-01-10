# 테스트 개선 계획서

**작성일**: 2026-01-10
**버전**: v5.85.0

---

## 1. 현재 테스트 현황

### 1.1 테스트 파일 분포 (총 61개)

| 카테고리 | 파일 수 | 환경 | 상태 |
|---------|:------:|------|------|
| src/ 단위 테스트 | 27 | jsdom + MSW | ⚠️ MSW 의존 |
| tests/e2e | 10 | Playwright | ✅ Vercel에서 실행 |
| tests/integration | 7 | jsdom + MSW | ⚠️ 서버 필요 |
| tests/api | 4 | jsdom + MSW | ⚠️ 서버 필요 |
| tests/ai-sidebar | 3 | jsdom + MSW | ⚠️ MSW 의존 |
| tests/performance | 3 | jsdom | ⚠️ 브라우저 API 필요 |

### 1.2 실행 환경별 현황

| 환경 | 테스트 수 | 상태 | 비고 |
|-----|:--------:|------|------|
| **minimal (node)** | 92 | ✅ 100% Pass | 순수 함수 테스트 |
| **main (jsdom+MSW)** | ~200+ | ⚠️ 환경 의존 | 로컬 WSL 한계 |
| **E2E (Playwright)** | 30 | ✅ Vercel | 프로덕션 검증 |

---

## 2. 문제 분석

### 2.1 수정 완료

| 문제 | 원인 | 해결 |
|-----|------|------|
| MSW import 실패 | 경로 오류 `src/mocks/server` | ✅ `src/__mocks__/msw/server` 수정 |

### 2.2 환경 의존 문제 (로컬 실패, Vercel 정상)

| 테스트 유형 | 원인 | 권장 조치 |
|------------|------|----------|
| **Integration** | 실서버/DB 연결 필요 | CI에서만 실행 |
| **Performance** | Web Vitals API 필요 | 브라우저 환경 필요 |
| **Component (jsdom)** | React 19 + jsdom 한계 | happy-dom 검토 |

### 2.3 무의미한 테스트 후보

| 파일 | 이유 | 권장 |
|-----|------|------|
| `tests/integration/basic-flow-e2e.test.ts` | E2E와 중복 | 제거 검토 |
| `tests/archive/**` | 이미 제외됨 | 유지 |
| `tests/manual/**` | 수동 검증용 | 유지 |

---

## 3. 테스트 개선 계획

### Phase 1: 기반 정비 (즉시)

#### 1.1 minimal 테스트 확장
현재 6개 → 12개로 확장 (순수 함수 추가)

**추가 대상**:
```
src/lib/ai/utils/message-normalizer.test.ts  (순수 함수 부분)
src/lib/ai/fallback/ai-fallback-handler.test.ts (순수 함수 부분)
src/utils/environment-security.test.ts (일부)
src/validators/paginationQuerySchema.test.ts
```

#### 1.2 vitest.config.minimal.ts 업데이트
```typescript
include: [
  // 기존 6개
  'src/utils/type-guards.test.ts',
  'src/utils/metricValidation.test.ts',
  'src/utils/utils-functions.test.ts',
  'src/lib/project-meta.test.ts',
  'src/lib/utils/time.test.ts',
  'src/safe-format.test.ts',
  // 추가
  'src/validators/paginationQuerySchema.test.ts',
]
```

### Phase 2: 핵심 로직 테스트 추가

#### 2.1 AI 관련 (우선순위 높음)

| 파일 | 테스트 대상 | 예상 케이스 |
|-----|-----------|:----------:|
| `src/lib/ai/utils/context-compressor.ts` | 컨텍스트 압축 로직 | 5-8 |
| `src/lib/ai/utils/query-complexity.ts` | 타임아웃 계산 | 4-6 |
| `src/app/api/ai/supervisor/cache-utils.ts` | 캐시 스킵 로직 | 3-5 |
| `src/app/api/ai/supervisor/security.ts` | 입력 정제 | 5-7 |

#### 2.2 서버 데이터 (우선순위 중간)

| 파일 | 테스트 대상 | 예상 케이스 |
|-----|-----------|:----------:|
| `src/services/data/UnifiedServerDataSource.ts` | 데이터 소스 | 6-8 |
| `src/services/metrics/MetricsCalculator.ts` | 메트릭 계산 | 5-7 |

### Phase 3: 통합 테스트 정리

#### 3.1 제거 대상
```
tests/integration/basic-flow-e2e.test.ts  # E2E와 중복
```

#### 3.2 CI 전용으로 이동
```
tests/integration/external-services-connection.test.ts
tests/api/*.integration.test.ts
```

---

## 4. 목표 커버리지

| 영역 | 현재 | 목표 | 전략 |
|-----|:----:|:----:|-----|
| **Lines** | ~10% | 60% | Phase 1-2 완료 시 |
| **Branches** | ~8% | 50% | 조건문 테스트 추가 |
| **Functions** | ~12% | 65% | 핵심 함수 우선 |

---

## 5. 실행 계획

### 즉시 실행 (1-2시간) - 완료

1. ✅ MSW 경로 수정 (`src/__mocks__/msw/server`)
2. ✅ minimal 테스트 확장 (92 → 160 테스트)
   - `paginationQuerySchema.test.ts` (22 tests)
   - `context-compressor.test.ts` (15 tests) - 신규 작성
   - `query-complexity.test.ts` (31 tests) - 신규 작성
3. ✅ 불필요 테스트 파일 정리 (Phase 3 완료)
   - `basic-flow-e2e.test.ts` → `tests/archive/` 이동 (E2E 중복)

### 단기 (1-2일) - 완료

4. ✅ AI 유틸리티 테스트 추가 (Phase 2.1)
   - `cache-utils.test.ts` (16 tests) - 신규 작성
   - `security.test.ts` (29 tests) - 신규 작성
5. ✅ 서버 데이터 테스트 추가 (Phase 2.2)
   - `variation-generator.test.ts` (23 tests) - 신규 작성

### 중기 (1주)

6. [ ] 컴포넌트 테스트 환경 개선 (happy-dom 검토)
7. ✅ CI 파이프라인 테스트 분리
   - `vitest.config.ci.ts` 생성
   - `npm run test:ci` 스크립트 추가

---

## 6. 결과

**Phase 1-2 결과** (2026-01-10 완료):
- minimal 테스트: 92 → **228 케이스** (+136, +148%)
- 신규 테스트 파일: 5개
  - `context-compressor.test.ts` (15 tests)
  - `query-complexity.test.ts` (31 tests)
  - `cache-utils.test.ts` (16 tests)
  - `security.test.ts` (29 tests)
  - `variation-generator.test.ts` (23 tests)
- 실행 시간: ~5.6초 (node 환경, vmThreads)

**향후 목표**:
- 커버리지: 현재 → 60%+
- CI 안정성: 환경 의존성 분리로 100% 재현 가능

---

**작성자**: Claude Code
**검토 필요**: Phase 2 우선순위, 커버리지 목표 조정
