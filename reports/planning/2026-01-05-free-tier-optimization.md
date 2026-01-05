# AI Engine 무료 티어 최적화 작업 계획서

**작성일**: 2026-01-05
**버전**: v5.83.14
**예상 소요 시간**: 1시간
**비용 영향**: $0 (무료 티어 내)

---

## 1. 배경 및 목적

### 1.1 제약 조건
| 서비스 | 무료 한도 | 현재 사용량 | 목표 |
|-------|----------|------------|------|
| Supabase DB | 500MB | 21MB (4.2%) | < 50MB |
| Groq API | 14.4K req/일 | ~50/일 | 변화 없음 |
| Cerebras API | 무제한 (beta) | ~50/일 | 변화 없음 |
| Cloud Run | 2M req/월 | ~1.5K/월 | 변화 없음 |

### 1.2 사용자 규모
- 일일 사용자: 5명
- 일일 쿼리: ~50회 (10쿼리/사용자)
- 월간 쿼리: ~1,500회

### 1.3 목표
1. **API 호출 감소**: 인메모리 캐싱으로 중복 호출 제거
2. **오탐 감소**: AdaptiveThreshold로 시간대별 임계값 적용
3. **무료 티어 유지**: 추가 비용 $0

---

## 2. 작업 항목

### 2.1 인메모리 Tool Result 캐싱

#### 2.1.1 현재 상태
```
현재 흐름:
User Query → Orchestrator → Tool 호출 → 매번 데이터 계산
                                         ↓
                                    응답 시간 ~3초
```

#### 2.1.2 개선 후
```
개선 흐름:
User Query → Orchestrator → Cache Check → Hit? → 캐시 반환 (~100ms)
                                    ↓ Miss
                              Tool 호출 → Cache 저장 → 응답 (~3초)
```

#### 2.1.3 구현 대상 파일
| 파일 | 변경 내용 |
|-----|----------|
| `src/tools-ai-sdk/server-metrics.ts` | getServerMetrics 캐싱 |
| `src/tools-ai-sdk/analyst-tools.ts` | checkThresholds 캐싱 |
| `src/lib/cache-layer.ts` | 기존 캐시 레이어 활용 |

#### 2.1.4 캐시 전략
| Tool | TTL | 캐시 키 |
|------|-----|--------|
| getServerMetrics | 60초 | `metrics:all` 또는 `metrics:{serverId}` |
| getServerMetricsAdvanced | 60초 | `metrics:adv:{timeRange}:{metric}:{agg}` |
| checkThresholds | 60초 | `thresholds:{serverId}` |
| detectAnomalies | 60초 | `anomalies:{serverId}` |

#### 2.1.5 예상 효과
```
Before: 동일 쿼리 10회 → AI API 10회 + Tool 계산 10회
After:  동일 쿼리 10회 → AI API 10회 + Tool 계산 1회 (캐시 9회)

Tool 계산 시간: ~500ms → ~10ms (캐시 히트 시)
```

---

### 2.2 AdaptiveThreshold 연동

#### 2.2.1 현재 상태
```typescript
// analyst-tools.ts - 현재 고정 임계값
const THRESHOLDS = {
  cpu: { warning: 80, critical: 90 },  // 항상 동일
  memory: { warning: 80, critical: 90 },
  disk: { warning: 80, critical: 90 },
};
```

#### 2.2.2 문제점
- 출근 시간 (09:00-10:00): CPU 70-80% 정상인데 경고 발생
- 야간 (02:00-06:00): CPU 40%도 이상일 수 있는데 미탐지

#### 2.2.3 개선 후
```typescript
// AdaptiveThreshold 활용
const manager = new AdaptiveThresholdManager();
const dynamicThreshold = manager.getAdaptiveThreshold('cpu', currentHour, currentDay);
// 출근 시간: warning=85, critical=95 (더 관대)
// 야간: warning=60, critical=80 (더 엄격)
```

#### 2.2.4 구현 대상 파일
| 파일 | 변경 내용 |
|-----|----------|
| `src/tools-ai-sdk/analyst-tools.ts` | AdaptiveThreshold import 및 적용 |
| `src/lib/ai/monitoring/AdaptiveThreshold.ts` | 기존 구현 활용 (변경 없음) |

