# AI 시스템 코드 품질 개선 계획서

## 개요

| 항목 | 내용 |
|------|------|
| **작성일** | 2026-01-24 |
| **대상** | Frontend AI Hooks + Cloud Run AI Engine |
| **총 이슈** | 13건 (Critical 1, High 4, Medium 5, Low 3) |
| **예상 소요** | P0: 1시간, P1: 2시간, P2: 1.5시간 |

---

## 아키텍처 제약사항

```
┌─────────────────┐     SSE/Stream      ┌──────────────────┐
│  Vercel (Free)  │ ◄─────────────────► │ Cloud Run (Free) │
│  - 10s timeout  │     HTTP/2          │  - 256MB RAM     │
│  - 100GB/월     │                     │  - 2M req/월     │
└─────────────────┘                     └──────────────────┘
```

### 무료 티어 영향 고려사항
- **메모리**: Cloud Run 256MB → unbounded 구조 제거 필수
- **Timeout**: Vercel 10s → AbortController 필수
- **연결 수**: 제한적 → EventSource 누수 방지 필수

---

## P0: Critical (즉시 수정)

### P0-1. Unbounded handoffEvents Array 제한

**파일**: `cloud-run/ai-engine/src/services/ai-sdk/agents/orchestrator.ts`
**라인**: 505-520
**위험도**: 🔴 Critical (OOM Crash 가능)

#### 현재 코드
```typescript
// Line 505: 무제한 배열
const handoffEvents: Array<{ from: string; to: string; reason?: string; timestamp: Date }> = [];

// Line 510-513: 추가만 하고 삭제 없음
function recordHandoff(from: string, to: string, reason?: string) {
  handoffEvents.push({ from, to, reason, timestamp: new Date() });
  console.log(`🔀 [Handoff] ${from} → ${to} (${reason || 'no reason'})`);
}

// Line 518-520: export하지만 실제 사용 안됨
export function getRecentHandoffs() {
  return handoffEvents.slice(-10);
}
```

#### 수정 계획
```typescript
// 상수 정의
const HANDOFF_EVENTS_CONFIG = {
  maxSize: 50,      // 최대 50개 유지 (Cloud Run 메모리 고려)
  cleanupAge: 3600000,  // 1시간 이후 자동 삭제
} as const;

// Line 505: 기존 배열 유지 (타입 동일)
const handoffEvents: Array<{ from: string; to: string; reason?: string; timestamp: Date }> = [];

// Line 510-513: FIFO 방식 크기 제한 + TTL 정리
function recordHandoff(from: string, to: string, reason?: string) {
  const now = new Date();

  // TTL 기반 정리: 1시간 이상 된 이벤트 제거
  const cutoff = now.getTime() - HANDOFF_EVENTS_CONFIG.cleanupAge;
  while (handoffEvents.length > 0 && handoffEvents[0].timestamp.getTime() < cutoff) {
    handoffEvents.shift();
  }

  // 크기 제한: FIFO
  if (handoffEvents.length >= HANDOFF_EVENTS_CONFIG.maxSize) {
    handoffEvents.shift();
  }

  handoffEvents.push({ from, to, reason, timestamp: now });
  console.log(`🔀 [Handoff] ${from} → ${to} (${reason || 'no reason'}) [${handoffEvents.length}/${HANDOFF_EVENTS_CONFIG.maxSize}]`);
}

// getRecentHandoffs는 유지 (디버깅용)
```

#### 영향 범위
- 메모리 사용량: 무제한 → 최대 ~50KB
- 기존 API: 변경 없음 (getRecentHandoffs 동일)

---

### P0-2. Stale Model Config 요청별 갱신

**파일**: `cloud-run/ai-engine/src/services/ai-sdk/agents/orchestrator.ts`
**라인**: 490
**위험도**: 🔴 Critical (Provider 장애 시 복구 불가)

