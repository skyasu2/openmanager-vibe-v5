# 🔥 Redis 설정 가이드 - OpenManager Vibe v5

## 📋 목차

1. [개요](#개요)
2. [환경별 Redis 설정](#환경별-redis-설정)
3. [하이브리드 Redis 시스템](#하이브리드-redis-시스템)
4. [환경변수 설정](#환경변수-설정)
5. [개발 환경 설정](#개발-환경-설정)
6. [배포 환경 설정](#배포-환경-설정)
7. [테스트 및 디버깅](#테스트-및-디버깅)
8. [문제 해결](#문제-해결)

## 개요

OpenManager Vibe v5는 **하이브리드 Redis 시스템**을 사용합니다:

- **Dev Mock Redis**: 개발 환경 전용 (영속성 지원)
- **Mock Redis**: 테스트/빌드용 (메모리만)
- **Real Redis (Upstash)**: 프로덕션용

## 환경별 Redis 설정

### 🚀 자동 환경 감지

시스템은 자동으로 환경을 감지하여 적절한 Redis를 선택합니다:

| 환경                          | Redis 타입           | 특징                     |
| ----------------------------- | -------------------- | ------------------------ |
| 개발 (`NODE_ENV=development`) | Dev Mock Redis       | 영속성 지원, 개발자 도구 |
| 테스트 (`NODE_ENV=test`)      | Mock Redis           | 메모리 전용, 빠른 초기화 |
| 빌드 시                       | Mock Redis           | 외부 연결 차단           |
| 프로덕션                      | Real Redis (Upstash) | 실제 Redis 서비스        |

## 하이브리드 Redis 시스템

### 컨텍스트별 자동 전환

```javascript
// Mock Redis 사용 (대용량 작업)
-build -
  ci -
  test -
  bulk -
  data -
  data -
  generation -
  server -
  simulation -
  ai -
  training -
  vector -
  processing -
  // Real Redis 사용 (가벼운 작업)
  keep -
  alive -
  simple -
  cache -
  user -
  session -
  api -
  response -
  metrics -
  cache -
  status -
  check;
```

### 자동 전환 임계값

- 분당 요청 50회 초과 → Mock Redis
- 데이터 크기 100KB 초과 → Mock Redis
- 동시 작업 10개 초과 → Mock Redis

## 환경변수 설정

### 필수 환경변수

```bash
# Upstash Redis (프로덕션)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Vercel KV 호환 (선택사항)
KV_REST_API_URL=https://your-kv-url.kv.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token
```

### 제어 플래그

```bash
# Redis 연결 완전 차단 (Mock만 사용)
FORCE_MOCK_REDIS=true

# 개발 환경에서 실제 Redis 사용
USE_REAL_REDIS=true

# Redis 연결 비활성화
REDIS_CONNECTION_DISABLED=true

# Mock Redis 활성화
MOCK_REDIS_ENABLED=true
```

## 개발 환경 설정

### 1. 기본 설정 (Dev Mock Redis 사용)

```bash
# .env.local
NODE_ENV=development
# Redis 환경변수 생략 가능 (자동으로 Dev Mock 사용)
```

### 2. 실제 Redis 사용하기

```bash
# .env.local
NODE_ENV=development
USE_REAL_REDIS=true
UPSTASH_REDIS_REST_URL=your-url
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3. Dev Mock Redis 특징

- **영속성**: 데이터가 `.redis-mock-data` 파일에 저장됨
- **개발자 도구**: 통계, 덤프, 복원 기능
- **완전한 Redis 명령어 지원**: GET, SET, HSET, LPUSH, SADD 등
- **Pub/Sub 지원**: 실시간 기능 테스트 가능

## 배포 환경 설정

### Vercel 배포

```bash
# Vercel 환경변수 설정
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

### 환경별 최적화

```javascript
// 자동 적용되는 설정
production: {
  maxRetriesPerRequest: 5,
  retryDelayOnFailover: 200,
  keepAlive: 60000,
  keyPrefix: 'openmanager:prod:',
}
```

## 테스트 및 디버깅

### Redis 연결 테스트

```bash
# 현재 환경의 Redis 상태 확인
npm run redis:check

# Dev Mock Redis 강제 사용
npm run redis:check:dev

# 실제 Redis 강제 사용
npm run redis:check:real
```

### 테스트 출력 예시

```
🔍 Redis 연결 테스트 시작...

📋 환경 정보:
  - NODE_ENV: development
  - Platform: local
  - Redis 활성화: ✅
  - Redis 상태: connected

🔑 Redis 환경변수:
  - UPSTASH_REDIS_REST_URL: ✅ 설정됨
  - UPSTASH_REDIS_REST_TOKEN: ✅ 설정됨

🔌 Redis 연결 테스트:
  - 연결 상태: ✅ 성공

📊 Redis 클라이언트 정보:
  - 테스트 쓰기/읽기: ✅ 성공
  - 테스트 삭제: ✅ 완료
```

### API를 통한 상태 확인

```bash
# Redis 통계 API
curl http://localhost:3000/api/redis/stats

# 개발 서비스 상태
curl http://localhost:3000/api/dev/services-status
```

## 문제 해결

### 1. Redis 연결 실패

```bash
# 환경변수 확인
npm run env:check

# Redis 환경변수만 확인
grep REDIS .env.local
```

### 2. 메모리 부족

```bash
# Mock Redis 데이터 정리
rm .redis-mock-data

# 또는 API로 정리
curl -X POST http://localhost:3000/api/redis/flush
```

### 3. 성능 문제

```javascript
// 대용량 데이터는 명시적으로 컨텍스트 지정
await smartRedis.set('large-data', bigData, { ex: 3600 }, 'bulk-data');
```

### 4. 디버깅 모드

```bash
# 상세 로그 활성화
DEBUG=redis:* npm run dev
```

## 권장사항

### 개발 환경

1. **기본적으로 Dev Mock Redis 사용** (외부 의존성 없음)
2. 실제 Redis 테스트 필요시에만 `USE_REAL_REDIS=true`
3. 영속성이 필요없으면 `.redis-mock-data` 주기적 삭제

### 프로덕션 환경

1. **반드시 실제 Redis (Upstash) 사용**
2. `FORCE_MOCK_REDIS` 환경변수 제거 확인
3. 연결 풀 설정 최적화
4. 모니터링 설정 활성화

### 보안

1. Redis 토큰을 코드에 하드코딩하지 않기
2. `.env.local` 파일을 Git에 커밋하지 않기
3. 프로덕션 환경변수는 Vercel 대시보드에서 관리

## 참고 자료

- [Upstash Redis 문서](https://docs.upstash.com/redis)
- [Vercel KV 문서](https://vercel.com/docs/storage/vercel-kv)
- [Redis 명령어 참조](https://redis.io/commands)
