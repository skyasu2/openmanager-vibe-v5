# Design Document

## Overview

일반 사용자와 관리자 사용자를 구분하여 프로필 드롭다운 메뉴의 기능 접근을 제한하는 권한 관리 시스템을 설계합니다. 현재 UnifiedProfileButton 컴포넌트를 기반으로 사용자 역할에 따른 조건부 렌더링을 구현하여 일반 사용자에게는 필수 기능만 제공하고, 관리자에게는 전체 기능을 제공합니다.

## Architecture

### User Role Detection System
- **GitHub Authentication Check**: `isGitHubAuthenticated()` 함수를 사용하여 GitHub 인증 여부 확인
- **User Information Retrieval**: `getCurrentUser()` 함수를 사용하여 현재 사용자 정보 획득
- **Role-based Permission Logic**: 사용자 역할에 따른 권한 매트릭스 적용

### Permission Matrix
```
Feature                 | General User | Admin User
------------------------|--------------|------------
AI Toggle               | ✅ (Modified)| ✅
System Start/Stop       | ❌           | ✅
System Restart          | ❌           | ✅
Admin Mode Toggle       | ❌           | ✅
Settings Panel          | ❌           | ✅
Logout                  | ❌           | ✅
Dashboard Access        | ✅           | ✅
```

## Components and Interfaces

### 1. Permission Hook (New)
```typescript
interface UserPermissions {
  canControlSystem: boolean;
  canAccessSettings: boolean;
  canToggleAdminMode: boolean;
  canLogout: boolean;
  isGeneralUser: boolean;
  isAdmin: boolean;
}

const useUserPermissions = (): UserPermissions
```

### 2. Enhanced UnifiedProfileButton
- **Conditional Rendering**: 사용자 권한에 따른 메뉴 아이템 표시/숨김
- **AI Button Text Logic**: AI 상태에 따른 버튼 텍스트 변경 ("AI 활성화" ↔ "AI 중지")
- **Permission-based Styling**: 일반 사용자용 간소화된 UI

### 3. User Role Context (Optional Enhancement)
```typescript
interface UserRoleContext {
  userType: 'general' | 'admin' | 'guest';
  permissions: UserPermissions;
  isLoading: boolean;
}
```

## Data Models

### User Permission Model
```typescript
interface UserRole {
  id: string;
  type: 'general' | 'admin' | 'guest';
  githubAuthenticated: boolean;
  permissions: {
    systemControl: boolean;
    settingsAccess: boolean;
    adminModeAccess: boolean;
    logoutAccess: boolean;
  };
}
```

### AI State Model Enhancement
```typescript
interface AIAgentState {
  isEnabled: boolean;
  state: 'idle' | 'processing' | 'error';
  // Add user-specific display text
  getDisplayText: (userType: 'general' | 'admin') => string;
}
```

## Error Handling

### Permission Denied Scenarios
1. **Unauthorized Access Attempt**: 일반 사용자가 관리자 기능 접근 시도
2. **Authentication Failure**: 사용자 인증 정보 확인 실패
3. **Role Detection Error**: 사용자 역할 판단 불가

### Error Response Strategy
- **Silent Hiding**: 권한 없는 기능은 UI에서 숨김 (에러 메시지 없음)
- **Graceful Degradation**: 권한 확인 실패 시 일반 사용자 권한으로 기본 설정
- **Logging**: 권한 관련 오류는 콘솔에 로깅 (사용자에게는 노출하지 않음)

## Testing Strategy

### Unit Tests
1. **Permission Hook Tests**
   - GitHub 인증된 사용자 권한 확인
   - 게스트 사용자 권한 제한 확인
   - 권한 매트릭스 정확성 검증

2. **Component Rendering Tests**
   - 일반 사용자용 메뉴 아이템 렌더링 확인
   - 관리자용 전체 메뉴 아이템 렌더링 확인
   - AI 버튼 텍스트 상태별 표시 확인

3. **Integration Tests**
   - 사용자 역할 변경 시 UI 업데이트 확인
   - 권한 없는 기능 접근 차단 확인

### User Acceptance Tests
1. **General User Experience**
   - 일반 사용자로 로그인 후 제한된 메뉴만 표시되는지 확인
   - AI 토글 기능이 올바른 텍스트로 표시되는지 확인

2. **Admin User Experience**
   - 관리자로 로그인 후 모든 메뉴가 표시되는지 확인
   - 기존 기능들이 정상 동작하는지 확인

## Implementation Approach

### Phase 1: Permission System Foundation
1. `useUserPermissions` 훅 생성
2. 사용자 역할 감지 로직 구현
3. 권한 매트릭스 정의

### Phase 2: UI Component Updates
1. UnifiedProfileButton 컴포넌트 수정
2. 조건부 렌더링 로직 추가
3. AI 버튼 텍스트 로직 개선

### Phase 3: Testing and Refinement
1. 단위 테스트 작성 및 실행
2. 사용자 시나리오 테스트
3. UI/UX 개선사항 적용

## Security Considerations

### Client-side Permission Enforcement
- **UI Level Only**: 클라이언트 사이드 권한 제어는 UI 표시 목적만
- **Server-side Validation**: 실제 기능 실행은 서버에서 권한 재검증 필요
- **No Sensitive Data Exposure**: 권한 정보에 민감한 데이터 포함하지 않음

### Authentication Integration
- **Existing Auth System**: 현재 Supabase 인증 시스템과 통합
- **Session Management**: 기존 세션 관리 로직 유지
- **Role Persistence**: 사용자 역할 정보는 세션 기간 동안 유지

## Performance Considerations

### Optimization Strategies
1. **Memoization**: 권한 계산 결과 메모이제이션
2. **Lazy Loading**: 권한 확인은 필요 시점에만 수행
3. **Minimal Re-renders**: 권한 변경 시에만 컴포넌트 리렌더링

### Caching Strategy
- **Permission Cache**: 사용자 권한 정보 단기 캐싱 (세션 기간)
- **Role Detection Cache**: 사용자 역할 감지 결과 캐싱
- **Cache Invalidation**: 인증 상태 변경 시 캐시 무효화

## Vercel 무료 티어 최적화

### 리소스 사용량 최소화
1. **클라이언트 사이드 처리**: 모든 권한 로직을 클라이언트에서 처리하여 서버리스 함수 호출 최소화
2. **로컬 스토리지 활용**: 사용자 권한 정보를 localStorage에 캐싱하여 반복 계산 방지
3. **번들 크기 최적화**: 권한 관련 코드를 최소화하여 번들 크기 증가 방지

### 서버리스 함수 호출 최소화
- **No API Calls**: 권한 확인을 위한 별도 API 호출 없음
- **Static Permission Logic**: 정적 권한 로직으로 런타임 계산 최소화
- **Edge Runtime 호환**: 필요 시 Edge Runtime에서 실행 가능한 가벼운 로직

### 메모리 사용량 최적화
- **Lightweight Hook**: useUserPermissions 훅을 최소한의 메모리로 구현
- **Conditional Imports**: 권한별 기능을 조건부로 임포트하여 메모리 절약
- **Garbage Collection**: 불필요한 권한 객체 즉시 해제

### 대역폭 최적화
- **No Additional Assets**: 권한 시스템을 위한 추가 에셋 로딩 없음
- **Minimal State Updates**: 권한 변경 시에만 최소한의 상태 업데이트
- **Efficient Re-rendering**: React.memo와 useMemo를 활용한 효율적 렌더링