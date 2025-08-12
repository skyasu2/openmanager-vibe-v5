# 🔧 GitHub 로그인 문제 해결 가이드

## 문제 상황

GitHub 로그인 시 "더미 수파베이스" 에러가 발생하는 경우, Supabase 환경변수가 제대로 설정되지 않았기 때문입니다.

## 즉시 해결 방법

### 1. `.env.local` 파일 확인

프로젝트 루트에 `.env.local` 파일이 있는지 확인하세요. 없다면:

```bash
cp .env.example .env.local
```

### 2. Supabase 환경변수 설정

`.env.local` 파일을 열고 다음 환경변수를 실제 값으로 설정하세요:

```bash
# 🗄️ Supabase 데이터베이스 설정
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...실제키입력
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...실제키입력
```

### 3. Supabase 프로젝트 설정 확인

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. Settings → API 섹션에서:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`에 복사
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 복사
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY`에 복사

### 4. GitHub OAuth 앱 설정

Supabase 대시보드에서:

1. Authentication → Providers → GitHub 활성화
2. GitHub OAuth 앱 생성:
   - [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
   - "New OAuth App" 클릭
   - 설정값:
     ```
     Application name: OpenManager Vibe v5
     Homepage URL: http://localhost:3000 (개발) 또는 https://your-domain.vercel.app (프로덕션)
     Authorization callback URL: https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
3. 생성된 Client ID와 Client Secret을 Supabase GitHub Provider 설정에 입력

### 5. 개발 서버 재시작

```bash
# 개발 서버 종료 (Ctrl+C)
# 다시 시작
npm run dev
```

## 환경별 설정

### 로컬 개발 환경

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제_anon_key_여기에_입력
```

### Vercel 배포 환경

1. Vercel 대시보드 → Settings → Environment Variables
2. 위와 동일한 환경변수 추가
3. 재배포 트리거

## 디버깅 팁

### 1. 환경변수 확인

브라우저 콘솔에서:

```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// https://dummy.supabase.co가 아닌 실제 URL이 나와야 함
```

### 2. 네트워크 탭 확인

- 개발자 도구 → Network 탭
- GitHub 로그인 시도
- supabase.co로의 요청이 실제 프로젝트 URL로 가는지 확인

### 3. 에러 메시지 확인

콘솔에 다음과 같은 메시지가 나타나면:

```
❌ Supabase URL이 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL을 설정하세요.
```

환경변수가 제대로 설정되지 않은 것입니다.

## 추가 도움

- Supabase 문서: https://supabase.com/docs/guides/auth/auth-github
- 프로젝트 환경변수 가이드: `/docs/environment-variables-guide.md`

## 완료 후 체크리스트

- [ ] `.env.local` 파일 생성됨
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨 (dummy가 아닌 실제 URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨 (dummy가 아닌 실제 키)
- [ ] 개발 서버 재시작함
- [ ] GitHub OAuth 앱 설정 완료
- [ ] Supabase에서 GitHub Provider 활성화됨