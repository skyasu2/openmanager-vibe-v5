# 🔧 환경변수 설정 가이드

OpenManager Vibe v5 배포를 위한 환경변수 설정 가이드입니다.

## ✅ **현재 설정 상태 (2025-06-06 업데이트)**

> **환경변수 설정 완료**: 모든 필수 환경변수가 Vercel과 로컬 환경에 설정되었습니다.
>
> - ✅ **Supabase**: `https://vnswjnltnhpsueosfhmw.supabase.co` (연결됨)
> - ✅ **Redis**: `https://charming-condor-46598.upstash.io` (연결됨)
> - ✅ **Vercel 환경변수**: 모든 필수 변수 설정 완료
> - ✅ **로컬 개발환경**: `.env.local` 파일 설정 완료

## 📋 **필수 환경변수 목록**

### 🗄️ **Supabase 설정** ✅

```env
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=qNzA4/WgbksJU3xxkQJcfbCRkXhgBR...
```

### 🔴 **Redis 설정 (Vercel KV)** ✅

```env
# 현재 사용 중인 Vercel KV 설정
KV_REST_API_URL=https://charming-condor-46598.upstash.io
KV_REST_API_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0...
KV_REST_API_READ_ONLY_TOKEN=ArYGAAIgcDEJt2OXeBDen9ob7Ll...
KV_URL=rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0...
REDIS_URL=rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0...

# 레거시 호환성 (자동 매핑됨)
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0...
```

### 🗃️ **PostgreSQL 설정** ✅

```env
POSTGRES_URL=postgres://postgres:2D3DWhSl8HBlgYIm@db.vnswjnltnhpsueosfhmw.supabase.co:6543/postgres?sslmode=require
POSTGRES_PRISMA_URL=postgres://postgres:2D3DWhSl8HBlgYIm@db.vnswjnltnhpsueosfhmw.supabase.co:6543/postgres?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://postgres:2D3DWhSl8HBlgYIm@db.vnswjnltnhpsueosfhmw.supabase.co:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_PASSWORD=2D3DWhSl8HBlgYIm
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.vnswjnltnhpsueosfhmw.supabase.co
```

### 🌐 **애플리케이션 설정**

```env
NEXT_PUBLIC_APP_URL=https://openmanager-vibe-v5.vercel.app
```

## 🚀 **로컬 개발 환경 설정**

### 1. `.env.local` 파일 확인 ✅

프로젝트 루트의 `.env.local` 파일이 이미 설정되어 있습니다:

```bash
# 현재 설정된 환경변수 확인
cat .env.local
```

### 2. 개발 서버 재시작

환경변수 변경 후에는 개발 서버를 재시작하세요:

```bash
# 기존 서버 종료 후
npm run dev
```

## ☁️ **Vercel 배포 환경 설정** ✅

### 1. 현재 Vercel 환경변수 상태

```bash
# 설정된 환경변수 확인 (2025-06-06 기준)
vercel env ls
```

**확인된 환경변수:**

- ✅ KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN
- ✅ NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
- ✅ POSTGRES\_\* (모든 PostgreSQL 관련 변수)

### 2. 자동 배포 설정 ✅

GitHub Actions를 통한 자동 배포가 설정되어 있습니다:

- `main` 브랜치 푸시 시 자동 배포
- Vercel 환경변수 자동 적용

## 🔄 **환경변수 매핑 시스템**

시스템에서 자동으로 처리되는 환경변수 매핑:

```typescript
// src/lib/env.ts에서 자동 매핑
UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL;
UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN;
```

이를 통해 Vercel KV와 Upstash Redis 모두 호환됩니다.

## 🧪 **연결 상태 테스트**

### 실시간 상태 확인

```bash
# 시스템 전체 상태
curl https://openmanager-vibe-v5.vercel.app/api/health

# 데이터베이스 연결 상태
curl https://openmanager-vibe-v5.vercel.app/api/database/status

# Keep-Alive 상태
curl https://openmanager-vibe-v5.vercel.app/api/cron/keep-alive
```

### 로컬 환경 테스트

```bash
# 빌드 테스트
npm run build

# 로컬 서버 상태 확인
curl http://localhost:3000/api/health
```

## ⚠️ **주의사항**

### 🔒 **보안**

- ✅ `.env.local`이 `.gitignore`에 포함되어 Git 추적에서 제외됨
- ✅ 민감한 키들이 서버 전용으로 설정됨
- ✅ `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트 노출

### 🔄 **배포 프로세스**

1. **코드 변경** → Git 푸시
2. **GitHub Actions** → 자동 빌드 및 테스트
3. **Vercel** → 자동 배포 (환경변수 자동 적용)

## 🆘 **문제 해결**

### ✅ **해결된 문제들**

- ~~"supabaseUrl is required" 에러~~ → **해결됨**
- ~~Redis 연결 실패~~ → **해결됨**
- ~~더미 값 사용 문제~~ → **해결됨**
- ~~환경변수 매핑 문제~~ → **해결됨**

### 🔧 **현재 작동 중인 기능**

- ✅ Supabase 데이터베이스 연결
- ✅ Redis/KV 캐시 시스템
- ✅ Keep-Alive 시스템
- ✅ 자동 배포 파이프라인
- ✅ 환경변수 매핑 시스템

## 📊 **시스템 모니터링**

### 실시간 대시보드

- **프로덕션**: https://openmanager-vibe-v5.vercel.app/dashboard
- **로컬**: http://localhost:3000/dashboard

### 로그 및 메트릭

```bash
# Vercel 로그 확인
vercel logs

# 로컬 개발 로그는 터미널에서 확인
```

---

## 🎯 **설정 완료 확인**

**✅ 모든 환경변수가 설정되고 연결이 확인되었습니다!**

```bash
# 최종 빌드 테스트
npm run build

# 결과: ✅ 115개 정적 페이지 생성 성공
# Keep-Alive: ✅ Supabase 연결 성공
# Cache: ✅ Redis 연결 성공
```

**마지막 업데이트**: 2025-06-06 13:32 KST
