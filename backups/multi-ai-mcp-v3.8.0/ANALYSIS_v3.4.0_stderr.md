# Multi-AI MCP v3.4.0 stderr 처리 분석

**작성일**: 2025-10-06
**목적**: 기존 방식의 문제점 파악 및 v3.5.0 개선 방향 정립

---

## 📊 현재 방식 분석 (v3.4.0)

### 1. execFile 반환 구조

```typescript
// Node.js execFile이 반환하는 데이터
interface ExecFileResult {
  stdout: string;  // 표준 출력 (AI의 실제 응답)
  stderr: string;  // 표준 에러 (경고/정보/에러 메시지)
}

// 에러 발생 시
interface ExecFileError extends Error {
  stdout: string;  // 에러 전까지의 출력
  stderr: string;  // 에러 메시지
  code: number;    // exit code (예: 1)
  message: string; // "Command failed with exit code 1"
}
```

---

### 2. 현재 코드 (codex.ts 예시)

#### ✅ 성공 케이스

```typescript
// src/ai-clients/codex.ts:42-76
try {
  const result = await execFileAsync('codex', ['exec', query]);

  // ❌ 문제 1: stderr 무시
  const response = result.stdout
    .split('\n')
    .filter(line => !line.includes('workdir:'))
    .join('\n')
    .trim();

  return {
    provider: 'codex',
    response,        // stdout만
    // stderr: ???   // 🚫 stderr는 버림
    success: true
  };
}
```

**실제 AI CLI 출력 예시**:
```bash
# stdout
코드 분석 결과: 버그 발견됨

# stderr (버려짐!)
Warning: Using deprecated API v1.0
Info: Processing 15 files
Hint: Consider upgrading to v2.0
```

**Claude가 받는 결과**:
```json
{
  "response": "코드 분석 결과: 버그 발견됨",
  "success": true
}
```
→ Claude는 Warning/Info/Hint를 **전혀 모름**

---

#### ❌ 에러 케이스

```typescript
// src/ai-clients/codex.ts:136-150
catch (error) {
  const errorMessage = error instanceof Error
    ? error.message  // ❌ 문제 2: "Command failed with exit code 1"만
    : String(error);

  return {
    provider: 'codex',
    response: '',
    success: false,
    error: errorMessage  // 추상적인 메시지만
    // stdout: ???       // 🚫 에러 전까지의 출력 손실
    // stderr: ???       // 🚫 실제 에러 메시지 손실
  };
}
```

**실제 AI CLI 에러 출력 예시**:
```bash
# stdout (버려짐!)
분석 시작...
파일 1/10 처리 중...
파일 2/10 처리 중...

# stderr (버려짐!)
Error: API rate limit exceeded
Rate limit: 50 requests per minute
Current usage: 52/50
Retry after: 60 seconds
Please wait or upgrade your plan

# Node.js error.message
"Command failed with exit code 1"
```

**Claude가 받는 결과**:
```json
{
  "response": "",
  "success": false,
  "error": "Command failed with exit code 1"
}
```
→ Claude는 **"왜 실패했는지" 전혀 모름**

---

## 🔍 문제점 요약

### 문제 1: 정상 실행 시 stderr 손실

**AI CLI의 stderr 용도**:
- 경고 메시지 (Warning)
- 정보 메시지 (Info)
- 힌트/권장사항 (Hint)
- 진행 상황 (Progress)

**현재 문제**:
```typescript
const result = await execFile('codex', ['exec', query]);
// result.stderr 존재하지만 사용 안 함
return { response: result.stdout };  // stderr 버림
```

**예시**:
```
AI CLI가 말함: "Warning: 이 API는 곧 지원 중단됩니다"
Claude는 듣지 못함: (stderr를 받지 못함)
```

---

### 문제 2: 에러 시 실제 에러 메시지 손실

**Node.js execFile의 에러 객체**:
```typescript
error = {
  message: "Command failed with exit code 1",  // 추상적
  stdout: "분석 시작...\n파일 1/10 처리 중...",
  stderr: "Error: API rate limit exceeded\nRetry after: 60s",  // 구체적!
  code: 1
}
```

**현재 코드**:
```typescript
catch (error) {
  return {
    error: error.message  // ❌ "Command failed with exit code 1"만
  };
}
```

**Claude의 혼란**:
```
사용자: "Codex로 분석해줘"
Claude: "에러 발생: Command failed with exit code 1"
사용자: "??? 무슨 에러야?"
Claude: "..." (실제 에러 메시지를 받지 못함)
```

---

### 문제 3: 디버깅 불가능

**현재 상황**:
- AI CLI가 자세한 에러를 stderr에 출력
- MCP 서버가 stderr를 버림
- Claude는 추상적인 메시지만 받음
- 사용자는 문제 원인 파악 불가

