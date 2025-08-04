# 🚀 성능 엔진 테스트 가이드

**목적**: PerformanceOptimizedQueryEngine E2E 테스트  
**상위 문서**: [성능 최적화 완전 가이드](/docs/performance-optimization-complete-guide.md)

> **포함 영역**: 성능 벤치마크, 캐시 효과 검증, 회로 차단기, Playwright E2E 테스트

## 🧪 테스트 파일 구성

### 1. 📊 성능 엔진 E2E 테스트

**파일**: `/src/test/performance-optimized-query-engine.e2e.test.ts`

**테스트 영역**:

- ✅ 엔진 초기화 및 기본 기능
- 📈 성능 비교 벤치마크 (기본 vs 최적화)
- 💾 캐시 효과 검증
- 🔌 회로 차단기 동작
- ⚡ 타임아웃 및 안정성
- 📊 성능 메트릭 정확성
- 🔍 엣지 케이스 처리

### 2. 📡 성능 API 엔드포인트 테스트

**파일**: `/src/test/performance-api.test.ts`

**테스트 영역**:

- 🔍 GET `/api/ai/performance` - 성능 통계 조회
- 🏆 POST `/api/ai/performance` - 벤치마크 실행
- 🧹 DELETE `/api/ai/performance` - 캐시 초기화
- 🌐 CORS 및 HTTP 헤더 검증
- 📊 성능 분석 알고리즘

### 3. ⚡ 회로 차단기 패턴 테스트

**파일**: `/src/test/circuit-breaker.test.ts`

**테스트 영역**:

- 🔄 기본 상태 전환 (Closed → Open → Half-Open)
- ⏱️ 타임아웃 및 복구 메커니즘
- 🎯 다중 서비스 독립적 회로 차단기
- 🛡️ 폴백 응답 품질 검증
- 📊 통계 및 모니터링

### 4. 🎭 Playwright 브라우저 E2E 테스트

**파일**: `/src/test/performance-optimized-query-engine.playwright.test.ts`

**테스트 영역**:

- 🌐 실제 브라우저 환경에서의 API 테스트
- 💾 브라우저 캐시 효과 검증
- 📱 반응형 및 접근성 테스트
- 🔧 성능 최적화 검증
- 📊 실시간 성능 모니터링

## 🚀 테스트 실행 방법

### 기본 성능 테스트 실행

```bash
# 모든 성능 테스트 실행
npm run test:performance

# 성능 테스트 watch 모드
npm run test:performance:watch

# 특정 테스트 파일만 실행
npx vitest run src/test/performance-api.test.ts
```

### Playwright E2E 테스트 실행

```bash
# 브라우저 E2E 테스트 실행
npm run test:e2e:performance

# Playwright UI 모드로 실행
npm run test:e2e:performance:ui

# 특정 브라우저에서만 실행
npx playwright test src/test/performance-optimized-query-engine.playwright.test.ts --project=chromium-stable
```

### 전체 테스트 스위트 실행

```bash
# 단위 테스트 + E2E 테스트
npm run test:performance && npm run test:e2e:performance

# 커버리지와 함께 실행
npm run test:coverage
```

## 📊 성능 벤치마크 분석

### 기대되는 성능 개선

1. **응답 시간 개선**: 20-50% 감소
2. **캐시 적중률**: 30% 이상
3. **병렬 처리 효율성**: 10% 이상 개선
4. **에러율**: 10% 미만 유지

### 성능 등급 기준

| 등급 | 응답시간 | 캐시적중률 | 에러율 |
| ---- | -------- | ---------- | ------ |
| A+   | < 500ms  | > 70%      | < 5%   |
| A    | < 1000ms | > 50%      | < 10%  |
| B    | < 2000ms | > 30%      | < 15%  |
| C    | < 3000ms | > 20%      | < 25%  |
| D    | ≥ 3000ms | ≤ 20%      | ≥ 25%  |

## 🔧 테스트 환경 설정

### 필수 환경 변수

