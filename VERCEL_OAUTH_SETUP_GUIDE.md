# 🚀 Vercel OAuth 설정 완전 가이드

## 🎯 현재 상황

- ✅ 코드 배포 완료: https://openmanager-vibe-v5.vercel.app
- ❌ OAuth 로그인 작동 안함 (환경변수 및 Supabase 설정 누락)

## 📋 필수 설정 체크리스트

### 1️⃣ **Supabase 프로젝트 설정 (최우선)**

**Step 1**: Supabase Dashboard 접속

```
https://supabase.com/dashboard
```

**Step 2**: 새 프로젝트 생성 또는 기존 프로젝트 사용

- 프로젝트명: `openmanager-vibe-v5`
- 리전: 가까운 지역 선택

**Step 3**: 환경변수 값 복사

```
Settings → API → Project URL & API Keys
```

### 2️⃣ **Vercel 환경변수 설정**

**Step 1**: Vercel Dashboard 접속

```
https://vercel.com/dashboard
```

**Step 2**: 프로젝트 선택 → Settings → Environment Variables

**Step 3**: 다음 환경변수들 추가:

```bash
# 필수 - 애플리케이션 URL
NEXT_PUBLIC_APP_URL=https://openmanager-vibe-v5.vercel.app

# 필수 - Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# 선택사항 - Google AI (AI 기능 사용시)
GOOGLE_AI_API_KEY=[your-google-ai-key]
GOOGLE_AI_ENABLED=true

# 선택사항 - Redis (캐싱 사용시)
UPSTASH_REDIS_REST_URL=[your-redis-url]
UPSTASH_REDIS_REST_TOKEN=[your-redis-token]
```

### 3️⃣ **Supabase Authentication 설정**

**Step 1**: Supabase Dashboard → Authentication → URL Configuration

**Step 2**: Site URL 설정

```
Site URL: https://openmanager-vibe-v5.vercel.app
```

**Step 3**: Redirect URLs 설정

```
Additional Redirect URLs에 추가:
- https://openmanager-vibe-v5.vercel.app/auth/callback
- http://localhost:3000/auth/callback (개발용)
```

### 4️⃣ **GitHub OAuth App 설정**

**Step 1**: GitHub → Settings → Developer settings → OAuth Apps

**Step 2**: New OAuth App 또는 기존 앱 수정

```
Application name: OpenManager VIBE v5
Homepage URL: https://openmanager-vibe-v5.vercel.app
Authorization callback URL: https://[your-supabase-project].supabase.co/auth/v1/callback
```

**Step 3**: Client ID와 Client Secret을 Supabase에 등록

```
Supabase Dashboard → Authentication → Providers → GitHub
- GitHub enabled: ON
- Client ID: [github-client-id]
- Client Secret: [github-client-secret]
```

## 🧪 **설정 완료 후 테스트 순서**

### 1. Vercel 재배포

```bash
# 로컬에서 푸시하여 재배포 트리거
git commit --allow-empty -m "🔄 환경변수 설정 후 재배포"
git push origin main
```

### 2. 설정 검증

```bash
# 로컬에서 OAuth 테스트 도구 실행
npm run oauth:test
```

### 3. 실제 로그인 테스트

```
1. https://openmanager-vibe-v5.vercel.app 접속
2. 로그인 페이지 확인
3. "GitHub로 계속하기" 클릭
4. GitHub 인증 후 /main으로 리다이렉트 확인
```

## 🚨 **문제 해결 가이드**

### 환경변수 관련 에러

```bash
# 환경변수 상태 확인
npm run env:status

# Vercel 로그 확인
vercel logs [deployment-url]
```

### OAuth 리다이렉트 에러

1. Supabase URL Configuration 재확인
2. GitHub OAuth App 콜백 URL 재확인
3. 브라우저 개발자 도구 Network 탭에서 리다이렉트 추적

### 세션/쿠키 문제

- 브라우저 캐시 및 쿠키 삭제 후 재시도
- Incognito/Private 모드에서 테스트

## ⏰ **예상 소요 시간**

- 환경변수 설정: 5분
- Supabase 설정: 10분
- GitHub OAuth 설정: 5분
- 총 소요시간: **약 20분**

## 🎯 **성공 확인 방법**

1. ✅ 로그인 페이지 정상 로드
2. ✅ GitHub OAuth 버튼 클릭시 GitHub으로 리다이렉트
3. ✅ GitHub 인증 후 /main 페이지로 정상 리다이렉트
4. ✅ 사용자 정보 표시 (우상단 프로필)
5. ✅ 로그아웃 기능 정상 작동