**예시 시나리오**:
```
1. Gemini가 429 Rate Limit 에러 발생
2. stderr에 "Rate limit: 60 RPM, Current: 65/60" 출력
3. MCP가 stderr 버림
4. Claude는 "Command failed"만 받음
5. 사용자는 왜 실패했는지 모름
```

---

## 💡 v3.5.0 개선 방안

### 간단한 해결책

```typescript
// ✅ 성공 시
return {
  response: result.stdout,
  stderr: result.stderr,  // 🆕 추가
  success: true
};

// ✅ 에러 시
catch (error) {
  return {
    response: error.stdout || '',    // 🆕 추가
    stderr: error.stderr || '',      // 🆕 추가
    error: error.message,
    success: false
  };
}
```

---

## 📈 개선 효과

### Before (v3.4.0):
```json
{
  "response": "",
  "success": false,
  "error": "Command failed with exit code 1"
}
```

### After (v3.5.0):
```json
{
  "response": "분석 시작...\n파일 1/10 처리 중...",
  "stderr": "Error: API rate limit exceeded (65/60 RPM)\nRetry after: 60 seconds",
  "success": false,
  "error": "Command failed with exit code 1"
}
```

**Claude의 이해**:
```
사용자: "Codex로 분석해줘"
Claude: "에러 발생: API Rate Limit 초과 (65/60 RPM)
        60초 후 재시도하거나 플랜 업그레이드가 필요합니다."
사용자: "아, Rate Limit 문제구나!"
```

---

## 🔬 실제 테스트 케이스

### 테스트 1: Codex 경고 메시지

```bash
# Codex CLI 실행
$ codex exec "코드 분석"

# stdout
분석 결과: 버그 3개 발견

# stderr
Warning: API v1.0 deprecated, use v2.0
Info: Using model gpt-4
```

**v3.4.0 결과**:
```json
{ "response": "분석 결과: 버그 3개 발견" }
```
→ Warning 손실

**v3.5.0 결과**:
```json
{
  "response": "분석 결과: 버그 3개 발견",
  "stderr": "Warning: API v1.0 deprecated, use v2.0\nInfo: Using model gpt-4"
}
```
→ Warning 전달 ✅

---

### 테스트 2: Gemini Rate Limit

```bash
# Gemini CLI 실행
$ gemini "아키텍처 검토"

# stdout
(없음)

# stderr
Error 429: Resource has been exhausted
Rate limit exceeded: 60 RPM
Current usage: 65/60
Retry after: 43 seconds

# exit code: 1
```

**v3.4.0 결과**:
```json
{
  "success": false,
  "error": "Command failed with exit code 1"
}
```
→ 왜 실패했는지 모름 ❌

**v3.5.0 결과**:
```json
{
  "success": false,
  "response": "",
  "stderr": "Error 429: Resource has been exhausted\nRate limit: 60 RPM\nCurrent: 65/60\nRetry after: 43s",
  "error": "Command failed with exit code 1"
}
```
→ 정확한 원인 파악 ✅

---

### 테스트 3: Qwen 타임아웃

```bash
# Qwen CLI 실행
$ qwen -p "복잡한 분석"

# stdout
분석 시작...
첫 번째 단계 완료
두 번째 단계 진행 중...

# stderr
Processing query...
Analyzing dependencies...
Computing metrics...
(300초 후 타임아웃)

# MCP가 강제 종료
```

**v3.4.0 결과**:
```json
{
  "success": false,
  "error": "Qwen timeout (300s)"
}
```
→ 어디까지 진행했는지 모름 ❌

**v3.5.0 결과**:
```json
{
  "success": false,
  "response": "분석 시작...\n첫 번째 단계 완료\n두 번째 단계 진행 중...",
  "stderr": "Processing query...\nAnalyzing dependencies...\nComputing metrics...",
  "error": "Qwen timeout (300s)"
}
```
→ 어디까지 진행했는지 파악 가능 ✅

---

## 🎯 결론

### 현재 문제 (v3.4.0)
1. ❌ stderr 무시 → 경고/정보 메시지 손실
2. ❌ 에러 시 stdout/stderr 버림 → 원인 파악 불가
3. ❌ 추상적인 에러 메시지만 전달

### 개선 방향 (v3.5.0)
1. ✅ **stderr 포함** → AI CLI의 모든 출력 전달
2. ✅ **에러 시 stdout/stderr 보존** → 정확한 원인 파악
3. ✅ **간단한 구현** → 기존 코드 2줄만 추가

**핵심**: "AI CLI가 출력하는 걸 버리지 말고 그대로 Claude에게 전달"

---

**작성일**: 2025-10-06
**분석 대상**: Multi-AI MCP v3.4.0
**개선 예정**: v3.5.0 (1-2시간 소요)