```bash
# .env.local
GOOGLE_AI_API_KEY=your_google_ai_key
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Mock 설정

테스트는 실제 서비스에 의존하지 않도록 Mock을 적극 활용합니다:

- ✅ Google AI API Mock
- ✅ Supabase RAG Engine Mock
- ✅ Memory Cache Cache Mock
- ✅ MCP Context Mock

## 🎯 테스트 시나리오

### 1. 성능 최적화 검증 시나리오

```typescript
// 동일 쿼리 반복 실행으로 캐시 효과 확인
const query = '서버 상태를 확인해주세요';
for (let i = 0; i < 5; i++) {
  const result = await engine.query({ query, mode: 'local' });
  // 캐시 적중률 증가 및 응답 시간 감소 확인
}
```

### 2. 회로 차단기 동작 검증 시나리오

```typescript
// 연속 실패로 회로 차단기 열기
for (let i = 0; i < 6; i++) {
  await engine.query({ query: ':::ERROR:::', mode: 'local' });
  // 5번 실패 후 폴백 응답 확인
}
```

### 3. 병렬 처리 효율성 검증 시나리오

```typescript
// 순차 vs 병렬 처리 시간 비교
const queries = ['쿼리1', '쿼리2', '쿼리3'];

// 순차 처리
const sequentialStart = Date.now();
for (const query of queries) await engine.query({ query });
const sequentialTime = Date.now() - sequentialStart;

// 병렬 처리
const parallelStart = Date.now();
await Promise.all(queries.map(q => engine.query({ query: q })));
const parallelTime = Date.now() - parallelStart;

// 병렬 효율성 = (순차시간 - 병렬시간) / 순차시간
```

## 🚨 트러블슈팅

### 일반적인 문제와 해결방법

#### 1. 테스트 타임아웃

```bash
Error: Test timeout of 30000ms exceeded
```

**해결방법**:

- 네트워크 연결 확인
- Mock 설정 검증
- 타임아웃 값 증가 고려

#### 2. Mock 설정 오류

```bash
Error: Cannot find module '@/services/ai/performance-optimized-query-engine'
```

**해결방법**:

- import 경로 확인
- Jest/Vitest 설정의 path alias 확인

#### 3. Playwright 브라우저 설치 문제

```bash
Error: Executable doesn't exist at /path/to/playwright
```

**해결방법**:

```bash
npx playwright install
```

#### 4. API 테스트 실패

```bash
Error: Network request failed
```

**해결방법**:

- 개발 서버 실행 확인 (`npm run dev`)
- 포트 충돌 확인 (3000번 포트)
- 환경 변수 설정 확인

## 📈 CI/CD 통합

### GitHub Actions 설정 예시

```yaml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run performance tests
        run: npm run test:performance

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E performance tests
        run: npm run test:e2e:performance

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## 📊 성능 모니터링 대시보드

### 실시간 성능 메트릭 확인

```bash
# 성능 통계 API 호출
curl http://localhost:3000/api/ai/performance

# 벤치마크 실행
curl -X POST http://localhost:3000/api/ai/performance \
  -H "Content-Type: application/json" \
  -d '{"mode":"comparison","queries":["테스트"],"iterations":3}'
```

### 브라우저에서 확인

- 성능 대시보드: http://localhost:3000/admin/performance
- AI 어시스턴트: http://localhost:3000
- 성능 차트: http://localhost:3000/admin/performance#charts

## 🎯 테스트 결과 해석

### 성공 기준

- ✅ 모든 테스트 통과율 95% 이상
- ✅ 성능 개선 20% 이상
- ✅ 캐시 적중률 30% 이상
- ✅ 에러율 10% 미만
- ✅ 폴백 응답 시간 200ms 이내

### 실패 분석

1. **성능 저하**: 원인 분석 및 최적화 필요
2. **캐시 미작동**: 캐시 로직 점검 필요
3. **회로 차단기 오작동**: 임계값 조정 필요
4. **타임아웃**: 네트워크 또는 리소스 문제

## 🔄 지속적 개선

### 성능 메트릭 추적

- 일별 성능 트렌드 모니터링
- 주간 벤치마크 결과 비교
- 월간 성능 개선 보고서 생성

### 테스트 확장 계획

- [ ] 부하 테스트 추가 (1000+ 동시 요청)
- [ ] 메모리 누수 테스트 강화
- [ ] 크로스 브라우저 호환성 확장
- [ ] 모바일 환경 성능 최적화
- [ ] 오프라인 모드 테스트 추가

---

💡 **주의사항**:

- 테스트 실행 전 개발 서버가 실행 중인지 확인하세요
- 환경 변수가 올바르게 설정되었는지 확인하세요
- 실제 API 키는 테스트에서 사용하지 마세요 (Mock 사용)
- 테스트 결과는 `/test-results` 디렉토리에 저장됩니다
