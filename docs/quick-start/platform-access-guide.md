# 🔌 4개 무료 티어 플랫폼 직접 접속 가이드

**작성일**: 2025-07-28  
**목적**: Vercel, Upstash Redis, Supabase, Google Cloud 직접 접속 및 상태 확인

## 📋 플랫폼별 접속 방법

### 1️⃣ **Vercel** 

#### 웹 콘솔 접속
```bash
# 브라우저에서 직접 접속
https://vercel.com/skyasu2s-projects/openmanager-vibe-v5

# Vercel CLI로 상태 확인
npx vercel list
npx vercel inspect openmanager-vibe-v5
```

#### API로 상태 확인
```bash
# 배포 상태 확인
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v6/deployments

# 프로젝트 정보
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects/openmanager-vibe-v5
```

#### CLI 직접 명령
```bash
# 로그 확인
npx vercel logs openmanager-vibe-v5 --follow

# 환경변수 확인
npx vercel env ls
```

---

### 2️⃣ **Upstash Redis**

#### 웹 콘솔 접속
```bash
# 브라우저에서 직접 접속
https://console.upstash.com/redis

# Redis CLI 직접 연결
redis-cli --tls -u $UPSTASH_REDIS_REST_URL
```

#### REST API로 상태 확인
```bash
# Redis 상태 확인
curl -X GET "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# 메모리 사용량 확인
curl -X GET "$UPSTASH_REDIS_REST_URL/info/memory" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

#### Node.js 직접 연결
```javascript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// 상태 확인
const pong = await redis.ping()
const info = await redis.info()
console.log('Redis Status:', pong, info)
```

---

### 3️⃣ **Supabase**

#### 웹 콘솔 접속
```bash
# 브라우저에서 직접 접속
https://app.supabase.com/project/[PROJECT_ID]

# SQL Editor 직접 접속
https://app.supabase.com/project/[PROJECT_ID]/sql
```

#### PostgreSQL 직접 연결
```bash
# psql로 직접 연결
psql "postgresql://postgres.[PROJECT_ID]:[PASSWORD]@db.[REGION].supabase.co:5432/postgres"

# 사용량 확인 SQL
SELECT 
    pg_database_size(current_database()) as db_size,
    pg_size_pretty(pg_database_size(current_database())) as db_size_pretty;
```

#### REST API로 상태 확인
```bash
# 프로젝트 상태
curl -X GET "https://api.supabase.com/v1/projects/[PROJECT_ID]" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

# 데이터베이스 상태
curl -X GET "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

---

### 4️⃣ **Google Cloud Platform**

#### 웹 콘솔 접속
```bash
# 브라우저에서 직접 접속
https://console.cloud.google.com/home?project=openmanager-free-tier

# Cloud Functions 콘솔
https://console.cloud.google.com/functions/list?project=openmanager-free-tier
```

#### gcloud CLI 명령
```bash
# 프로젝트 설정
gcloud config set project openmanager-free-tier

# VM 상태 확인
gcloud compute instances list
gcloud compute instances describe mcp-server --zone=us-central1-a

# Functions 상태 확인
gcloud functions list
gcloud functions describe enhanced-korean-nlp

# 사용량 확인
gcloud compute project-info describe --project=openmanager-free-tier
```

#### SSH 직접 접속
```bash
# VM SSH 접속
gcloud compute ssh mcp-server --zone=us-central1-a --project=openmanager-free-tier

# VM 내부에서 상태 확인
top -bn1
free -h
df -h
```

---

## 🔧 통합 상태 확인 스크립트

```bash
#!/bin/bash
# platform-status-check.sh

echo "🔍 4개 플랫폼 통합 상태 확인"
echo "================================"

# 1. Vercel
echo "1️⃣ Vercel 상태:"
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v6/deployments | jq '.deployments[0].state'

# 2. Redis
echo "2️⃣ Redis 상태:"
curl -s -X GET "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"

# 3. Supabase
echo "3️⃣ Supabase 상태:"
curl -s "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY" | head -1

# 4. GCP
echo "4️⃣ GCP 상태:"
gcloud compute instances list --format="value(name,status)"

echo "================================"
echo "✅ 상태 확인 완료"
```

---

## 📊 예상 결과

| 플랫폼 | 정상 응답 | 비정상 응답 |
|--------|----------|-------------|
| Vercel | `"READY"` | `"ERROR"`, `"FAILED"` |
| Redis | `"PONG"` | Connection error |
| Supabase | `200 OK` | `401`, `500` |
| GCP | `"RUNNING"` | `"STOPPED"`, `404` |