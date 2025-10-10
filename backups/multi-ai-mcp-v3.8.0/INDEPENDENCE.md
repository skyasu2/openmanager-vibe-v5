# Multi-AI MCP 독립성 철학

**설계 원칙**: Multi-AI MCP는 **완전히 독립적으로 동작**해야 합니다.

---

## 🏗️ 아키텍처 개요

### WSL CLI 기반 설계

Multi-AI MCP는 **API가 아닌 WSL 로컬 CLI 방식**으로 동작합니다:

```bash
# WSL에 설치된 CLI 도구들
codex exec "query"           # ChatGPT Plus 계정 인증
gemini "query" --model pro   # Google OAuth 인증
qwen -p "query"              # Qwen OAuth 인증
```

**특징**:
- ✅ API 키 불필요 (계정 인증 방식)
- ✅ API 비용 없음 (무료/구독 계정 활용)
- ✅ WSL 환경에서 직접 실행
- ✅ Node.js `execFile()`로 CLI 호출

**MCP 서버 역할**:
```typescript
// Multi-AI MCP는 CLI를 래핑하는 인프라 레이어
execFile('gemini', [query, '--model', model], { ... })
  → WSL에서 gemini CLI 실행
  → stdout/stderr 수집
  → MCP 응답으로 반환
```

---

## 🎯 핵심 철학

### 다른 MCP vs Multi-AI MCP

| 구분 | 다른 MCP 서버 | Multi-AI MCP |
|------|--------------|-------------|
| **제작자** | 외부 개발자/회사 | **직접 제작** |
| **의존성** | 외부 설정 필요 | **완전 독립** |
| **env 설정** | 필수 | **선택** (기본값 우선) |
| **타임아웃** | .mcp.json에서 설정 | **자체 내장** |

### 왜 독립성인가?

**다른 MCP 서버들**:
```json
// Serena MCP (외부 제작) - env 설정 필수
"serena": {
  "command": "serena-mcp-server",
  "args": ["--tool-timeout", "180"],  // ← 외부에서 설정
  "env": { "TERM": "dumb", ... }      // ← 외부에서 설정
}
```

**Multi-AI MCP (직접 제작)**:
```json
// 완전히 독립적 - env 없이도 동작
"multi-ai": {
  "command": "node",
  "args": [
    "--max-old-space-size=512",  // Node 메모리만
    "dist/index.js"
  ]
  // ✅ env 없음!
  // ✅ timeout 설정 없음!
  // ✅ 모든 설정이 내부에 있음!
}
```

---

## 🏗️ 독립적 설계 구조

### 1. 자체 기본값 (config.ts)

```typescript
// 환경변수 없이도 완벽하게 동작
export function getConfig(): MultiAIConfig {
  return {
    codex: {
      timeout: 240000,  // 4분 (기본값)
    },
    gemini: {
      timeout: 420000,  // 7분 (기본값)
    },
    qwen: {
      timeout: 420000,  // 7분 (기본값)
    },
    mcp: {
      requestTimeout: 600000,  // 10분 (기본값)
    },
    // ... 기타 설정
  };
}
```

### 2. 환경변수는 선택사항

환경변수가 **있으면** 사용하고, **없으면** 기본값 사용:

```typescript
timeout: parseIntWithValidation(
  process.env.MULTI_AI_CODEX_TIMEOUT,  // ← 환경변수 (선택)
  240000,  // ← 기본값 (필수, 항상 사용 가능)
  1000,    // ← 최소값
  600000,  // ← 최대값
  'MULTI_AI_CODEX_TIMEOUT'
)
```

**결과**:
- ✅ `process.env.MULTI_AI_CODEX_TIMEOUT` 있음 → 환경변수 사용
- ✅ `process.env.MULTI_AI_CODEX_TIMEOUT` 없음 → 기본값 240000 사용
- ✅ **언제나 동작**

### 3. .mcp.json 최소 설정

```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": [
        "--max-old-space-size=512",
        "/path/to/packages/multi-ai-mcp/dist/index.js"
      ]
    }
  }
}
```

**필수 항목**:
- `command`: node
- `args`: 메모리 설정 + 스크립트 경로

**불필요 항목**:
- ❌ `env.MULTI_AI_CODEX_TIMEOUT` - 기본값 있음
- ❌ `env.MULTI_AI_GEMINI_TIMEOUT` - 기본값 있음
- ❌ `env.MULTI_AI_QWEN_TIMEOUT` - 기본값 있음
- ❌ `env.MULTI_AI_MCP_TIMEOUT` - 기본값 있음

---

## 🎨 설계 비교

### Before: 외부 의존적 설계 (❌ 비권장)

```json
"multi-ai": {
  "command": "node",
  "args": ["dist/index.js"],
  "env": {
    "MULTI_AI_CODEX_TIMEOUT": "240000",   // ← 외부 설정 필요
    "MULTI_AI_GEMINI_TIMEOUT": "420000",  // ← 외부 설정 필요
    "MULTI_AI_QWEN_TIMEOUT": "420000",    // ← 외부 설정 필요
    "MULTI_AI_MCP_TIMEOUT": "600000"      // ← 외부 설정 필요
  }
}
```

**문제점**:
- ❌ .mcp.json 수정 시마다 설정 필요
- ❌ 다른 환경에서 재설정 필요
- ❌ 설정 누락 시 동작 안 함
- ❌ **독립성 상실**

