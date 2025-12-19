# 🧪 테스트 전략 가이드

**클라우드 네이티브 환경 기반 실용적 테스트 전략**

## 📊 **현재 테스트 구성 현황 (2025-12-19)**

### **테스트 파일 분포 (총 65개)**

```
📁 Co-located Unit Tests (35개) - src/ 내 배치 ✅ 안정적
├── components/**/*.test.tsx (UI 컴포넌트)
├── hooks/**/*.test.ts (React Hooks)
├── lib/**/*.test.ts (라이브러리)
└── utils/**/*.test.ts (유틸리티)

📁 Integration Tests (10개) - tests/integration/
├── 시스템 통합 테스트
└── 외부 서비스 연동

📁 E2E Tests (8개) - tests/e2e/
├── Playwright (Chromium)
└── Critical User Flows

📁 API Tests (3개) - tests/api/
└── API Contract 검증

📁 기타 (9개) - tests/
└── Performance, Security 등
```

### **성능 지표**

| 지표 | 목표 | 현재 |
|------|------|------|
| CI 최고속 | < 5s | ✅ 2.2s (92 tests) |
| Minimal 테스트 | < 100ms | ✅ 22ms |
| E2E Critical | < 2분 | ✅ ~1분 |

## 🎯 **테스트 철학: 클라우드 네이티브 중심**

### **핵심 원칙**

> **"실제 Vercel/GCP/Supabase 환경 테스트가 Mock보다 더 유효하다"**

#### **1. 테스트 피라미드 재설계**

```
      🔺 E2E Tests (실제 클라우드)
     ────────────────────────────
    🔺🔺 Cloud Integration (Staging)
   ────────────────────────────────
  🔺🔺🔺 Unit Tests (순수 함수만)
 ──────────────────────────────────
```

#### **2. Mock vs Reality 기준**

| 테스트 대상        | 로컬 Mock   | 실제 환경 | 권장 방식     |
| ------------------ | ----------- | --------- | ------------- |
| **순수 함수**      | ✅ 적합     | ⚡ 과도   | **Mock**      |
| **유틸리티/헬퍼**  | ✅ 적합     | ⚡ 과도   | **Mock**      |
| **타입 가드**      | ✅ 적합     | ⚡ 과도   | **Mock**      |
| **UI 컴포넌트**    | ✅ 적합     | ⚡ 과도   | **Mock**      |
| **API 엔드포인트** | ⚠️ 제한적   | ✅ 최적   | **실제 환경** |
| **AI 서비스 통합** | ❌ 비현실적 | ✅ 필수   | **실제 환경** |
| **데이터베이스**   | ❌ 비현실적 | ✅ 필수   | **실제 환경** |
| **외부 API**       | ❌ 비현실적 | ✅ 필수   | **실제 환경** |

## 📋 **신규 테스트 작성 가이드**

### **✅ 작성하면 좋은 테스트**

#### **1. 순수 함수 및 유틸리티**

```typescript
// ✅ 권장: 순수 함수 테스트
describe('formatTimestamp', () => {
  it('should format Korean time correctly', () => {
    const result = formatTimestamp('2024-09-24T10:00:00Z');
    expect(result).toBe('2024년 9월 24일 19:00');
  });
});
```

#### **2. 타입 가드 및 검증 로직**

```typescript
// ✅ 권장: 타입 안전성 테스트
describe('isValidServerMetric', () => {
  it('should validate metric structure', () => {
    expect(isValidServerMetric({ cpu: 50, memory: 60 })).toBe(true);
    expect(isValidServerMetric({ invalid: true })).toBe(false);
  });
});
```

#### **3. 비즈니스 로직 (순수 함수)**

```typescript
// ✅ 권장: 비즈니스 규칙 테스트
describe('calculateHealthScore', () => {
  it('should calculate score based on metrics', () => {
    const metrics = { cpu: 30, memory: 40, disk: 20 };
    expect(calculateHealthScore(metrics)).toBe(87);
  });
});
```

### **⚠️ 신중하게 작성해야 할 테스트**

#### **1. API 엔드포인트 - 간단한 케이스만**

```typescript
// ⚠️ 신중히: 기본 응답 검증만
describe('GET /api/health', () => {
  it('should return 200 with basic health check', async () => {
    const response = await fetch('/api/health');
    expect(response.status).toBe(200);
    expect(response.json()).resolves.toMatchObject({
      status: 'healthy',
    });
  });
});
```

#### **2. React 컴포넌트 - 핵심 로직만**

```typescript
// ⚠️ 신중히: 단순한 렌더링 테스트
describe('ServerCard', () => {
  it('should render server name', () => {
    render(<ServerCard server={{name: 'test-server'}} />);
    expect(screen.getByText('test-server')).toBeInTheDocument();
  });
});
```

### **❌ 작성하지 말아야 할 테스트**

#### **1. 복잡한 AI 서비스 통합**

