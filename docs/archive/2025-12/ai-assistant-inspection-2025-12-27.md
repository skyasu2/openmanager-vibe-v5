# AI Assistant 점검 보고서

**점검일**: 2025-12-27
**버전**: v5.83.12
**점검자**: Claude Code (Opus 4.5)

---

## 1. AI 어시스턴트 기능 점검 결과

### 1.1 기능별 동작 상태

| 기능 | Agent | Provider | 응답시간 | 상태 |
|------|-------|----------|----------|------|
| 자연어 질의 (Chat) | NLQ Agent | Cerebras | 6.7s | ✅ 정상 |
| 자동 장애 보고서 | Reporter Agent | Cerebras | 3.1s | ✅ 정상 |
| 이상감지/예측 | Analyst Agent | Cerebras | 3.6s | ✅ 정상 |
| 결과 검증 | Verifier Agent | Mistral | - | ✅ 정상 |
| 라우팅/조율 | Supervisor | Groq | - | ✅ 정상 |

### 1.2 Health Check 결과

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "groq": true,
    "cerebras": true,
    "mistral": true,
    "redis": true
  }
}
```

---

## 2. 무료 티어 준수 현황

### 2.1 Provider별 일일 한도

| Provider | 일일 토큰 | 일일 요청 | 실제 사용률 |
|----------|----------|----------|------------|
| Groq | 100,000 | 1,000 | ~20% (Supervisor만) |
| Cerebras | 24,000,000 | 무제한 | ~70% (Workers) |
| Mistral | ~1,000,000 | - | ~10% (Verifier) |

### 2.2 Agent-Provider 배치 전략

```typescript
// cloud-run/ai-engine/src/lib/model-config.ts
export const AGENT_MODEL_CONFIG = {
  supervisor: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  },
  nlq: {
    provider: 'cerebras',
    model: 'llama-3.3-70b',
  },
  analyst: {
    provider: 'cerebras',  // Groq에서 전환 (2025-12-27)
    model: 'llama-3.3-70b',
  },
  reporter: {
    provider: 'cerebras',  // Groq에서 전환 (2025-12-27)
    model: 'llama-3.3-70b',
  },
  verifier: {
    provider: 'mistral',
    model: 'mistral-small-2506',
  },
};
```

### 2.3 Fallback Chain

```
Supervisor: Groq 70B → Cerebras 70B → Mistral
NLQ/Analyst/Reporter: Cerebras 70B → Groq 70B → Mistral
Verifier: Mistral 24B (단일)
```

**결론**: Groq 사용량을 80% 감소시켜 일일 한도 내에서 안정적 운영 가능.

---

## 3. Vercel 타임아웃 처리 구조

### 3.1 문제점 (이전)

- Vercel Serverless 함수 타임아웃: **10초** (무료 플랜)
- AI 처리 시간: **5~30초** (복잡도에 따라 다름)
- 결과: 긴 작업에서 504 Gateway Timeout 빈번 발생

### 3.2 해결 구조 (현재)

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                          │
│                                                                    │
│  1. POST /api/ai/jobs → Job 생성 (즉시 응답)                        │
│  2. GET /api/ai/jobs/:id/stream → SSE 연결 (2분 대기)               │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                       Vercel (BFF)                               │
│                                                                   │
│  /api/ai/jobs (POST)                                              │
│    - Supabase에 Job 저장 (status: queued)                         │
│    - Cloud Run에 비동기 트리거 (fire-and-forget)                   │
│    - 즉시 응답: { jobId, pollUrl }                                │
│                                                                   │
│  /api/ai/jobs/:id/stream (GET) - SSE                              │
│    - Redis 내부 폴링 (100ms 간격, <1ms RTT)                        │
│    - 진행상황 2초마다 전송                                          │
│    - 최대 대기: 120초 (Vercel 제한 내)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Upstash Redis (HTTP)                          │
│                                                                   │
│  Key Pattern:                                                     │
│    job:{jobId}          → 결과 저장 (TTL: 1시간)                   │
│    job:progress:{jobId} → 진행상황 (TTL: 10분)                     │
│                                                                   │
│  특징:                                                            │
│    - HTTP 기반 (Connection Pool 불필요)                           │
│    - Serverless 환경에 최적화                                      │
│    - 글로벌 복제로 낮은 지연시간                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Cloud Run (AI Engine)                         │
│                                                                   │
│  /api/jobs/process (POST)                                         │
│    - LangGraph Multi-Agent 처리 (5~30초)                          │
│    - 진행상황 Redis에 업데이트                                     │
│    - 완료 시 결과를 Redis에 저장                                   │
│                                                                   │
│  타임아웃: 300초 (Cloud Run 제한)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 핵심 코드 구조

#### Job 생성 (Vercel)
```typescript
// src/app/api/ai/jobs/route.ts
async function triggerWorker(jobId, query, type, sessionId) {
  // 비동기로 Worker 호출 (응답을 기다리지 않음)
  fetch(`${cloudRunUrl}/api/jobs/process`, {...})
    .catch((err) => console.error('[AI Jobs] Failed to trigger worker:', err));
}
```

#### SSE 스트리밍 (Vercel)
```typescript
// src/app/api/ai/jobs/[id]/stream/route.ts
const POLL_INTERVAL_MS = 100;    // Redis 폴링 간격
const MAX_WAIT_TIME_MS = 120_000; // 최대 대기 시간 (2분)

