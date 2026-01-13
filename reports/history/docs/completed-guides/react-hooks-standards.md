# React Hooks 아키텍처 표준

## 🎯 목표: Hook 관련 프로젝트 중단 방지

### 📋 **문제가 발생했던 패턴**

```typescript
// ❌ 문제 패턴: AdminClient.tsx
const loadInitialData = useCallback(async () => {
  await Promise.all([
    loadPlatformUsage(), // 함수 호이스팅 문제
    loadSystemStatus(), // 의존성 순서 이슈
  ]);
}, [loadPlatformUsage, loadSystemStatus]); // 순환 의존성

useEffect(() => {
  void loadInitialData();
}, [loadInitialData]); // loadInitialData가 먼저 선언되어야 함
```

**문제점:**

- 함수 선언 순서와 의존성 배열 불일치
- useEffect에서 선언되지 않은 함수 참조
- 227k 줄 코드베이스에서 이런 패턴 추적 어려움

---

## 🏗️ **Hook 아키텍처 표준**

### **Rule 1: 함수 선언 순서 표준화**

```typescript
// ✅ 올바른 패턴
export default function Component() {
  // 1. 상태 선언
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. 개별 함수들 (의존성 없는 것부터)
  const loadPlatformUsage = useCallback(async () => {
    // 구현
  }, []); // 의존성 없음

  const loadSystemStatus = useCallback(async () => {
    // 구현
  }, []);

  // 3. 조합 함수들 (의존성 있는 것들)
  const loadInitialData = useCallback(async () => {
    await Promise.all([
      loadPlatformUsage(),
      loadSystemStatus()
    ]);
  }, [loadPlatformUsage, loadSystemStatus]);

  // 4. Effects (함수들이 모두 선언된 후)
  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // 5. 렌더링 로직
  return <div>...</div>;
}
```

### **Rule 2: 의존성 배열 안전성**

```typescript
// ✅ 의존성 배열 표준 패턴
const fetchData = useCallback(async (id: string) => {
  // 외부 의존성 최소화
  const response = await api.getData(id);
  setData(response);
}, []); // id는 매개변수로 전달

const handleRefresh = useCallback(() => {
  if (currentId) {
    fetchData(currentId); // 의존성 배열에 fetchData 불필요
  }
}, [currentId, fetchData]);
```

### **Rule 3: 대형 컴포넌트 분할 전략**

```typescript
// ✅ Hook 로직 분리 패턴
// hooks/useAdminData.ts
export function useAdminData() {
  const [platformUsage, setPlatformUsage] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  const loadPlatformUsage = useCallback(async () => {
    // 로직
  }, []);

  const loadSystemStatus = useCallback(async () => {
    // 로직
  }, []);

  const loadInitialData = useCallback(async () => {
    await Promise.all([
      loadPlatformUsage(),
      loadSystemStatus()
    ]);
  }, [loadPlatformUsage, loadSystemStatus]);

  return {
    platformUsage,
    systemStatus,
    loadInitialData,
    // 기타 필요한 것들
  };
}

// AdminClient.tsx
export default function AdminClient() {
  const { platformUsage, systemStatus, loadInitialData } = useAdminData();

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // UI 로직만 집중
  return <div>...</div>;
}
```

---

## 🔧 **자동 검증 도구**

> **Note**: 이 프로젝트는 ESLint 대신 **Biome**을 사용합니다.

### **Biome 린트 설정**

```json
// biome.json (관련 설정)
{
  "linter": {
    "rules": {
      "correctness": {
        "useExhaustiveDependencies": "error",
        "useHookAtTopLevel": "error"
      }
    }
  }
}
```

### **Hook 의존성 검사**

```bash
# Biome을 사용한 React Hooks 검사
npm run lint        # 전체 린트 검사
npx biome lint src  # 직접 실행

# TypeScript 타입 검사 (Hook 관련 에러 포함)
npm run type-check
```

---

## 📊 **마이그레이션 가이드**

### **1단계: 현재 문제 컴포넌트 식별**

```bash
# 대형 컴포넌트 찾기 (500줄 이상)
find src/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 500'

# Hook 관련 문제 찾기 (Biome 린트)
npm run lint
```

### **2단계: 우선순위 기반 리팩토링**

1. **Critical**: AdminClient.tsx 같은 핵심 컴포넌트
2. **High**: 500줄 이상 대형 컴포넌트
3. **Medium**: Hook 의존성 경고 있는 컴포넌트

### **3단계: 점진적 적용**

- 새로운 컴포넌트: 표준 적용 필수
- 기존 컴포넌트: 수정 시 표준 적용
- 문제 컴포넌트: 우선 리팩토링

---

## 🚀 **도구 및 자동화**

### **개발 시 실시간 검증**

```bash
# 전체 린트 검사 (Hook 의존성 포함)
npm run lint

# 타입 검사 (Hook 관련 타입 에러 포함)
npm run type-check

# 자동 수정
npm run lint:fix
```

### **Pre-commit Hook (권장)**

```bash
# .husky/pre-commit (설정 시)
#!/usr/bin/env sh
npm run lint || {
  echo "❌ 린트 문제로 커밋 차단"
  echo "💡 'npm run lint:fix'로 자동 수정하세요"
  exit 1
}
```

이 표준을 통해 AdminClient.tsx와 같은 Hook 관련 문제를 **사전에 방지**하고, **227k 줄 코드베이스에서도 안전한 Hook 사용**을 보장합니다.
