# 🔐 OpenManager VIBE v5 인증 플로우 완전 가이드

> **최종 업데이트**: 2025년 1월 19일  
> **적용 버전**: v5.50.0  
> **주요 변경**: GitHub OAuth + 게스트 모드 통합 플로우

## 📋 목차

1. [인증 플로우 개요](#-인증-플로우-개요)
2. [전체 접속 과정 분석](#-전체-접속-과정-분석)
3. [단계별 상세 분석](#-단계별-상세-분석)
4. [사용자 타입별 차이점](#-사용자-타입별-차이점)
5. [핵심 컴포넌트](#-핵심-컴포넌트)
6. [성능 및 최적화](#-성능-및-최적화)
7. [문제 해결 가이드](#-문제-해결-가이드)

---

## 🔍 인증 플로우 개요

OpenManager VIBE v5는 **Supabase Auth 기반 GitHub OAuth**와 **게스트 모드**를 지원하는 이중 인증 시스템을 사용합니다.

### 지원하는 인증 방식

| 인증 방식 | 권한 레벨 | 접근 가능 기능 |
|-----------|-----------|----------------|
| **GitHub OAuth** | 전체 권한 | 시스템 시작/정지, 대시보드, AI 사이드바 |
| **게스트 모드** | 읽기 전용 | 메인 페이지 열람, 제한된 기능 |

### 전체 플로우 차트

```mermaid
graph TD
    A[사용자가 루트 페이지 접속] --> B{인증 상태 확인}
    B -->|인증됨| C[메인 페이지로 리다이렉트]
    B -->|미인증| D[로그인 페이지로 리다이렉트]
    
    D --> E[GitHub 로그인 클릭]
    E --> F[GitHub OAuth 인증]
    F --> G[/auth/callback 처리]
    G --> H[세션 생성 후 /main 리다이렉트]
    
    D --> I[게스트 로그인 클릭]
    I --> J[게스트 세션 생성]
    J --> K[/main 리다이렉트]
    
    C --> L{사용자 타입 확인}
    H --> L
    K --> L
    L -->|GitHub 사용자| M[시스템 시작 버튼 표시]
    L -->|게스트 사용자| N[로그인 안내 메시지]
    
    M --> O[시스템 시작 버튼 클릭]
    O --> P[대시보드로 이동]
    P --> Q[AI 사이드바 토글 버튼 표시]
    Q --> R[AI 사이드바 열기/닫기]
```

---

## 🎯 전체 접속 과정 분석

### 루트 페이지부터 AI 사이드바까지의 완전한 여정

#### **1단계: 루트 페이지 접속** (`/`)
```typescript
// src/app/page.tsx
const checkAuthAndRedirect = async () => {
  const authenticated = await isAuthenticated();
  const user = await getCurrentUser();
  
  if (authenticated && user) {
    router.replace('/main');  // 인증된 사용자
  } else {
    router.replace('/login'); // 미인증 사용자
  }
};
```

**처리 시간**: ~1초 (리다이렉트)

#### **2단계: 로그인 페이지** (`/login`)
```typescript
// src/app/login/page.tsx
const handleGitHubLogin = async () => {
  const { error } = await signInWithGitHub();
  // 성공 시 GitHub OAuth로 리다이렉트
};

const handleGuestLogin = async () => {
  const result = await authManager.authenticateGuest();
  if (result.success) {
    router.push('/main');
  }
};
```

**처리 시간**: 
- GitHub OAuth: ~3-5초 (사용자 승인)
- 게스트 로그인: ~1초 (즉시)

#### **3단계: GitHub OAuth 인증**
- GitHub 인증 페이지에서 사용자 승인
- 콜백 URL로 리다이렉트: `/auth/callback`

**처리 시간**: ~3-5초 (사용자 승인 시간)

#### **4단계: 인증 콜백 처리** (`/auth/callback`)
```typescript
// src/app/auth/callback/route.ts
const { error } = await supabase.auth.exchangeCodeForSession(code);
// 세션 생성 후 /main으로 리다이렉트
return NextResponse.redirect(`${requestUrl.origin}/main`);
```

**처리 시간**: ~1-2초 (세션 생성)

#### **5단계: 메인 페이지** (`/main`)
```typescript
// src/app/main/page.tsx
const isGitHub = await isGitHubAuthenticated();
setIsGitHubUser(isGitHub);

// GitHub 사용자: 시스템 시작 버튼 표시
// 게스트 사용자: 로그인 안내 메시지
```

**처리 시간**: ~2-3초 (컴포넌트 렌더링)

#### **6단계: 대시보드 이동** (`/dashboard`)
```typescript
// 메인 페이지에서 시스템 시작 또는 대시보드 버튼 클릭
const handleDashboardClick = () => {
  router.push('/dashboard');
};
```

**처리 시간**: ~1-2초 (페이지 전환)

#### **7단계: AI 사이드바 활성화**
```typescript
// src/app/dashboard/page.tsx
const [isAgentOpen, setIsAgentOpen] = useState(false);

const toggleAgent = useCallback(() => {
  setIsAgentOpen(prev => !prev);
}, []);

// AI 사이드바 렌더링
{isAgentOpen && (
  <AISidebar onClose={closeAgent} isOpen={isAgentOpen} />
)}
```

**처리 시간**: ~0.3초 (애니메이션)

### **총 소요 시간: 약 8-14초** (GitHub 인증 시간 포함)

---

## 📊 단계별 상세 분석

### 1. 루트 페이지 (`src/app/page.tsx`)

**역할**: 스마트 리다이렉션
- 인증된 사용자 → `/main`
- 미인증 사용자 → `/login`

**핵심 로직**:
```typescript
const authenticated = await isAuthenticated();
const user = await getCurrentUser();

console.log('🔍 루트 페이지 인증 체크:', { authenticated, user });

if (authenticated && user) {
  console.log('✅ 인증된 사용자 - 메인 페이지로 이동');
  router.replace('/main');
} else {
  console.log('❌ 미인증 사용자 - 로그인 페이지로 이동');
  router.replace('/login');
}
```

### 2. 로그인 페이지 (`src/app/login/page.tsx`)

**역할**: 이중 인증 방식 제공

**GitHub OAuth 플로우**:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${redirectUrl}?redirect=/main`,
    scopes: 'read:user user:email',
  },
});
```

**게스트 로그인 플로우**:
```typescript
const result = await authManager.authenticateGuest();
if (result.success && result.user && result.sessionId) {
  // localStorage + 쿠키에 세션 저장
  localStorage.setItem('auth_session_id', result.sessionId);
  document.cookie = `guest_session_id=${result.sessionId}; path=/`;
  router.push('/main');
}
```

### 3. 인증 콜백 (`src/app/auth/callback/route.ts`)

**역할**: OAuth 코드를 세션으로 교환

**핵심 처리**:
```typescript
const { error } = await supabase.auth.exchangeCodeForSession(code);

if (error) {
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}

// 세션 정보 확인
const { data: { session } } = await supabase.auth.getSession();
console.log('🔐 생성된 세션:', {
  userId: session?.user?.id,
  email: session?.user?.email,
  provider: session?.user?.app_metadata?.provider,
});

// 성공 시 메인 페이지로 리다이렉트
return NextResponse.redirect(`${requestUrl.origin}/main`);
```

### 4. 메인 페이지 (`src/app/main/page.tsx`)

**역할**: 사용자 타입별 차별화된 UI 제공

**사용자 타입 감지**:
```typescript
const isGitHub = await isGitHubAuthenticated();
setIsGitHubUser(isGitHub);

const user = await getCurrentUser();
if (user) {
  setCurrentUser({
    name: user.name || 'User',
    email: user.email,
    avatar: user.avatar
  });
}
```

**조건부 렌더링**:
```typescript
{isGitHubUser ? (
  // GitHub 사용자: 시스템 시작 버튼
  <motion.button onClick={handleSystemToggle}>
    🚀 시스템 시작
  </motion.button>
) : (
  // 게스트 사용자: 로그인 안내
  <div>GitHub 로그인이 필요합니다</div>
)}
```

### 5. 대시보드 (`src/app/dashboard/page.tsx`)

**역할**: 서버 모니터링 및 AI 사이드바 제공

**AI 사이드바 상태 관리**:
```typescript
const [isAgentOpen, setIsAgentOpen] = useState(false);

const toggleAgent = useCallback(() => {
  setIsAgentOpen(prev => !prev);
}, []);

const closeAgent = useCallback(() => {
  setIsAgentOpen(false);
}, []);
```

**AI 사이드바 렌더링**:
```typescript
<AnimatePresence>
  {isAgentOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className='fixed inset-y-0 right-0 w-96 z-40'
    >
      <AISidebar onClose={closeAgent} isOpen={isAgentOpen} />
    </motion.div>
  )}
</AnimatePresence>
```

---

## 👥 사용자 타입별 차이점

### GitHub 사용자 vs 게스트 사용자

| 기능 | GitHub 사용자 | 게스트 사용자 |
|------|---------------|---------------|
| **시스템 시작** | ✅ 가능 | ❌ 불가능 |
| **대시보드 접근** | ✅ 가능 | ❌ 불가능 |
| **AI 사이드바** | ✅ 전체 기능 | ❌ 접근 불가 |
| **서버 관리** | ✅ 전체 권한 | ❌ 읽기 전용 |
| **시스템 제어** | ✅ 시작/정지 | ❌ 제한됨 |

### 메인 페이지에서의 차이

**GitHub 사용자 화면**:
```typescript
<motion.button
  onClick={handleSystemToggle}
  className="bg-gradient-to-r from-blue-500 to-purple-600"
>
  🚀 시스템 시작
</motion.button>
```

**게스트 사용자 화면**:
```typescript
<div className="bg-blue-500/10 border border-blue-400/30">
  <LogIn className="w-12 h-12 text-blue-400" />
  <h3>GitHub 로그인이 필요합니다</h3>
  <p>시스템 시작 기능은 GitHub 인증된 사용자만 사용할 수 있습니다.</p>
  <button onClick={() => router.push('/login')}>
    로그인 페이지로 이동
  </button>
</div>
```

---

## 🔧 핵심 컴포넌트

### 인증 관련 컴포넌트

1. **`src/lib/supabase-auth.ts`** - GitHub OAuth 처리
2. **`src/middleware.ts`** - 경로 보호 및 인증 체크
3. **`src/app/auth/callback/route.ts`** - OAuth 콜백 처리
4. **`src/services/auth/AuthStateManager.ts`** - 게스트 인증 관리

### 페이지 컴포넌트

1. **`src/app/page.tsx`** - 루트 리다이렉션
2. **`src/app/login/page.tsx`** - 로그인 인터페이스
3. **`src/app/main/page.tsx`** - 메인 대시보드
4. **`src/app/dashboard/page.tsx`** - 서버 모니터링 대시보드

### AI 사이드바 컴포넌트

1. **`src/presentation/ai-sidebar/components/AISidebar.tsx`** - 래퍼
2. **`src/domains/ai-sidebar/components/AISidebarV2.tsx`** - 실제 구현체
3. **`src/components/ai/SimplifiedAISidebar.tsx`** - 간소화 버전 (백업됨)

---

## ⚡ 성능 및 최적화

### 최적화 포인트

1. **프리로딩**: 메인 페이지에서 대시보드 컴포넌트 미리 로드
2. **캐싱**: 인증 상태 및 사용자 정보 캐싱
3. **지연 로딩**: AI 사이드바 컴포넌트 동적 로딩
4. **상태 관리**: 전역 상태로 사용자 정보 공유

### 성능 메트릭

- **초기 로드**: ~2-3초
- **인증 처리**: ~1-2초
- **페이지 전환**: ~1초
- **AI 사이드바**: ~0.3초

### 최적화 기법

```typescript
// 동적 import로 번들 크기 최적화
const DashboardContent = dynamic(
  () => import('../../components/dashboard/DashboardContent')
);

// 메모이제이션으로 불필요한 리렌더링 방지
const toggleAgent = useCallback(() => {
  setIsAgentOpen(prev => !prev);
}, []);

// 조건부 렌더링으로 성능 향상
{isAgentOpen && <AISidebar />}
```

---

## 🔍 문제 해결 가이드

### 일반적인 문제들

#### 1. GitHub 로그인 후 메인 페이지로 이동하지 않음

**원인**: 콜백 URL 설정 오류
**해결**:
```bash
# GitHub OAuth App 설정 확인
Authorization callback URL: https://your-domain.com/auth/callback

# Supabase 설정 확인
Site URL: https://your-domain.com
Redirect URLs: https://your-domain.com/auth/callback
```

#### 2. 게스트 로그인이 작동하지 않음

**원인**: LocalStorage 또는 쿠키 문제
**해결**:
```typescript
// 브라우저 콘솔에서 확인
console.log(localStorage.getItem('auth_session_id'));
console.log(document.cookie);

// 수동 정리
localStorage.clear();
```

#### 3. AI 사이드바가 열리지 않음

**원인**: 권한 부족 또는 컴포넌트 로딩 실패
**해결**:
```typescript
// 사용자 타입 확인
const isGitHub = await isGitHubAuthenticated();
console.log('GitHub 사용자:', isGitHub);

// 컴포넌트 상태 확인
console.log('AI 사이드바 열림:', isAgentOpen);
```

### 디버깅 도구

#### 인증 상태 확인
```typescript
// 브라우저 콘솔에서 실행
const checkAuth = async () => {
  const { getCurrentUser, isAuthenticated } = await import('/lib/supabase-auth');
  const user = await getCurrentUser();
  const auth = await isAuthenticated();
  console.log({ user, auth });
};
checkAuth();
```

#### 세션 정보 확인
```typescript
// Supabase 세션 확인
import { supabase } from '/lib/supabase';
const { data: { session } } = await supabase.auth.getSession();
console.log('Supabase 세션:', session);
```

---

## 📚 관련 문서

- [인증 설정 가이드](./auth-setup-guide.md)
- [인증 라우팅 가이드](./auth-routing-guide.md)
- [시스템 아키텍처](./system-architecture.md)
- [AI 시스템 통합 가이드](./ai-system-unified-guide.md)

---

## 🎯 요약

OpenManager VIBE v5의 인증 플로우는 다음과 같은 특징을 가집니다:

1. **이중 인증 시스템**: GitHub OAuth + 게스트 모드
2. **권한 기반 접근 제어**: 사용자 타입별 차별화된 기능
3. **완전한 보안**: 모든 주요 기능은 GitHub 인증 필요
4. **사용자 친화적**: 게스트 모드로 기본 기능 체험 가능
5. **성능 최적화**: 지연 로딩 및 캐싱으로 빠른 응답

이 가이드를 통해 전체 인증 플로우를 이해하고, 문제 발생 시 효과적으로 디버깅할 수 있습니다.