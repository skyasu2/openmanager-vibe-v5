# 타입 레벨 테스트 가이드

**작성일**: 2025-11-26
**목적**: Vitest `expectTypeOf`를 사용한 TypeScript 타입 안전성 검증

---

## 🎯 타입 레벨 테스트란?

런타임 테스트처럼 **타입 자체를 검증**하는 테스트입니다.

**문제 상황**:

```typescript
// 리팩토링 후 타입이 미묘하게 변경됨
interface PredictionResult {
  serverId: string;
  failureProbability: number;
  // predictedTime: Date;  // ❌ 실수로 제거됨
}

// 런타임에는 정상 작동, 하지만 타입 오류 발생 가능
```

**해결책**:

```typescript
// 타입 테스트로 즉시 감지
expectTypeOf<PredictionResult>().toHaveProperty('predictedTime');
// ✅ 테스트 실패: predictedTime 속성이 없음
```

---

## 📦 설치 (이미 완료)

Vitest는 기본적으로 `expectTypeOf`를 제공합니다.

```bash
# 별도 설치 불필요, Vitest에 포함
npm install -D vitest
```

---

## 🛠️ 구현된 타입 테스트

### 1. Prediction System 타입 (22개 테스트)

**파일**: `tests/types/prediction-types.test.ts`

**테스트 케이스**:

```typescript
describe('🔮 Prediction System 타입 테스트', () => {
  it('PredictionResult 필수 속성 검증', () => {
    expectTypeOf<PredictionResult>().toHaveProperty('serverId');
    expectTypeOf<PredictionResult>().toHaveProperty('failureProbability');
    expectTypeOf<PredictionResult>().toHaveProperty('predictedTime');
  });

  it('severity는 특정 리터럴만 허용', () => {
    expectTypeOf<PredictionResult['severity']>().toEqualTypeOf<
      'low' | 'medium' | 'high' | 'critical'
    >();
  });

  it('중첩 객체 구조 검증', () => {
    expectTypeOf<ServerMetrics['cpu']>().toHaveProperty('usage');
    expectTypeOf<ServerMetrics['cpu']['usage']>().toBeNumber();
  });
});
```

**실행 결과**:

```bash
✓ tests/types/prediction-types.test.ts (22 tests) 8ms
```

### 2. Server 타입 (23개 테스트)

**파일**: `tests/types/server-types.test.ts`

**테스트 케이스**:

```typescript
describe('🖥️ Server Types 타입 테스트', () => {
  it('메트릭 속성들은 숫자', () => {
    expectTypeOf<ServerInstance['cpu']>().toBeNumber();
    expectTypeOf<ServerInstance['memory']>().toBeNumber();
  });

  it('uptime은 number 또는 string', () => {
    expectTypeOf<ServerInstance['uptime']>().toEqualTypeOf<number | string>();
  });

  it('실전 시나리오: Partial 타입 생성', () => {
    expectTypeOf<Partial<ServerInstance>>().toMatchTypeOf<{
      id?: string;
      name?: string;
    }>();
  });

  it('실전 시나리오: Pick 타입 생성', () => {
    type ServerSummary = Pick<ServerInstance, 'id' | 'name' | 'status'>;
    expectTypeOf<ServerSummary>().toHaveProperty('id');
  });
});
```

**실행 결과**:

```bash
✓ tests/types/server-types.test.ts (23 tests) 7ms
```

---

## 🎨 주요 expectTypeOf API

### 1. 기본 타입 검증

```typescript
// 문자열
expectTypeOf<string>().toBeString();

// 숫자
expectTypeOf<number>().toBeNumber();

// 불리언
expectTypeOf<boolean>().toBeBoolean();

// 배열
expectTypeOf<string[]>().toBeArray();

// 객체
expectTypeOf<{}>().toBeObject();
```

### 2. 속성 검증

```typescript
// 속성 존재 확인
expectTypeOf<User>().toHaveProperty('id');
expectTypeOf<User>().toHaveProperty('name');

// 속성 타입 확인
expectTypeOf<User['id']>().toBeString();
expectTypeOf<User['age']>().toBeNumber();
```

### 3. 정확한 타입 일치

```typescript
// 완전히 동일한 타입
expectTypeOf<Status>().toEqualTypeOf<'active' | 'inactive'>();

// 타입 포함 여부 (더 넓은 타입)
expectTypeOf<User>().toMatchTypeOf<{ id: string }>();
```

### 4. Optional 속성

```typescript
// optional 속성 검증
expectTypeOf<User['email']>().toEqualTypeOf<string | undefined>();
```

### 5. 부정 테스트

```typescript
// 타입이 아닌 것 검증
expectTypeOf<Status>().not.toEqualTypeOf<string>();
```

---

## 💡 실전 활용 예시

### 1. API 응답 타입 검증

```typescript
// API 응답이 예상 구조와 일치하는지 확인
it('API 응답 구조 검증', () => {
  expectTypeOf<ApiResponse>().toHaveProperty('success');
  expectTypeOf<ApiResponse>().toHaveProperty('data');
  expectTypeOf<ApiResponse['success']>().toBeBoolean();
});
```

### 2. 리팩토링 시 타입 변경 감지

