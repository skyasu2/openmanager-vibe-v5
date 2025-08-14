# 🎨 타입 우선 개발 완전 가이드

## 📌 핵심 원칙

**"타입은 코드의 설계도"** - 건물을 짓기 전에 설계도를 그리듯, 코드를 작성하기 전에 타입을 정의합니다.

## 🚀 타입 우선 개발의 이점

### 1. 버그 예방 (90% 감소)
- 컴파일 타임에 오류 발견
- 런타임 에러 대폭 감소
- 타입 불일치 자동 감지

### 2. 개발 속도 향상
- IDE 자동완성 100% 활용
- IntelliSense 지원 극대화
- 리팩토링 시 자동 추적

### 3. 자동 문서화
- 타입이 곧 API 문서
- JSDoc 필요성 감소
- 팀 협업 효율 증대

## 📋 타입 우선 워크플로우

### Phase 1: 타입 설계
```typescript
// 1. 도메인 모델 정의
interface User {
  id: string;
  email: string;
  profile: UserProfile;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  name: string;
  avatar?: string;
  bio?: string;
  preferences: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  notifications: NotificationSettings;
}

// 2. API 타입 정의
type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateUserRequest = Partial<CreateUserRequest>;
type UserResponse = User & { token?: string };

// 3. 함수 시그니처 정의
type UserService = {
  create: (data: CreateUserRequest) => Promise<UserResponse>;
  update: (id: string, data: UpdateUserRequest) => Promise<UserResponse>;
  delete: (id: string) => Promise<void>;
  findById: (id: string) => Promise<User | null>;
  findMany: (filter?: UserFilter) => Promise<User[]>;
};
```

### Phase 2: 타입 기반 구현
```typescript
// 타입을 만족하는 구현
class UserServiceImpl implements UserService {
  async create(data: CreateUserRequest): Promise<UserResponse> {
    // 타입이 정의되어 있어 구현이 명확
    const user: User = {
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.users.insert(user);
    const token = generateToken(user.id);
    
    return { ...user, token };
  }

  async update(id: string, data: UpdateUserRequest): Promise<UserResponse> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`User ${id} not found`);
    }

    const updated: User = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    await db.users.update(id, updated);
    return updated;
  }

  // ... 나머지 메서드 구현
}
```

### Phase 3: 타입 검증 및 가드
```typescript
// 타입 가드 함수
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'profile' in obj
  );
}

// 타입 검증 유틸리티
function assertUser(obj: unknown): asserts obj is User {
  if (!isUser(obj)) {
    throw new TypeError('Invalid user object');
  }
}

// 런타임 타입 검증 (Zod 활용)
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  profile: z.object({
    name: z.string().min(1).max(100),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
  }),
});

type UserFromSchema = z.infer<typeof UserSchema>;
```

## 🛠️ 고급 타입 패턴

### 1. 조건부 타입
```typescript
// API 응답 타입 자동 추론
type ApiResponse<T> = T extends { error: string }
  ? { success: false; error: string }
  : { success: true; data: T };

// 사용 예
type UserApiResponse = ApiResponse<User>; // { success: true; data: User }
type ErrorResponse = ApiResponse<{ error: string }>; // { success: false; error: string }
```

### 2. 매핑 타입
```typescript
// 모든 필드를 선택적으로 만들기
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 모든 필드를 읽기 전용으로
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 특정 필드만 필수로
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

### 3. 템플릿 리터럴 타입
```typescript
// 동적 라우트 타입
type Route = `/users/${string}` | `/posts/${string}` | `/admin/${string}`;

// 이벤트 이름 타입
type EventName = `on${Capitalize<string>}`;

// CSS 단위 타입
type CSSUnit = `${number}${'px' | 'em' | 'rem' | '%'}`;
```

### 4. 브랜디드 타입
```typescript
// 타입 안전한 ID
type UserId = string & { __brand: 'UserId' };
type PostId = string & { __brand: 'PostId' };

