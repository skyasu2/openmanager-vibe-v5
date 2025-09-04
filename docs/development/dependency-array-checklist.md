# 🔍 React Hooks 의존성 배열 체크리스트

## 🚨 중요: 대규모 리팩토링 시 필수 점검 사항

### ✅ useMemo/useCallback 의존성 체크리스트

#### 1. **상태 변수 누락 방지**
```typescript
// ❌ 위험: 의존성 누락
const buttonConfig = useMemo(() => {
  if (isGitHubUser && isAuthenticated) {
    return { disabled: false, text: "시스템 시작" };
  }
  return { disabled: true, text: "시스템 초기화중" };
}, [isAuthenticated]); // ❌ isGitHubUser 누락!

// ✅ 안전: 모든 의존성 포함
const buttonConfig = useMemo(() => {
  if (isGitHubUser && isAuthenticated) {
    return { disabled: false, text: "시스템 시작" };
  }
  return { disabled: true, text: "시스템 초기화중" };
}, [isAuthenticated, isGitHubUser]); // ✅ 모든 상태 포함
```

#### 2. **객체 의존성 분해 원칙**
```typescript
// ❌ 위험: 객체 전체 의존성
const statusInfo = useMemo(() => {
  return `상태: ${multiUserStatus.isRunning ? '실행중' : '중지'}`;
}, [multiUserStatus]); // ❌ 객체 참조로 무한 리렌더링 위험

// ✅ 안전: primitive 값 의존성
const statusInfo = useMemo(() => {
  return `상태: ${multiUserStatus?.isRunning ? '실행중' : '중지'}`;
}, [multiUserStatus?.isRunning]); // ✅ primitive 값만 의존
```

### 📋 **커밋 전 필수 점검사항**

#### React Error #310 관련 수정 시:
- [ ] 모든 useMemo 의존성 배열 재검토
- [ ] 모든 useCallback 의존성 배열 재검토  
- [ ] 객체 의존성 → primitive 의존성 전환 확인
- [ ] 핵심 상태 변수 누락 여부 확인 (isAuthenticated, isGitHubUser 등)

#### 인증 시스템 수정 시:
- [ ] isAuthenticated, isGitHubUser, authLoading 의존성 확인
- [ ] buttonConfig, handleSystemToggle 의존성 배열 점검
- [ ] 게스트/GitHub 사용자 권한 분리 로직 확인

#### 성능 최적화 시:
- [ ] setIsLoading(false) finally 블록 누락 확인
- [ ] 에러 핸들링 후 상태 복원 로직 확인
- [ ] 타이머/인터벌 정리 함수 확인

### 🔧 **자동 검증 도구**

```bash
# ESLint 규칙 활성화
"react-hooks/exhaustive-deps": "error"

# 커밋 전 자동 검사
npm run lint:hooks
npm run type-check
npm run test:hooks-deps
```

### 📊 **과거 사고 사례**

#### **사례 1: React Error #310 해결 과정 (2025-08-31)**
- **원인**: 대규모 의존성 배열 정리 중 isGitHubUser 누락
- **증상**: "GitHub 로그인 후 시스템 초기화중" 고착
- **교훈**: 의존성 제거 시 각각의 영향도 분석 필요

#### **사례 2: setIsLoading 누락 (2025-09-04)**
- **원인**: try-catch 블록에 finally 누락
- **증상**: statusLoading이 true로 고착
- **교훈**: 비동기 함수의 상태 정리 로직 필수 확인

### 🎯 **재발 방지 원칙**

1. **점진적 수정**: 한 번에 많은 의존성을 변경하지 않음
2. **개별 테스트**: 각 훅의 의존성 변경 후 개별 검증
3. **핵심 기능 우선**: 인증, 버튼 상태 등 핵심 기능부터 검증
4. **문서화**: 의존성 변경 이유와 영향도 상세 기록
5. **롤백 계획**: 문제 발생 시 즉시 롤백 가능한 커밋 단위

---

## 📈 **성공적인 의존성 관리 사례**

```typescript
// ✅ 모범 사례: 완전한 의존성 배열
const buttonConfig = useMemo(() => {
  const baseConfig = {
    className: "system-button",
    disabled: false,
    text: "시스템 시작"
  };

  // 로딩 상태 확인
  if (authLoading || statusLoading || isSystemStarting) {
    return { ...baseConfig, disabled: true, text: "시스템 초기화중" };
  }

  // 인증 상태 확인  
  if (!isAuthenticated || !isGitHubUser) {
    return { ...baseConfig, disabled: true, text: "GitHub 로그인 필요" };
  }

  // 시스템 상태 확인
  if (multiUserStatus?.isRunning) {
    return { ...baseConfig, text: "대시보드로 이동" };
  }

  return baseConfig;
}, [
  // 🔍 완전한 의존성 배열 - 누락 없음
  authLoading,           // 인증 로딩 상태
  statusLoading,         // 시스템 상태 로딩  
  isSystemStarting,      // 시스템 시작 중
  isAuthenticated,       // 인증 완료 여부
  isGitHubUser,          // GitHub 사용자 여부 ⭐ 핵심!
  multiUserStatus?.isRunning, // 시스템 실행 상태
  multiUserStatus?.userCount  // 사용자 수
]);
```

이 체크리스트를 통해 앞으로 유사한 실수를 방지할 수 있습니다.