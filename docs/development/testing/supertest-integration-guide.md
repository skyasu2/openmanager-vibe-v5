# Supertest API 테스트 가이드 (시도 기록)

**작성일**: 2025-11-26
**상태**: ⚠️ **시도 후 보류** - Option 2 (기존 방식 유지) 선택
**목적**: Next.js API Routes를 Supertest로 테스트하는 시도 및 제한사항 분석

---

## 📦 설치 완료

```bash
npm install -D supertest @types/supertest
```

**설치된 패키지**:

- `supertest`: HTTP 요청 테스트 라이브러리
- `@types/supertest`: TypeScript 타입 정의

---

## 🎯 목표 및 이점

### 기존 방식의 문제점

```typescript
// ❌ 기존: 실제 서버 실행 필요
const BASE_URL = 'http://localhost:3000';
const response = await fetch(`${BASE_URL}/api/health`);
```

**문제점**:

1. 실제 서버 실행 필요 (느림)
2. 포트 충돌 가능성
3. 테스트 환경 복잡도 증가

### Supertest 방식의 이점

```typescript
// ✅ Supertest: Handler 직접 테스트
import { GET } from '@/app/api/health/route';
const { status, body } = await testApiRoute(GET);
```

**이점**:

1. 🚀 빠른 실행 (서버 불필요)
2. 🎯 격리된 테스트 (포트 충돌 없음)
3. 📦 간단한 설정

---

## 🛠️ 구현 상태

### 1. 테스트 유틸리티 (✅ 완료)

**파일**: `tests/utils/supertest-helper.ts`

```typescript
/**
 * Next.js API Route를 직접 호출하여 테스트
 */
export async function testApiRoute(
  handler: (req: NextRequest) => Promise<NextResponse>,
  path: string = '/api/health',
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    searchParams?: Record<string, string>;
  }
);
```

**주요 기능**:

- NextRequest 객체 생성
- Handler 직접 호출
- 응답 파싱 (JSON/Text)
- 쿼리 파라미터 지원

### 2. Health API 테스트 (✅ 완료)

**파일**: `tests/api/health.supertest.test.ts`

```typescript
describe('🏥 Health API - Supertest', () => {
  it('GET /api/health - 기본 헬스체크 성공', async () => {
    const { status, body } = await testApiRoute(GET);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET /api/health - 응답 시간 검증', async () => {
    const { responseTime } = await testApiRouteWithTiming(GET);
    expect(responseTime).toBeLessThan(5000);
  });
});
```

**테스트 케이스** (7개):

1. 기본 헬스체크 성공
2. 응답 시간 검증
3. 서비스 상태 검증
4. 버전 정보 검증
5. 타임스탬프 검증
6. 응답 헤더 검증
7. 여러 번 호출 시 안정성 검증

### 3. Servers API 테스트 (✅ 완료)

**파일**: `tests/api/servers.supertest.test.ts`

```typescript
describe('🖥️ Servers API - Supertest', () => {
  it('GET /api/servers/all - 기본 요청 성공', async () => {
    const { status, body } = await testApiRoute(ServersAllGET);
    expect(status).toBe(200);
  });

  it('정렬 파라미터 테스트', async () => {
    const { body } = await testApiRoute(ServersAllGET, '/api/servers/all', {
      searchParams: { sortBy: 'cpu', sortOrder: 'desc' },
    });
    // CPU 내림차순 정렬 확인
  });
});
```

**테스트 케이스** (9개):

1. 기본 요청 성공
2. 응답 시간 검증
3. 서버 데이터 구조 검증
4. 정렬 파라미터 테스트
5. 검색 파라미터 테스트
6. 페이지네이션 테스트
7. 리다이렉트 테스트
8. 여러 정렬 옵션 동시 테스트
9. 연속 10회 요청 안정성 검증

---

## ⚠️ 현재 제한사항

### 1. Next.js 동적 API 문제

**문제**: `cookies()`, `headers()` 등 Next.js 동적 API가 요청 컨텍스트 밖에서 호출되는 오류 발생

```
❌ Error: `cookies` was called outside a request scope
```

**원인**:

- Next.js는 요청 컨텍스트(Request AsyncLocalStorage)에서만 동적 API 호출 가능
- 직접 handler 호출 시 이 컨텍스트가 없음

**영향받는 API**:

- `/api/health` - Supabase 클라이언트 생성 시 cookies() 사용
- 기타 인증이 필요한 API

### 2. 해결 방법 (선택지)

#### Option A: Mock 방식 (권장)

