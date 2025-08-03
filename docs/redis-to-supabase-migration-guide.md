# Redis → Supabase Realtime 마이그레이션 가이드

## 📋 개요

이 문서는 Redis Streams 기반 "생각중" 상태 관리를 Supabase Realtime으로 마이그레이션하는 과정을 설명합니다.

### 마이그레이션 이유

1. **비용 절감**: Redis 서비스 제거 가능 ($0 운영)
2. **성능 향상**: WebSocket이 SSE+폴링보다 효율적
3. **기능 확장**: PostgreSQL로 영구 저장 및 SQL 분석 가능
4. **운영 간소화**: Supabase 단일 서비스로 통합

## 🚀 마이그레이션 단계

### Phase 1: 데이터베이스 준비 ✅

```sql
-- thinking_steps 테이블 생성
CREATE TABLE thinking_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  step text NOT NULL,
  description text,
  status text DEFAULT 'processing',
  service text,
  timestamp bigint NOT NULL,
  duration integer,
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Realtime 활성화
ALTER TABLE thinking_steps REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE thinking_steps;
```

### Phase 2: 서비스 구현 ✅

#### 1. SupabaseRealtimeAdapter
- **위치**: `/src/services/ai/adapters/supabase-realtime-adapter.ts`
- **기능**: 
  - `addThinkingStep()`: 생각 단계 추가
  - `subscribeToSession()`: 실시간 구독
  - `getThinkingSteps()`: 기존 단계 조회

#### 2. 새로운 API 엔드포인트
- **SSE v2**: `/api/ai/thinking/stream-v2/route.ts`
- **Edge v2**: `/api/ai/edge-v2/route.ts`

### Phase 3: 클라이언트 업데이트 ✅

#### useHybridAI Hook v2
```typescript
// 이전 (Redis + SSE)
import { useHybridAI } from '@/hooks/useHybridAI';

// 이후 (Supabase Realtime)
import { useHybridAI } from '@/hooks/useHybridAI-v2';
```

## 🔄 점진적 마이그레이션

### 1단계: 병행 운영 (현재)

```typescript
// 기존 Redis 유지
export { redisCacheAdapter } from './service-adapters';

// 새로운 Supabase 추가
export { supabaseRealtimeAdapter } from './service-adapters';
```

### 2단계: 트래픽 전환

```typescript
// 환경변수로 제어
const USE_SUPABASE_REALTIME = process.env.NEXT_PUBLIC_USE_SUPABASE_REALTIME === 'true';

const adapter = USE_SUPABASE_REALTIME 
  ? supabaseRealtimeAdapter 
  : redisCacheAdapter;
```

### 3단계: Redis 제거

1. 모든 참조를 Supabase로 변경
2. Redis 관련 코드 제거
3. 환경변수 정리

## 📊 성능 비교

| 항목 | Redis Streams | Supabase Realtime |
|------|--------------|-------------------|
| 실시간성 | 1초 폴링 | 즉시 (WebSocket) |
| 네트워크 | SSE + 폴링 | WebSocket 단일 연결 |
| 저장 기간 | 1시간 TTL | 영구 저장 |
| 쿼리 | 제한적 | Full SQL |
| 비용 | $0 (256MB) | $0 (500MB) |

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
# 환경변수 설정
export NEXT_PUBLIC_USE_SUPABASE_REALTIME=true

# 개발 서버 실행
npm run dev

# 데모 페이지 접속
http://localhost:3000/demo/hybrid-ai
```

### 2. API 테스트

```bash
# 생각 단계 추가 (POST)
curl -X POST http://localhost:3000/api/ai/thinking/stream-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "step": "테스트 단계",
    "description": "마이그레이션 테스트"
  }'

# SSE 스트림 구독 (GET)
curl -N http://localhost:3000/api/ai/thinking/stream-v2?sessionId=test-session-123
```

### 3. Supabase 대시보드 확인

1. Supabase 대시보드 → Table Editor
2. `thinking_steps` 테이블 확인
3. Realtime 로그 모니터링

## ⚠️ 주의사항

### 1. RLS 정책
- 사용자별 격리 필수
- `user_id` 컬럼 활용
- 게스트 사용자 처리

### 2. WebSocket 연결
- 자동 재연결 구현됨
- 연결 상태 모니터링
- 오프라인 처리

### 3. 데이터 마이그레이션
- 기존 Redis 데이터는 1시간 후 자동 삭제
- 필요시 수동 마이그레이션 스크립트 실행

## 📈 모니터링

### Supabase 메트릭
- Realtime 연결 수
- 데이터베이스 사용량
- API 요청 수

### 애플리케이션 메트릭
```typescript
// Hook에서 제공하는 통계
const { stats, connectionStatus } = useHybridAI();

console.log('연결 상태:', connectionStatus);
console.log('캐시 히트율:', stats.cacheHits / stats.totalRequests);
```

## 🎯 다음 단계

1. [ ] 프로덕션 환경변수 설정
2. [ ] A/B 테스트 실행 (10% → 50% → 100%)
3. [ ] 성능 메트릭 수집
4. [ ] Redis 완전 제거

## 💡 FAQ

### Q: 기존 세션은 어떻게 되나요?
A: Redis의 기존 세션은 TTL(1시간) 후 자동 삭제됩니다. 새 세션은 Supabase에 저장됩니다.

### Q: 오프라인 지원은?
A: 현재는 온라인 전용입니다. 필요시 IndexedDB 로컬 캐싱 추가 가능합니다.

### Q: 비용 증가는?
A: 없습니다. Supabase 무료 티어(500MB)로 충분합니다.

## 📚 참고 문서

- [Supabase Realtime 문서](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Pub/Sub](https://www.postgresql.org/docs/current/sql-notify.html)
- [WebSocket vs SSE 비교](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)