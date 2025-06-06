# 🔧 환경변수 설정 가이드

OpenManager Vibe v5 배포를 위한 환경변수 설정 가이드입니다.

## 📋 **필수 환경변수 목록**

### 🗄️ **Supabase 설정**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 🔴 **Redis 설정 (Upstash 또는 Vercel KV)**

```env
# Option 1: Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Option 2: Vercel KV (자동 설정됨)
KV_REST_API_URL=https://your-kv.kv.vercel-storage.com
KV_REST_API_TOKEN=your_kv_token
```

### 🌐 **애플리케이션 설정**

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=your_secure_cron_secret
```

## 🚀 **로컬 개발 환경 설정**

### 1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 위 환경변수들을 설정하세요.

```bash
# .env.local.example을 복사하여 시작
cp .env.local.example .env.local
```

### 2. 실제 값으로 교체

각 환경변수를 실제 서비스의 값으로 교체하세요.

## ☁️ **Vercel 배포 환경 설정**

### 1. Vercel 대시보드에서 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)로 이동
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 각 환경변수를 **Production**, **Preview**, **Development** 환경에 추가

### 2. 환경변수 확인

```bash
# 현재 설정된 환경변수 확인
vercel env ls

# 개발 환경변수를 로컬로 가져오기
vercel env pull .env.vercel
```

## 🔍 **환경변수 획득 방법**

### 📊 **Supabase 설정**

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 → **Settings** → **API**
3. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 🔴 **Redis 설정 (Upstash)**

1. [Upstash Console](https://console.upstash.com/) 접속
2. Redis 데이터베이스 생성
3. **REST API** 탭에서 URL과 토큰 복사
4. `UPSTASH_REDIS_REST_URL`과 `UPSTASH_REDIS_REST_TOKEN` 설정

### 🔴 **Redis 설정 (Vercel KV)**

1. Vercel 프로젝트에서 **Storage** 탭
2. **Create Database** → **KV**
3. 자동으로 `KV_REST_API_URL`과 `KV_REST_API_TOKEN` 설정됨

## ⚠️ **주의사항**

### 🔒 **보안**

- `.env.local` 파일은 **절대 Git에 커밋하지 마세요**
- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에서 접근 가능
- Service Role Key는 서버에서만 사용하세요

### 🔄 **배포 후 변경**

- 환경변수 변경 후에는 **재배포**가 필요합니다
- Vercel에서 환경변수 변경 → **Redeploy** 버튼 클릭

### 🧪 **테스트**

```bash
# 환경변수 로드 테스트
npm run build

# Keep-Alive 엔드포인트 테스트
curl https://your-app.vercel.app/api/cron/keep-alive
```

## 🆘 **문제 해결**

### ❌ **"supabaseUrl is required" 에러**

- `NEXT_PUBLIC_SUPABASE_URL`이 설정되지 않음
- Vercel 환경변수에서 확인 후 재배포

### ❌ **Redis 연결 실패**

- `KV_REST_API_URL` 또는 `UPSTASH_REDIS_REST_URL` 확인
- 토큰이 올바른지 확인

### ❌ **빌드 실패**

- 모든 필수 환경변수가 설정되었는지 확인
- `vercel env ls`로 환경변수 목록 확인

## 📞 **지원**

문제가 지속되면 다음을 확인하세요:

1. 환경변수 이름 오타 확인
2. 값에 공백이나 특수문자 포함 여부
3. Vercel 환경변수가 모든 환경(Production, Preview, Development)에 설정되었는지 확인

---

✅ **설정 완료 후 `npm run build`로 빌드 테스트를 진행하세요!**
