# Multi-AI MCP Server v3.1.0

**순수 AI 통신 인프라** - Claude Code와 Codex/Gemini/Qwen을 연결하는 채널

---

## 📋 개요

Claude Code에서 WSL 환경의 3개 AI CLI(Codex, Gemini, Qwen)와 안정적으로 통신할 수 있도록 지원하는 순수 인프라 레이어입니다.

### 핵심 특징 (v3.0.0)

- ✅ **개별 AI 통신**: Codex/Gemini/Qwen 각각 독립적 쿼리
- ✅ **적응형 타임아웃**: 복잡도 기반 자동 타임아웃 조정 (60s~300s)
- ✅ **자동 재시도**: 실패 시 Exponential Backoff 재시도
- ✅ **입력 검증**: Command Injection 방지, 보안 강화
- ✅ **기본 히스토리**: 실행 기록 자동 저장 (~/.multi-ai-history/)
- ✅ **100% 안정성**: timeout.ts, retry.ts 검증된 로직 완전 보존

### v3.1.0 주요 개선사항 (2025-10-06)

**Unified Memory Guard Middleware**:
- ✅ **공정한 보호**: 모든 AI에 동일한 90% pre-check 적용
- ✅ **코드 품질**: 60줄 중복 제거 → 10줄 미들웨어 (83% 감소)
- ✅ **아키텍처**: DRY + SoC 원칙 준수
- ✅ **통합 힙 정책**: MCP 서버 레벨 2GB heap 통일

**Before (v3.0.0)**:
```typescript
Qwen:   90% pre-check + post-log + 2GB heap (특수 보호)
Codex:  post-log only (OOM 위험 노출)
Gemini: post-log only (OOM 위험 노출)
```

**After (v3.1.0)**:
```typescript
All AIs: withMemoryGuard() 미들웨어
  → 90% pre-check (통일)
  → post-log (통일)
  → 2GB heap (MCP 레벨 통일)
```

**상세 문서**: [Unified Memory Guard Implementation](docs/ai-verifications/2025-10-06-unified-memory-guard-implementation.md)

### v3.0.0 주요 변경사항

**역할 재정의**:
- **Before (v2.3.0)**: 비즈니스 로직 + 인프라 레이어 혼재
- **After (v3.0.0)**: **순수 AI 통신 채널** (인프라만)

**책임 분리**:
- **MCP**: AI 간 통신만 담당
- **서브에이전트**: 교차검증, 합의분석, 결과 종합 담당

---

## 🚀 빠른 시작

### 1. 사전 요구사항

다음 AI CLI 도구들이 WSL 환경에 설치되어 있어야 합니다:

```bash
# 설치 확인
codex --version    # ChatGPT Plus 계정 필요
gemini --version   # Google OAuth 인증
qwen --version     # Qwen OAuth 인증
```

### 2. 설치

```bash
cd packages/multi-ai-mcp
npm install
npm run build
```

### 3. Claude Code에 연결

`~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": [
        "/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"
      ]
    }
  }
}
```

### 4. 사용 가능 도구

```typescript
// 1. Codex 쿼리 (실무 전문: 버그 수정, 프로토타입)
mcp__multi_ai__queryCodex({ query: "이 버그를 수정해줘" })

// 2. Gemini 쿼리 (아키텍처 전문: SOLID 원칙, 설계)
mcp__multi_ai__queryGemini({ query: "이 구조를 리뷰해줘" })

// 3. Qwen 쿼리 (성능 전문: 최적화, 병목점)
mcp__multi_ai__queryQwen({ query: "성능을 개선해줘", planMode: true })

// 4. 기본 히스토리 조회 (메타데이터만)
mcp__multi_ai__getBasicHistory({ limit: 10 })
```

---

## 🎯 사용 시나리오

### 시나리오 1: 개별 AI와 직접 대화

**Codex와 대화** (실무 코드 구현):
```typescript
// Claude Code에서 직접 MCP 호출
mcp__multi_ai__queryCodex({
  query: "React Hook으로 카운터 구현해줘"
})
```

**Gemini와 대화** (아키텍처 설계):
```typescript
mcp__multi_ai__queryGemini({
  query: "마이크로서비스 아키텍처 설계 리뷰"
})
```

**Qwen과 대화** (성능 최적화):
```typescript
mcp__multi_ai__queryQwen({
  query: "이 알고리즘을 O(n)으로 개선",
  planMode: true  // 복잡한 쿼리는 Plan Mode 권장
})
```

### 시나리오 2: AI 교차검증 (서브에이전트 통해)

**올바른 방법** (v3.0.0):
```
사용자: "이 코드를 AI 교차검증해줘"
  ↓
Claude Code
  ↓
Multi-AI Verification Specialist (서브에이전트)
  ↓
Promise.all([
  mcp__multi_ai__queryCodex(query),
  mcp__multi_ai__queryGemini(query),
  mcp__multi_ai__queryQwen(query, planMode)
])
  ↓
서브에이전트가 합의/충돌 분석
  ↓
docs/ai-verifications/ 저장
```

**서브에이전트 설정**:
`.claude/agents/multi-ai-verification-specialist.md`에서 자동 처리

---

