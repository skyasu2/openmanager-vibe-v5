# TypeScript 코딩 표준

## 🎯 핵심 규칙

### 1. Strict Mode 필수 ✅
- **any 금지**: 모든 타입은 명시적으로 정의
- **strict: true**: tsconfig.json에서 필수 설정
- **noImplicitAny: true**: 암묵적 any 허용 안 함

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 2. 파일 크기 제한
- **권장**: 500줄 이하
- **최대**: 1500줄
- **초과 시**: 파일 분리 필수

### 3. 타입 정의 우선
- **Type-First 개발**: 타입 정의 → 구현 → 리팩토링
- **명시적 타입**: 모든 함수 파라미터와 반환 타입 명시
- **Interface vs Type**:
  - 확장 가능한 구조 → Interface
  - Union/Intersection → Type

---

## 📝 타입 정의 베스트 프랙티스

### ✅ 올바른 예시

```typescript
// 명시적 타입 정의
interface ServerData {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  metrics: ServerMetrics;
}

interface ServerMetrics {
  cpu: number;
  memory: number;
  responseTime: number;
}

// 함수 시그니처 명시
function getServerData(serverId: string): Promise<ServerData> {
  // 구현
}

// 제네릭 타입 활용
function processData<T extends ServerData>(data: T): T {
  // 구현
}
```

### ❌ 잘못된 예시

```typescript
// any 사용 금지
function getData(id: any): any {
  // ❌ 타입 안전성 상실
}

// 암묵적 any
function process(data) {  // ❌ 파라미터 타입 누락
  return data;
}

// 타입 단언 남용
const data = response as any;  // ❌ any로 타입 회피
```

---

## 🔄 타입 우선 개발 (Type-First)

### 개발 순서

1. **타입 정의**
```typescript
// 먼저 타입 정의
interface AIQueryRequest {
  query: string;
  mode: 'LOCAL' | 'GOOGLE_AI';
  context?: string;
}

interface AIQueryResponse {
  answer: string;
  confidence: number;
  sources: string[];
}
```

1. **구현**
```typescript
// 타입에 맞춰 구현
async function queryAI(
  request: AIQueryRequest
): Promise<AIQueryResponse> {
  // 타입이 이미 정의되어 IDE 자동완성 지원
  return {
    answer: '...',
    confidence: 0.95,
    sources: ['...']
  };
}
```

1. **리팩토링**
```typescript
// 타입 기반으로 안전한 리팩토링
function extractSources(response: AIQueryResponse): string[] {
  return response.sources;  // 타입 안전성 보장
}
```

---

## ⚠️ 특수 상황 처리

### Unknown vs Any
- **any**: 절대 사용 금지
- **unknown**: 타입을 알 수 없는 경우 사용 (타입 가드 필수)

```typescript
// ✅ unknown 사용
function processUnknown(data: unknown): string {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  throw new Error('Invalid data type');
}

// ❌ any 사용
function processAny(data: any): string {
  return data.toUpperCase();  // 런타임 오류 가능성
}
```

### 타입 가드 활용
```typescript
// 타입 가드 함수
function isServerData(data: unknown): data is ServerData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'status' in data
  );
}

// 사용
if (isServerData(response)) {
  console.log(response.name);  // 타입 안전
}
```

---

## 🎯 품질 기준

- **TypeScript 에러**: 0개 유지 필수
- **Strict 모드**: 100% 적용
- **타입 커버리지**: any 사용 금지
- **검증 명령**: `npm run type-check`
