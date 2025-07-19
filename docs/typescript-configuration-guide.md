# 🔧 TypeScript 설정 가이드

> **최종 업데이트**: 2025-01-19 (v5.48.6)  
> **목적**: 프로젝트의 TypeScript 설정 이해 및 최적화 전략

## 📋 목차

1. [현재 설정](#현재-설정)
2. [주요 설정 설명](#주요-설정-설명)
3. [개발 생산성 최적화](#개발-생산성-최적화)
4. [향후 개선 계획](#향후-개선-계획)

## 현재 설정

### tsconfig.json 주요 설정

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es2017", "webworker"],
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noUnusedLocals": false, // ⚠️ 의도적으로 비활성화
    "noUnusedParameters": false, // ⚠️ 의도적으로 비활성화
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"],
      "@/services/*": ["./src/services/*"]
    }
  }
}
```

## 주요 설정 설명

### 1. Strict Mode 활성화 ✅

```json
"strict": true
```

- 타입 안정성을 위한 모든 strict 옵션 활성화
- `noImplicitAny`, `strictNullChecks` 등 포함

### 2. 사용하지 않는 변수/매개변수 경고 비활성화 ⚠️

```json
"noUnusedLocals": false,
"noUnusedParameters": false
```

#### 비활성화 이유

1. **개발 중 유연성**:
   - 임시 변수나 디버깅용 코드 작성 시 방해 요소 제거
   - 리팩토링 과정에서 단계적 수정 가능

2. **빠른 프로토타이핑**:
   - MVP 개발 시 빠른 반복 가능
   - 나중에 정리할 코드에 대한 경고 회피

3. **대규모 리팩토링**:
   - 단계적 코드 개선 시 중간 상태 허용
   - CI/CD 파이프라인 차단 방지

### 3. Path Aliases 설정

```json
"paths": {
  "@/*": ["./src/*"],
  "@/components/*": ["./src/components/*"],
  // ...
}
```

- 깔끔한 import 경로
- 상대 경로 지옥(../../..) 회피

### 4. Exclude 설정

```json
"exclude": [
  "node_modules",
  "backup-removed-features/**/*",
  "**/*.test.ts",
  "**/*.stories.tsx"
]
```

- 불필요한 파일 타입 체크 제외
- 빌드 성능 향상

## 개발 생산성 최적화

### 1. 점진적 타입 개선 전략

```typescript
// 1단계: any 타입으로 빠른 구현
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// 2단계: 점진적 타입 추가
interface DataItem {
  value: number;
  // 추가 속성은 나중에...
}

function processData(data: DataItem[]) {
  return data.map(item => item.value);
}
```

### 2. 유틸리티 타입 활용

```typescript
// Partial: 모든 속성을 선택적으로
type PartialUser = Partial<User>;

// Pick: 필요한 속성만 선택
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit: 특정 속성 제외
type PublicUser = Omit<User, 'password'>;
```

### 3. 타입 가드 함수

```typescript
// 타입 안전성 확보
function isValidUser(data: unknown): data is User {
  return (
    typeof data === 'object' && data !== null && 'id' in data && 'email' in data
  );
}
```

## 향후 개선 계획

### 단기 목표 (1-2개월)

1. **사용하지 않는 코드 정리**
   - 정기적인 코드 리뷰로 불필요한 변수 제거
   - 자동화 도구 도입 검토

2. **타입 커버리지 향상**
   - 현재 any 타입 사용 부분 점진적 개선
   - 중요 비즈니스 로직부터 우선 적용

### 중기 목표 (3-6개월)

1. **Strict 설정 단계적 활성화**

   ```json
   // 단계별 활성화 계획
   "noUnusedLocals": true,      // 1단계
   "noUnusedParameters": true,  // 2단계
   ```

2. **타입 정의 파일 정리**
   - 공통 타입 중앙화
   - 도메인별 타입 분리

### 장기 목표 (6개월+)

1. **완전한 타입 안전성**
   - 모든 strict 옵션 활성화
   - any 타입 완전 제거

2. **자동화 도구 도입**
   - 타입 커버리지 리포트
   - PR 단위 타입 체크 강화

## 팀 가이드라인

### ✅ 현재 권장사항

1. **새로운 코드**: 가능한 한 정확한 타입 사용
2. **레거시 코드**: 수정 시 타입 개선
3. **any 사용**: 임시로만, TODO 주석 추가
4. **타입 정의**: 인터페이스 우선, 필요시 type 사용

### 📝 코드 리뷰 체크리스트

- [ ] 새로운 any 타입 사용 시 정당한 이유가 있는가?
- [ ] 타입 정의가 명확하고 재사용 가능한가?
- [ ] 유틸리티 타입을 활용할 수 있는가?
- [ ] 타입 가드가 필요한 경우인가?

## 결론

현재 TypeScript 설정은 **개발 속도와 타입 안전성의 균형**을 추구합니다. `noUnusedLocals`와 `noUnusedParameters`를 비활성화한 것은 개발 생산성을 위한 임시 조치이며, 프로젝트가 안정화되면 점진적으로 더 엄격한 설정으로 전환할 예정입니다.

### 참고 자료

- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Type-Level TypeScript](https://type-level-typescript.com/)
