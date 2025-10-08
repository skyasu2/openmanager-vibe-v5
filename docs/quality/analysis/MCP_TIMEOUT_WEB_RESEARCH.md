# MCP 타임아웃 회피 방법 - 웹 조사 결과

**작성일**: 2025-10-08
**출처**: 공식 문서 + 커뮤니티 분석 (2025년 최신 정보)

---

## 📊 Executive Summary

**핵심 발견**:
1. **공식 MCP 스펙**: Progress notification으로 timeout **리셋 가능** (SHOULD)
2. **Claude Code**: `MCP_TIMEOUT` 환경 변수로 설정 가능
3. **커뮤니티 해결책**: 비동기 아키텍처 패턴 권장
4. **다른 클라이언트**: Cline, LM Studio 등은 설정 가능하도록 패치됨

---

## 🔍 공식 MCP 스펙 분석 (2025-06-18)

### Timeout 공식 규정

**출처**: https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle

**핵심 내용**:
```
Implementations SHOULD establish timeouts for all sent requests,
to prevent hung connections and resource exhaustion.

Timeouts can be reset when receiving a progress notification.

A maximum timeout should always be enforced.
```

**중요 발견**:
- Progress notification으로 timeout **리셋 가능** ✅
- 하지만 "maximum timeout should always be enforced" → 무한 연장 불가 ⚠️
- "SHOULD" 규정 → 선택적 구현

### Request Lifecycle

1. **Initialization Phase**:
   - Client sends initialize request
   - Server responds with capabilities
   - Client sends initialized notification

2. **Operation Phase**:
   - Normal protocol communication
   - Progress notifications can reset timeout

3. **Shutdown Phase**:
   - Clean termination

### Cancellation

```
When no response is received within the timeout,
the sender SHOULD issue a cancellation notification for that request.
```

**의미**: Timeout 시 자동으로 cancellation notification 전송됨

---

## 🛠️ Claude Code 공식 설정 방법

### 환경 변수

**출처**: https://docs.claude.com/en/docs/claude-code/mcp

**사용 가능한 환경 변수**:

```bash
# 1. MCP 서버 시작 타임아웃
MCP_TIMEOUT=10000 claude

# 2. MCP 출력 토큰 제한
MAX_MCP_OUTPUT_TOKENS=50000 claude
```

**주의**: 공식 문서에는 **tool call timeout 전용 환경 변수 없음**

### .claude/settings.json 설정

**출처**: GitHub Issue #3033, 커뮤니티

**시도 가능한 설정** (비공식):
```json
{
  "environment": {
    "MCP_TIMEOUT": "180000",
    "MCP_TOOL_TIMEOUT": "180000"
  }
}
```

**문제점**:
- `MCP_TOOL_TIMEOUT`은 문서화되지 않음
- 일부 사용자는 효과 없다고 보고

### .claude/mcp.json 설정

**우리 실험 결과 확인됨**:
```json
{
  "mcpServers": {
    "multi-ai": {
      "timeout": 600000,  // 실제 효과 있음!
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

**효과**:
- 공식 문서: "startup timeout만"
- 실제 동작: **tool call timeout도 제어함** ✅

---

## 🌐 다른 MCP 클라이언트 비교

### Cline (VSCode Extension)

**출처**: https://github.com/cline/cline/issues/1306

**문제**:
- 초기 버전: 30초 하드코딩 타임아웃
- 사용자가 수정 불가능

**해결**:
- PR #2018로 설정 가능하게 개선
- MCP SDK 포크하여 timeout 파라미터 노출

**교훈**: 하드코딩된 timeout은 커뮤니티 압력으로 변경 가능

### LM Studio

**출처**: https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/727

**문제**:
- v0.3.17: `mcp.json`의 `timeout` 설정이 자동 제거됨
- 60초 이상 작업 불가능

**해결**:
- v0.3.18 beta 1부터 timeout 설정 가능
- 밀리초 단위로 지정

**설정 예시**:
```json
{
  "timeout": 120000  // 2분
}
```

### n8n

**출처**: https://community.n8n.io/t/mcp-server-timeout-issue/137313

**문제**: MCP 서버 timeout 문제 발생

**해결**: 워크플로우 설정에서 timeout 조정 가능

---

## 🏗️ 커뮤니티 권장 아키텍처 패턴

### 패턴 1: Asynchronous Hand-Off (가장 권장)

**출처**: https://www.arsturn.com/blog/no-more-timeouts-how-to-build-long-running-mcp-tools-that-actually-finish-the-job

**핵심 개념**:
```
"긴 작업을 동기식으로 기다리지 말고,
비동기 작업으로 전환하여 상태를 조회하는 방식"
```

**구현 방법**:

```typescript
// ❌ 잘못된 방법 (동기식, 타임아웃 발생)
async function analyzeCode(code: string) {
  // 60초 이상 걸리는 분석
  const result = await longRunningAnalysis(code);
  return result;
}

