# Multi-AI MCP v3.3.0 - Progress Notification 추가

**릴리스 일시**: 2025-10-06
**이전 버전**: v3.2.0
**새 버전**: v3.3.0

---

## 🎯 목표

**MCP 클라이언트 타임아웃 경고 제거**

### 문제점
```
⎿  Error: MCP error -32001: Request timed out
```

- MCP 클라이언트: ~60초 타임아웃
- 긴 AI 쿼리: 60초 이상 소요 (Gemini 70초, Codex 30-60초)
- 결과: 클라이언트 타임아웃 에러 표시 (실제로는 백그라운드에서 성공)

### 해결 방법

**MCP Progress Notification 구현**
- 10초마다 progress 신호 전송
- 클라이언트가 작업 진행 중임을 인식
- 타임아웃 방지

---

## 🔧 변경 사항

### 1. Progress Callback Factory 추가 (`src/index.ts`)

**Before**:
```typescript
const onProgress: ProgressCallback = (provider, status, elapsed) => {
  const elapsedSeconds = Math.floor(elapsed / 1000);
  console.error(`[${provider.toUpperCase()}] ${status} (${elapsedSeconds}초)`);
};
```

**After**:
```typescript
const createProgressCallback = (progressToken?: string): ProgressCallback => {
  return (provider, status, elapsed) => {
    const elapsedSeconds = Math.floor(elapsed / 1000);

    // Log to stderr (does not interfere with stdout MCP protocol)
    console.error(`[${provider.toUpperCase()}] ${status} (${elapsedSeconds}초)`);

    // Send MCP progress notification to prevent client timeout
    if (progressToken) {
      try {
        server.notification({
          method: 'notifications/progress',
          params: {
            progressToken,
            progress: elapsedSeconds,
            total: 120, // Estimated max seconds
          },
        });
      } catch (error) {
        // Progress notification is best-effort, don't fail on error
        console.error(`[Progress] Failed to send notification:`, error);
      }
    }
  };
};
```

**주요 변경**:
- Factory 패턴 사용 (progressToken 주입)
- MCP `notifications/progress` 전송
- Best-effort 방식 (에러 시 실패하지 않음)

---

### 2. Tool Handler에서 ProgressToken 추출

**Before**:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'queryCodex': {
        const { query } = args as { query: string };
        const result = await queryCodex(query, onProgress); // Static callback
```

**After**:
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Extract progressToken from request metadata
  const progressToken = (request.params as any)._meta?.progressToken as string | undefined;
  const onProgress = createProgressCallback(progressToken);

  try {
    switch (name) {
      case 'queryCodex': {
        const { query } = args as { query: string };
        const result = await queryCodex(query, onProgress); // Dynamic callback
```

**주요 변경**:
- Request metadata에서 `_meta.progressToken` 추출
- Token이 있으면 progress notification 활성화
- 모든 tool (queryCodex, queryGemini, queryQwen)에 일괄 적용

---

## 📊 Progress Notification 메커니즘

### 1. 클라이언트 → 서버 (Request)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "queryGemini",
    "arguments": {
      "query": "긴 분석 요청..."
    },
    "_meta": {
      "progressToken": "unique-token-12345"
    }
  }
}
```

### 2. 서버 → 클라이언트 (Progress Notification)

**10초마다 자동 전송**:
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/progress",
  "params": {
    "progressToken": "unique-token-12345",
    "progress": 10,  // 경과 시간 (초)
    "total": 120     // 예상 최대 시간
  }
}
```

**타임라인 예시 (70초 Gemini 쿼리)**:
```
0초:  Gemini 시작
10초: Progress notification (10/120)
20초: Progress notification (20/120)
30초: Progress notification (30/120)
40초: Progress notification (40/120)
50초: Progress notification (50/120)
60초: Progress notification (60/120)  ← 타임아웃 방지!
70초: Gemini 완료 → 최종 응답
```

### 3. 서버 → 클라이언트 (Final Response)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"provider\": \"gemini\",\n  \"response\": \"...\",\n  \"success\": true\n}"
      }
    ]
  }
}
```

---

## 🎯 기대 효과

### Before (v3.2.0)

**문제**:
- 60초 초과 쿼리: 클라이언트 타임아웃 에러
- UX: 사용자는 실패로 인식
- 실제: 백그라운드에서 정상 완료

**예시**:
```
User: Gemini로 코드 분석해줘
Claude: [60초 경과]
⎿  Error: MCP error -32001: Request timed out

[실제로는 70초에 완료되어 히스토리에 저장됨]
[하지만 사용자는 실패로 인식]
```

### After (v3.3.0)

**개선**:
- 60초 초과 쿼리: Progress notification으로 타임아웃 방지
- UX: 진행 중임을 인식
- 실제: 정상 완료 후 응답

**예시**:
```
User: Gemini로 코드 분석해줘
Claude: [10초] Gemini 분석 중... (10초)
        [20초] Gemini 분석 중... (20초)
        [30초] Gemini 분석 중... (30초)
        ...
        [70초] Gemini 완료! (70초)

