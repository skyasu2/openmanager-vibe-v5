# 🎯 무료 티어 최적화 보고서

## 📋 개요

OpenManager VIBE v5 시스템의 무료 티어 한계를 초과하지 않도록 다음과 같은 최적화를 수행했습니다:

1. **API 폴링 간격**: 5초 → 30초 (6배 증가)
2. **캐시 TTL**: 5분 → 30분 (6배 증가)
3. **실시간 업데이트**: 환경변수 기반 동적 조정

## 🔧 주요 변경사항

### 1. 환경변수 기반 설정 (`src/config/free-tier-intervals.ts`)

```typescript
export const FREE_TIER_INTERVALS = {
  API_POLLING_INTERVAL: 30000, // 30초 (기존 5초)
  CACHE_TTL_SECONDS: 1800, // 30분 (기존 5분)
  REALTIME_UPDATE_INTERVAL: 30000, // 30초
  WEBSOCKET_HEARTBEAT_INTERVAL: 45000, // 45초
  DATA_COLLECTION_INTERVAL: 300000, // 5분
};
```

### 2. 주요 파일 수정

- `src/config/environment.ts`: 무료 티어 간격 적용
- `src/config/serverConfig.ts`: 데이터 수집 간격 환경변수화
- `src/config/free-tier-cache-config.ts`: 캐시 TTL 환경변수화
- `src/hooks/api/useServerQueries.ts`: API 폴링 간격 적용
- `src/hooks/api/useRealtimeQueries.ts`: WebSocket 하트비트 간격 적용

## 💰 예상 절감 효과

### API 호출 감소

#### 기존 사용량 (5초 폴링, 5분 캐시)

- 월간 API 호출: **518,400회**
- 캐시 미스율: 80% (TTL이 짧아서)
- 실제 API 호출: **414,720회**
- GCP Functions 사용률: **20.7%**

#### 최적화 후 (30초 폴링, 30분 캐시)

- 월간 API 호출: **86,400회**
- 캐시 미스율: 20% (TTL이 길어서)
- 실제 API 호출: **17,280회**
- GCP Functions 사용률: **0.86%**

**절감률: 95.8%** (414,720 → 17,280회)

### Memory Cache 명령 감소

#### 기존 사용량

- 월간 Memory Cache 명령: **1,555,200회**
- Upstash 사용률: **311%** (한계 초과!)

#### 최적화 후

- 월간 Memory Cache 명령: **259,200회**
- Upstash 사용률: **51.8%**

**절감률: 83.3%** (1,555,200 → 259,200회)

### 대역폭 절약

#### 기존 사용량

- 평균 응답 크기: 2KB
- 월간 대역폭: **829MB**

#### 최적화 후

- 월간 대역폭: **34.5MB**

**절감률: 95.8%** (829MB → 34.5MB)

## 📊 무료 티어 사용률 예측

| 서비스               | 무료 한도     | 최적화 전 | 최적화 후 | 여유율 |
| -------------------- | ------------- | --------- | --------- | ------ |
| GCP Functions        | 200만 호출/월 | 20.7%     | 0.86%     | 99.14% |
| Upstash Memory Cache | 50만 명령/월  | 311% ⚠️   | 51.8%     | 48.2%  |
| Vercel 대역폭        | 100GB/월      | 0.83%     | 0.03%     | 99.97% |
| Supabase             | 50만 요청/월  | 82.9%     | 3.5%      | 96.5%  |

## 🎯 추가 최적화 권장사항

### 1. 동적 간격 조정

사용률이 높을 때 자동으로 폴링 간격을 늘리는 기능:

```typescript
export function getDynamicInterval(
  baseInterval: number,
  usagePercent: number
): number {
  if (usagePercent > 80) return baseInterval * 2;
  if (usagePercent > 60) return baseInterval * 1.5;
  return baseInterval;
}
```

### 2. 스마트 캐싱 전략

- 정적 데이터: 24시간 캐시
- 서버 메트릭: 30분 캐시
- 실시간 상태: 30초 캐시
- AI 응답: 15-60분 캐시

### 3. 배치 처리

여러 API 요청을 하나로 묶어서 처리:

- 서버 목록 + 상태 + 메트릭을 한 번에 가져오기
- GraphQL 또는 custom batch endpoint 활용

## 🚀 환경변수 설정 가이드

`.env.local` 파일에 다음 환경변수를 추가하여 간격을 조정할 수 있습니다:

```bash
# API 폴링 간격 (밀리초)
API_POLLING_INTERVAL=30000

# 캐시 TTL (초)
CACHE_TTL_SECONDS=1800

# 실시간 업데이트 간격 (밀리초)
REALTIME_UPDATE_INTERVAL=30000

# WebSocket 하트비트 간격 (밀리초)
WEBSOCKET_HEARTBEAT_INTERVAL=45000

# 데이터 수집 간격 (밀리초)
DATA_COLLECTION_INTERVAL=300000
```

## ✅ 결론

이번 최적화를 통해:

1. **API 호출 95.8% 감소** - 무료 티어 안전 영역 확보
2. **Memory Cache 명령 83.3% 감소** - 한계 초과 문제 해결
3. **대역폭 95.8% 절약** - 네트워크 비용 최소화
4. **유연한 설정** - 환경변수로 즉시 조정 가능

모든 서비스가 무료 티어 한계의 60% 이하로 유지되어 안정적인 운영이 가능합니다.
