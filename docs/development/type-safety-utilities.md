# 🛡️ 타입 안전성 유틸리티 가이드

**작성일**: 2025-07-28  
**대상**: OpenManager VIBE v5 개발자  
**목적**: TypeScript 타입 안전성 향상을 위한 유틸리티 함수 사용법

## 📋 개요

OpenManager VIBE v5는 TypeScript strict mode를 사용하며, 타입 안전성을 보장하기 위한 다양한 유틸리티 함수를 제공합니다. 이러한 유틸리티는 런타임 에러를 방지하고 개발 경험을 향상시킵니다.

## 🔧 핵심 유틸리티 함수

### 1. Error 안전 처리

```typescript
import { getErrorMessage } from '@/types/type-utils';

// ❌ 위험한 방식
try {
  // ...
} catch (error) {
  console.log(error.message); // error가 Error 타입이 아닐 수도 있음
}

// ✅ 안전한 방식
try {
  // ...
} catch (error) {
  console.log(getErrorMessage(error)); // 항상 안전한 문자열 반환
}
```

### 2. 배열 안전 접근

```typescript
import { safeArrayAccess } from '@/types/type-utils';

// ❌ 위험한 방식
const firstItem = array[0]; // undefined일 수 있음
if (firstItem.name) {
  // 런타임 에러 가능
  // ...
}

// ✅ 안전한 방식
const firstItem = safeArrayAccess(array, 0);
if (firstItem?.name) {
  // 안전한 옵셔널 체이닝
  // ...
}
```

### 3. 객체 안전 접근

```typescript
import { safeObjectAccess } from '@/types/type-utils';

// ❌ 위험한 방식
const value = obj.nested.property; // nested가 undefined일 수 있음

// ✅ 안전한 방식
const value = safeObjectAccess(obj, 'nested.property');
// 또는
const value = safeObjectAccess(obj, ['nested', 'property']);
```

### 4. 숫자 안전 변환

```typescript
import { safeParseFloat, safeParseInt } from '@/types/type-utils';

// ❌ 위험한 방식
const num = parseFloat(userInput); // NaN 가능
const calculation = num * 2; // NaN * 2 = NaN

// ✅ 안전한 방식
const num = safeParseFloat(userInput, 0); // 기본값 0
const calculation = num * 2; // 항상 유효한 숫자
```

## 🎯 React 유틸리티

### 1. 안전한 useEffect

```typescript
import { useSafeEffect } from '@/types/react-utils';

// ❌ 위험한 방식
useEffect(() => {
  fetchData();
  // cleanup 함수 없음 - 메모리 누수 가능
}, []);

// ✅ 안전한 방식
useSafeEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);

  // cleanup 함수 자동 처리
  return () => controller.abort();
}, []);
```

### 2. 비동기 useEffect

```typescript
import { useAsyncEffect } from '@/types/react-utils';

// ❌ 위험한 방식
useEffect(() => {
  (async () => {
    await fetchData(); // 에러 처리 없음
  })();
}, []);

// ✅ 안전한 방식
useAsyncEffect(async signal => {
  try {
    await fetchData({ signal });
  } catch (error) {
    if (!signal.aborted) {
      console.error(getErrorMessage(error));
    }
  }
}, []);
```

## 📊 타입 가드 함수

### 1. 기본 타입 체크

```typescript
import { isString, isNumber, isArray, isObject } from '@/types/type-utils';

function processData(data: unknown) {
  if (isString(data)) {
    // data는 string 타입으로 좁혀짐
    return data.toUpperCase();
  }

  if (isArray(data)) {
    // data는 unknown[] 타입으로 좁혀짐
    return data.map(item => processData(item));
  }

  if (isObject(data)) {
    // data는 Record<string, unknown> 타입으로 좁혀짐
    return Object.entries(data);
  }

  return null;
}
```

### 2. 커스텀 타입 가드