#### 현재 코드
```typescript
// Line 490: 모듈 로드 시 1회만 호출
const orchestratorModelConfig = getOrchestratorModel();
```

#### 수정 계획
```typescript
// Line 490: 삭제 또는 주석 처리
// const orchestratorModelConfig = getOrchestratorModel(); // REMOVED: Stale data risk

// 사용처에서 직접 호출하도록 변경
// 예: executeOrchestratorRouting 함수 내부에서
async function executeOrchestratorRouting(...) {
  // 요청마다 fresh model config 획득
  const modelConfig = getOrchestratorModel();
  if (!modelConfig) {
    console.warn('⚠️ [Orchestrator] No model available');
    return null;
  }
  // ...
}
```

#### 영향 범위
- `orchestratorModelConfig` 참조하는 모든 함수 수정 필요
- 검색 필요: `orchestratorModelConfig` 사용처

---

## P1: High Severity (이번 주 내 수정)

### P1-1. SSE Reconnection Timer 누수 수정

**파일**: `src/hooks/ai/useAsyncAIQuery.ts`
**라인**: 277-286
**위험도**: 🟠 High (메모리 누수)

#### 현재 코드
```typescript
// Line 277-286: setTimeout이 ref에 저장되지 않음
setTimeout(() => {
  connectSSE(jobId, reconnectAttempt + 1);
}, delay);
```

#### 수정 계획
```typescript
// 기존 timeoutRef 활용
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

// connectSSE 함수 내부 수정 (Line 277-286)
if (reconnectAttempt < maxReconnects) {
  const delay = calculateBackoff(reconnectAttempt, 1000, 10000, 0.1);

  // 기존 타이머 정리
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  // 새 타이머를 ref에 저장
  timeoutRef.current = setTimeout(() => {
    // 컴포넌트 언마운트 체크
    if (eventSourceRef.current === null) {
      return; // 이미 정리됨
    }
    connectSSE(jobId, reconnectAttempt + 1);
  }, delay);
}
```

#### cleanup 함수 수정
```typescript
const cleanup = useCallback(() => {
  // EventSource 정리
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }
  // Timeout 정리 (reconnection 포함)
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}, []);
```

---

### P1-2. Job Stream Polling Loop 종료 로직 추가

**파일**: `src/app/api/ai/jobs/[id]/stream/route.ts`
**라인**: 99-200
**위험도**: 🟠 High (리소스 낭비)

#### 현재 코드
```typescript
// Line 99: 무한 루프
while (true) {
  // ... polling ...
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
}

// Line 197-200: cancel()에서 루프 종료 안됨
cancel() {
  logger.info(`[Jobs Stream] Client disconnected: ${jobId}`);
}
```

#### 수정 계획
```typescript
// AbortController 추가
let aborted = false;

const stream = new ReadableStream({
  async start(controller) {
    const startTime = Date.now();

    while (!aborted) {  // aborted 플래그 체크
      const elapsed = Date.now() - startTime;

      if (elapsed > MAX_WAIT_TIME_MS) {
        sendEvent('timeout', { ... });
        break;
      }

      // ... polling logic ...

      // AbortSignal 체크 가능한 sleep
      await new Promise((resolve) => {
        const timeoutId = setTimeout(resolve, POLL_INTERVAL_MS);
        // 취소 시 즉시 resolve
        if (aborted) {
          clearTimeout(timeoutId);
          resolve(undefined);
        }
      });
    }

    controller.close();
  },

  cancel() {
    logger.info(`[Jobs Stream] Client disconnected: ${jobId}`);
    aborted = true;  // 루프 종료 트리거
  }
});
```

---

### P1-3. AbortController Timeout Finally Cleanup

**파일**: `src/app/api/ai/supervisor/stream/v2/route.ts`
**라인**: 233-308
**위험도**: 🟠 High (Timeout 누수)