```typescript
// 리팩토링 전
interface OldServer {
  id: string;
  name: string;
  cpu: number;
}

// 리팩토링 후 - 타입 테스트가 변경 감지
it('Server 타입이 변경되지 않았는지 확인', () => {
  expectTypeOf<NewServer>().toMatchTypeOf<OldServer>();
  // ❌ 실패: cpu 속성 타입이 변경됨
});
```

### 3. Union 타입 검증

```typescript
it('Status는 특정 값만 허용', () => {
  expectTypeOf<ServerStatus>().toEqualTypeOf<
    'online' | 'offline' | 'maintenance'
  >();

  // 임의의 문자열 허용 안 함
  expectTypeOf<ServerStatus>().not.toEqualTypeOf<string>();
});
```

### 4. 제네릭 타입 검증

```typescript
it('제네릭 타입이 올바르게 작동', () => {
  type Response<T> = {
    data: T;
    error: string | null;
  };

  expectTypeOf<Response<User>>().toMatchTypeOf<{
    data: User;
    error: string | null;
  }>();
});
```

---

## 🚀 테스트 실행

### 타입 테스트만 실행

```bash
# 모든 타입 테스트
npm run test -- tests/types/

# 특정 타입 테스트
npm run test -- tests/types/prediction-types.test.ts
npm run test -- tests/types/server-types.test.ts
```

### 전체 테스트에 포함

```bash
# 타입 테스트도 자동으로 실행됨
npm run test
npm run test:quick
npm run validate:all
```

---

## 📊 테스트 결과 (2025-11-26)

| 파일                     | 테스트 개수 | 통과      | 실행 시간 |
| ------------------------ | ----------- | --------- | --------- |
| prediction-types.test.ts | 22          | ✅ 22     | 8ms       |
| server-types.test.ts     | 23          | ✅ 23     | 7ms       |
| **합계**                 | **45**      | **✅ 45** | **15ms**  |

**성능**: 타입 테스트는 매우 빠름 (컴파일 타임 검증)

---

## 🎯 언제 타입 테스트를 작성하나요?

### ✅ 작성해야 하는 경우

1. **복잡한 타입 구조**
   - 중첩된 객체, 제네릭, Union 타입
   - 예: `IntegratedAnalysisResult`, `ServerInstance`

2. **API 계약 (Contract)**
   - API 요청/응답 타입
   - 예: `PredictionResult`, `IncidentReport`

3. **리팩토링 대상**
   - 자주 변경되는 타입
   - 여러 곳에서 사용되는 공통 타입

4. **타입 안전성이 중요한 경우**
   - 잘못된 타입 사용 시 심각한 오류 발생 가능
   - 예: 결제, 인증, 보안 관련 타입

### ⛔ 작성하지 않아도 되는 경우

1. **단순한 타입**
   - `type UserId = string;`
   - 간단한 인터페이스

2. **임시 타입**
   - 한 곳에서만 사용되는 타입

3. **자동 추론 가능한 타입**
   - TypeScript가 자동으로 검증하는 경우

---

## 🔧 Vitest 설정 (이미 완료)

**파일**: `config/testing/vitest.config.main.ts`

```typescript
export default defineConfig({
  test: {
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'tests/unit/**/*.{test,spec}.{js,ts,tsx}',
      'tests/types/**/*.{test,spec}.{js,ts,tsx}', // ✅ 타입 테스트 추가
    ],
  },
});
```

---

## 📚 추가 리소스

- **Vitest expectTypeOf 공식 문서**: https://vitest.dev/api/expect-typeof.html
- **TypeScript Utility Types**: https://www.typescriptlang.org/docs/handbook/utility-types.html
- **tsd (더 강력한 타입 테스트)**: https://github.com/SamVerschueren/tsd

---

## 🎓 다음 단계

### 1. 추가 타입 테스트 작성

```typescript
// tests/types/api-types.test.ts
// API 응답 타입 검증

// tests/types/ai-types.test.ts
// AI 관련 타입 검증
```

### 2. CI/CD 통합

```yaml
# .github/workflows/test.yml
- name: Run type tests
  run: npm run test -- tests/types/
```

### 3. 더 강력한 타입 테스트 (선택)

```bash
# tsd 설치 (필요 시)
npm install -D tsd

# tsd 테스트 작성
# test-d/index.test-d.ts
```

---

## 💡 핵심 요약

1. **타입 테스트는 리팩토링 안전망**
   - 타입 변경 시 즉시 감지
   - 런타임 오류 사전 방지

2. **Vitest expectTypeOf 사용**
   - 별도 설치 불필요
   - 기존 테스트 인프라 활용

3. **빠르고 효율적**
   - 45개 테스트가 15ms에 실행
   - 컴파일 타임 검증

4. **실전 적용**
   - API 계약 검증
   - 복잡한 타입 구조 검증
   - 리팩토링 안전성 보장

---

**결론**: 타입 레벨 테스트는 TypeScript 프로젝트에서 타입 안전성을 보장하는 강력한 도구입니다. 복잡한 타입 구조와 API 계약을 검증하여 리팩토링 시 발생할 수 있는 타입 오류를 사전에 방지할 수 있습니다.
