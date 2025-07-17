# 🔐 인증 중심 라우팅 가이드

> **최종 업데이트**: 2025년 7월 17일  
> **적용 버전**: v5.46.42  
> **주요 변경**: 인증 우선 라우팅 구조

## 📋 개요

OpenManager VIBE는 이제 인증이 필요한 폐쇄형 시스템으로 전환되었습니다. 모든 사용자는 먼저 로그인 페이지를 거쳐야 하며, 인증 후에만 메인 애플리케이션에 접근할 수 있습니다.

## 🗺️ 라우팅 구조

### 주요 라우트

```
/              → /login으로 자동 리다이렉션
/login         → 로그인 페이지 (GitHub OAuth & 게스트)
/main          → 메인 애플리케이션 (구 /)
/auth/callback → OAuth 콜백 처리
```

### 파일 구조 변경

```
src/app/
├── page.tsx         # 루트 페이지 (리다이렉션)
├── login/
│   └── page.tsx     # 로그인 페이지
├── main/
│   └── page.tsx     # 메인 애플리케이션 (이전의 /)
└── auth/
    └── callback/
        └── route.ts # OAuth 콜백 핸들러
```

## 🔄 로그인 플로우

### GitHub OAuth 로그인
```mermaid
graph LR
    A[/] --> B[/login]
    B --> C[GitHub OAuth]
    C --> D[/auth/callback]
    D --> E[/main]
```

### 게스트 로그인
```mermaid
graph LR
    A[/] --> B[/login]
    B --> C[게스트 인증]
    C --> D[/main]
```

### 로그아웃
```mermaid
graph LR
    A[/main] --> B[로그아웃]
    B --> C[/login]
```

## 💻 구현 세부사항

### 1. 루트 리다이렉션 (`src/app/page.tsx`)

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-white">리다이렉션 중...</div>
    </div>
  );
}
```

### 2. 로그인 성공 처리

```typescript
// 게스트 로그인 후
router.push('/main');

// OAuth 콜백에서
const redirect = requestUrl.searchParams.get('redirect') || '/main';
```

### 3. 로그아웃 처리

```typescript
// ProfileDropdown.tsx
await logout();
router.push('/login');
```

## 🔧 마이그레이션 가이드

### 기존 프로젝트 업데이트

1. **메인 페이지 이동**
   ```bash
   mkdir -p src/app/main
   mv src/app/page.tsx src/app/main/page.tsx
   ```

2. **루트 리다이렉션 페이지 생성**
   - 새 `src/app/page.tsx` 파일 생성
   - 위의 리다이렉션 코드 추가

3. **경로 업데이트**
   - 모든 `href="/"` → `href="/main"`
   - 모든 `router.push('/')` → `router.push('/main')`
   - 로그아웃 시 `router.push('/login')`

4. **에러 페이지 업데이트**
   - `not-found.tsx`, `error.tsx`, `500.tsx` 등의 홈 링크 수정

## 📝 주의사항

- **Middleware 불필요**: 루트 페이지에서 직접 리다이렉션 처리
- **SEO 영향**: 루트 페이지가 로그인으로 리다이렉션되므로 공개 콘텐츠 없음
- **성능**: 클라이언트 사이드 리다이렉션이므로 약간의 지연 발생

## 🎯 장점

1. **명확한 인증 플로우**: 모든 사용자가 동일한 경로 거침
2. **보안 강화**: 인증 없이는 앱 접근 불가
3. **사용자 경험**: 일관된 로그인 경험 제공

## 🔗 관련 문서

- [인증 설정 가이드](./auth-setup-guide.md)
- [Supabase OAuth 설정](./archive/supabase-github-oauth-setup.md)
- [시스템 아키텍처](./system-architecture.md)