```typescript
// 서버 메트릭 타입 가드
function isServerMetric(data: unknown): data is ServerMetric {
  return (
    isObject(data) &&
    'cpu' in data &&
    'memory' in data &&
    'disk' in data &&
    isNumber(data.cpu) &&
    isNumber(data.memory) &&
    isNumber(data.disk)
  );
}

// 사용 예시
const metrics = await fetchMetrics();
if (isServerMetric(metrics)) {
  // metrics는 ServerMetric 타입으로 좁혀짐
  console.log(`CPU: ${metrics.cpu}%`);
}
```

## 🚀 고급 유틸리티

### 1. 깊은 객체 병합

```typescript
import { deepMerge } from '@/types/type-utils';

const defaultConfig = {
  api: {
    timeout: 5000,
    retries: 3,
  },
  cache: {
    ttl: 300,
  },
};

const userConfig = {
  api: {
    timeout: 10000,
  },
};

const finalConfig = deepMerge(defaultConfig, userConfig);
// 결과: { api: { timeout: 10000, retries: 3 }, cache: { ttl: 300 } }
```

### 2. 타입 안전 debounce

```typescript
import { safeDebounce } from '@/types/type-utils';

const handleSearch = safeDebounce((query: string) => {
  searchAPI(query);
}, 300);

// TypeScript가 파라미터 타입을 정확히 추론
handleSearch('검색어'); // ✅
handleSearch(123); // ❌ 타입 에러
```

### 3. 타입 안전 localStorage

```typescript
import { safeLocalStorage } from '@/types/type-utils';

interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
}

// 저장
safeLocalStorage.setItem('preferences', {
  theme: 'dark',
  language: 'ko',
});

// 읽기 (타입 안전)
const prefs = safeLocalStorage.getItem<UserPreferences>('preferences');
if (prefs) {
  console.log(prefs.theme); // 타입 추론 완벽
}
```

## 📈 성능 최적화 팁

### 1. 메모이제이션

```typescript
import { memoizeWithTypes } from '@/types/type-utils';

// 복잡한 계산을 메모이제이션
const calculateMetrics = memoizeWithTypes(
  (data: ServerMetric[]) => {
    // 복잡한 계산...
    return result;
  },
  { maxSize: 100 } // 캐시 크기 제한
);
```

### 2. 배치 처리

```typescript
import { batchProcess } from '@/types/type-utils';

// 대량 데이터를 배치로 처리
const results = await batchProcess(
  largeArray,
  async batch => {
    return await processInParallel(batch);
  },
  { batchSize: 100, concurrency: 5 }
);
```

## 🛠️ 마이그레이션 가이드

### 단계별 적용

1. **Phase 1**: Error 처리 유틸리티 적용

   ```bash
   npm run migrate:error-handling
   ```

2. **Phase 2**: 배열/객체 접근 안전화

   ```bash
   npm run migrate:safe-access
   ```

3. **Phase 3**: React 컴포넌트 유틸리티 적용
   ```bash
   npm run migrate:react-utils
   ```

### 자동화 스크립트

```bash
# 전체 마이그레이션 실행
npm run migrate:type-safety

# 특정 디렉토리만 마이그레이션
npm run migrate:type-safety -- --dir src/services

# 드라이런 (변경사항 미리보기)
npm run migrate:type-safety -- --dry-run
```

## ⚠️ 주의사항

1. **점진적 적용**: 한 번에 모든 코드를 변경하지 말고 점진적으로 적용
2. **테스트 우선**: 유틸리티 적용 전후 테스트 실행 필수
3. **성능 고려**: 과도한 안전성 체크는 성능에 영향을 줄 수 있음
4. **타입 추론 활용**: TypeScript의 타입 추론을 최대한 활용

## 📚 참고 자료

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type Guards and Differentiating Types](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## 🔗 관련 파일

- `/src/types/type-utils.ts` - 핵심 유틸리티 함수
- `/src/types/react-utils.ts` - React 전용 유틸리티
- `/src/types/guards.ts` - 타입 가드 함수
- `/scripts/migrate-type-safety.ts` - 마이그레이션 스크립트