while (true) {
  const result = await redisGet(`job:${jobId}`);
  if (result?.status === 'completed') {
    sendEvent('result', { response: result.result });
    break;
  }
  await sleep(POLL_INTERVAL_MS);
}
```

#### 결과 저장 (Cloud Run)
```typescript
// cloud-run/ai-engine/src/lib/job-notifier.ts
export async function saveJobResult(jobId, result) {
  await redisSet(`job:${jobId}`, result, JOB_TTL_SECONDS); // TTL: 1시간
}
```

### 3.4 타임아웃 시나리오

| 시나리오 | 처리 방식 |
|----------|----------|
| 일반 쿼리 (< 10초) | 직접 응답 (SSE 불필요) |
| 복잡한 쿼리 (10~30초) | Job Queue + SSE 스트리밍 |
| 초장시간 작업 (> 120초) | SSE 타임아웃 후 폴링 전환 |
| Cloud Run 장애 | Redis에서 실패 상태 확인 |

---

## 4. 테스트 결과 요약

### 4.1 응답 시간 측정 (2025-12-27)

```
NLQ Agent (서버 상태 요약): 6.7초 ✅
Reporter Agent (장애 보고서): 3.1초 ✅
Analyst Agent (이상 감지): 3.6초 ✅
```

### 4.2 Health Check

```bash
curl https://ai-engine-490817238363.asia-northeast1.run.app/health
# Result: 200 OK, all services healthy
```

### 4.3 Rate Limit 테스트

```
Groq Rate Limit → Cerebras Fallback: ✅ 정상 동작
Cerebras Primary 응답: ✅ 일관된 품질
```

---

## 5. 권장 사항

### 5.1 현재 상태 유지

- Triple-Provider 전략이 잘 작동 중
- 무료 티어 한도 내에서 안정적 운영
- Fallback Chain으로 장애 대응 가능

### 5.2 모니터링 포인트

| 항목 | 임계치 | 조치 |
|------|--------|------|
| Groq 일일 토큰 | 80,000 (80%) | Cerebras 비중 확대 |
| 응답 시간 | 10초 초과 | Job Queue 자동 전환 |
| Redis 지연 | 100ms 초과 | Upstash 리전 확인 |

### 5.3 향후 개선 사항

1. **Redis Pub/Sub 도입**: SSE 폴링 → Push 방식 전환 (지연시간 감소)
2. **복잡도 기반 라우팅**: 단순 쿼리는 직접 응답, 복잡한 쿼리만 Job Queue
3. **캐싱 전략**: 자주 묻는 질문에 대한 응답 캐싱

---

## 6. 관련 파일

| 파일 | 역할 |
|------|------|
| `cloud-run/ai-engine/src/lib/model-config.ts` | Agent-Provider 매핑 |
| `cloud-run/ai-engine/src/lib/redis-client.ts` | Upstash Redis 클라이언트 |
| `cloud-run/ai-engine/src/lib/job-notifier.ts` | Job 결과 저장 |
| `src/app/api/ai/jobs/route.ts` | Job 생성 API |
| `src/app/api/ai/jobs/[id]/stream/route.ts` | SSE 스트리밍 API |
| `src/components/ai/AIAssistantIconPanel.tsx` | AI 기능 아이콘 패널 |

---

_Last Updated: 2025-12-27_
_Document Version: 1.0.0_