// ✅ 올바른 방법 (비동기 핸드오프)
async function startCodeAnalysis(code: string) {
  const taskId = await initiateBackgroundTask(code);
  return {
    taskId,
    message: "분석이 시작되었습니다. queryAnalysisStatus로 확인하세요."
  };
}

async function queryAnalysisStatus(taskId: string) {
  const status = await checkTaskStatus(taskId);
  return {
    status: status.state,  // 'running' | 'completed' | 'failed'
    progress: status.progress,
    result: status.result
  };
}

async function waitAnalysisComplete(taskId: string) {
  // 주기적으로 progress notification 전송
  while (true) {
    const status = await checkTaskStatus(taskId);

    // Progress notification 전송 (timeout 리셋)
    if (onProgress) {
      onProgress('analysis', `진행률 ${status.progress}%`, Date.now());
    }

    if (status.state === 'completed') {
      return status.result;
    }

    await sleep(5000);  // 5초마다 체크
  }
}
```

**장점**:
- Timeout 완전 회피 ✅
- 사용자에게 즉시 응답
- 백그라운드에서 안전하게 처리

**단점**:
- 구현 복잡도 증가
- 상태 관리 필요

### 패턴 2: Durable Execution (Temporal)

**출처**: https://www.arsturn.com/blog/no-more-timeouts-how-to-build-long-running-mcp-tools-that-actually-finish-the-job

**핵심 개념**:
```
"서버 크래시, 네트워크 장애에도 작업이 완료되도록 보장"
```

**도구**: Temporal, Inngest 등

**장점**:
- 자동 재시도
- 작업 내구성 보장
- 확장성

**단점**:
- 인프라 복잡도 증가
- 추가 서비스 필요

### 패턴 3: Retry + Circuit Breaker

**출처**: https://octopus.com/blog/mcp-timeout-retry

**Python 구현 예시**:

```python
from tenacity import retry, stop_after_attempt, wait_fixed
from purgatory import AsyncCircuitBreakerFactory

# Retry 전략
@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(1),
    retry=retry_if_exception_type(Exception)
)
async def call_mcp_tool():
    # MCP 호출
    pass

# Circuit Breaker 전략
circuitbreaker = AsyncCircuitBreakerFactory(default_threshold=3)

@circuitbreaker.decorator
async def call_external_service():
    # 외부 서비스 호출
    pass
