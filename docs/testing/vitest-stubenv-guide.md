# Vitest vi.stubEnv() 사용 가이드

## 개요

Vitest에서 `process.env`에 직접 값을 할당하면 읽기 전용 에러가 발생할 수 있습니다. 이를 해결하기 위해 Vitest는 `vi.stubEnv()` API를 제공합니다.

## 문제 상황

```typescript
// ❌ 잘못된 방법 - 읽기 전용 에러 발생
process.env.NODE_ENV = 'test';
process.env['API_KEY'] = 'test-key';
Object.assign(process.env, { NODE_ENV: 'test' });
```

## 해결 방법

### 1. vi.stubEnv() 사용

```typescript
import { vi } from 'vitest';

// ✅ 올바른 방법 - vi.stubEnv 사용
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('API_KEY', 'test-key');
```

### 2. 여러 환경변수 설정

```typescript
// 여러 환경변수를 한번에 설정
const envVars = {
  NODE_ENV: 'test',
  API_KEY: 'test-key',
  DATABASE_URL: 'postgres://test',
};

Object.entries(envVars).forEach(([key, value]) => {
  vi.stubEnv(key, value);
});
```

### 3. 환경변수 제거

```typescript
// 특정 환경변수 제거
vi.unstubEnv('API_KEY');

// 모든 스텁된 환경변수 제거
vi.unstubAllEnvs();
```

### 4. 테스트 설정 예시

```typescript
import { beforeEach, afterEach, describe, it, vi } from 'vitest';

describe('환경변수 테스트', () => {
  beforeEach(() => {
    // 테스트 전 환경변수 초기화
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    // 테스트 후 정리
    vi.unstubAllEnvs();
  });

  it('개발 환경 테스트', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(process.env.NODE_ENV).toBe('development');
  });

  it('프로덕션 환경 테스트', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(process.env.NODE_ENV).toBe('production');
  });
});
```

### 5. 유틸리티 함수 활용

```typescript
// src/test/utils.ts
export function withEnv<T>(
  envVars: Record<string, string>,
  fn: () => T
): T {
  // 기존 환경변수 백업
  const originalEnv: Record<string, string | undefined> = {};
  Object.keys(envVars).forEach(key => {
    originalEnv[key] = process.env[key];
  });

  // 새 환경변수 설정
  Object.entries(envVars).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });

  try {
    return fn();
  } finally {
    // 원래 값으로 복원
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        vi.unstubEnv(key);
      } else {
        vi.stubEnv(key, value);
      }
    });
  }
}

// 사용 예시
const result = withEnv(
  { NODE_ENV: 'test', DEBUG: 'true' },
  () => {
    // 이 블록 안에서만 환경변수가 변경됨
    return myFunction();
  }
);
```

## 마이그레이션 체크리스트

프로젝트에서 `process.env` 직접 수정을 `vi.stubEnv()`로 변경해야 하는 파일들:

- [x] `/src/test/setup.ts` - `setupTestEnvironment()` 함수 수정 완료
- [x] `/src/test/env.config.ts` - `vi.stubEnv()` 사용하도록 수정 완료
- [x] `/tests/unit/fallback-data.test.ts` - 모든 환경변수 설정 수정 완료
- [x] `/tests/integration/environment-integration.test.ts` - `setTestEnv()` 제거하고 `vi.stubEnv()` 사용

## 주의사항

1. **타이밍**: `vi.stubEnv()`는 모듈이 로드되기 전에 호출되어야 합니다.
2. **정리**: 테스트 후 항상 `vi.unstubAllEnvs()`로 환경변수를 정리하세요.
3. **타입 안전성**: TypeScript에서 `process.env`의 타입은 여전히 `string | undefined`입니다.

## 참고 자료

- [Vitest vi.stubEnv API 문서](https://vitest.dev/api/vi.html#vi-stubenv)
- [Vitest 환경변수 모킹 가이드](https://vitest.dev/guide/mocking.html#environment-variables)