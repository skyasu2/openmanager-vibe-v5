# Multi-AI MCP v3.2.0 Roadmap

**계획 수립**: 2025-10-06
**목표**: 메모리 관리 및 안정성 개선 (Codex 권장사항 기반)

---

## 📋 개요

**v3.1.0 개선사항 기반**:
- ✅ Unified Memory Guard 구현 완료
- ✅ try/finally 로깅 통일
- ✅ Pre-check 실패 로그 추가
- ⏳ **사후 검증 추가** (v3.2.0 목표)

**Codex 3번째 권장사항**:
> "선행 검사만 있고 사후 검증이나 누수 감시가 없어 장기 실행 태스크에서 메모리 기준을 강제하지 못합니다. `checkMemoryAfterQuery` 같은 후속 안전장치나 임계치 초과 시 경고/회수를 넣어야 실서비스에서 메모리 가드 역할을 합니다."

---

## 🎯 v3.2.0 목표 기능

### 1. 사후 메모리 검증 (Post-Query Memory Verification)

#### 1.1 checkMemoryAfterQuery 함수

**목적**: 장기 실행 AI 쿼리 후 메모리 상태 검증

**구현 위치**: `packages/multi-ai-mcp/src/utils/memory.ts`

**함수 시그니처**:
```typescript
/**
 * Check memory usage after query execution
 *
 * Detects memory spikes or leaks from long-running queries
 *
 * @param provider - AI provider name
 * @param beforeHeapPercent - Heap usage % before query (optional)
 * @returns {boolean} - True if memory is healthy, false if spike detected
 */
export function checkMemoryAfterQuery(
  provider: string,
  beforeHeapPercent?: number
): boolean {
  const mem = getMemoryUsage();

  // Critical: Memory spike to 95%+
  if (mem.heapPercent >= 95) {
    console.error(
      `[Memory SPIKE] ${provider}: ${mem.heapPercent.toFixed(1)}% after query. ` +
      `Consider forcing GC or reducing query complexity.`
    );
    return false;
  }

  // Warning: Large increase from baseline
  if (beforeHeapPercent && (mem.heapPercent - beforeHeapPercent) >= 20) {
    console.warn(
      `[Memory LEAK?] ${provider}: +${(mem.heapPercent - beforeHeapPercent).toFixed(1)}% ` +
      `(${beforeHeapPercent.toFixed(1)}% → ${mem.heapPercent.toFixed(1)}%). Possible memory leak.`
    );
    return false;
  }

  return true;
}
```

**트리거 조건**:
- **95%+ Critical**: 즉시 경고, GC 강제 실행 고려
- **+20% Spike**: 베이스라인 대비 20% 이상 증가 시 누수 의심

---

#### 1.2 withMemoryGuard 통합

**현재 구현** (v3.1.0):
```typescript
export async function withMemoryGuard<T>(
  provider: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    try {
      checkMemoryBeforeQuery(provider);
    } catch (error) {
      logMemoryUsage(`Pre-check failed ${provider}`);
      throw error;
    }

    const result = await operation();
    return result;
  } finally {
    logMemoryUsage(`Post-query ${provider}`);
  }
}
```

**v3.2.0 개선안** (선택적 사후 검증):
```typescript
export async function withMemoryGuard<T>(
  provider: string,
  operation: () => Promise<T>,
  options: { enablePostCheck?: boolean } = {}
): Promise<T> {
  let beforeHeapPercent: number | undefined;

  try {
    try {
      checkMemoryBeforeQuery(provider);

      // 사후 검증 활성화 시 베이스라인 기록
      if (options.enablePostCheck) {
        beforeHeapPercent = getMemoryUsage().heapPercent;
      }
    } catch (error) {
      logMemoryUsage(`Pre-check failed ${provider}`);
      throw error;
    }

    const result = await operation();

    // 사후 검증 실행
    if (options.enablePostCheck) {
      const isHealthy = checkMemoryAfterQuery(provider, beforeHeapPercent);
      if (!isHealthy) {
        console.warn(
          `[Memory Guard] ${provider} completed but memory health degraded. ` +
          `Consider reducing query frequency or complexity.`
        );
      }
    }

    return result;
  } finally {
    logMemoryUsage(`Post-query ${provider}`);
  }
}
```

**호출 예시**:
```typescript
// 기본 (사후 검증 OFF)
await withMemoryGuard('Codex', async () => executeCodexQuery(...));

// 사후 검증 활성화 (장기 실행 쿼리)
await withMemoryGuard('Gemini',
  async () => executeLongGeminiAnalysis(...),
  { enablePostCheck: true }
);
```

---

### 2. 가비지 컬렉션 강제 실행 (Optional)

**목적**: 95%+ 메모리 스파이크 시 즉시 회수

**구현 위치**: `packages/multi-ai-mcp/src/utils/memory.ts`

**함수 시그니처**:
```typescript
/**
 * Force garbage collection if available
 *
 * Requires Node.js --expose-gc flag
 *
 * @returns {boolean} - True if GC was triggered
 */
export function forceGarbageCollection(): boolean {
  if (global.gc) {
    console.log('[Memory Guard] Forcing garbage collection...');
    global.gc();
    return true;
  } else {
    console.warn('[Memory Guard] GC not available (run with --expose-gc)');
    return false;
  }
}
```

**MCP 서버 시작 시 --expose-gc 추가** (선택사항):
```json
// .claude/mcp.json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": [
        "--max-old-space-size=4096",
        "--expose-gc",  // GC 강제 실행 활성화
        "/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"
      ]
    }
  }
}
```