### After: 독립적 설계 (✅ 권장)

```json
"multi-ai": {
  "command": "node",
  "args": [
    "--max-old-space-size=512",
    "dist/index.js"
  ]
  // ✅ env 없음!
}
```

**장점**:
- ✅ .mcp.json 최소 설정
- ✅ 어디서나 동일하게 동작
- ✅ 설정 누락 불가능 (기본값 내장)
- ✅ **완전한 독립성**

---

## 📊 v3.6.0 독립적 기본값

### AI별 타임아웃

| AI | Timeout | P99 | 안전 계수 | 독립 동작 |
|----|---------|-----|----------|----------|
| **Codex** | 240s (4분) | 168s | 1.4x | ✅ env 불필요 |
| **Gemini** | 420s (7분) | 78s | 5.4x | ✅ env 불필요 |
| **Qwen** | 420s (7분) | 92s | 4.6x | ✅ env 불필요 |
| **MCP** | 600s (10분) | - | - | ✅ env 불필요 |

### 재시도 설정

| 항목 | 기본값 | 독립 동작 |
|------|--------|----------|
| **maxAttempts** | 2회 | ✅ env 불필요 |
| **backoffBase** | 1000ms | ✅ env 불필요 |

### 메모리 설정

| 항목 | 기본값 | 설정 위치 |
|------|--------|----------|
| **Node heap** | 512MB | `.mcp.json` args |
| **maxBuffer** | 10MB | `config.ts` 기본값 ✅ |

---

## 🚀 사용 가이드

### 기본 사용 (권장)

1. **빌드**:
   ```bash
   cd packages/multi-ai-mcp
   npm run build
   ```

2. **`.mcp.json` 설정** (최소):
   ```json
   "multi-ai": {
     "command": "node",
     "args": [
       "--max-old-space-size=512",
       "/absolute/path/to/packages/multi-ai-mcp/dist/index.js"
     ]
   }
   ```

3. **완료!**
   - ✅ 모든 타임아웃 자동 적용 (240s, 420s, 600s)
   - ✅ 재시도 로직 자동 적용 (2회, 1000ms backoff)
   - ✅ 메모리 관리 자동 적용 (512MB heap, 10MB buffer)

### 고급 사용 (선택)

**특정 AI 타임아웃 변경**:
```json
"multi-ai": {
  "command": "node",
  "args": ["--max-old-space-size=512", "dist/index.js"],
  "env": {
    "MULTI_AI_CODEX_TIMEOUT": "300000"  // Codex만 5분으로 변경
    // Gemini/Qwen은 기본값 420s 유지
  }
}
```

**디버그 모드**:
```json
"env": {
  "MULTI_AI_DEBUG": "true"  // 상세 로그 출력
}
```

---

## 🎯 독립성 검증

### 테스트 방법

1. **env 없이 실행**:
   ```bash
   node --max-old-space-size=512 dist/index.js
   ```

2. **MCP 도구 호출**:
   ```typescript
   mcp__multi-ai__queryCodex("테스트")
   mcp__multi-ai__queryGemini("테스트")
   mcp__multi-ai__queryQwen("테스트")
   ```

3. **기대 결과**:
   - ✅ Codex: 240s timeout 적용
   - ✅ Gemini: 420s timeout 적용
   - ✅ Qwen: 420s timeout 적용
   - ✅ 모두 정상 동작

### 독립성 체크리스트

- [ ] `.mcp.json`에 `env` 섹션 없음
- [ ] `config.ts`에 모든 기본값 있음
- [ ] 환경변수 없이 빌드 성공
- [ ] 환경변수 없이 실행 성공
- [ ] 환경변수 없이 3-AI 모두 동작

---

## 📝 설계 결정 배경

### 왜 독립성인가?

1. **직접 제작**: 다른 MCP와 달리 프로젝트 일부
2. **완전한 제어**: 모든 설정을 내부에서 관리
3. **이식성**: 어디서나 동일하게 동작
4. **유지보수**: 설정 파일 변경 최소화
5. **신뢰성**: 기본값 누락 불가능

### 설계 원칙

1. **Self-Contained**: 모든 필수 설정 내장
2. **Zero-Config**: .mcp.json 최소 설정
3. **Override-Friendly**: 필요시 환경변수로 덮어쓰기 가능
4. **Fail-Safe**: 기본값이 항상 안전한 값
5. **Documented**: 기본값의 근거 문서화 (P99 + 안전 계수)

---

## 🔍 비교 분석

### 독립성 vs 설정성

| 접근 | 장점 | 단점 | Multi-AI MCP 선택 |
|------|------|------|------------------|
| **독립성** | 설정 불필요, 이식성 | 유연성 낮음 | ✅ **채택** |
| **설정성** | 유연성 높음 | 설정 복잡, 이식성 낮음 | ❌ 미채택 |

**결정**: 기본적으로 **독립성**, 필요시 환경변수로 **설정성** 지원

---

## 📖 관련 문서

- [config.ts](src/config.ts) - 기본값 정의
- [v3.6.0 Changelog](../../CHANGELOG.md) - 타임아웃 안전 마진 확대
- [독립성 테스트](../../docs/quality/ai-verifications/2025-10-08-v360-independence-test.md)

---

**철학**: "Multi-AI MCP는 **완전히 독립적**으로 동작해야 한다."

**설계자**: [Your Name]
**버전**: v3.6.0
**작성일**: 2025-10-08
