# 🔧 Vercel OAuth 리다이렉트 문제 해결 가이드

## 🔍 문제 상황

- **환경**: Vercel 배포 (https://openmanager-vibe-v5.vercel.app)
- **증상**: GitHub OAuth 로그인 성공 후 `/auth/success`에서 `/main`으로 이동하지 않고 로그인 페이지로 돌아감
- **로컬 환경**: 정상 작동

## 🎯 주요 원인 분석

### 1. 환경변수 불일치

```bash
# .env.local (로컬)
NEXTAUTH_URL=https://openmanager-vibe-v5.vercel.app
NEXT_PUBLIC_SITE_URL=https://openmanager-vibe-v5.vercel.app

# Vercel 환경변수 (배포)
NEXTAUTH_URL=??? # 설정 필요
```

### 2. Supabase OAuth 콜백 URL 설정

```
현재 설정: https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback
필요한 설정: https://openmanager-vibe-v5.vercel.app/auth/callback
```

### 3. GitHub OAuth App 설정

```
Authorization callback URL:
- https://openmanager-vibe-v5.vercel.app/auth/callback
- https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback
```

## 🛠️ 해결 방법

### 1단계: Vercel 환경변수 설정

```bash
# Vercel 대시보드에서 설정 필요
NEXTAUTH_URL=https://openmanager-vibe-v5.vercel.app
NEXT_PUBLIC_APP_URL=https://openmanager-vibe-v5.vercel.app
NEXT_PUBLIC_SITE_URL=https://openmanager-vibe-v5.vercel.app

# GitHub OAuth 설정
GITHUB_CLIENT_ID=Ov23liFnUsRO0ttNegju
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
GITHUB_TOKEN=ghp_YOUR_GITHUB_TOKEN_HERE

# Supabase 설정
SUPABASE_URL=https://vnswjnltnhpsueosf.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# 암호화 키
ENCRYPTION_KEY=openmanager-vibe-v5-2025-production-key
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
```

### 2단계: Supabase OAuth 설정 확인

1. Supabase 대시보드 → Authentication → URL Configuration
2. Site URL: `https://openmanager-vibe-v5.vercel.app`
3. Redirect URLs 추가:
   - `https://openmanager-vibe-v5.vercel.app/auth/callback`
   - `https://openmanager-vibe-v5.vercel.app/auth/success`

### 3단계: GitHub OAuth App 설정 확인

1. GitHub → Settings → Developer settings → OAuth Apps
2. Application name: `OpenManager Vibe v5`
3. Homepage URL: `https://openmanager-vibe-v5.vercel.app`
4. Authorization callback URL: `https://vnswjnltnhpsueosf.supabase.co/auth/v1/callback`

## 🔧 코드 수정 사항

### 1. 환경변수 동적 감지 개선

```typescript
// src/app/auth/success/page.tsx
const isVercel =
  window.location.hostname.includes('vercel.app') ||
  process.env.VERCEL === '1' ||
  process.env.VERCEL_ENV !== undefined;
```

### 2. 리다이렉트 로직 강화

```typescript
// window.location.href 사용으로 완전한 페이지 새로고침
window.location.href = redirectTo;
```

### 3. 세션 확인 재시도 로직

```typescript
// Vercel 환경에서 더 많은 재시도와 긴 대기시간
const maxRetries = isVercel ? 7 : 5;
const waitTime = isVercel ? 2000 : 1000;
```

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
npm run dev
# http://localhost:3000/login에서 GitHub 로그인 테스트
```

### 2. Vercel 배포 테스트

```bash
npm run deploy
# https://openmanager-vibe-v5.vercel.app/login에서 테스트
```

### 3. 디버깅 로그 확인

```javascript
// 브라우저 콘솔에서 확인
console.log('🍪 쿠키 상태:', document.cookie);
console.log('🌍 환경:', window.location.hostname);
```

## 📋 체크리스트

### Vercel 설정

- [ ] 환경변수 모두 설정됨
- [ ] 도메인 설정 확인
- [ ] 빌드 성공 확인

### Supabase 설정

- [ ] Site URL 설정
- [ ] Redirect URLs 설정
- [ ] OAuth Provider 활성화

### GitHub OAuth 설정

- [ ] Callback URL 정확히 설정
- [ ] Client ID/Secret 일치
- [ ] 앱 활성화 상태

### 코드 설정

- [ ] 환경변수 참조 정확
- [ ] 리다이렉트 로직 작동
- [ ] 에러 핸들링 적절

## 🚨 주의사항

1. **환경변수 동기화**: 로컬과 Vercel 환경변수가 일치해야 함
2. **캐시 문제**: Vercel 배포 후 브라우저 캐시 클리어 필요
3. **도메인 일치**: 모든 설정에서 동일한 도메인 사용
4. **HTTPS 필수**: OAuth는 HTTPS 환경에서만 정상 작동

## 🔄 배포 후 확인사항

1. 환경변수 로드 확인: `/api/health`
2. OAuth 플로우 테스트: `/login`
3. 세션 지속성 확인: `/main`
4. 에러 로그 모니터링: Vercel 대시보드

---

**작성일**: 2025-07-24  
**대상 환경**: Vercel + Supabase + GitHub OAuth  
**상태**: 해결 진행 중