#### 현재 코드
```typescript
// Line 233-234
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 55000);

try {
  // ... 스트림 처리 ...
  clearTimeout(timeout);  // try 블록 내에서만 호출
} catch (error) {
  clearTimeout(timeout);  // catch 블록에서도 호출
  // ...
}
// finally 블록 없음!
```

#### 수정 계획
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 55000);

try {
  // ... 스트림 처리 ...
} catch (error) {
  // 에러 처리
} finally {
  // 항상 실행 보장
  clearTimeout(timeout);
}
```

---

### P1-4. onError/onFinish Race Condition 강화

**파일**: `src/hooks/ai/useHybridAIQuery.ts`
**라인**: 365-489
**위험도**: 🟠 High (이중 처리 가능)

#### 현재 코드
```typescript
// Line 368: Race window 존재
if (errorHandledRef.current) {
  return;
}
// ... 처리 로직 ...
errorHandledRef.current = true;  // 늦게 설정
```

#### 수정 계획
```typescript
// Atomic check-and-set 패턴
const handleError = useCallback(() => {
  // 이미 처리됨 - 즉시 반환
  if (errorHandledRef.current) {
    logger.debug('[HybridAI] Error already handled, skipping');
    return true; // handled
  }

  // Atomic set (다음 호출 즉시 차단)
  errorHandledRef.current = true;
  return false; // not yet handled, proceed
}, []);

// onFinish에서 사용
onFinish: ({ message }) => {
  if (handleError()) {
    setState((prev) => ({ ...prev, isLoading: false }));
    onStreamFinish?.();
    return;
  }

  // ... 정상 처리 로직 ...
},

// onError에서 사용
onError: async (error) => {
  if (handleError()) {
    return; // 이미 onFinish에서 처리됨
  }

  // ... 에러 처리 로직 ...
},
```

---

## P2: Medium/Low Severity (다음 스프린트)

### P2-1. prepareStep Regex 사전 컴파일

**파일**: `cloud-run/ai-engine/src/services/ai-sdk/supervisor.ts`
**라인**: 901-953
**효과**: 성능 최적화 (~3x regex 호출 감소)

#### 수정 계획
```typescript
// 모듈 레벨에서 사전 컴파일
const TOOL_ROUTING_PATTERNS = {
  anomaly: /이상|급증|급감|스파이크|anomal|탐지|감지|비정상/i,
  prediction: /예측|트렌드|추이|전망|forecast|추세/i,
  rca: /장애|rca|타임라인|상관관계|원인|왜|근본|incident/i,
  advisor: /해결|방법|명령어|가이드|이력|과거|사례|검색/i,
  serverGroup: /(db|web|cache|lb|api|storage|로드\s*밸런서|캐시|스토리지)\s*(서버)?/i,
} as const;

// createPrepareStep에서 사용
function createPrepareStep(query: string) {
  const q = query.toLowerCase();

  return async ({ stepNumber }: { stepNumber: number }) => {
    if (stepNumber > 0) return {};

    if (TOOL_ROUTING_PATTERNS.anomaly.test(q)) {
      return { activeTools: [...] };
    }
    // ... 나머지 패턴
  };
}
```

---

### P2-2. Message ID UUID 전환

**파일**: `cloud-run/ai-engine/src/services/ai-sdk/supervisor.ts`
**라인**: 1007-1009
**효과**: 충돌 확률 0%

#### 수정 계획
```typescript
// 현재: Math.random() 기반 nonce
const nonce = Math.random().toString(36).slice(2, 8);

// 변경: crypto.randomUUID() 또는 atomic counter
import { randomUUID } from 'crypto';

// Option A: UUID (권장)
const messageId = `assistant-${request.sessionId}-${randomUUID()}`;

// Option B: Atomic counter (대안)
let messageCounter = 0;
const getNextMessageId = (sessionId: string) =>
  `assistant-${sessionId}-${Date.now()}-${++messageCounter}`;
