# MCP Timeout 문제 분석

**문제**: Gemini/Qwen이 MCP 도구에서 timeout되지만 Bash CLI에서는 정상 동작

---

## 🔍 사실 관계

### 테스트 결과 비교

| 실행 방식 | Codex | Gemini | Qwen | 비고 |
|-----------|-------|--------|------|------|
| **Bash CLI 직접** | ✅ 성공 | ✅ 성공 (13.6s) | ✅ 성공 (9.6s) | v1.6.0 테스트 |
| **MCP 도구** | ✅ 성공 (13.1s) | ❌ MCP timeout | ❌ MCP timeout | v3.6.0 테스트 |

### CLI 직접 실행 (성공)

```bash
# Gemini CLI 직접 실행
$ gemini "1+1은?"
Loaded cached credentials.
2

# Qwen CLI 직접 실행
$ qwen -p "안녕하세요"
Hello! I'm ready to help...

# 응답 시간
Gemini: 13.6s
Qwen: 9.6s
```

### MCP 도구 실행 (실패)

```typescript
// MCP 도구로 호출
mcp__multi-ai__queryGemini("1+1은?")
// → MCP error -32001: Request timed out

mcp__multi-ai__queryQwen("안녕하세요")
// → MCP error -32001: Request timed out
```

---

## 🏗️ 아키텍처 이해

### WSL CLI 기반 설계

Multi-AI MCP는 **API가 아닌 WSL 로컬 CLI**를 사용:

```typescript
// ai-clients/gemini.ts
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// WSL에 설치된 gemini CLI 실행
const result = await execFileAsync('gemini', [query, '--model', model], {
  maxBuffer: config.maxBuffer,
  cwd: config.cwd
});
```

**특징**:
- ✅ API 키 불필요 (OAuth 계정 인증)
- ✅ API 비용 없음
- ✅ WSL 환경에서 `child_process.execFile()` 사용
- ✅ stdout/stderr 수집하여 반환

### 호출 흐름

```
Claude Code (User)
  ↓ MCP Protocol
MCP Server (index.ts)
  ↓ CallToolRequest
queryGemini() (ai-clients/gemini.ts)
  ↓ execFile()
WSL: gemini CLI 실행
  ↓ OAuth 인증
Google Gemini API
  ↓ Response
WSL: stdout 출력
  ↓ 수집
MCP Server: AIResponse 반환
  ↓ MCP Protocol
Claude Code: 결과 표시
```

---

## 🐛 문제 원인 분석

### 1. Bash 성공 vs MCP 실패

**Bash에서 직접 실행**:
```bash
$ gemini "1+1은?"
# → 13.6초 성공
```

**MCP에서 실행**:
```typescript
mcp__multi-ai__queryGemini("1+1은?")
// → MCP timeout (600s 초과?)
```

**결론**: CLI 자체는 정상 동작함. **MCP 서버 레벨의 문제**.

### 2. 가능한 원인

#### 원인 1: MCP 서버 미재시작

**현재 상황**:
- `.mcp.json` 수정 (env 제거)
- **하지만 MCP 서버 재시작 안 함**
- 이전 env 설정이 메모리에 남아있을 수 있음

**검증 방법**:
```bash
# Claude Code 재시작 필요
/restart
```

#### 원인 2: Progress Callback 미작동

**index.ts의 Progress Callback**:
```typescript
const createProgressCallback = (progressToken?: string): ProgressCallback => {
  return (provider, status, elapsed) => {
    // MCP progress notification 전송
    if (progressToken) {
      server.notification({
        method: 'notifications/progress',
        params: {
          progressToken,
          progress: elapsedSeconds,
          total: 120,  // ← 120초로 고정?
        },
      });
    }
  };
};
```

**문제점**:
- `total: 120` 고정 (2분)
- 하지만 실제 타임아웃은 420s (7분)
- Progress notification이 정확하지 않을 수 있음

#### 원인 3: execFile() Buffering 문제

**현재 설정**:
```typescript
execFileAsync('gemini', [query, '--model', model], {
  maxBuffer: config.maxBuffer,  // 10MB
  cwd: config.cwd
})
```

**가능한 문제**:
- stdout/stderr가 10MB를 초과하면 에러
- 하지만 Gemini 응답은 보통 KB 단위
- 이것이 원인일 가능성 낮음

#### 원인 4: WSL + Node.js 통신 문제

**환경**:
- WSL 2 환경
- Node.js execFile()로 WSL CLI 실행
- 프로세스 간 통신 (IPC)

**가능한 문제**:
- WSL 프로세스 생성 지연
- stdout/stderr 버퍼링 지연
- 하지만 Bash에서는 성공하므로 가능성 낮음

#### 원인 5: MCP 600s Timeout 자체

**설정**:
```typescript
mcp: {
  requestTimeout: 600000,  // 10분
}
```

**하지만**:
- Gemini 응답: 13.6s (실제)
- MCP timeout: 600s (설정)
- **13.6초 응답이 600초 내에 와야 함**
- 뭔가 MCP 레벨에서 응답을 받지 못하는 상황

