# 🔴 Redis 연결 가이드 - Upstash TLS 완전 정복

## 📖 개요

OpenManager Vibe v5에서 사용하는 **Upstash Redis** 연결 방법과 테스트 가이드입니다.

## 🔧 연결 정보

### 🌐 기본 정보

- **Provider**: Upstash Redis
- **Endpoint**: `charming-condor-46598.upstash.io:6379`
- **Protocol**: `rediss://` (TLS 필수)
- **Region**: AWS ap-southeast-1 (추정)

### 🔐 인증 정보

- **Username**: `default`
- **Password**: `AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA`
- **Full URL**: `rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379`

## 🛠️ 연결 방법

### 1️⃣ **Redis CLI 연결 (Linux/macOS)**

```bash
# TLS 연결 (Upstash 표준)
redis-cli --tls -u rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379

# 연결 테스트
redis-cli --tls -u rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379 ping
# 응답: PONG

# 정보 확인
redis-cli --tls -u rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379 info
```

### 2️⃣ **Windows 환경 (Redis CLI 설치)**

```powershell
# Chocolatey로 Redis CLI 설치
choco install redis-64

# 또는 직접 다운로드
# https://github.com/microsoftarchive/redis/releases
```

### 3️⃣ **Node.js 환경 (프로젝트 내)**

```typescript
// src/lib/redis-test.ts
import { Redis } from 'ioredis';

const redis = new Redis({
  host: 'charming-condor-46598.upstash.io',
  port: 6379,
  password: 'AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA',
  tls: {}, // TLS 활성화
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 1,
});

// 연결 테스트
async function testRedisConnection() {
  try {
    const result = await redis.ping();
    console.log('✅ Redis 연결 성공:', result);

    // 기본 명령어 테스트
    await redis.set('test:connection', new Date().toISOString());
    const value = await redis.get('test:connection');
    console.log('📝 테스트 데이터:', value);

    return true;
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
    return false;
  }
}
```

## 🧪 테스트 명령어 모음

### 🔍 **연결 상태 확인**

```bash
# 1. 기본 연결 테스트
redis-cli --tls -u $REDIS_URL ping

# 2. 서버 정보 확인
redis-cli --tls -u $REDIS_URL info server

# 3. 메모리 사용량 확인
redis-cli --tls -u $REDIS_URL info memory

# 4. 키 개수 확인
redis-cli --tls -u $REDIS_URL dbsize
```

### 📊 **성능 테스트**

```bash
# 1. 대량 읽기/쓰기 테스트
redis-cli --tls -u $REDIS_URL eval "
for i=1,1000 do
  redis.call('set', 'test:' .. i, 'value' .. i)
end
return 'OK'
" 0

# 2. 응답 시간 측정
redis-cli --tls -u $REDIS_URL --latency

# 3. 처리량 테스트 (초당 처리 수)
redis-cli --tls -u $REDIS_URL --latency-history
```

## 🛡️ 보안 고려사항

### ⚠️ **중요 주의사항**

1. **비밀번호 노출 방지**: 터미널 히스토리에 패스워드가 저장될 수 있음
2. **환경변수 사용**: 직접 명령어에 패스워드 입력 금지
3. **TLS 필수**: Upstash는 TLS 연결만 허용

### 🔐 **안전한 연결 방법**

```bash
# 환경변수 설정 (권장)
export REDIS_URL="rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379"

# 환경변수로 연결
redis-cli --tls -u $REDIS_URL ping
```

## 🚀 OpenManager Vibe v5 통합

### 🔧 **현재 시스템 연동**

```typescript
// src/lib/redis.ts (기존 설정)
export const redis = new Redis({
  host: 'charming-condor-46598.upstash.io',
  port: 6379,
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {},
});

// 환경변수 설정 (.env.local)
UPSTASH_REDIS_PASSWORD=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
```

### 🧪 **시스템 테스트**

```bash
# 프로젝트 내 Redis 테스트
npm run test:redis

# API 엔드포인트 테스트
curl http://localhost:3000/api/ping
```

## 🎯 **빠른 참고**

```bash
# 한 줄 연결 테스트
redis-cli --tls -u rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379 ping

# 환경변수 설정 후 사용
export REDIS_URL="rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379"
redis-cli --tls -u $REDIS_URL ping
```

**🔥 중요**: 이 비밀번호는 보안상 주기적으로 재생성해야 합니다!