```

---

### P2-3. useChat Resume Callbacks 추가

**파일**: `src/hooks/ai/useHybridAIQuery.ts`
**라인**: 354-364
**효과**: AI SDK v6 권장 패턴 준수

#### 수정 계획
```typescript
const { ... } = useChat({
  id: sessionIdRef.current,
  transport,
  resume: true,

  // 기존 콜백
  onFinish: ({ message }) => { ... },
  onData: (dataPart) => { ... },
  onError: async (error) => { ... },

  // 추가: Resume lifecycle callbacks (AI SDK v6)
  onResume: () => {
    logger.info('[HybridAI] Stream resumed successfully');
    setState((prev) => ({ ...prev, warning: null }));
  },
  onResumeError: (error) => {
    logger.warn('[HybridAI] Stream resume failed:', error);
    // Fallback: 새 요청으로 재시도
    setState((prev) => ({
      ...prev,
      warning: '연결이 복구되지 않았습니다. 다시 시도해주세요.',
    }));
  },
});
```

---

### P2-4. DataCacheLayer 삽입 전 크기 체크

**파일**: `cloud-run/ai-engine/src/lib/cache-layer.ts`
**라인**: 118-127
**효과**: 일시적 maxSize 초과 방지

#### 수정 계획
```typescript
set(key: string, value: T): void {
  // 삽입 전 크기 체크 및 정리
  if (this.cache.size >= this.maxSize) {
    this.cleanup();
  }

  // 정리 후에도 초과 시 가장 오래된 항목 삭제
  if (this.cache.size >= this.maxSize) {
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  this.cache.set(key, {
    data: value,
    timestamp: Date.now(),
  });
}
```

---

### P2-5. Dead Code 정리

| 파일 | 삭제 대상 | 예상 라인 |
|------|----------|----------|
| `useHybridAIQuery.ts:169-185` | underscore re-export alias | ~15줄 |
| `supervisor.ts:612-621` | 미사용 StreamEventType 주석 추가 | 0줄 (문서화) |
| `useAsyncAIQuery.ts:204-210` | Silent parse error → Zod validation | ~10줄 추가 |

---

## 검증 계획

### 단계별 검증

| 단계 | 명령어 | 통과 기준 |
|------|--------|----------|
| 1 | `npm run type-check` | 에러 0건 |
| 2 | `npm run test:quick` | 228개 테스트 통과 |
| 3 | `npm run lint` | 에러 0건 |
| 4 | Cloud Run 로컬 테스트 | 정상 응답 |

### 메모리 검증 (P0 수정 후)
```bash
# Cloud Run 로컬 실행 후 메모리 모니터링
docker stats ai-engine

# 100회 요청 후 메모리 증가량 확인
# 기대값: < 10MB 증가 (기존: 무제한 증가)
```

---

## 롤백 계획

각 우선순위별 개별 커밋:

```bash
# P0 커밋
git commit -m "fix(critical): bounded handoffEvents array and fresh model config"

# P1 커밋
git commit -m "fix(high): SSE timer cleanup, job stream abort, timeout finally"

# P2 커밋
git commit -m "refactor(medium): regex precompile, UUID messageId, resume callbacks"
```

문제 발생 시:
```bash
git revert <commit-hash>
```

---

## 일정 요약

| 우선순위 | 이슈 수 | 예상 시간 | 위험도 |
|:--------:|:-------:|:---------:|:------:|
| **P0** | 2건 | 1시간 | Critical |
| **P1** | 4건 | 2시간 | High |
| **P2** | 5건 | 1.5시간 | Medium/Low |
| **검증** | - | 0.5시간 | - |
| **Total** | 11건 | **5시간** | |

---

## 승인 요청

위 계획에 대해 검토 후 진행 방식을 선택해 주세요:

- [ ] P0만 진행 (Critical 이슈 즉시 수정)
- [ ] P0 + P1 진행 (High 이상 수정)
- [ ] 전체 (P0 + P1 + P2) 진행
- [ ] 수정 요청

---

_작성자: Claude Opus 4.5_
_최종 수정: 2026-01-24_
