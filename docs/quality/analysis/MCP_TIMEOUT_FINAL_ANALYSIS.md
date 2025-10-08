# MCP 타임아웃 계층 구조 최종 분석

**작성일**: 2025-10-08
**버전**: Multi-AI MCP v3.8.0
**목적**: 하드코딩된 타임아웃 위치 및 수정 가능 여부 완전 파악

---

## 📊 Executive Summary

**핵심 결론**:
- `.claude/mcp.json`의 `timeout` 설정이 **실제로 tool call timeout에 영향을 줌**
- 하지만 공식 문서는 "startup timeout"이라고 설명 → **문서 오류 또는 이중 용도**
- Progress notification은 **필수** (비활성화 시 즉시 타임아웃)
- 타임아웃 한계: 대략 **20-60초 사이** (설정에 따라 변동)

---

## 🔬 실험 결과 요약

### 실험 1: `.claude/mcp.json` timeout 설정 효과

| timeout 설정 | 간단한 쿼리 (3초) | 중간 쿼리 (18초) | 긴 쿼리 (60초+) |
|--------------|-------------------|------------------|-----------------|
| **180000** (3분) | ❌ 타임아웃 | ❌ 타임아웃 | ❌ 타임아웃 |
| **600000** (10분) | ✅ 성공 (10초) | ✅ 성공 (18초) | ❌ 타임아웃 |

**결론**: `timeout` 값이 너무 낮으면 모든 쿼리가 타임아웃됨. 하지만 높게 설정해도 긴 쿼리는 타임아웃됨.

### 실험 2: Progress Notification 효과

| MULTI_AI_ENABLE_PROGRESS | 결과 |
|--------------------------|------|
| **false** | ❌ 모든 쿼리 즉시 타임아웃 |
| **true** | ✅ 중간 쿼리까지 정상 작동 |

**결론**: Progress notification은 **필수**. 없으면 Claude Code가 "응답 없음"으로 판단하여 즉시 타임아웃.

### 실험 3: Progress Interval 단축 효과

| MULTI_AI_PROGRESS_INTERVAL | 결과 |
|----------------------------|------|
| **10000** (10초) | ✅ 정상 |
| **5000** (5초) | ✅ 정상 |
| **3000** (3초) | ✅ 정상 (변화 없음) |

**결론**: Interval 단축은 체감 효과 미미. 타임아웃 한계는 변하지 않음.

### 실험 4: 다른 MCP 비교 (Playwright)

| MCP | Progress 사용 | 120초 작업 |
|-----|---------------|------------|
| **Multi-AI** | ✅ 사용 | ❌ 타임아웃 (60초 추정) |
| **Playwright** | ❌ 미사용 | ✅ 성공 |

**결론**: MCP마다 다른 타임아웃 정책이 있을 가능성. 또는 Playwright 작업이 실제로는 60초 이내에 완료되었을 가능성.

---

## 🎯 타임아웃 계층 구조 (최종)

```
┌─────────────────────────────────────────────────────────────────┐
│ Level 1: .claude/mcp.json timeout (설정 가능)                   │
│   - 기본값: 설정하지 않으면 무한대?                              │
│   - 권장값: 600000 (10분)                                        │
│   - 효과: tool call의 최대 허용 시간                             │
│   - 주의: 너무 낮으면 모든 요청 타임아웃                         │
│   - 위치: ✅ .claude/mcp.json (사용자 수정 가능)                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Level 2: Claude Code 내부 타임아웃 (하드코딩 추정)              │
│   - 추정값: 60-90초                                              │
│   - 효과: Level 1보다 짧으면 먼저 발동                           │
│   - Progress의 역할: 타임아웃 카운터를 리셋하지 않음             │
│   - 위치: ❌ Claude Code 클라이언트 (수정 불가)                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Level 3: AI CLI 타임아웃 (환경 변수로 설정 가능)                │
│   - Codex: 240000ms (4분)                                        │
│   - Gemini: 420000ms (7분)                                       │
│   - Qwen: 420000ms (7분)                                         │
│   - 효과: CLI 프로세스 자체의 타임아웃                           │
│   - 위치: ✅ src/config.ts (환경 변수로 수정 가능)               │
└─────────────────────────────────────────────────────────────────┘
```

**실제 발동 순서**:
1. Level 2 (60-90초) - 가장 먼저 발동 (추정)
2. Level 1 (설정값) - Level 2보다 짧으면 먼저 발동
3. Level 3 (240-420초) - 실제로는 도달하지 않음

---

## 🔍 Progress Notification의 역할

### 발견 사실

**Progress notification은 타임아웃을 "회피"하는 것이 아니라 "탐지를 회피"하는 역할**:

1. **Progress 활성화 (enableProgress: true)**:
   - MCP 서버가 주기적으로 "작업 중입니다" 신호 전송
   - Claude Code가 "서버 살아있음"으로 인식
   - 하지만 **타임아웃 카운터는 리셋되지 않음** (MCP 표준 MAY 규정)

2. **Progress 비활성화 (enableProgress: false)**:
   - MCP 서버가 아무 신호도 보내지 않음
   - Claude Code가 "서버 응답 없음"으로 즉시 판단
   - **즉시 타임아웃 발생** (수 초 이내)

