# 🚀 OpenManager Vibe v5 - 빠른 배포 설정 가이드

## 📋 현재 상황

- ✅ 빌드 성공
- ✅ Upstash Redis SDK 설치됨
- ✅ 환경변수 준비됨
- ⚠️ Vercel 환경변수 설정 필요
- ⚠️ Supabase 스키마 설정 필요

## 🎯 즉시 실행할 단계

### 1단계: Vercel 환경변수 설정

```bash
# Vercel 대시보드에서 다음 환경변수들을 설정:
# (vercel-env-vars.txt 파일 참고)

UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
KV_REST_API_URL=https://charming-condor-46598.upstash.io
KV_REST_API_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2단계: Supabase 스키마 설정

Supabase SQL Editor에서 `sql/supabase-schema-setup.sql` 실행

### 3단계: 로컬 환경변수 동기화 (선택사항)

```bash
# Vercel 프로젝트와 연결
vercel link

# 환경변수 다운로드
vercel env pull .env.development.local
```

### 4단계: 배포 검증

```bash
# 로컬 테스트
npm run dev

# 배포 후 검증
node scripts/verify-deployment.js
```

## 🔧 해결되는 문제들

✅ **Redis 에러 해결:**

```
❌ Redis keep-alive 실패: Error: Redis 환경변수가 설정되지 않았습니다
→ ✅ UPSTASH_REDIS_REST_URL + TOKEN 설정으로 해결
```

✅ **PostgreSQL 에러 해결:**

```
❌ PostgresVectorDB 초기화 실패: Could not find the function public.create_vector_table
→ ✅ sql/supabase-schema-setup.sql 실행으로 해결
```

✅ **테이블 누락 에러 해결:**

```
❌ organization_settings 테이블 필요 - 관리자에게 문의
❌ custom_rules 테이블 필요 - 관리자에게 문의
❌ user_profiles 테이블 필요 - 관리자에게 문의
→ ✅ 스키마 SQL 실행으로 모든 테이블 생성
```

## 🎉 완료 후 기대 효과

- 🔴 52개 Redis 에러 → ✅ 0개
- 🔴 PostgreSQL 벡터 에러 → ✅ AI 검색 기능 활성화
- 🔴 테이블 누락 에러 → ✅ 사용자 컨텍스트 기능 활성화
- 🔴 캐싱 비활성화 → ✅ 50% 성능 향상
