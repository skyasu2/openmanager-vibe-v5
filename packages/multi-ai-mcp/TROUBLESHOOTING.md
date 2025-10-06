# Multi-AI MCP 트러블슈팅 가이드

**버전**: v1.8.0
**최종 업데이트**: 2025-10-06

---

## 📋 목차

1. [MCP 도구가 인식되지 않음](#1-mcp-도구가-인식되지-않음)
2. [히스토리 파일이 저장되지 않음](#2-히스토리-파일이-저장되지-않음)
3. [타임아웃 발생](#3-타임아웃-발생)
4. [입력 검증 실패](#4-입력-검증-실패)
5. [외부 AI CLI 연결 실패](#5-외부-ai-cli-연결-실패)
6. [디버그 모드 활성화](#6-디버그-모드-활성화)

---

## 1. MCP 도구가 인식되지 않음

### 증상

```bash
claude mcp list
# multi-ai 서버가 목록에 없음
```

또는 Claude Code에서:
```
Error: No such tool available: mcp__multi_ai__queryAllAIs
```

### 원인

- `.claude/mcp.json` 설정 파일이 없음
- Claude Code가 설정 파일을 아직 로드하지 않음
- MCP 서버 빌드 파일(`dist/index.js`)이 없음

### 해결 방법

#### Step 1: MCP 설정 파일 확인

```bash
# 프로젝트 루트에서
cat .claude/mcp.json
```

**예상 내용**:
```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": [
        "/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"
      ],
      "env": {
        "MULTI_AI_DEBUG": "false",
        "NODE_ENV": "production"
      }
    }
  }
}
```

파일이 없다면:
```bash
# .claude 디렉토리 생성
mkdir -p .claude

# 위 내용으로 mcp.json 생성
```

#### Step 2: 빌드 파일 확인

```bash
cd packages/multi-ai-mcp
npm run build

# 빌드 파일 확인
ls -l dist/index.js
```

#### Step 3: Claude Code 재시작

1. `Ctrl + C` (현재 세션 종료)
2. `claude` (새 세션 시작)
3. MCP 서버 자동 연결 확인

#### Step 4: 수동 연결 테스트

```bash
# MCP 서버 직접 실행 테스트
node packages/multi-ai-mcp/dist/index.js

# 정상 출력: JSON-RPC 프로토콜 메시지
```

---

## 2. 히스토리 파일이 저장되지 않음

### 증상

```bash
ls packages/multi-ai-mcp/history/
# 파일이 없음 (또는 0개)
```

### 원인 (v1.8.0 이전)

- `process.cwd()` 기반 경로 계산 오류
- MCP 서버 실행 위치에 따라 잘못된 경로 사용

### 해결 방법 (v1.8.0+)

**이미 수정 완료** ✅

```typescript
// src/history/manager.ts (v1.8.0)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getHistoryDir(): string {
  // __dirname 기반 안정적 경로
  return join(__dirname, '..', '..', 'history');
}
```

### 검증

```bash
# 히스토리 디렉토리 확인
ls -lah packages/multi-ai-mcp/history/

# MCP 도구 사용 후 파일 생성 확인
# 파일명: YYYY-MM-DDTHH-MM-SS-verification.json
```

### 수동 테스트

```bash
# Node.js에서 경로 확인
node -e "
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('History Dir:', join(__dirname, 'packages', 'multi-ai-mcp', 'history'));
"
```

---

## 3. 타임아웃 발생

### 증상

```
Error: Command timed out after 90000ms
```

### 원인

- 복잡한 쿼리로 AI 응답 시간 초과
- 3-AI 병렬 실행 시 누적 시간 증가
- 네트워크 지연 또는 AI CLI 응답 느림

### 해결 방법

#### Option 1: 타임아웃 증가 (환경변수)

```bash
# .env 또는 .bashrc에 추가
export MULTI_AI_CODEX_TIMEOUT_COMPLEX=240000  # 4분
export MULTI_AI_GEMINI_TIMEOUT=360000         # 6분
export MULTI_AI_QWEN_TIMEOUT_PLAN=360000      # 6분
export MULTI_AI_MCP_TIMEOUT=600000            # 10분
```

**현재 기본값 (v1.8.0)**:
- Codex Simple: 60s
- Codex Medium: 90s
- Codex Complex: **180s** (3분)
- Gemini: **300s** (5분)
- Qwen Normal: **180s** (3분)
- Qwen Plan: **300s** (5분)
- MCP 전체: **360s** (6분)

#### Option 2: 단일 AI 사용

복잡한 쿼리는 3-AI 병렬 대신 단일 AI 사용:

```typescript
// queryWithPriority 사용
mcp__multi_ai__queryWithPriority({
  query: "복잡한 분석 쿼리",
  includeCodex: true,
  includeGemini: false,  // 비활성화
  includeQwen: false     // 비활성화
})
```

#### Option 3: 쿼리 간소화

- 코드 블록 축약
- 질문 분할
- 핵심만 포함

---

## 4. 입력 검증 실패

### 증상

```
Error: Query contains dangerous characters
```

### 원인 (v1.8.0 이전)

과도한 입력 검증으로 정상 코드 차단:
- `$` (템플릿 리터럴, jQuery)
- `;` (TypeScript 세미콜론)
- `|` (Pipe, Logical OR)
- `` ` `` (백틱)

### 해결 방법 (v1.8.0+)

**이미 완화됨** ✅

```typescript
// src/utils/validation.ts (v1.8.0)
const dangerousPatterns = [
  /\x00/,  // Null byte만 차단
];

// ✅ 허용: $, ;, &, |, `
```

### 여전히 차단되는 경우

**Null byte 포함 여부 확인**:
```bash
# 쿼리에 \x00이 있는지 확인
echo -n "쿼리 내용" | od -A x -t x1z
```

**길이 제한 확인**:
- 최대: 2,500자
- 초과 시 분할 또는 축약 필요

---

## 5. 외부 AI CLI 연결 실패

### 증상

```
Error: spawn codex ENOENT
Error: spawn gemini ENOENT
Error: spawn qwen ENOENT
```

### 원인

- AI CLI 도구가 설치되지 않음
- PATH 환경변수에 없음

### 해결 방법

#### Step 1: 설치 확인

```bash
codex --version   # v0.44.0+
gemini --version  # v0.7.0+
qwen --version    # v0.0.14+
```

#### Step 2: PATH 확인

```bash
echo $PATH | tr ':' '\n' | grep -E "codex|gemini|qwen"
```

#### Step 3: 설치 (없는 경우)

```bash
# Codex (ChatGPT Plus 필요)
npm install -g @anthropic-ai/codex-cli

# Gemini (Google OAuth)
npm install -g @google/generative-ai-cli

# Qwen (무료)
npm install -g qwen-cli
```

#### Step 4: 수동 테스트

```bash
# 각 CLI 개별 테스트
codex exec "Hello"
gemini "Hello"
qwen "Hello"
```

---

## 6. 디버그 모드 활성화

### 상세 로그 확인

```bash
# 환경변수 설정
export MULTI_AI_DEBUG=true

# Claude Code 재시작
claude

# 또는 .claude/mcp.json에서
{
  "mcpServers": {
    "multi-ai": {
      "env": {
        "MULTI_AI_DEBUG": "true"
      }
    }
  }
}
```

### 로그 출력 위치

- **stderr**: MCP 프로토콜과 분리된 디버그 로그
- **stdout**: MCP JSON-RPC 메시지 (건드리지 말 것)

### 디버그 정보 내용

```
[DEBUG 2025-10-06T14:00:00.000Z] MCP Request: queryAllAIs
{
  "query": "테스트 쿼리",
  "qwenPlanMode": true
}

[DEBUG] Query Analysis:
{
  "complexity": "MEDIUM",
  "estimatedTokens": 150,
  "suggestedTimeouts": {
    "codex": 90000,
    "gemini": 300000,
    "qwen": 180000
  }
}

[CODEX] Codex 실행 시작... (0초)
[GEMINI] Gemini 사고 시작... (0초)
[QWEN] Qwen Plan 모드 시작... (0초)

[CODEX] 작업 중... (10초)
[GEMINI] 분석 중... (20초)

[DEBUG] Codex 완료 (성공, 15초, 1,234바이트)
[DEBUG] Gemini 완료 (성공, 23초, 2,456바이트)
[DEBUG] Qwen 완료 (성공, 18초, 987바이트)

[DEBUG] Synthesis:
{
  "consensus": ["TypeScript strict 모드 권장", "any 타입 제거"],
  "conflicts": [],
  "successRate": 100
}
```

---

## 🔗 관련 문서

- [README.md](./README.md) - 기본 사용법
- [SETUP-GUIDE.md](./SETUP-GUIDE.md) - 초기 설정
- [CHANGELOG.md](./CHANGELOG.md) - 버전 히스토리
- [MCP-BEST-PRACTICES.md](./MCP-BEST-PRACTICES.md) - MCP 모범 사례

---

## 📞 추가 지원

### 이슈 보고

- GitHub Issues: https://github.com/skyasu2/openmanager-vibe-v5/issues
- 버그 리포트 템플릿:
  ```markdown
  **환경**:
  - OS: WSL Ubuntu 22.04
  - Node.js: v22.19.0
  - Multi-AI MCP: v1.8.0
  - Claude Code: v2.0.8

  **증상**:
  (상세 설명)

  **재현 방법**:
  1. ...
  2. ...

  **기대 결과**:
  (예상 동작)

  **실제 결과**:
  (실제 발생 동작)

  **로그** (디버그 모드):
  ```
  (로그 내용)
  ```
  ```

### 커뮤니티

- 프로젝트 문서: `/mnt/d/cursor/openmanager-vibe-v5/CLAUDE.md`
- Multi-AI 전략: `docs/claude/environment/multi-ai-strategy.md`

---

**💡 팁**: 대부분의 문제는 Claude Code 재시작으로 해결됩니다!
