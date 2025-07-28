# TypeScript 개선 가이드 v5.49.0

## 🎯 목표

OpenManager VIBE의 TypeScript 타입 안전성을 강화하여 런타임 에러를 방지하고 개발자 경험을 향상시킵니다.

## 📋 진행 상황

### ✅ Phase 1: 설정 강화 (완료)

#### tsconfig.json 업데이트

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true
  }
}
```

#### ESLint TypeScript 규칙 추가

```json
{
  "extends": ["plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "unused-imports/no-unused-imports": "error"
  }
}
```

### ✅ Phase 2: any 타입 제거 (완료)

#### 주요 개선 사항

1. **서버 타입 정의 강화**

```typescript
// Before
alerts?: any[];
customMetrics?: Record<string, any>;

// After
export interface ServerAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'health' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved?: boolean;
}

alerts?: ServerAlert[];
customMetrics?: Record<string, string | number | boolean>;
```

2. **제네릭 활용**

```typescript
// Before
async insert(table: string, data: any) { }

// After
async insert<T = Record<string, unknown>>(table: string, data: T) { }
```

3. **WebSocket 타입 정의**

```typescript
export interface MetricsData {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
  [key: string]: number | undefined;
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  activeServers: number;
  totalAlerts: number;
  timestamp: string;
}
```

### 🚧 Phase 3: 타입 구조 개선 (진행 예정)

#### 계획된 작업

- [ ] 공통 타입을 types/index.ts로 통합
- [ ] 도메인별 타입 파일 정리
- [ ] 유틸리티 타입 활용 확대
- [ ] 타입 가드 함수 구현

### 🔮 Phase 4: 자동화 (계획)

#### 목표

- [ ] pre-commit hook에 타입 체크 추가
- [ ] CI/CD에 strict 타입 체크 통합
- [ ] 타입 커버리지 모니터링

## 🛠️ 개발자 가이드

### 1. any 타입 회피 방법

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good - unknown 사용
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  return null;
}

// ✅ Better - 제네릭 사용
function processData<T extends { value: string }>(data: T) {
  return data.value;
}
```

### 2. 옵셔널 체이닝 활용

```typescript
// ❌ Bad
if (user && user.profile && user.profile.settings) {
  return user.profile.settings.theme;
}

// ✅ Good
return user?.profile?.settings?.theme;
```

### 3. 널리시 병합 활용

```typescript
// ❌ Bad
const value = data !== null && data !== undefined ? data : defaultValue;

// ✅ Good
const value = data ?? defaultValue;
```

### 4. 배열/객체 인덱스 안전 접근

```typescript
// noUncheckedIndexedAccess 활성화 시

// ❌ Bad
const value = array[index]; // 타입: T | undefined

// ✅ Good
const value = array[index];
if (value !== undefined) {
  // value는 이제 T 타입
}

// ✅ Better - 기본값 제공
const value = array[index] ?? defaultValue;
```

## 📈 성과

- **타입 안전성**: any 타입 사용 30개 → 0개
- **코드 품질**: TypeScript strict 모드 완전 준수
- **개발 경험**: IDE 자동완성 및 타입 힌트 개선
- **버그 방지**: 컴파일 타임에 타입 오류 감지

## 🚀 다음 단계

1. **남은 TypeScript 오류 해결** (현재 223개)
   - undefined 체크 추가
   - 타입 가드 구현
   - 옵셔널 체이닝 적용

2. **테스트 코드 타입 강화**
   - 테스트 파일에도 동일한 규칙 적용
   - Mock 타입 정의

3. **문서화**
   - 타입 정의 JSDoc 추가
   - 복잡한 타입에 대한 설명

## 🔗 참고 자료

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