### MCP 표준 분석

**MCP 2025-03-26 표준**:
```
Progress notification의 timeout reset: "MAY" (선택 사항)
```

**의미**:
- Progress를 보내도 timeout을 리셋할지는 **클라이언트 구현에 따라 다름**
- Claude Code는 timeout reset을 구현하지 않은 것으로 추정
- 하지만 Progress가 없으면 "응답 없음"으로 판단하여 더 빨리 타임아웃

---

## 💡 .claude/mcp.json timeout의 실제 효과

### 공식 문서 vs 실제 동작

**공식 문서 (docs.claude.com)**:
> "Configure MCP server startup timeout using the MCP_TIMEOUT environment variable"

**실제 동작** (실험 결과):
- `.claude/mcp.json`의 `timeout` 필드는 **tool call timeout**도 제어함
- `timeout: 180000` → 간단한 쿼리도 타임아웃
- `timeout: 600000` → 중간 쿼리까지 정상

**결론**:
1. 공식 문서가 불완전함 (startup timeout만 설명)
2. 실제로는 tool call timeout도 제어함
3. 또는 startup timeout과 tool call timeout을 동시에 제어

---

## 🎯 하드코딩된 타임아웃 위치

### 1. `.claude/mcp.json` timeout (Level 1) ✅ 수정 가능

**파일**: 프로젝트 루트 `.claude/mcp.json`

**예시**:
```json
{
  "mcpServers": {
    "multi-ai": {
      "timeout": 600000,  // 10분 (밀리초)
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

**효과**:
- 너무 낮으면 (180000): 모든 요청 타임아웃
- 적절히 높으면 (600000): 중간 쿼리까지 정상
- 매우 높게 설정해도: 긴 쿼리는 여전히 타임아웃 (Level 2 제약)

**권장값**: `600000` (10분)

### 2. Claude Code 클라이언트 내부 (Level 2) ❌ 수정 불가

**위치**: Claude Code 클라이언트 소스 코드 (접근 불가)

**추정값**: 60-90초

**증거**:
- timeout 600초 설정해도 긴 쿼리는 60초쯤에 타임아웃
- 이전 테스트: 86초, 107초 쿼리가 타임아웃 (서버는 성공)
- 현재 테스트: 매우 긴 쿼리가 타임아웃 (추정 60초)

**수정 불가능**: Claude Code 클라이언트 코드를 직접 수정할 수 없음

### 3. Multi-AI MCP 내부 (Level 3) ✅ 수정 가능

**파일**: `packages/multi-ai-mcp/src/config.ts`

**환경 변수**:
```bash
MULTI_AI_CODEX_TIMEOUT=240000    # 4분
MULTI_AI_GEMINI_TIMEOUT=420000   # 7분
MULTI_AI_QWEN_TIMEOUT=420000     # 7분
```

**효과**: 실제로는 Level 2에서 먼저 타임아웃되므로 도달하지 않음

---

## 📋 타임아웃 문제 해결 전략

### 전략 1: MCP 사용 범위 제한 ✅ 권장

**적용**:
- MCP 사용: **60초 이내 완료 예상 쿼리만**
- Bash wrapper: **60초 이상 예상 쿼리**

**예시**:
```typescript
// ✅ MCP 사용 (간단한 쿼리)
mcp__multi_ai__queryCodex({ query: "버그 분석" });

