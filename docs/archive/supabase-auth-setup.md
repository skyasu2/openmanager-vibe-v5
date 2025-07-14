# Supabase Auth 설정 가이드

## 📦 필요한 패키지 설치

```bash
# Supabase Auth Helpers 설치
npm install @supabase/auth-helpers-nextjs

# NextAuth 제거 (선택사항)
npm uninstall next-auth
```

## 🔐 GitHub OAuth 설정 방법

### 1. Supabase Dashboard 설정

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **Authentication** 클릭
4. **Providers** 탭으로 이동
5. **GitHub** 찾아서 활성화

### 2. GitHub OAuth App 생성

1. GitHub 로그인
2. Settings → Developer settings → OAuth Apps
3. **New OAuth App** 클릭
4. 다음 정보 입력:
   - **Application name**: OpenManager Vibe v5
   - **Homepage URL**: https://your-app-domain.com
   - **Authorization callback URL**: 
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     (Supabase Dashboard의 GitHub Provider 설정에서 확인 가능)

5. **Register application** 클릭
6. Client ID와 Client Secret 복사

### 3. Supabase에 GitHub 정보 입력

1. Supabase Dashboard의 GitHub Provider 설정으로 돌아가기
2. **Client ID**와 **Client Secret** 입력
3. **Save** 클릭

### 4. 환경변수 설정

`.env.local` 파일에 다음 환경변수가 설정되어 있는지 확인:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **참고**: GitHub Client ID/Secret은 Supabase Dashboard에서 관리되므로 
> 애플리케이션 환경변수에 별도로 설정할 필요 없습니다.

## 🚀 사용 방법

### 로그인 구현

```typescript
import { signInWithGitHub } from '@/lib/supabase-auth';

const handleGitHubLogin = async () => {
  const { error } = await signInWithGitHub();
  if (error) {
    console.error('로그인 실패:', error);
  }
  // 성공 시 자동으로 리다이렉트됨
};
```

### 세션 확인

```typescript
import { getCurrentUser, isGitHubAuthenticated } from '@/lib/supabase-auth';

// GitHub 인증 여부 확인
const isGitHub = await isGitHubAuthenticated();

// 현재 사용자 정보 가져오기
const user = await getCurrentUser();
```

### 로그아웃

```typescript
import { signOut } from '@/lib/supabase-auth';

const handleLogout = async () => {
  await signOut();
  router.push('/login');
};
```

## 🛡️ 라우트 보호

`middleware.ts`에서 자동으로 보호된 경로에 대한 인증 체크가 수행됩니다:

- `/dashboard` - 대시보드
- `/admin` - 관리자 페이지
- `/system-boot` - 시스템 부팅 페이지
- `/api/dashboard/*` - 대시보드 API
- `/api/admin/*` - 관리자 API
- `/api/ai/*` - AI 기능 API
- `/api/servers/*` - 서버 관리 API

## 📌 주요 변경사항

### NextAuth → Supabase Auth 전환

1. **간소화된 구현**: OAuth 토큰 교환 로직을 Supabase가 처리
2. **보안 강화**: Supabase의 검증된 인증 시스템 사용
3. **유지보수 용이**: 환경변수 관리 간소화
4. **통합 관리**: 데이터베이스와 인증을 한 곳에서 관리

### 기능별 접근 권한

- **GitHub 인증 사용자**: 모든 기능 사용 가능
  - 시스템 시작/정지
  - 대시보드 접근
  - AI 기능 사용
  - 서버 관리

- **게스트 사용자**: 읽기 전용
  - 메인 페이지 보기
  - 공개 정보 열람
  - 시스템 시작 불가

## 🔍 문제 해결

### 로그인이 작동하지 않는 경우

1. Supabase Dashboard에서 GitHub Provider가 활성화되어 있는지 확인
2. GitHub OAuth App의 Callback URL이 정확한지 확인
3. 환경변수가 올바르게 설정되어 있는지 확인

### 세션이 유지되지 않는 경우

1. `supabase.auth.getSession()`으로 세션 상태 확인
2. 브라우저 쿠키가 차단되어 있지 않은지 확인
3. Supabase Dashboard의 Auth 설정 확인

## 📚 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Supabase GitHub OAuth 가이드](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Next.js와 Supabase 통합](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)