function getUserById(id: UserId): User {
  // UserId만 허용
  return users.get(id);
}

// 타입 변환 함수
function toUserId(id: string): UserId {
  return id as UserId;
}
```

## 📁 프로젝트 타입 구조

```
src/
├── types/
│   ├── index.ts           # 메인 export
│   ├── models/           # 도메인 모델
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── comment.ts
│   ├── api/              # API 타입
│   │   ├── requests.ts
│   │   ├── responses.ts
│   │   └── errors.ts
│   ├── services/         # 서비스 인터페이스
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   └── cache.ts
│   └── utils/            # 유틸리티 타입
│       ├── helpers.ts
│       ├── guards.ts
│       └── branded.ts
```

## 🎯 실전 예제

### 복잡한 폼 처리
```typescript
// 폼 상태 타입
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// 폼 액션 타입
type FormAction<T> =
  | { type: 'SET_VALUE'; field: keyof T; value: T[keyof T] }
  | { type: 'SET_ERROR'; field: keyof T; error: string }
  | { type: 'SET_TOUCHED'; field: keyof T }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; errors: Partial<Record<keyof T, string>> }
  | { type: 'RESET' };

// 폼 리듀서
function formReducer<T>(
  state: FormState<T>,
  action: FormAction<T>
): FormState<T> {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    // ... 나머지 케이스
  }
}
```

### API 클라이언트 타입
```typescript
// 제네릭 API 클라이언트
class ApiClient<T extends Record<string, any>> {
  constructor(private baseUrl: string) {}

  async get<K extends keyof T>(
    endpoint: K,
    params?: T[K]['params']
  ): Promise<T[K]['response']> {
    const response = await fetch(`${this.baseUrl}${String(endpoint)}`, {
      method: 'GET',
      // ... params 처리
    });
    return response.json();
  }

  async post<K extends keyof T>(
    endpoint: K,
    data: T[K]['body']
  ): Promise<T[K]['response']> {
    const response = await fetch(`${this.baseUrl}${String(endpoint)}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

// API 엔드포인트 타입 정의
interface ApiEndpoints {
  '/users': {
    params: { page?: number; limit?: number };
    response: User[];
  };
  '/users/create': {
    body: CreateUserRequest;
    response: UserResponse;
  };
  '/users/:id': {
    params: { id: string };
    response: User;
  };
}

// 사용
const api = new ApiClient<ApiEndpoints>('https://api.example.com');
const users = await api.get('/users', { page: 1, limit: 10 });
```

## ⚠️ 주의사항

### 1. 과도한 타입 복잡도 피하기
```typescript
// ❌ 나쁜 예: 읽기 어려운 타입
type ComplexType<T> = T extends readonly (infer U)[]
  ? U extends (...args: any[]) => any
    ? ReturnType<U>
    : U
  : T extends object
  ? { [K in keyof T]: ComplexType<T[K]> }
  : T;

// ✅ 좋은 예: 명확하고 단순한 타입
type SimpleType<T> = T[];
type ObjectType<T> = Record<string, T>;
```

### 2. 타입 추론 활용
```typescript
// ❌ 나쁜 예: 불필요한 타입 명시
const numbers: number[] = [1, 2, 3];
const doubled: number[] = numbers.map((n: number): number => n * 2);

// ✅ 좋은 예: 타입 추론 활용
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2);
```

### 3. DRY 원칙 적용
```typescript
// ❌ 나쁜 예: 타입 중복
interface CreateUserInput {
  name: string;
  email: string;
  age: number;
}

interface UpdateUserInput {
  name: string;
  email: string;
  age: number;
}

// ✅ 좋은 예: 타입 재사용
interface UserInput {
  name: string;
  email: string;
  age: number;
}

type CreateUserInput = UserInput;
type UpdateUserInput = Partial<UserInput>;
```

## 📚 추가 자료

- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
- [ts-reset](https://github.com/total-typescript/ts-reset) - TypeScript 기본 타입 개선