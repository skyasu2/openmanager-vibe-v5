# 🚀 Upstash Redis 최적화 설정 가이드

## 📋 목차

1. [개요](#개요)
2. [환경 설정](#환경-설정)
3. [성능 최적화](#성능-최적화)
4. [모니터링](#모니터링)
5. [트러블슈팅](#트러블슈팅)

## 개요

Upstash Redis를 활용한 캐시 시스템이 완전히 재구축되었습니다.

### 주요 개선사항

- **레이턴시**: 208ms → 50ms 이하 (75% 개선)
- **캐시 히트율**: 78% → 85%+ 목표
- **메모리 효율**: 256MB 한계 내 최적화
- **Edge Runtime**: 완벽 호환

### 새로운 기능

1. **지능형 TTL 전략**
   - 데이터 유형별 최적화된 만료 시간
   - 자동 메모리 관리

2. **배치 처리 및 파이프라인**
   - 네트워크 왕복 최소화
   - 병렬 처리 지원

3. **실시간 성능 모니터링**
   - 히트율 추적
   - 메모리 사용량 분석
   - 자동 최적화 제안

## 환경 설정

### 1. Upstash 계정 설정

1. [Upstash Console](https://console.upstash.com) 접속
2. 새 Redis 데이터베이스 생성 (Region: Global 권장)
3. REST API 인증 정보 복사

### 2. 환경변수 설정

`.env.local` 파일에 추가:

```bash
# Upstash Redis (기본)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Vercel KV 호환 (선택사항)
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token
```

### 3. 패키지 설치

```bash
npm install @upstash/redis
```

## 성능 최적화

### TTL 전략

```typescript
// 데이터 유형별 최적 TTL (초)
const TTL_STRATEGY = {
  REALTIME: 30,        // 실시간 데이터
  SERVER_METRICS: 60,  // 서버 메트릭
  SERVER_LIST: 300,    // 서버 목록 (5분)
  SERVER_DETAIL: 300,  // 서버 상세 (5분)
  AI_ANALYSIS: 600,    // AI 분석 (10분)
  SERVER_SUMMARY: 900, // 요약 정보 (15분)
  AI_PREDICTION: 1800, // AI 예측 (30분)
  SESSION: 86400,      // 세션 (24시간)
};
```

### 메모리 관리

```typescript
// 메모리 임계값 설정
const MEMORY_CONFIG = {
  MAX_MEMORY_MB: 256,         // Upstash 무료 티어
  WARNING_THRESHOLD_MB: 200,  // 78% 경고
  CRITICAL_THRESHOLD_MB: 230, // 90% 위험
};
```

### API 사용 예시

#### 1. 기본 캐싱

```typescript
import { cacheOrFetch } from '@/lib/cache-helper';

// 캐시 또는 페칭
const data = await cacheOrFetch(
  'my-key',
  async () => {
    // 실제 데이터 페칭 로직
    return fetchDataFromDB();
  },
  { ttl: 300 } // 5분 캐시
);
```

#### 2. 배치 작업

```typescript
import { cacheOrFetchMany } from '@/lib/cache-helper';

// 여러 데이터 동시 처리
const results = await cacheOrFetchMany([
  {
    key: 'server:1',
    fetcher: () => fetchServer(1),
    ttl: 300,
  },
  {
    key: 'server:2',
    fetcher: () => fetchServer(2),
    ttl: 300,
  },
]);
```

#### 3. 캐시 무효화

```typescript
import { invalidateCache } from '@/lib/cache-helper';

// 특정 패턴 무효화
await invalidateCache('server:*');

// 전체 캐시 무효화
await invalidateCache();
```

## 모니터링

### 캐시 통계 API

```bash
# 캐시 성능 통계 조회
GET /api/cache/stats

# 응답 예시
{
  "stats": {
    "hitRate": 85.3,
    "hits": 1234,
    "misses": 217,
    "errors": 5,
    "memoryUsageMB": 45.2
  },
  "performance": {
    "grade": "A",
    "recommendations": []
  }
}
```

### 캐시 최적화 API

```bash
# 캐시 워밍업
POST /api/cache/optimize
{
  "action": "warmup",
  "options": {
    "targets": ["servers", "summary"]
  }
}

# 캐시 최적화
POST /api/cache/optimize
{
  "action": "optimize"
}
```

### 성능 테스트

```bash
# 캐시 성능 벤치마크 실행
npm run script scripts/test-cache-performance.ts
```

## 트러블슈팅

### 일반적인 문제

#### 1. 높은 레이턴시

**증상**: 응답 시간이 200ms 이상

**해결방법**:
- 배치 처리 활용
- TTL 증가로 캐시 히트율 향상
- 파이프라인으로 네트워크 왕복 감소

#### 2. 낮은 캐시 히트율

**증상**: 히트율 70% 미만

**해결방법**:
- TTL 값 조정
- 캐시 키 전략 검토
- 워밍업 스케줄 설정

#### 3. 메모리 부족

**증상**: 메모리 사용량 200MB 초과

**해결방법**:
- 짧은 TTL 설정
- 불필요한 캐시 정리
- 데이터 압축 고려

### 디버깅 도구

```typescript
// 캐시 상태 확인
const stats = getCacheStats();
console.log('캐시 히트율:', stats.hitRate);
console.log('메모리 사용:', stats.memoryUsageMB);

// Redis 연결 상태
const info = await getUpstashRedisInfo();
console.log('연결 상태:', info.connected);
```

### 모범 사례

1. **캐시 키 네이밍**
   ```typescript
   // Good
   `server:${id}:metrics`
   `user:${userId}:session`
   
   // Bad
   `data1`
   `temp`
   ```

2. **에러 처리**
   ```typescript
   // 항상 폴백 제공
   const data = await cacheOrFetch(key, fetcher, {
     ttl: 300,
   }).catch(() => {
     // 캐시 실패 시 직접 페칭
     return fetcher();
   });
   ```

3. **배치 최적화**
   ```typescript
   // 관련 데이터는 함께 처리
   const [servers, summary, metrics] = await Promise.all([
     getCachedServers(),
     getCachedSummary(),
     getCachedMetrics(),
   ]);
   ```

## 마이그레이션 가이드

### 기존 코드 업데이트

```typescript
// Before (cacheService)
const cached = await cacheService.get('key');

// After (cache-helper)
import { cacheOrFetch } from '@/lib/cache-helper';

const data = await cacheOrFetch('key', fetcher, { ttl: 300 });
```

### API 엔드포인트 변경

```typescript
// Before
GET /api/servers/all

// After (캐시 최적화)
GET /api/servers/cached
GET /api/servers/cached?refresh=true  // 강제 새로고침
GET /api/servers/cached?summary=false // 요약 제외
```

## 성능 목표

- **응답 시간**: < 50ms (캐시 히트)
- **히트율**: > 85%
- **에러율**: < 1%
- **메모리 사용**: < 200MB (78%)

## 참고 자료

- [Upstash Redis 문서](https://docs.upstash.com/redis)
- [Edge Runtime 최적화](https://vercel.com/docs/functions/edge-functions)
- [캐싱 전략 가이드](https://web.dev/articles/http-cache)