## 🔧 기술 스택

### 안정성 핵심 (v3.0.0 완전 보존)

**적응형 타임아웃** (`src/utils/timeout.ts`):
```typescript
// Codex
Simple:  60s   // 단순 쿼리
Medium:  90s   // 중간 복잡도
Complex: 180s  // 복잡한 분석

// Gemini (고정)
Timeout: 300s  // 5분

// Qwen
Normal:  120s  // 일반 모드
Plan:    300s  // Plan Mode (안전한 계획 수립)
```

**자동 재시도** (`src/utils/retry.ts`):
```typescript
최대 재시도: 3회
Backoff: 2초 → 4초 → 8초 (Exponential)
```

**보안** (`src/utils/validation.ts`):
```typescript
// Command Injection 방지
execFile('codex', ['exec', query])  // 배열 인자

// 입력 검증
- Null byte 차단
- 길이 제한 (2500자)
```

### 파일 구조 (v3.0.0)

```
packages/multi-ai-mcp/
├─ src/
│  ├─ ai-clients/
│  │  ├─ codex.ts       ✅ Codex CLI 실행
│  │  ├─ gemini.ts      ✅ Gemini CLI 실행
│  │  └─ qwen.ts        ✅ Qwen CLI 실행
│  ├─ middlewares/
│  │  └─ memory-guard.ts ✅ 통합 메모리 보호 (v3.1.0)
│  ├─ utils/
│  │  ├─ timeout.ts     ✅ 적응형 타임아웃 (핵심)
│  │  ├─ retry.ts       ✅ 자동 재시도 (핵심)
│  │  ├─ validation.ts  ✅ 입력 검증 (보안)
│  │  └─ memory.ts      ✅ 메모리 모니터링
│  ├─ history/
│  │  └─ basic.ts       ✅ 간소화된 히스토리
│  ├─ config.ts         ✅ 설정 관리
│  ├─ types.ts          ✅ 타입 정의 (4개만)
│  └─ index.ts          ✅ MCP 서버 (4개 도구)
└─ REMOVED/              🗑️ 백업 (비즈니스 로직)
   ├─ synthesizer.ts
   ├─ query-analyzer.ts
   ├─ query-splitter.ts
   └─ manager.ts
```

---

## 📊 성능 및 안정성

### 응답 시간 (평균)

| AI | Simple | Medium | Complex |
|----|--------|--------|---------|
| **Codex** | 2-5초 | 5-10초 | 10-30초 |
| **Gemini** | 3-8초 | 8-20초 | 20-60초 |
| **Qwen** | 3-6초 (Normal) | 6-15초 | 15-120초 (Plan) |

### 안정성 지표

- **타임아웃 성공률**: 95%+ (적응형 타임아웃 + 재시도)
- **Command Injection**: 0건 (execFile 사용)
- **코드 감소**: 52% (2,500줄 → 1,200줄)

---

## 🔄 v2.3.0 → v3.0.0 마이그레이션

### 제거된 도구

```typescript
// ❌ v2.3.0에서 제거됨
mcp__multi_ai__queryAllAIs()
mcp__multi_ai__queryWithPriority()
mcp__multi_ai__getPerformanceStats()
mcp__multi_ai__getHistory()
mcp__multi_ai__searchHistory()
mcp__multi_ai__getHistoryStats()
```

### 대체 방법

**AI 교차검증**:
- Before: `queryAllAIs()` 직접 호출
- After: Multi-AI Verification Specialist 서브에이전트 사용

**개별 AI 협업**:
- Before: `queryWithPriority({ includeCodex: true })`
- After: `queryCodex({ query })` 직접 호출

**히스토리**:
- Before: `getHistory()` 상세 히스토리
- After: `getBasicHistory()` 기본 메타데이터만

---

## 🛠️ 개발

### 빌드

```bash
npm run build        # TypeScript 컴파일
npm run dev          # Watch mode
```

### 테스트

```bash
npm run test         # Vitest 실행
npm run test:watch   # Watch mode
npm run test:coverage # 커버리지 리포트
```

### 디버깅

```bash
# 디버그 모드 활성화
export MULTI_AI_DEBUG=true

# MCP 서버 직접 실행
node dist/index.js
```

---

## 📝 환경변수

```bash
# 타임아웃 조정 (밀리초)
MULTI_AI_CODEX_TIMEOUT_SIMPLE=60000    # 기본값
MULTI_AI_GEMINI_TIMEOUT=300000         # 기본값
MULTI_AI_QWEN_TIMEOUT_PLAN=300000      # 기본값

# 작업 디렉토리
MULTI_AI_CWD=/your/project/path

# 디버그 모드
MULTI_AI_DEBUG=true
```

---

## 🔗 관련 문서

- **[CHANGELOG.md](./CHANGELOG.md)** - 버전 히스토리
- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - 설정 가이드
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - 트러블슈팅

---

## 📄 라이선스

MIT License - OpenManager VIBE Project

---

## 🤝 기여

이슈 및 PR 환영합니다!

- GitHub: [skyasu2/openmanager-vibe-v5](https://github.com/skyasu2/openmanager-vibe-v5)
- Packages: [@mcp/multi-ai](./package.json)