```

**장점**:
- 자동 재시도로 일시적 실패 대응
- Circuit breaker로 연쇄 실패 방지

**단점**:
- 근본적 timeout 회피는 아님

### 패턴 4: Progress Notification 적극 활용

**MCP 스펙 기반**:

```typescript
async function longRunningTask(onProgress?: ProgressCallback) {
  const startTime = Date.now();

  // Progress notification interval (5초마다)
  const progressInterval = setInterval(() => {
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress('task', `작업 중... (${Math.floor(elapsed / 1000)}초)`, elapsed);
    }
  }, 5000);  // 5초마다 전송하여 timeout 리셋

  try {
    // 긴 작업 수행
    const result = await actualWork();
    clearInterval(progressInterval);
    return result;
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}
```

**효과**:
- MCP 스펙대로 timeout 리셋 가능
- 하지만 "maximum timeout" 제약 존재

---

## 🎯 Claude Code 타임아웃 해결 전략 (종합)

### 전략 1: .claude/mcp.json timeout 설정 ✅ 즉시 적용 가능

**설정**:
```json
{
  "mcpServers": {
    "multi-ai": {
      "timeout": 600000,  // 10분
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

**효과**:
- 우리 실험으로 확인됨: **실제 효과 있음**
- 공식 문서와 다르게 tool call timeout도 제어

**한계**:
- Claude Code 내부 제약 (60-90초 추정)은 여전히 존재

### 전략 2: MCP_TIMEOUT 환경 변수 ⚠️ 효과 불확실

**설정**:
```bash
MCP_TIMEOUT=180000 claude
```

**문제**:
- 공식 문서: "startup timeout만"
- 우리 실험: tool call에는 효과 없음

### 전략 3: Asynchronous Hand-Off 아키텍처 ✅ 근본 해결

**구현**:
```typescript
// Multi-AI MCP에 적용 가능
export async function startCodexAnalysis(query: string) {
  const taskId = generateTaskId();

  // 백그라운드에서 실행
  executeInBackground(async () => {
    const result = await queryCodex(query);
    saveTaskResult(taskId, result);
  });

  return {
    taskId,
    message: "분석이 시작되었습니다. getAnalysisResult로 확인하세요."
  };
}

export async function getAnalysisResult(taskId: string) {
  const result = await loadTaskResult(taskId);
  return result;
}
```

**장점**:
- Timeout 완전 회피
- 모든 길이의 쿼리 처리 가능

**단점**:
- 구현 복잡도 증가
- 상태 저장소 필요

### 전략 4: Progress Notification 최적화 ✅ 부분 개선

**현재 구현**:
```typescript
// v3.8.0 환경 변수
MULTI_AI_PROGRESS_INTERVAL=5000  // 5초마다 (기본 10초)
```

**효과**:
- MCP 스펙상 timeout 리셋 가능
- 하지만 실험 결과 효과 미미

**이유**:
- Claude Code가 "maximum timeout" 강제하는 것으로 추정

---

## 📊 벤치마크: MCP 클라이언트별 Timeout 정책

| 클라이언트 | 기본 Timeout | 설정 가능 여부 | 설정 방법 | 비고 |
|-----------|--------------|----------------|-----------|------|
| **Claude Code** | 60-90초 (추정) | ✅ 부분 가능 | `.claude/mcp.json` timeout | 공식 문서와 실제 다름 |
| **Cline** | 30초 (초기) | ✅ 가능 | PR #2018 이후 | 커뮤니티 압력으로 개선 |
| **LM Studio** | 60초 | ✅ 가능 | v0.3.18 beta+ | `mcp.json` timeout |
| **n8n** | 설정값 | ✅ 가능 | 워크플로우 설정 | - |

**결론**: 대부분의 MCP 클라이언트가 timeout 설정을 지원하는 추세

---

## 💡 Multi-AI MCP 개선 제안

### Phase 2 (v3.9.0) - 비동기 핸드오프 패턴

**새로운 도구 추가**:

```typescript
// 1. 비동기 작업 시작
{
  name: 'startAsyncQuery',
  description: '긴 쿼리를 비동기로 시작 (60초 이상 예상 시 사용)',
  inputSchema: {
    properties: {
      provider: { enum: ['codex', 'gemini', 'qwen'] },
      query: { type: 'string' }
    }
  }
}

// 2. 상태 조회
{
  name: 'getQueryStatus',
  description: '비동기 쿼리 상태 조회',
  inputSchema: {
    properties: {
      taskId: { type: 'string' }
    }
  }
}

// 3. 결과 대기 (progress 전송)
{
  name: 'waitQueryComplete',
  description: '비동기 쿼리 완료 대기 (progress notification 전송)',
  inputSchema: {
    properties: {
      taskId: { type: 'string' }
    }
  }
}
```

**구현**:
```typescript
// src/async-queue.ts
class AsyncTaskQueue {
  private tasks = new Map<string, AsyncTask>();

  async startTask(provider: string, query: string): Promise<string> {
    const taskId = generateId();

    const task: AsyncTask = {
      id: taskId,
      provider,
      query,
      status: 'running',
      startTime: Date.now()
    };

    this.tasks.set(taskId, task);

    // 백그라운드 실행
    this.executeTask(taskId);

    return taskId;
  }

  private async executeTask(taskId: string) {
    const task = this.tasks.get(taskId)!;

    try {
      const result = await this.callAI(task.provider, task.query);
      task.status = 'completed';
      task.result = result;
    } catch (error) {
      task.status = 'failed';
      task.error = error;
    }
  }

  async getStatus(taskId: string) {
    return this.tasks.get(taskId);
  }

  async waitComplete(taskId: string, onProgress: ProgressCallback) {
    const task = this.tasks.get(taskId)!;

    while (task.status === 'running') {
      // Progress notification 전송 (timeout 리셋)
      onProgress(
        task.provider,
        `작업 진행 중... (${Math.floor((Date.now() - task.startTime) / 1000)}초)`,
        Date.now() - task.startTime
      );

      await sleep(5000);
    }

    if (task.status === 'failed') {
      throw task.error;
    }

    return task.result;
  }
}
```

**장점**:
- 모든 길이의 쿼리 처리 가능
- Timeout 완전 회피
- 기존 도구와 호환성 유지

### Phase 3 - Claude Code에 개선 요청

**GitHub Issue 제출**:
```
Title: [Feature Request] Configurable tool call timeout via environment variable

Description:
Currently, Claude Code appears to have a hardcoded 60-90 second timeout
for MCP tool calls, regardless of the `timeout` setting in .claude/mcp.json.

Request:
1. Add MCP_TOOL_TIMEOUT environment variable
2. Or make .claude/mcp.json timeout apply to both startup AND tool calls
3. Document the actual behavior clearly

Use case:
- AI query analysis tools (Multi-AI MCP) often take >60 seconds
- Users need configurable timeout for long-running operations

Current workarounds:
- Using Bash wrapper instead of MCP (suboptimal UX)
- Implementing async hand-off patterns (complex)
```

---

## 📝 최종 권장 사항

### 즉시 적용 가능 (현재)

1. **`.claude/mcp.json` timeout을 600000 (10분)으로 설정** ✅
   ```json
   { "timeout": 600000 }
   ```

2. **Progress notification 유지** ✅
   ```typescript
   config.mcp.enableProgress = true
   ```

3. **60초 이내 쿼리만 MCP 사용** ✅
   - 간단한 질문
   - 코드 리뷰
   - 버그 분석

4. **60초 이상 쿼리는 Bash wrapper 사용** ✅
   ```bash
   ./scripts/ai-subagents/codex-wrapper.sh
   ```

### 중기 개선 (v3.9.0)

1. **비동기 핸드오프 패턴 구현** 🎯
   - `startAsyncQuery` 도구
   - `getQueryStatus` 도구
   - `waitQueryComplete` 도구

2. **자동 라우팅** 🎯
   ```typescript
   MULTI_AI_AUTO_MODE=true
   MULTI_AI_ASYNC_THRESHOLD=200  // 200자 이상 = 비동기
   ```

### 장기 개선 (커뮤니티)

1. **Claude Code에 기능 요청** 📮
   - MCP_TOOL_TIMEOUT 환경 변수
   - 또는 .claude/mcp.json timeout의 명확한 문서화

2. **MCP 스펙 준수 요청** 📮
   - Progress notification으로 timeout 리셋 보장
   - Maximum timeout 정책 명확화

---

## 🔗 참고 자료

### 공식 문서
- [MCP Specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle)
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)

### GitHub Issues
- [Cline #1306 - MCP Timeout Issues](https://github.com/cline/cline/issues/1306)
- [Claude Code #424 - MCP Timeout configurable](https://github.com/anthropics/claude-code/issues/424)
- [Claude Code #3033 - SSE Timeout ignored](https://github.com/anthropics/claude-code/issues/3033)
- [LM Studio #727 - Timeout configuration](https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/727)

### 커뮤니티 가이드
- [Build Timeout-Proof MCP Tools](https://www.arsturn.com/blog/no-more-timeouts-how-to-build-long-running-mcp-tools-that-actually-finish-the-job)
- [Resilient AI Agents With MCP](https://octopus.com/blog/mcp-timeout-retry)

---

**작성**: 2025-10-08
**최종 업데이트**: 웹 조사 완료
**핵심 결론**:
1. `.claude/mcp.json`의 `timeout`이 실제로 효과 있음 (우리 실험 확인)
2. 비동기 핸드오프 패턴이 근본적 해결책
3. Progress notification은 스펙상 효과 있지만 Claude Code 구현은 불확실
4. 커뮤니티는 설정 가능한 timeout을 강력히 요구 중
