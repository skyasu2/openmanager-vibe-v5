# 🆓 무료 티어 사용량 분석 리포트

> 생성일: 2025-08-03
> 하이브리드 AI 아키텍처 기준

## 📊 플랫폼별 무료 티어 현황 및 사용량

### 1. Vercel (Frontend + Edge)

**무료 한계**:

- 대역폭: 100GB/월
- Edge Function 실행: 500,000 실행/월
- Edge Runtime: 50시간/월

**예상 사용량**:

```typescript
// Edge AI Router 호출 빈도
- 평균 요청: 1,000회/일 = 30,000회/월 ✅ (6% 사용)
- Edge Runtime: 각 요청 100ms = 0.83시간/월 ✅ (1.7% 사용)
- 대역폭: 요청당 10KB = 300MB/월 ✅ (0.3% 사용)
```

### 2. Supabase (Database + Vector)

**무료 한계**:

- PostgreSQL: 500MB
- Vector 저장: 일반 DB 용량에 포함
- API 요청: 무제한 (대역폭 제한)
- 대역폭: 2GB/월

**예상 사용량**:

```sql
-- 현재 테이블 구조
- servers: ~100 레코드 = 1MB
- ai_embeddings: ~1,000 벡터 = 50MB
- server_metrics: ~10,000 레코드 = 10MB
- 총 사용: 61MB ✅ (12.2% 사용)
```

### 3. Upstash Memory Cache (Cache + State)

**무료 한계**:

- 메모리: 256MB
- 일일 명령: 10,000개
- 대역폭: 1GB/월

**예상 사용량**:

```typescript
// Memory Cache 사용 패턴
- 캐시 키: ~500개 활성 = 50MB
- 생각중 스트림: 세션당 1MB × 10 동시 = 10MB
- 일일 명령: 캐시 2,000 + 스트림 1,000 = 3,000 ✅ (30% 사용)
- 총 메모리: 60MB ✅ (23.4% 사용)
```

### 4. GCP Functions (Python Backend)

**무료 한계**:

- 호출: 2백만회/월
- 컴퓨팅: 400,000 GB-초/월
- 메모리: 256MB 인스턴스 기준

**예상 사용량**:

```python
# 3개 함수 기준
- korean-nlp: 500회/일 = 15,000회/월
- ml-analytics: 300회/일 = 9,000회/월
- unified-processor: 200회/일 = 6,000회/월
- 총 호출: 30,000회/월 ✅ (1.5% 사용)
- 컴퓨팅: 각 2초 실행 = 15 GB-초/월 ✅ (0.004% 사용)
```

## 🚨 위험 요소 및 최적화 전략

### 1. Vercel Edge Runtime 시간

**문제**: Edge Runtime 50시간은 의외로 빠르게 소진될 수 있음
**해결**:

```typescript
// edge-ai-router.ts 최적화
export class EdgeAIRouter {
  // 캐시 우선 전략
  async route(request: EdgeRouterRequest) {
    // 1. Memory Cache 캐시 먼저 확인 (Edge Runtime 소비 X)
    const cached = await this.checkCache(request);
    if (cached) return cached;

    // 2. 필요한 경우만 Edge 처리
    return this.processRequest(request);
  }
}
```

### 2. Upstash Memory Cache 일일 명령 제한

**문제**: 10,000 명령/일은 생각보다 적음
**해결**:

```typescript
// 배치 처리로 명령 수 최소화
class Memory CacheCacheAdapter {
  async batchOperations(operations: Memory CacheOperation[]) {
    const pipeline = this.memory cache.pipeline();
    operations.forEach(op => pipeline[op.command](...op.args));
    return pipeline.exec(); // 1개 명령으로 처리
  }
}
```

### 3. Supabase 대역폭 제한

**문제**: 2GB/월은 벡터 검색 시 빠르게 소진
**해결**:

```typescript
// 결과 크기 최적화
const VECTOR_SEARCH_CONFIG = {
  maxResults: 3, // 5 → 3 으로 감소
  columns: ['id', 'content', 'similarity'], // 필요한 컬럼만
  contentLength: 500, // 긴 텍스트 잘라내기
};
```

## 📈 월간 예상 비용 (무료 티어 초과 시)

| 서비스   | 무료 한계 | 예상 사용 | 초과 비용 |
| -------- | --------- | --------- | --------- |
| Vercel   | 100GB     | 0.3GB     | $0 ✅     |
| Supabase | 500MB     | 61MB      | $0 ✅     |
| Upstash  | 256MB     | 60MB      | $0 ✅     |
| GCP      | 2M 호출   | 30K 호출  | $0 ✅     |

**총 월간 비용: $0** 🎉

## 🔧 무료 티어 유지 전략

### 1. 자동 정리 시스템

```typescript
// 주기적 캐시 정리
setInterval(async () => {
  const memoryUsage = await memory cache.info('memory');
  if (memoryUsage.used_memory > 200 * 1024 * 1024) { // 200MB
    await this.cleanupOldCache();
  }
}, 5 * 60 * 1000); // 5분마다
```

### 2. 스마트 캐싱

```typescript
// TTL 차등 적용
const TTL_STRATEGY = {
  'high-cost-query': 3600, // 1시간
  'vector-search': 1800, // 30분
  'simple-query': 300, // 5분
  'realtime-data': 60, // 1분
};
```

### 3. 요청 통합

```typescript
// 여러 요청을 하나로 병합
class RequestBatcher {
  private queue: BatchRequest[] = [];

  async add(request: EdgeRouterRequest) {
    this.queue.push(request);

    if (this.queue.length >= 5) {
      return this.flush();
    }

    // 100ms 대기 후 자동 처리
    setTimeout(() => this.flush(), 100);
  }
}
```

## ✅ 결론

현재 하이브리드 AI 아키텍처는 **모든 플랫폼의 무료 티어 내에서 안전하게 작동** 가능합니다.

주요 안전 마진:

- Vercel: 94% 여유
- Supabase: 88% 여유
- Upstash: 77% 여유
- GCP: 98.5% 여유

월 1만 사용자까지는 무료 티어로 충분히 서비스 가능합니다.