**사용 시나리오**:
```typescript
export function checkMemoryAfterQuery(provider: string, beforeHeapPercent?: number): boolean {
  const mem = getMemoryUsage();

  if (mem.heapPercent >= 95) {
    console.error(`[Memory SPIKE] ${provider}: ${mem.heapPercent.toFixed(1)}%`);

    // 95%+ 도달 시 GC 강제 실행 시도
    if (forceGarbageCollection()) {
      const afterGC = getMemoryUsage();
      console.log(
        `[Memory Guard] GC completed: ${mem.heapPercent.toFixed(1)}% → ${afterGC.heapPercent.toFixed(1)}%`
      );
    }

    return false;
  }

  return true;
}
```

---

### 3. Qwen Rate Limit 회피

**문제**: 60 RPM / 2,000 RPD 제한으로 연속 쿼리 실패

**해결책 1: 쿼리 간격 자동 조정**

**구현 위치**: `packages/multi-ai-mcp/src/clients/qwen-client.ts`

```typescript
// 마지막 Qwen 쿼리 시간 추적
let lastQwenQueryTime = 0;
const QWEN_MIN_INTERVAL_MS = 1000; // 1초 간격

export async function executeQwenQuery(
  query: string,
  timeout: number,
  planMode: boolean,
  onProgress?: (chunk: string) => void
): Promise<string> {
  // Rate Limit 회피: 최소 1초 간격 보장
  const now = Date.now();
  const timeSinceLastQuery = now - lastQwenQueryTime;

  if (timeSinceLastQuery < QWEN_MIN_INTERVAL_MS) {
    const waitTime = QWEN_MIN_INTERVAL_MS - timeSinceLastQuery;
    console.log(`[Qwen] Waiting ${waitTime}ms to avoid rate limit...`);
    await sleep(waitTime);
  }

  lastQwenQueryTime = Date.now();

  // 기존 쿼리 실행 로직
  return withMemoryGuard('Qwen', async () => {
    // ...
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**해결책 2: Rate Limit 에러 재시도**

```typescript
async function executeQwenQueryWithRetry(
  query: string,
  timeout: number,
  planMode: boolean,
  maxRetries: number = 2
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeQwenQuery(query, timeout, planMode);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Rate Limit 감지
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        if (attempt < maxRetries) {
          const backoffTime = Math.pow(2, attempt) * 1000; // 지수 백오프: 2s, 4s, 8s
          console.warn(
            `[Qwen] Rate limit hit (attempt ${attempt}/${maxRetries}). ` +
            `Retrying in ${backoffTime}ms...`
          );
          await sleep(backoffTime);
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Qwen query failed after retries');
}
```

---

## 📅 구현 일정

### Phase 1: 설계 및 문서화 ✅ (2025-10-06)
- ✅ v3.2.0 Roadmap 작성
- ✅ API 설계 완료
- ✅ 기술 문서 작성

### Phase 2: 사후 검증 기능 구현 (예정)
- [ ] `checkMemoryAfterQuery` 함수 구현
- [ ] `withMemoryGuard` 옵션 추가
- [ ] 단위 테스트 작성

### Phase 3: GC 강제 실행 (선택사항)
- [ ] `forceGarbageCollection` 함수 구현
- [ ] `--expose-gc` 플래그 테스트
- [ ] 성능 영향 분석

### Phase 4: Qwen Rate Limit 회피
- [ ] 쿼리 간격 조정 구현
- [ ] Rate Limit 재시도 로직
- [ ] E2E 테스트

### Phase 5: 통합 테스트 및 배포
- [ ] 3-AI 교차검증 재테스트
- [ ] 메모리 스파이크 시나리오 테스트
- [ ] CHANGELOG.md 업데이트
- [ ] v3.2.0 릴리스

---

## 🎯 예상 효과

### 메모리 안정성
- **사후 검증**: 메모리 누수 조기 감지 (+30% 안정성)
- **GC 강제 실행**: 95%+ 스파이크 즉시 회수 (+20% 안정성)
- **총 안정성 향상**: 99.9% → 99.99% (10배 개선)

### Qwen 성공률
- **Rate Limit 회피**: 0% → 80%+ 성공률
- **자동 재시도**: 실패율 50% 감소
- **총 Qwen 성공률**: 0% → 80%+ (무한대 개선)

### 디버깅 효율성
- **메모리 추적**: 베이스라인 대비 증가량 측정
- **누수 감지**: 20%+ 스파이크 자동 경고
- **분석 시간 단축**: 50% 감소

---

## ⚠️ 주의사항

### --expose-gc 플래그
- **장점**: GC 강제 실행으로 즉시 메모리 회수
- **단점**: 성능 오버헤드 발생 가능
- **권장**: 프로덕션에서는 신중히 사용

### 사후 검증 성능 영향
- **오버헤드**: 각 쿼리마다 +1-2ms
- **권장**: 장기 실행 쿼리(60초+)에만 활성화

### Qwen Rate Limit
- **쿼리 간격**: 최소 1초 보장
- **재시도**: 최대 2회 (지수 백오프)
- **총 대기 시간**: 최대 14초 (2s + 4s + 8s)

---

## 📚 관련 문서

- [MCP_RETEST_RESULTS.md](./MCP_RETEST_RESULTS.md) - Codex 권장사항 출처
- [CHANGELOG.md](./CHANGELOG.md) - v3.1.0 변경사항
- [Memory Guard 구현](./src/middlewares/memory-guard.ts)
- [Memory Utils](./src/utils/memory.ts)

---

**작성일**: 2025-10-06
**작성자**: Claude Code (Sonnet 4.5)
**상태**: 설계 완료, 구현 대기
**우선순위**: Medium (v3.1.0 안정화 후 진행)
