# Redis 연결 설정 가이드

## 🔧 Redis 환경변수 설정

OpenManager Vibe v5에서 Redis 연결 문제를 해결하기 위해 다음 환경변수들을 `.env.local` 파일에 설정해야 합니다.

### 📋 필수 환경변수

```env
# Redis/KV Store Configuration (Upstash)
KV_URL=rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379
KV_REST_API_URL=https://charming-condor-46598.upstash.io
KV_REST_API_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
KV_REST_API_READ_ONLY_TOKEN=ArYGAAIgcDEJt2OXeBDen9ob7LlHXZiPD3cWjKXjdo0GT-jFZwW1lw
REDIS_URL=rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379

# Additional Redis Configuration
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
```

### 🚀 설정 방법

1. 프로젝트 루트에 `.env.local` 파일 생성
2. 위의 환경변수들을 복사하여 붙여넣기
3. 개발 서버 재시작: `npm run dev`

### ✅ 연결 테스트

Redis 연결이 정상적으로 설정되었는지 확인:

```bash
curl http://localhost:3005/api/test-redis
```

**성공 응답 예시:**

```json
{
  "success": true,
  "timestamp": "2025-06-12T15:00:07.917Z",
  "redisTest": {
    "ping": {
      "result": "PONG",
      "responseTime": "126ms"
    },
    "readWrite": {
      "success": true,
      "dataMatches": true
    },
    "info": {
      "memoryUsage": "0.000B",
      "totalKeys": 1
    }
  }
}
```

### 🔍 문제 해결

#### 대시보드에서 "Redis 연결 문제로 인한 일시적 오류" 메시지가 나타나는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경변수가 올바르게 설정되었는지 확인
3. 개발 서버를 완전히 재시작
4. Redis 테스트 API로 연결 상태 확인

#### 환경변수 로드 확인

```bash
node -e "require('dotenv').config({ path: '.env.local' }); console.log('REDIS_URL:', process.env.REDIS_URL ? '설정됨' : '설정되지 않음')"
```

### 📊 시스템 상태 확인

Redis 연결이 정상적으로 설정되면:

- ✅ 대시보드에서 30개 서버 모두 `healthy` 상태 표시
- ✅ Redis 관련 오류 메시지 사라짐
- ✅ 실시간 데이터 저장/조회 정상 작동
- ✅ 메트릭 데이터 캐싱 활성화

### 🔒 보안 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- 프로덕션 환경에서는 별도의 환경변수 관리 시스템 사용
- API 키와 토큰은 정기적으로 갱신

---

**마지막 업데이트:** 2025-06-12  
**버전:** OpenManager Vibe v5.43.5