#### 2.2.5 예상 효과
```
Before: 고정 임계값 → 출근 시간 오탐 다수
After:  동적 임계값 → 시간대별 정확도 향상

오탐률: ~30% → ~10% (예상)
```

---

## 3. 구현 상세

### 3.1 인메모리 캐싱 구현

```typescript
// server-metrics.ts 변경 예시
import { dataCache } from '../../lib/cache-layer';

export const getServerMetrics = tool({
  // ... 기존 스키마
  execute: async ({ serverId }) => {
    // 캐시 키 생성
    const cacheKey = serverId ? `metrics:${serverId}` : 'metrics:all';

    // 캐시 확인
    const cached = dataCache.get<ServerMetricsResult>(cacheKey, 'metrics');
    if (cached) {
      console.log(`📦 [Cache Hit] ${cacheKey}`);
      return { ...cached, _cached: true };
    }

    // 캐시 미스 - 계산 수행
    const result = computeMetrics(serverId);

    // 캐시 저장 (TTL: 60초)
    dataCache.set(cacheKey, result, 'metrics');

    return result;
  },
});
```

### 3.2 AdaptiveThreshold 연동

```typescript
// analyst-tools.ts 변경 예시
import { AdaptiveThresholdManager } from '../../lib/ai/monitoring/AdaptiveThreshold';

const adaptiveManager = new AdaptiveThresholdManager();

export const checkThresholds = tool({
  // ... 기존 스키마
  execute: async ({ serverId }) => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // 동적 임계값 계산
    const cpuThreshold = adaptiveManager.getAdaptiveThreshold('cpu', hour, day);
    const memThreshold = adaptiveManager.getAdaptiveThreshold('memory', hour, day);

    // 또는 고정 임계값과 블렌딩
    const effectiveWarning = Math.max(THRESHOLDS.cpu.warning, cpuThreshold.warning);

    // ... 나머지 로직
  },
});
```

---

## 4. 테스트 계획

### 4.1 단위 테스트
```bash
# 캐싱 테스트
npm run test -- --grep "cache"

# TypeScript 타입 체크
npm run type-check
```

### 4.2 통합 테스트
```bash
# 동일 쿼리 2회 실행 - 캐시 히트 확인
curl -X POST http://localhost:8080/api/ai/supervisor \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"서버 상태 알려줘"}],"sessionId":"test-1"}'

# 로그에서 [Cache Hit] 확인
```

### 4.3 검증 항목
- [ ] 캐시 히트 시 `_cached: true` 반환
- [ ] TTL 만료 후 새 데이터 반환
- [ ] AdaptiveThreshold 시간대별 값 변화 확인
- [ ] 빌드 성공 (tsc --noEmit)

---

## 5. 롤백 계획

### 5.1 캐싱 롤백
```typescript
// 문제 발생 시 캐싱 비활성화
const CACHE_ENABLED = false; // 환경변수로 전환 가능

if (CACHE_ENABLED) {
  const cached = dataCache.get(cacheKey, 'metrics');
  if (cached) return cached;
}
```

### 5.2 AdaptiveThreshold 롤백
```typescript
// 기존 고정 임계값으로 복귀
const USE_ADAPTIVE = false;

const threshold = USE_ADAPTIVE
  ? adaptiveManager.getAdaptiveThreshold('cpu', hour, day)
  : THRESHOLDS.cpu;
```

---

## 6. 성공 지표

| 지표 | Before | After (목표) |
|-----|--------|-------------|
| 동일 쿼리 응답 시간 | ~3초 | ~0.1초 (캐시 히트) |
| Tool 계산 횟수 | 100% | ~20% (80% 캐시) |
| 시간대별 오탐률 | ~30% | ~10% |
| 무료 티어 사용률 | 현재 유지 | 현재 유지 |

---

## 7. 일정

| 단계 | 작업 | 예상 시간 |
|-----|------|----------|
| 1 | 인메모리 캐싱 구현 | 30분 |
| 2 | AdaptiveThreshold 연동 | 20분 |
| 3 | 테스트 및 검증 | 10분 |
| **합계** | | **1시간** |

---

## 8. 승인

- [x] 작업 계획서 작성 완료
- [ ] 구현 시작 승인 대기

**작성자**: Claude Code
**검토자**: (사용자 승인 필요)