// ✅ Bash wrapper (복잡한 쿼리)
Bash("./scripts/ai-subagents/codex-wrapper.sh");
```

**장점**:
- 간단하고 확실함
- 타임아웃 문제 완전 회피

**단점**:
- 쿼리 길이 사전 판단 필요

### 전략 2: .claude/mcp.json timeout 적절히 설정 ✅ 필수

**설정**:
```json
{
  "multi-ai": {
    "timeout": 600000  // 10분 권장
  }
}
```

**효과**:
- 너무 낮으면 모든 요청 타임아웃
- 적절히 높게 설정하여 Level 2 제약 전까지 활용

**주의**:
- Level 2 (60-90초) 제약은 여전히 존재

### 전략 3: Progress Notification 필수 활성화 ✅ 필수

**설정**:
```typescript
// config.ts
mcp: {
  enableProgress: true,  // 필수!
}
```

**또는**:
```json
// .claude/mcp.json
{
  "multi-ai": {
    "env": {
      "MULTI_AI_ENABLE_PROGRESS": "true"  // 기본값
    }
  }
}
```

**효과**:
- Progress 없으면 즉시 타임아웃
- Progress 있으면 Level 2 제약까지 작동

### 전략 4: v3.8.0 환경 변수 사용 (실험적) ⚠️ 효과 미미

**설정**:
```json
{
  "multi-ai": {
    "env": {
      "MULTI_AI_PROGRESS_INTERVAL": "3000",  // 3초 (기본 10초)
      "MULTI_AI_EARLY_RESPONSE": "true",     // 즉시 응답
      "MULTI_AI_VERBOSE_PROGRESS": "true"    // 디버깅용
    }
  }
}
```

**효과**:
- Progress interval 단축: 체감 효과 미미
- Early response: 사용자 경험 개선 (타임아웃 회피 아님)
- Verbose progress: 디버깅용

**결론**: 근본 해결 아님, 완화 수단일 뿐

---

## 🔧 최종 권장 설정

### .claude/mcp.json 권장 설정

```json
{
  "mcpServers": {
    "multi-ai": {
      "timeout": 600000,
      "command": "node",
      "args": [
        "--max-old-space-size=4096",
        "/path/to/packages/multi-ai-mcp/dist/index.js"
      ],
      "env": {
        "MULTI_AI_DEBUG": "false",
        "NODE_ENV": "production"
      },
      "description": "Multi-AI MCP - Default configuration"
    }
  }
}
```

**포인트**:
- `timeout: 600000` (10분) - 충분히 높게 설정
- v3.8.0 환경 변수는 **사용하지 않음** (기본값 사용)
- Progress는 코드 내부에서 기본 활성화됨

### 사용 가이드

**MCP 사용 시나리오**:
- 간단한 질문 (<30초)
- 코드 리뷰 (<30초)
- 버그 분석 (<60초)
- 아키텍처 검토 (<60초)

**Bash wrapper 사용 시나리오**:
- 종합 분석 (>60초)
- 다중 항목 비교 (>60초)
- 상세 문서 생성 (>60초)
- 복잡한 설계 (>60초)

---

## 📊 비교: Playwright MCP vs Multi-AI MCP

### Playwright MCP

**특징**:
- Progress notification: ❌ 없음
- 120초 작업: ✅ 성공

**가설**:
1. 작업이 실제로는 60초 이내 완료
2. Claude Code가 tool별로 다른 timeout 정책 적용
3. Playwright의 작업 특성상 빠른 응답

### Multi-AI MCP

**특징**:
- Progress notification: ✅ 있음
- 60초 이상 작업: ❌ 타임아웃

**이유**:
- AI CLI 특성상 응답 시간이 가변적
- Level 2 (60-90초) 제약에 걸림

---

## 🎓 교훈 및 제한 사항

### 발견한 사실

1. **`.claude/mcp.json`의 `timeout`은 실제 효과가 있음**
   - 공식 문서는 "startup timeout"이라고 하지만
   - 실제로는 tool call timeout도 제어함

2. **Progress notification은 필수이지만 만능 아님**
   - Progress 없으면 즉시 타임아웃
   - Progress 있어도 60-90초 제약 존재

3. **하드코딩된 제약 존재**
   - Claude Code 클라이언트 내부에 60-90초 제약 추정
   - MCP 서버에서는 우회 불가능

### 제한 사항

1. **Level 2 타임아웃 (60-90초) 수정 불가**
   - Claude Code 클라이언트 내부 구현
   - 사용자가 접근 불가능

2. **v3.8.0 환경 변수 효과 미미**
   - Progress interval 단축: 체감 효과 없음
   - Early response: UX 개선일 뿐, 타임아웃 회피 아님

3. **MCP 표준의 모호함**
   - Progress timeout reset: "MAY" (선택)
   - 구현마다 다를 수 있음

---

## 📝 결론

### 핵심 요약

| 항목 | 수정 가능 여부 | 권장 설정 | 효과 |
|------|----------------|-----------|------|
| **.claude/mcp.json timeout** | ✅ 가능 | 600000 (10분) | Level 2 제약까지 작동 |
| **Progress notification** | ✅ 가능 | true (필수) | 즉시 타임아웃 방지 |
| **Progress interval** | ✅ 가능 | 10000 (기본값) | 효과 미미 |
| **Claude Code 내부 timeout** | ❌ 불가능 | - | 60-90초 하드코딩 추정 |
| **AI CLI timeout** | ✅ 가능 | 240-420초 (기본값) | 실제로는 도달 안 함 |

### 실무 권장 사항

1. **`.claude/mcp.json` timeout을 600000 (10분)으로 설정** ✅
2. **Progress notification 활성화 유지 (기본값)** ✅
3. **60초 이내 쿼리만 MCP 사용** ✅
4. **60초 이상 예상 쿼리는 Bash wrapper 사용** ✅
5. **v3.8.0 환경 변수는 실험적 사용만** ⚠️

### 향후 개선 방향

**Phase 2 (v3.9.0)** - 자동 라우팅:
```typescript
// 쿼리 길이 자동 분석하여 MCP vs Wrapper 결정
MULTI_AI_AUTO_MODE=true
MULTI_AI_SHORT_QUERY_THRESHOLD=200  // 200자 이하 = MCP
```

**Phase 3** - 문서 개선:
- 공식 문서의 timeout 설명 보강 요청
- 실무 사용 패턴 가이드 작성

---

**작성**: 2025-10-08
**버전**: Multi-AI MCP v3.8.0
**상태**: 완료

**핵심 발견**: `.claude/mcp.json`의 `timeout`이 실제로 tool call timeout을 제어하지만, Claude Code 클라이언트 내부의 60-90초 제약이 먼저 발동됨. Progress notification은 필수이나 타임아웃을 완전히 회피하지는 못함.
