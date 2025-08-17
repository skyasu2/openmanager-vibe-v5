# 🧠 Memory-based Cache System Guide

**최종 업데이트**: 2025-08-03

## 📋 목차

1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [핵심 기능](#핵심-기능)
4. [사용 가이드](#사용-가이드)
5. [성능 최적화](#성능-최적화)
6. [마이그레이션 가이드](#마이그레이션-가이드)
7. [모니터링](#모니터링)
8. [FAQ](#faq)

## 🎯 개요

OpenManager VIBE v5는 외부 캐시 의존성을 제거하고 메모리 기반 캐싱 시스템을 채택했습니다. 이를 통해:

- ✅ **네트워크 지연 제거**: 외부 서비스 호출 없이 즉시 응답
- ✅ **비용 절감**: 월 $0 (외부 캐시 서비스 불필요)
- ✅ **복잡성 감소**: 외부 서비스 관리 불필요
- ✅ **성능 향상**: 응답 시간 50-150ms → <1ms

## 🏗️ 아키텍처

### 시스템 구조

```typescript
// lib/cache-helper.ts
class MemoryCache {
  private cache: Map<string, CacheItem>;
  private stats: CacheStats;

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
    };
  }
}
```

### 주요 컴포넌트

1. **LRU Cache**: 최대 1000개 아이템 저장
2. **TTL Management**: 자동 만료 및 정리
3. **Stats Tracking**: 실시간 성능 모니터링
4. **Auto Cleanup**: 5분마다 만료 데이터 정리

## 🔧 핵심 기능

### 1. 기본 캐싱 작업

```typescript
import { getCachedData, setCachedData } from '@/lib/cache-helper';

// 데이터 캐싱
await setCachedData('user:123', userData, 300); // 5분 TTL

// 캐시된 데이터 조회
const cached = await getCachedData('user:123');
if (cached) {
  return cached; // 캐시 히트
}

// 캐시 미스 시 데이터 로드
const data = await fetchFromDatabase();
await setCachedData('user:123', data, 300);
return data;
```

### 2. 패턴별 헬퍼 함수

```typescript
// 세션 관리
import { setSession, getSession } from '@/lib/cache-helper';

// 세션 저장 (30분 TTL)
await setSession(sessionId, { userId, role });

// 세션 조회
const session = await getSession(sessionId);

// 메트릭 캐싱
import { setMetrics, getMetrics } from '@/lib/cache-helper';

// 서버 메트릭 저장 (5분 TTL)
await setMetrics(`server:${serverId}`, metrics);

// 정적 데이터 캐싱
import { setStatic, getStatic } from '@/lib/cache-helper';

// 설정 데이터 저장 (24시간 TTL)
await setStatic('app:config', config);
```

### 3. 고급 기능

```typescript
// 캐시 통계 조회
const stats = getCacheStats();
console.log(
  `히트율: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)}%`
);

// 캐시 정리
clearExpiredCache();

// 특정 패턴 삭제
deleteCacheByPattern('user:*');
```

## 📊 성능 최적화

### 메모리 사용량 관리

```typescript
// 메모리 제한 설정
const MAX_CACHE_SIZE = 1000; // 최대 아이템 수
const MAX_MEMORY_MB = 50; // 최대 메모리 사용량

// LRU 정책으로 오래된 아이템 자동 제거
if (cache.size >= MAX_CACHE_SIZE) {
  const oldestKey = cache.keys().next().value;
  cache.delete(oldestKey);
}
```

### TTL 전략

| 데이터 유형 | 권장 TTL | 설명                  |
| ----------- | -------- | --------------------- |
| 세션        | 30분     | 사용자 활동 기반 갱신 |
| API 응답    | 1-5분    | 빈번한 업데이트       |
| 메트릭      | 5분      | 실시간성 요구         |
| 정적 데이터 | 24시간   | 거의 변경되지 않음    |

### 압축 전략

```typescript
// 1KB 이상 데이터 자동 압축
if (JSON.stringify(data).length > 1024) {
  const compressed = compressData(data);
  await setCachedData(key, compressed, ttl, { compressed: true });
}
```

## 🔄 마이그레이션 가이드

### 외부 캐시에서 Memory Cache로 전환

#### 이전 (외부 캐시)

```typescript
// 외부 캐시 클라이언트 사용
const client = getCacheClient();
await client.set('key', JSON.stringify(data), 'EX', 300);
const cached = await client.get('key');
```

#### 이후 (Memory Cache)

```typescript
import { setCachedData, getCachedData } from '@/lib/cache-helper';

await setCachedData('key', data, 300);
const cached = await getCachedData('key');
```

### 주요 변경사항

1. **의존성 제거**
   - 외부 캐시 클라이언트 패키지 제거
   - 캐시 서버 환경변수 제거

2. **API 단순화**
   - JSON 직렬화/역직렬화 자동 처리
   - 타입 안전성 향상

3. **에러 처리 개선**
   - 네트워크 에러 없음
   - 즉각적인 응답

## 📈 모니터링

### 실시간 메트릭

```typescript
// API: /api/cache/stats
{
  "hits": 15234,
  "misses": 3421,
  "hitRate": "81.65%",
  "size": 892,
  "memoryUsage": "12.3MB",
  "uptime": "2h 34m"
}
```

### 성능 대시보드

`/admin/cache` 페이지에서 실시간 모니터링:

- 히트율 차트
- 메모리 사용량 추이
- 인기 캐시 키 목록
- TTL 분포

## ❓ FAQ

### Q: 서버 재시작 시 캐시가 사라지나요?

A: 네, 메모리 기반이므로 서버 재시작 시 초기화됩니다. 중요한 데이터는 데이터베이스에 저장하세요.

### Q: 분산 환경에서 사용 가능한가요?

A: 각 인스턴스가 독립적인 캐시를 가집니다. 분산 캐시가 필요하면 Supabase를 활용하세요.

### Q: 최대 저장 가능한 데이터 크기는?

A: 단일 아이템 최대 1MB, 전체 캐시 최대 50MB를 권장합니다.

### Q: 외부 캐시 서비스로 전환할 수 있나요?

A: 네, 캐시 인터페이스가 추상화되어 있어 쉽게 전환 가능합니다.

## 🚀 다음 단계

1. **성능 테스트**: `npm run test:cache-performance`
2. **메모리 프로파일링**: `npm run profile:memory`
3. **최적화 권장사항**: `/docs/cache-optimization-tips.md`

---

## 📚 관련 문서

- [시스템 아키텍처](../../system-architecture.md)
- [성능 최적화 가이드](../../performance/performance-optimization-complete-guide.md)
- [API 최적화 가이드](../../performance/api-optimization-guide.md)
