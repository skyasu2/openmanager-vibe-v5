# 🏆 테스트 철학: 클라우드 네이티브 우선

**OpenManager VIBE 테스트 전략 상세 가이드**

## 핵심 원칙

> **"실제 Vercel/GCP/Supabase 환경 테스트가 Mock보다 더 유효하다"**

## 테스트 피라미드 재설계

```
      🔺 E2E Tests (실제 클라우드)
     ────────────────────────────
    🔺🔺 Cloud Integration (Staging)
   ────────────────────────────────
  🔺🔺🔺 Unit Tests (순수 함수만)
 ──────────────────────────────────
```

## Mock vs Reality 판단 기준

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

## 🚀 환경별 테스트 전략

| 환경                | URL                   | 목적                | 권장도     |
| ------------------- | --------------------- | ------------------- | ---------- |
| **개발 서버**       | localhost:3000        | 개발 중 빠른 피드백 | ⭐⭐⭐     |
| **로컬 프로덕션**   | localhost:3000 (빌드) | 배포 전 검증        | ⭐⭐⭐⭐   |
| **베르셀 프로덕션** | vercel.app            | 실제 사용자 환경    | ⭐⭐⭐⭐⭐ |

### ✅ 베르셀 환경 테스트의 핵심 가치

- **실제 성능**: 152ms vs 24.1s (개발 서버)
- **프로덕션 버그**: 빌드 최적화 이슈 발견
- **CDN 검증**: Edge 캐싱 및 성능 확인
- **환경변수**: 베르셀 설정 적용 검증

## 테스트 복잡도 판단하기

### 🟢 Low Complexity - 즉시 작성 권장

```typescript
// ✅ 권장: 순수 함수, 유틸리티, 타입 가드
describe('calculateHealthScore', () => {
  it('should calculate score correctly', () => {
    const metrics = { cpu: 30, memory: 40, disk: 20 };
    expect(calculateHealthScore(metrics)).toBe(87);
  });
});
```

### 🟡 Medium Complexity - 신중히 작성

```typescript
// ⚠️ 신중히: 간단한 React 컴포넌트, 기본 API
describe('ServerCard', () => {
  it('should render server name', () => {
    render(<ServerCard server={{name: 'test-server'}} />);
    expect(screen.getByText('test-server')).toBeInTheDocument();
  });
});
```

### 🔴 High Complexity - Skip 처리 고려

```typescript
// ❌ Skip: 복잡한 AI 통합, 외부 서비스 Mock
describe.skip('Complex AI Integration', () => {
  // 실제 Vercel/Staging 환경에서 테스트
});
```

## 테스트 작성 전 체크리스트

```
□ 순수 함수인가? → ✅ Unit Test 작성
□ 유틸리티/헬퍼 함수인가? → ✅ Unit Test 작성
□ 타입 가드/검증 로직인가? → ✅ Unit Test 작성
□ 간단한 UI 컴포넌트인가? → ✅ Component Test 작성
□ 기본 API 엔드포인트인가? → ⚠️ 간단한 테스트만
□ 복잡한 AI/외부 서비스 통합인가? → ❌ Skip, 실제 환경 테스트
□ 데이터베이스 복잡 쿼리인가? → ❌ Skip, 실제 환경 테스트
```

## Mocking Strategy

### Supabase Mocking with `SupabaseMockBuilder`

To reduce code duplication and improve the consistency and maintainability of tests that rely on Supabase, a `SupabaseMockBuilder` was introduced. This helper can be found at `/src/test/helpers/supabase-mock.ts`.

**Example Usage:**

```typescript
import { SupabaseMockBuilder } from '@/test/helpers/supabase-mock';

it('should handle successful data fetching', () => {
  const mockQueryBuilder = new SupabaseMockBuilder()
    .withData([{ id: 1, name: 'Test Server' }])
    .build();

  // Your test logic here that uses the mockQueryBuilder
});

it('should handle fetching with an error', () => {
  const mockQueryBuilder = new SupabaseMockBuilder()
    .withError({ message: 'Failed to fetch' })
    .build();

  // Your test logic here
});
```

**효과**: 59% 테스트 코드 중복 감소

---

## 🎯 핵심 메시지

**"테스트는 도구일 뿐, 목적은 안정적인 프로덕션 서비스"**

- **간단한 것은 Mock으로** → 빠른 피드백
- **복잡한 것은 실제 환경으로** → 신뢰성 확보
- **유지보수 비용 < 실제 가치** → 실용적 접근

**클라우드 네이티브 시대에는 실제 환경 테스트가 Mock보다 더 유효합니다** 🚀
