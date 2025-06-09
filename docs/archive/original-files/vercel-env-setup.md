# Vercel 환경변수 설정 가이드

## 🔧 설정 필요한 환경변수들

### Supabase 관련
```
POSTGRES_URL=postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_USER=postgres
POSTGRES_HOST=db.vnswjnltnhpsueosfhmw.supabase.co
POSTGRES_PASSWORD=2D3DWhSl8HBlgYIm
POSTGRES_DATABASE=postgres
POSTGRES_PRISMA_URL=postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_URL_NON_POOLING=postgres://postgres.vnswjnltnhpsueosfhmw:2D3DWhSl8HBlgYIm@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require

SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
SUPABASE_JWT_SECRET=qNzA4/WgbksJU3xxkQJcfbCRkXhgBR7TVmI4y2XKRy59BwtRk6iuUSdkRNNQN1Yud3PGsGLTcZkdHSTZL0mhug==
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8

NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU
```

### Redis 관련 (핵심!)
```
# 기존 방식 (UPSTASH_* 환경변수)
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA

# Vercel KV 방식
KV_REST_API_URL=https://charming-condor-46598.upstash.io
KV_REST_API_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
KV_REST_API_READ_ONLY_TOKEN=ArYGAAIgcDEJt2OXeBDen9ob7LlHXZiPD3cWjKXjdo0GT-jFZwW1lw

# 연결 URL (일부 코드에서 사용)
REDIS_URL=rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379
KV_URL=rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379
```

### 기타 설정
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

## 📋 설정 방법

1. **Vercel 대시보드** → **프로젝트** → **Settings** → **Environment Variables**
2. 위 환경변수들을 모두 추가
3. **Production**, **Preview**, **Development** 환경 모두 체크
4. **Save** 후 재배포 트리거

## ✅ 우선순위

**즉시 필요:**
- `UPSTASH_REDIS_REST_URL` 
- `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

**부차적:**
- `REDIS_URL` (일부 레거시 코드용) 