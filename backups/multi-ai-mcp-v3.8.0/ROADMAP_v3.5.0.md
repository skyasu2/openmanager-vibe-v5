# Multi-AI MCP v3.5.0 Roadmap (Simple)

**목표**: AI CLI의 실제 출력(stdout + stderr)을 Claude에게 그대로 전달

**핵심 원칙**: "복잡한 상태 추적 불필요. AI CLI가 출력하는 걸 그대로 전달하면 에러도 자동으로 감지됨"

---

## 🎯 간단한 개선사항

### 1. stderr 출력 추가

**현재 (v3.4.0)**:
```typescript
interface AIResponse {
  provider: AIProvider;
  response: string;        // stdout만
  tokens?: number;
  responseTime: number;
  success: boolean;
  error?: string;
}
```

**개선 (v3.5.0)**:
```typescript
interface AIResponse {
  provider: AIProvider;
  response: string;        // stdout
  stderr?: string;         // 🆕 stderr 추가
  tokens?: number;
  responseTime: number;
  success: boolean;
  error?: string;
}
```

**효과**:
- ✅ AI CLI의 에러 메시지가 Claude에게 자동 전달
- ✅ 복잡한 상태 추적 불필요
- ✅ AI가 출력하는 모든 정보를 Claude가 볼 수 있음

---

### 2. 에러 캐치 개선

**현재 (v3.4.0)**:
```typescript
try {
  const result = await execFile('codex', ['exec', query]);
  return {
    response: result.stdout,  // stdout만
    success: true
  };
} catch (error) {
  throw error;  // 실제 CLI 에러 메시지 손실
}
```

**개선 (v3.5.0)**:
```typescript
try {
  const result = await execFile('codex', ['exec', query]);
  return {
    response: result.stdout,
    stderr: result.stderr,    // 🆕 정상 실행 시에도 stderr 포함
    success: true
  };
} catch (error) {
  // 🆕 에러 발생 시 stdout/stderr 모두 포함
  return {
    response: error.stdout || '',
    stderr: error.stderr || error.message,
    success: false,
    error: error.message
  };
}
```

**효과**:
- ✅ AI CLI의 경고 메시지도 Claude가 볼 수 있음
- ✅ 에러 발생 시 정확한 원인 파악 가능
- ✅ 디버깅 시간 단축

---

## 🔄 응답 형식 개선

### Before (v3.4.0):
```json
{
  "provider": "codex",
  "response": "코드 분석 결과...",
  "responseTime": 28000,
  "success": true
}
```

### After (v3.5.0):
```json
{
  "provider": "codex",
  "response": "코드 분석 결과...",
  "stderr": "Warning: Using deprecated API\nInfo: Processing file...",
  "responseTime": 28000,
  "success": true
}
```

**효과**:
- ✅ AI CLI의 경고/정보 메시지가 Claude에게 전달
- ✅ 복잡한 추가 코드 불필요
- ✅ 에러 발생 시 자동으로 감지됨

---

## 📊 에러 자동 감지 (간단)

### 시나리오 1: AI CLI 에러
```json
{
  "success": false,
  "response": "",
  "stderr": "Error: API rate limit exceeded\nPlease wait 60 seconds",
  "error": "Command failed with exit code 1"
}
```
→ Claude가 stderr를 보고 "Rate limit 문제구나" 자동 인지

### 시나리오 2: 타임아웃
```json
{
  "success": false,
  "response": "",
  "stderr": "Processing query...\nAnalyzing...",
  "error": "Timeout after 300s"
}
```
→ Claude가 "타임아웃 전까지 처리 중이었구나" 파악

---

## 🚀 구현 단계 (단순화)

### 단일 Phase: stderr 전달 (v3.5.0)
- [ ] `AIResponse`에 `stderr?: string` 필드 추가
- [ ] `codex.ts`: stdout + stderr 포함
- [ ] `gemini.ts`: stdout + stderr 포함
- [ ] `qwen.ts`: stdout + stderr 포함
- [ ] 에러 catch에서 stdout/stderr 추출
- [ ] 테스트
- [ ] 문서 업데이트

**예상 소요 시간**: 1-2시간 (복잡한 추적 시스템 없음)

---

## 💡 사용자 경험 개선

### Before (v3.4.0):
```
사용자: Gemini로 분석해줘
Claude: 에러 발생: Command failed
사용자: ??? 왜 실패했지?
```

### After (v3.5.0):
```
사용자: Gemini로 분석해줘
Claude: 에러 발생:
  stderr: "Error 429: Rate limit exceeded. Retry after 60s"

사용자: 아, Rate limit 문제구나!
```

**핵심**:
- ✅ AI CLI가 출력하는 에러를 Claude가 그대로 볼 수 있음
- ✅ 복잡한 상태 추적 시스템 불필요
- ✅ 간단하지만 효과적

---

## 📝 v3.4.0 → v3.5.0 마이그레이션

### 코드 변경 불필요

**하위 호환성 보장**:
- 기존 `queryCodex`, `queryGemini`, `queryQwen` 도구는 그대로 동작
- `stderr` 필드는 선택적 (있으면 사용, 없어도 문제없음)
- Claude가 자동으로 stderr를 활용

### 선택적 기능

```typescript
// v3.4.0 스타일 (여전히 작동)
const result = await queryCodex("테스트");
console.log(result.response);  // ✅

// v3.5.0 스타일 (stderr 확인)
const result = await queryCodex("테스트");
console.log(result.response);  // ✅
if (result.stderr) {
  console.log("경고/정보:", result.stderr);  // 🆕
}
```

---

## 🎯 성공 기준 (단순화)

### 자동 감지 요구사항
- ✅ AI CLI의 stdout + stderr를 Claude가 모두 볼 수 있음
- ✅ 에러 발생 시 AI CLI의 실제 에러 메시지 전달
- ✅ 복잡한 상태 추적 시스템 불필요

### UX 개선
- ✅ Claude가 AI CLI의 출력을 그대로 보고 판단
- ✅ 간단하지만 효과적
- ✅ 구현 시간 1-2시간

---

**작성일**: 2025-10-06
**타겟 버전**: v3.5.0
**예상 출시**: 2025-10-07 (내일)
**구현 시간**: 1-2시간
