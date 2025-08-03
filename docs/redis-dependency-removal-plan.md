# Redis 의존성 제거 계획

## 개요

Redis Streams에서 Supabase Realtime으로 마이그레이션이 완료되었으므로, 이제 남은 Redis 의존성을 제거합니다.

## 현재 상태

- **총 파일**: 50개 파일이 Redis를 사용 중
- **v2 마이그레이션**: 완료 (Supabase Realtime 기반)
- **주요 사용처**:
  1. 구 버전 API 엔드포인트
  2. Edge AI Router 캐싱
  3. 서비스 어댑터
  4. 테스트 및 Mock 파일

## 제거 전략

### Phase 1: API 엔드포인트 정리 (즉시 실행)

#### 1.1 구 버전 엔드포인트 제거
```
DELETE: /src/app/api/ai/edge/route.ts
DELETE: /src/app/api/ai/thinking/stream/route.ts
```

이유: v2 엔드포인트가 이미 존재하고 동작 중

#### 1.2 리다이렉트 설정
```typescript
// /src/app/api/ai/edge/route.ts (새로 생성)
export { GET, POST, OPTIONS } from '../edge-v2/route';

// /src/app/api/ai/thinking/stream/route.ts (새로 생성)
export { GET, POST } from '../stream-v2/route';
```

### Phase 2: Edge AI Router 캐싱 교체

#### 2.1 현재 Redis 캐싱 코드
```typescript
// edge-ai-router.ts
response = await redisCacheAdapter.execute({
  operation: 'get',
  key: `ai:response:${this.generateCacheKey(request)}`,
  id: request.id,
});
```

#### 2.2 로컬 메모리 캐시로 교체
```typescript
// 새로운 EdgeCache 클래스
class EdgeCache {
  private cache = new Map<string, CachedResponse>();
  private maxSize = 100; // Edge Runtime 메모리 제한
  
  async get(key: string): Promise<CachedResponse | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item;
  }
  
  async set(key: string, value: any, ttl: number) {
    // LRU 정책으로 오래된 항목 제거
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      ...value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }
}
```

### Phase 3: Service Adapters 정리

#### 3.1 RedisCacheAdapter 제거
- `service-adapters.ts`에서 RedisCacheAdapter 클래스 제거
- export 구문 제거

#### 3.2 edge-ai-router.ts 수정
- redisCacheAdapter import 제거
- EdgeCache로 모든 참조 교체

### Phase 4: 기타 서비스 정리

#### 4.1 주요 서비스 파일들
- `/src/services/upstashCacheService.ts` → 제거 또는 메모리 캐시로 교체
- `/src/services/RedisConnectionManager.ts` → 제거
- `/src/services/cacheService.ts` → 메모리 캐시로 교체
- `/src/lib/cache-helper.ts` → 제거 또는 간소화

#### 4.2 테스트 파일
- Mock 파일들 정리
- 테스트 케이스 업데이트

### Phase 5: 패키지 정리

#### 5.1 package.json에서 제거
```json
{
  "dependencies": {
    "@upstash/redis": "제거",
    "ioredis": "제거"
  }
}
```

#### 5.2 환경 변수 정리
```env
# 제거할 환경 변수
KV_REST_API_URL
KV_REST_API_TOKEN
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
GCP_REDIS_HOST
GCP_REDIS_PORT
GCP_REDIS_PASSWORD
```

## 영향 분석

### 긍정적 영향
1. **비용 절감**: Upstash Redis 무료 티어 제한 회피
2. **복잡도 감소**: 외부 의존성 제거
3. **성능 향상**: 네트워크 지연 없음 (Edge Runtime 내 캐싱)

### 주의사항
1. **캐시 용량**: Edge Runtime 메모리 제한 (128MB)
2. **분산 환경**: 인스턴스별 캐시 분리
3. **영속성**: 재배포 시 캐시 초기화

## 마이그레이션 체크리스트

- [ ] Phase 1: 구 버전 API 엔드포인트 제거
- [ ] Phase 2: Edge AI Router 캐싱 교체
- [ ] Phase 3: Service Adapters 정리
- [ ] Phase 4: 기타 서비스 및 테스트 정리
- [ ] Phase 5: 패키지 및 환경 변수 정리
- [ ] 통합 테스트 실행
- [ ] 배포 및 모니터링

## 롤백 계획

문제 발생 시:
1. git revert로 변경사항 되돌리기
2. 환경 변수 복원
3. Redis 연결 재설정

## 예상 완료 시간

- 총 작업 시간: 4-6시간
- 테스트 및 검증: 2시간
- 배포 및 모니터링: 1시간