결과: [정상 응답 표시]
```

---

## 📈 성능 지표

### 타임아웃 방지 효과

| 쿼리 유형 | 응답 시간 | v3.2.0 UX | v3.3.0 UX |
|-----------|-----------|-----------|-----------|
| **Codex 짧은** | 2-10초 | ✅ 즉시 | ✅ 즉시 |
| **Qwen 짧은** | 10-26초 | ✅ 즉시 | ✅ 즉시 |
| **Codex 긴** | 30-40초 | ✅ 즉시 | ✅ 즉시 |
| **Qwen 긴** | 40-60초 | ✅ 즉시 | ✅ 즉시 |
| **Gemini 긴** | 60-80초 | ❌ 타임아웃 | ✅ **Progress 표시** |
| **매우 긴 쿼리** | 80-120초 | ❌ 타임아웃 | ✅ **Progress 표시** |

### Progress Notification 빈도

- **간격**: 10초
- **오버헤드**: ~1ms (무시 가능)
- **네트워크**: ~100 bytes/notification
- **예시**: 70초 쿼리 = 7회 notification

---

## 🔍 기술 세부사항

### MCP Protocol 준수

**MCP Specification**:
- Method: `notifications/progress`
- Direction: Server → Client (unidirectional)
- Type: Notification (response 불필요)

**구현**:
```typescript
server.notification({
  method: 'notifications/progress',
  params: {
    progressToken: string,    // Request에서 제공
    progress: number,          // 현재 진행도 (초)
    total: number,             // 예상 최대 시간 (초)
  },
});
```

### AI 클라이언트 통합

**기존 Progress Callback 활용**:
- Codex: 10초 간격 progress callback (이미 구현됨)
- Gemini: 10초 간격 progress callback (이미 구현됨)
- Qwen: 10초 간격 progress callback (이미 구현됨)

**추가 작업**: 없음
- 기존 callback을 MCP notification으로 연결만 추가
- 코드 중복 없음
- AI 클라이언트 코드 변경 없음

---

## 🚀 업그레이드 가이드

### 1. 패키지 업데이트

```bash
cd /mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp
npm run build
```

### 2. Claude Code 재시작

```bash
# Claude Code 종료
Ctrl+C

# 재실행
claude
```

### 3. 확인

```typescript
// 긴 쿼리 테스트 (60초 이상)
mcp__multi_ai__queryGemini({
  query: "Memory Guard 코드를 SOLID 원칙 관점에서 상세 분석해주세요. (긴 쿼리)"
})

// 예상 결과:
// - 타임아웃 에러 없음
// - Progress 로그 출력 (10초마다)
// - 정상 완료 후 응답
```

---

## 🐛 알려진 제한사항

### 1. ProgressToken 의존성

**상황**: Claude Code가 progressToken을 제공하지 않는 경우

**영향**:
- Progress notification 비활성화
- stderr 로그만 출력 (기존 동작)
- 타임아웃 에러 가능 (60초 초과 쿼리)

**확률**: 낮음 (MCP SDK 1.0.4+는 대부분 지원)

### 2. Best-Effort Notification

**설계**:
```typescript
try {
  server.notification({ ... });
} catch (error) {
  // Progress notification is best-effort, don't fail on error
  console.error(`[Progress] Failed to send notification:`, error);
}
```

**이유**:
- Progress는 선택적 기능
- Notification 실패가 쿼리 실패로 이어지면 안 됨
- 에러 시에도 로그는 출력됨

---

## 📚 관련 문서

- [v3.2.0 Final Verification](FINAL_VERIFICATION_2025-10-06.md) - 이전 버전 검증
- [v3.2.0 Roadmap](ROADMAP_v3.2.0.md) - Rate Limit 해결
- [Debug Mode Guide](DEBUG_MODE_GUIDE.md) - 디버깅 방법

---

## 🎉 요약

### v3.3.0 핵심 개선

**Problem**: 60초 초과 쿼리 시 타임아웃 에러 표시
**Solution**: MCP Progress Notification 구현
**Result**: 타임아웃 에러 제거, 진행 상황 표시

### 코드 변경

- **수정**: `src/index.ts` (Progress callback factory)
- **추가**: MCP `notifications/progress` 전송
- **변경 없음**: AI 클라이언트 (codex.ts, gemini.ts, qwen.ts)

### 검증 필요

1. ✅ TypeScript 빌드: 성공
2. ⏳ 긴 쿼리 테스트: Claude Code 재시작 후 확인
3. ⏳ Progress 로그 확인: 10초 간격 notification

---

**릴리스 날짜**: 2025-10-06
**상태**: 빌드 완료, 테스트 대기 중
**다음 버전**: v3.4.0 (Post-Query Verification 예정)