---

## 🔬 디버깅 전략

### 1단계: MCP 서버 재시작

**.mcp.json 변경사항 적용**:
```bash
# Claude Code 완전 재시작
/restart
```

**또는**:
```bash
# MCP 서버만 재시작
claude mcp restart
```

### 2단계: 로깅 추가

**ai-clients/gemini.ts 수정**:
```typescript
async function executeGeminiQuery(...) {
  console.error(`[Gemini] 시작: ${new Date().toISOString()}`);

  const result = await withTimeout(
    execFileAsync('gemini', [query, '--model', model], {...}),
    timeout,
    `Gemini timeout after ${timeout}ms`
  );

  console.error(`[Gemini] 완료: ${new Date().toISOString()}`);
  return result;
}
```

### 3단계: Progress Notification 수정

**index.ts 수정**:
```typescript
// total을 동적으로 계산
const createProgressCallback = (
  progressToken?: string,
  expectedTimeout?: number  // ← 추가
): ProgressCallback => {
  return (provider, status, elapsed) => {
    if (progressToken) {
      server.notification({
        method: 'notifications/progress',
        params: {
          progressToken,
          progress: elapsedSeconds,
          total: expectedTimeout ? Math.floor(expectedTimeout / 1000) : 120,
        },
      });
    }
  };
};
```

### 4단계: Timeout 테스트

**간단한 쿼리로 테스트**:
```typescript
// 짧은 쿼리 (1초 예상)
mcp__multi-ai__queryGemini("1+1")

// 중간 쿼리 (5초 예상)
mcp__multi-ai__queryGemini("간단한 설명")

// 긴 쿼리 (30초 예상)
mcp__multi-ai__queryGemini("상세한 분석과 예시 제공")
```

---

## 🎯 즉시 조치 사항

### 우선순위 1: MCP 서버 재시작 (Critical)

**.mcp.json 변경사항 적용 필요**:

```json
// 변경 전 (env 있음)
"multi-ai": {
  "command": "node",
  "args": ["dist/index.js"],
  "env": { ... }  // ← 이전 설정
}

// 변경 후 (env 없음)
"multi-ai": {
  "command": "node",
  "args": [
    "--max-old-space-size=512",
    "dist/index.js"
  ]
  // ✅ env 없음
}
```

**재시작 방법**:
1. Claude Code 재시작: `/restart`
2. 또는 터미널 재시작
3. 또는 `claude mcp restart`

### 우선순위 2: 재시작 후 테스트

```typescript
// 1. 짧은 쿼리
mcp__multi-ai__queryGemini("1+1은?")
mcp__multi-ai__queryQwen("안녕하세요")

// 2. 응답 확인
// - 성공: 독립성 철학 검증 완료
// - 실패: 추가 디버깅 필요
```

---

## 📊 예상 결과

### 시나리오 A: 재시작 후 성공 ✅

**원인**: MCP 서버가 이전 env 설정을 캐시함
**해결**: 재시작으로 새 설정 적용
**결론**: 독립성 철학 완벽 작동

### 시나리오 B: 재시작 후에도 실패 ❌

**원인**: MCP 서버 코드 자체의 문제
**다음 단계**:
1. Progress notification 수정
2. 로깅 추가하여 정확한 실패 지점 파악
3. execFile() 호출 방식 검토
4. MCP Protocol 레벨 디버깅

---

## 🔍 근본 원인 가설

### 가설 1: MCP 서버 캐싱 (70% 확률)

**증거**:
- `.mcp.json` 변경 후 재시작 안 함
- Bash CLI는 성공 (MCP 서버 무관)
- MCP 도구는 실패 (MCP 서버 경유)

**검증**: 재시작 후 재테스트

### 가설 2: Progress Notification 오류 (20% 확률)

**증거**:
- `total: 120` 고정 (2분)
- 실제 timeout 420s (7분)
- MCP 600s timeout이지만 progress가 멈추면?

**검증**: Progress callback 수정

### 가설 3: execFile() 자체 문제 (10% 확률)

**증거**:
- Bash 성공, MCP 실패
- 하지만 Codex는 MCP에서도 성공
- Gemini/Qwen만 실패

**검증**: 로깅 추가하여 execFile() 호출 확인

---

## 📝 결론

**즉시 조치**:
1. ✅ `.mcp.json` env 제거 완료
2. ⏳ **Claude Code 재시작 필요** (가장 중요!)
3. ⏳ 재시작 후 테스트

**만약 재시작 후에도 실패**:
1. 로깅 추가
2. Progress notification 수정
3. 코드 레벨 디버깅

**현재 상태**:
- 독립성 철학: ✅ 문서화 완료
- 실제 동작: ⏳ 재시작 후 검증 필요

---

**작성일**: 2025-10-08
**버전**: v3.6.0
**다음 단계**: Claude Code 재시작 (`/restart`)