```typescript
// Supabase 클라이언트를 Mock으로 대체
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}));
```

**장점**: 빠르고 간단
**단점**: 실제 Supabase 연결 테스트 불가

#### Option B: 실제 서버 방식 (기존)

```typescript
// 실제 서버 실행 필요
const response = await fetch('http://localhost:3000/api/health');
```

**장점**: 실제 환경 테스트
**단점**: 느리고 복잡함

#### Option C: Supertest + HTTP 서버 (미구현)

```typescript
// Next.js 앱을 HTTP 서버로 래핑
const server = createServer((req, res) => {
  // Next.js handler 호출
});
await request(server).get('/api/health');
```

**장점**: 요청 컨텍스트 유지
**단점**: 복잡한 설정 필요

---

## 📊 테스트 실행 결과

**실행 명령어**:

```bash
npm run test -- tests/api/health.supertest.test.ts --run
npm run test -- tests/api/servers.supertest.test.ts --run
```

**현재 상태**:

- ✅ 테스트 프레임워크 정상 작동
- ✅ API Handler 직접 호출 성공
- ⚠️ Next.js 동적 API 오류 발생 (예상된 문제)

**해결 필요**:

- Supabase 클라이언트 Mock 추가
- 또는 cookies() 의존성 제거

---

## 🎯 권장 사항

### 1. 간단한 API는 Supertest 사용

**적합한 경우**:

- `/api/ping` - 단순 응답
- `/api/version` - 정적 데이터
- `/api/metrics` - 계산만 수행

**이유**: 빠르고 간단하며 격리된 테스트 가능

### 2. 복잡한 API는 기존 방식 유지

**적합한 경우**:

- `/api/health` - Supabase 연결 필요
- `/api/auth/*` - 인증 필요
- 기타 동적 API 의존성이 있는 경우

**이유**: 실제 환경에서만 정확한 테스트 가능

### 3. 하이브리드 전략

```typescript
// 빠른 단위 테스트: Supertest (Mock)
describe('Unit: Health API Logic', () => {
  it('상태 계산 로직 검증', async () => {
    // Mock Supabase
    const { status } = await testApiRoute(GET);
    expect(status).toBe(200);
  });
});

// 통합 테스트: 실제 서버
describe('Integration: Health API', () => {
  it('실제 Supabase 연결 검증', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    expect(response.ok).toBe(true);
  });
});
```

---

## 📚 참고 자료

- **Supertest 공식 문서**: https://github.com/ladjs/supertest
- **Next.js 테스트 가이드**: https://nextjs.org/docs/app/building-your-application/testing
- **Next.js 동적 API**: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context

---

## 🔄 다음 단계

1. ✅ Supertest 설치 완료
2. ✅ 테스트 유틸리티 작성 완료
3. ✅ Health & Servers API 테스트 작성 완료
4. ⏳ **Supabase Mock 추가** (다음 작업)
5. ⏳ 기타 간단한 API 마이그레이션

---

**결론**: Supertest는 간단한 API 테스트에 매우 유용하지만, Next.js 동적 API 의존성이 있는 경우 Mock 또는 실제 서버 방식이 필요합니다. 하이브리드 전략 (간단한 API는 Supertest, 복잡한 API는 기존 방식)이 가장 효율적입니다.

---

## 📋 최종 결정 (2025-11-26)

**선택**: **Option 2 - 기존 방식 유지**

**이유**:

1. ✅ 프로젝트가 이미 안정적인 테스트 환경 보유 (88.9% 통과율)
2. ✅ 기존 `tests/api/core-endpoints.integration.test.ts` 잘 작동 중
3. ✅ Supertest 도입 시 추가 복잡도와 Mock 유지보수 비용 발생
4. ✅ 개발 속도 유지가 현재 우선순위

**제거된 파일**:

- `tests/api/health.supertest.test.ts` (삭제)
- `tests/api/servers.supertest.test.ts` (삭제)
- `tests/utils/supertest-helper.ts` (삭제)

**유지된 패키지**:

- `supertest` + `@types/supertest` (나중에 필요하면 재사용 가능)

**학습 내용**:

- Next.js API Routes의 `cookies()`, `headers()` 등 동적 API는 Request Context 필요
- 직접 handler 호출 시 컨텍스트 오류 발생
- Mock 또는 실제 서버 방식으로 우회 가능

**다음 단계**:

- 기존 테스트 방식 유지
- 필요 시 Option 3 (하이브리드) 또는 Option 1 (Mock) 재검토 가능
- 이 문서는 참고 자료로 보존