```typescript
// ❌ 비추천: 복잡한 Mock 체인
describe.skip('SimplifiedQueryEngine Integration', () => {
  // AI 엔진 + RAG + 외부 API Mock 지옥
  // → 실제 Vercel 환경에서 테스트하는 것이 더 유효
});
```

#### **2. 외부 서비스 의존성**

```typescript
// ❌ 비추천: 외부 API Mock
describe.skip('Google AI Service', () => {
  // Gemini API Mock → 실제 API와 완전히 다른 동작
  // → Staging 환경에서 실제 API로 테스트
});
```

#### **3. 데이터베이스 복잡한 쿼리**

```typescript
// ❌ 비추천: DB 상태 의존적 테스트
describe.skip('Complex Supabase Queries', () => {
  // RLS Policy + Connection Pool Mock
  // → 실제 Supabase에서 직접 테스트
});
```

## 🚀 **실제 환경 테스트 전략**

### **1. Staging 환경 활용**

```bash
# 실제 클라우드 서비스 연동 테스트
vercel --prod  # Preview 배포로 실제 환경 검증
npx playwright test --headed https://your-staging-app.vercel.app
```

### **2. 프로덕션 스모크 테스트**

```bash
# 핵심 기능만 빠른 검증
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/servers
```

### **3. 로컬 개발 환경 통합**

```typescript
// 개발용 실제 서비스 연동
if (process.env.NODE_ENV === 'development') {
  // 실제 Supabase Test DB 사용
  // 실제 Google AI API (낮은 rate limit)
  // 로컬 Mock은 최소한으로
}
```

## 🛠️ **테스트 도구 및 헬퍼**

### **현재 구축된 도구들**

```typescript
// ✅ 이미 구축된 헬퍼들
- SupabaseMockBuilder: 간단한 DB Mock용
- timeout-config.ts: 테스트 타임아웃 설정
- test/setup.ts: 글로벌 테스트 설정
```

### **권장 테스트 헬퍼 패턴**

```typescript
// 테스트 헬퍼 예시
export const createTestServer = (overrides = {}) => ({
  id: 'test-1',
  name: 'Test Server',
  cpu: 50,
  memory: 60,
  status: 'healthy',
  ...overrides,
});

export const mockSuccessResponse = (data: any) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
```

## 📈 **테스트 운영 목표**

### **핵심 성능 지표**

- **CI 속도**: < 5초 (현재 2.2초 ✅)
- **E2E Critical**: < 2분 (현재 ~1분 ✅)
- **TypeScript 오류**: 0개 유지 ✅

### **테스트 구조 전략**

1. **Co-located Unit Tests** → `src/` 내 배치 (발견성 향상)
2. **실제 환경 테스트** → Vercel E2E 우선
3. **복잡한 Mock 테스트** → Skip 또는 실제 환경으로 대체
4. **빠른 피드백** → `npm run test:quick` (22ms)

## 🎯 **실용적 권장사항**

### **새 기능 개발 시**

1. **순수 함수부터** → Unit 테스트 작성
2. **API 엔드포인트** → 기본 응답만 테스트, 복잡한 로직은 실제 환경
3. **UI 컴포넌트** → 렌더링 + 핵심 인터랙션만
4. **통합 기능** → Staging 환경에서 수동/자동 검증

### **테스트 유지보수 시**

1. **실패하는 복잡한 테스트** → Skip 처리 고려
2. **환경 의존적 테스트** → 실제 환경으로 이전
3. **Mock이 복잡해지는 테스트** → 테스트 전략 재검토

### **CI/CD 파이프라인**

```yaml
# 권장 CI 구성
test:
  unit: npm run test:unit # 빠른 피드백
  build: npm run build # TypeScript 검증
  deploy: vercel --prod # 실제 환경 배포
  e2e: playwright test # 실제 환경 검증
```

## 🏆 **성공 사례 패턴**

### **현재 잘 작동하는 테스트들 (Co-located)**

- `src/utils/type-guards.test.ts` - 타입 안전성 ✅
- `src/lib/utils.test.ts` - 유틸리티 함수 ✅
- `src/components/**/*.test.tsx` - UI 컴포넌트 ✅
- `src/hooks/**/*.test.ts` - React Hooks ✅

### **Vercel 환경 테스트 (권장)**

- `tests/e2e/*.spec.ts` - Playwright E2E ✅
- `tests/integration/*.test.ts` - 시스템 통합 ✅
- 실제 환경: `npm run test:vercel:e2e` ✅

---

## 🎯 **핵심 메시지**

**"테스트는 도구일 뿐, 목적은 안정적인 프로덕션 서비스"**

- **간단한 것은 Mock으로** → 빠른 피드백
- **복잡한 것은 실제 환경으로** → 신뢰성 확보
- **유지보수 비용 < 실제 가치** → 실용적 접근

**클라우드 네이티브 시대에는 실제 환경 테스트가 Mock보다 더 유효합니다**

---

_📅 작성일: 2025-09-24_
_📝 작성자: Claude Code AI_
_🔄 최종 업데이트: 2025-12-19 (Co-location 구조 반영)_
