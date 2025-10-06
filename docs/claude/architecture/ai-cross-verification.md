# AI 교차검증 시스템

**버전**: Multi-AI MCP v3.0.0
**최종 업데이트**: 2025-10-06

---

## 📊 개요

3-AI 협업 교차검증 시스템 - **독립적인 외부 AI들의 병렬 실행을 통한 품질 보장**

### 핵심 구성
- **Claude Code**: 메인 개발 환경 + MCP 오케스트레이터 (Max 플랜)
- **Codex (GPT-5)**: 실무 코딩 검증 (ChatGPT Plus) - HumanEval 94%, SWE-bench 74.5%
- **Gemini (2.5 Flash)**: 아키텍처 분석 (무료 OAuth) - SWE-bench 54%
- **Qwen (2.5 Coder)**: 성능 최적화 (무료 OAuth) - HumanEval 88.4%, MBPP 84.5%

### 핵심 원칙

> **"각 AI의 독립적 판단을 Claude가 교차검증하여 최종 결정"**

1. **독립성**: 각 AI는 독립적으로 실행 (진정한 교차검증)
2. **병렬성**: 3-AI 동시 실행으로 시간 절약 (평균 21초)
3. **자동화**: Multi-AI MCP가 합의/충돌 자동 분석
4. **필터링**: Claude가 최종 검증 및 우선순위 재정렬

---

## 🎯 Multi-AI MCP v3.0.0 아키텍처 (2025-10-06)

### 핵심 변경사항: 관심사 분리 (SoC)

**Before (v2.3.0)**: MCP가 모든 것 처리
```
Multi-AI MCP
├─ AI 통신 (인프라)
├─ 교차검증 로직 (비즈니스)
├─ 결과 종합 (비즈니스)
└─ 히스토리 관리 (비즈니스)
```

**After (v3.0.0)**: 완전한 책임 분리
```
Multi-AI MCP (순수 인프라)
└─ queryCodex, queryGemini, queryQwen, getBasicHistory

Multi-AI Verification Specialist (서브에이전트)
├─ 쿼리 분석 (복잡도 판단)
├─ 쿼리 분할 (필요 시)
├─ 3-AI 병렬 실행 (MCP 도구 3개 동시 호출)
├─ 결과 종합 (합의/충돌 검출)
└─ 고급 히스토리 (docs/ai-verifications/)
```

### 코드 감소 및 개선

| 항목 | v2.3.0 | v3.0.0 | 개선 |
|------|--------|--------|------|
| **MCP 코드** | 2,500줄 | 1,200줄 | -52% |
| **MCP 도구** | 6개 (복합) | 4개 (단순) | -33% |
| **책임** | 혼재 | 완전 분리 | ✅ |
| **유연성** | 고정 로직 | 서브에이전트 수정 가능 | ✅ |
| **히스토리** | MCP 내장 | MCP (기본) + 서브에이전트 (고급) | ✅ |

### v3.0.0 MCP 도구

**1. queryCodex** - Codex 실무 전문가
```typescript
mcp__multi_ai__queryCodex({
  query: "버그 수정 및 실용적 해결책"
})
```
- 특화: 버그 수정, 프로토타입, 실무적 해결
- 타임아웃: 60s (simple) ~ 180s (complex)

**2. queryGemini** - Gemini 아키텍처 전문가
```typescript
mcp__multi_ai__queryGemini({
  query: "SOLID 원칙 및 아키텍처 검토"
})
```
- 특화: SOLID 원칙, 시스템 설계, 리팩토링
- 타임아웃: 300s (고정)

**3. queryQwen** - Qwen 성능 전문가
```typescript
mcp__multi_ai__queryQwen({
  query: "성능 병목점 및 최적화",
  planMode: false  // 또는 true
})
```
- 특화: 알고리즘 최적화, 성능 분석, 확장성
- 타임아웃: 120s (normal) / 300s (plan mode)

**4. getBasicHistory** - 기본 히스토리 조회
```typescript
mcp__multi_ai__getBasicHistory({
  limit: 10
})
```
- 메타데이터만 (타임스탬프, 성공/실패, 응답 시간)
- 저장 위치: `~/.multi-ai-history/`

### 제거된 도구 (v2.3.0 → v3.0.0)

**❌ 제거됨**:
- `queryAllAIs` - 3-AI 병렬 + 합의분석
- `queryWithPriority` - 선택적 실행 + 종합 로직
- `getPerformanceStats` - 성능 통계
- `getHistory` - 상세 히스토리
- `searchHistory` - 히스토리 검색
- `getHistoryStats` - 히스토리 통계

**✅ 대체 방법**:
- 3-AI 교차검증 → Multi-AI Verification Specialist (서브에이전트)
- 개별 AI 협업 → Claude Code가 MCP 직접 호출
- 고급 히스토리 → 서브에이전트가 `docs/ai-verifications/` 저장

---

## 🔄 AI 협업 MCP 패턴 비교

### 4가지 패턴 분석

| 패턴 | 역할 | 혁신성 | 실용성 | 확장성 | 효율성 |
|------|------|--------|--------|--------|--------|
| **Context7** | 지식 제공 (최신 문서) | 중간 | **최고** | 최고 | 중간 |
| **Sequential-thinking** | 사고 유도 (단계별 분석) | 중간 | **최고** | 최고 | 중-하 |
| **Memory** | 기억 보강 (컨텍스트 유지) | 중간 | 중간 | 중간 | **최고** |
| **Multi-AI** | **교차검증** (다중 AI) | **최고** | 중간 | 중-하 | 하 |

### Multi-AI MCP의 차별점 (Codex + Qwen 합의)

**Codex 평가**:
> "Multi-AI MCP는 모델 다수를 동시 활용해 결과를 교차 검증하는 **메타 오케스트레이션 전략**이다. 품질·안전성 극대화 측면에서 가장 강력하지만, 수행 비용과 인프라 복잡도도 가장 높다."

**Qwen 평가**:
> "The Multi-AI MCP stands out as the most innovative approach, **fundamentally changing how we interact with AI** by introducing parallel processing of multiple AIs for cross-validation."

**6가지 독창성** (Qwen):
1. **Uniqueness of Approach**: 패러다임 변화 (단일 AI → 다중 AI)
2. **Error Reduction Through Diversity**: 다양성으로 에러 감소
3. **Quality Assurance Focus**: 품질 보증 중심
4. **Cost vs. Quality Trade-off**: 비용 대신 품질 선택
5. **Model Independence**: 모델 수정 없이 오케스트레이션
6. **Inherent Verification**: 검증이 프로세스의 일부

### 다른 MCP와의 관계

```
작업 흐름:
1. Memory MCP: 프로젝트 컨텍스트 로드
2. Context7 MCP: 최신 문서 조회
3. Sequential-thinking MCP: 단계별 설계
4. Multi-AI MCP: 최종 교차검증 ← 품질 보장
```

**상호 보완 관계**: Multi-AI는 다른 MCP들의 결과를 검증하는 최상위 레이어

---

## 🤝 lastmile-ai/mcp-agent 비교

### 핵심 차이점

| 구분 | lastmile-ai/mcp-agent | Multi-AI MCP (우리) |
|------|------------------------|---------------------|
| **개념** | 에이전트 프레임워크 | AI 오케스트레이션 |
| **AI 수** | 단일 AI (Claude 등) | 다중 AI (Codex+Gemini+Qwen) |
| **분산 방식** | 에이전트로 분산 (역할) | AI로 분산 (검증) |
| **워크플로우** | Parallel, Router, Orchestrator | queryAllAIs, queryWithPriority |
| **목적** | 복잡한 작업 분해 | 품질 보장 및 검증 |
| **비용** | 단일 AI 비용 | 다중 AI 비용 (3배) |

### 패러다임 비교

**lastmile-ai (에이전트 분산)**:
```
단일 AI → [Research Agent, Writer Agent, Reviewer Agent] → 작업 분해
```
- 단일 AI가 여러 역할 수행
- 워크플로우 관리 중심

**Multi-AI MCP (AI 교차검증)**:
```
[Codex (실무), Gemini (설계), Qwen (성능)] → 교차검증 → 종합
```
- 여러 독립 AI가 동시 검증
- 품질 보장 중심

### 상호 보완 관계

**결론**: 경쟁이 아닌 **상호 보완**
- lastmile-ai: 작업 분해 및 워크플로우 관리
- Multi-AI: 품질 검증 및 교차검증

---

## 🚀 AI 호출 방법 비교 (v3.0.0)

### 방법 A: 서브에이전트 교차검증 (✅ **최우선 권장**)

**v3.0.0 주요 방법**: Multi-AI Verification Specialist 서브에이전트

**장점**:
- ✅ **완전한 자동화**: 쿼리 분석, 병렬 실행, 결과 종합 모두 자동
- ✅ **자동 합의/충돌 분석**: 서브에이전트가 패턴 매칭으로 검출
- ✅ **고급 히스토리**: docs/ai-verifications/ 상세 저장
- ✅ **유연한 로직**: 서브에이전트 수정으로 알고리즘 개선 가능

**사용 예시**:
```
사용자: "LoginClient.tsx를 AI 교차검증해줘"

→ Claude Code가 서브에이전트 자동 호출
→ 서브에이전트가 3-AI 병렬 실행:
   - mcp__multi_ai__queryCodex()
   - mcp__multi_ai__queryGemini()
   - mcp__multi_ai__queryQwen()
→ 결과 종합 (합의/충돌 검출)
→ docs/ai-verifications/ 저장
→ 사용자에게 보고
```

**워크플로우**:
1. 쿼리 복잡도 분석 (simple/medium/complex)
2. 필요 시 쿼리 분할 (2500자 초과)
3. 3-AI 병렬 실행 (단일 메시지에서 3개 MCP 도구 호출)
4. 합의/충돌 검출 (의미적 패턴 매칭)
5. 히스토리 저장 (Markdown 템플릿)
6. Claude 최종 판단

### 방법 B: 개별 AI 직접 호출 (Claude Code가 직접 사용)

**사용 시나리오**: 특정 AI만 필요할 때, 빠른 단일 검증

**사용 예시**:
```typescript
// Codex 실무 전문가
mcp__multi_ai__queryCodex({
  query: "이 버그의 근본 원인과 실용적 해결책"
})

// Gemini 아키텍처 전문가
mcp__multi_ai__queryGemini({
  query: "SOLID 원칙 준수 여부 검토"
})

// Qwen 성능 전문가
mcp__multi_ai__queryQwen({
  query: "성능 병목점 및 최적화 방법",
  planMode: false  // 또는 true
})

// 기본 히스토리 조회
mcp__multi_ai__getBasicHistory({ limit: 10 })
```

**장점**:
- 빠른 응답 (단일 AI만 실행)
- 토큰 절약 (1개 AI만)
- 명확한 전문가 의견

### 방법 C: Bash CLI 병렬 실행 (⚠️ MCP 불가 시 대안)

**사용 시나리오**: MCP 서버 연결 실패 시, 디버깅 목적

```bash
# Claude가 bash로 3개 AI CLI 병렬 실행
./scripts/ai-subagents/codex-wrapper.sh "코드 검증" > /tmp/codex.txt &
./scripts/ai-subagents/gemini-wrapper.sh "아키텍처" > /tmp/gemini.txt &
./scripts/ai-subagents/qwen-wrapper.sh -p "성능" > /tmp/qwen.txt &
wait

# Claude가 결과 종합
```

**단점**:
- 수동 합의 분석 필요
- JSON 구조화 안 됨
- Claude가 결과 종합해야 함

### 비교표 (v3.0.0)

| 항목 | 방법 A (서브에이전트) | 방법 B (개별 AI) | 방법 C (Bash CLI) |
|------|---------------------|-----------------|-------------------|
| **실행 방식** | ✅ 서브에이전트 → 3 MCP | ✅ Claude → 1 MCP | ✅ Bash 병렬 |
| **결과 형식** | ✅ Markdown (docs/) | ✅ JSON | ⚠️ 텍스트 |
| **합의 분석** | ✅ 자동 (서브에이전트) | ❌ 없음 (단일 AI) | ❌ 수동 |
| **히스토리** | ✅ 고급 (상세 분석) | ✅ 기본 (메타데이터) | ❌ 없음 |
| **정확성** | ✅ 3-AI 교차검증 | ✅ 단일 AI 전문가 | ✅ 3-AI 교차검증 |
| **속도** | 10-15초 (병렬) | 3-5초 (단일) | ~15초 (병렬) |
| **용도** | **AI 교차검증** | **빠른 단일 검증** | MCP 불가 시 대안 |
| **권장 순위** | **1순위** | 2순위 | 3순위 |

---

## 🎯 AI 사용 우선순위 전략

### 의사결정 플로우차트

```
작업 시작
    ↓
┌─────────────────────────────────────────┐
│ 품질/안전성이 중요한가?                  │
│ (코드 리뷰, 보안, 아키텍처)             │
└─────────────────────────────────────────┘
    ↓ YES
┌─────────────────────────────────────────┐
│ 1순위: Multi-AI MCP 교차검증             │
│ mcp__multi_ai__queryAllAIs()            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 상세 분석 필요?                          │
└─────────────────────────────────────────┘
    ↓ YES
┌─────────────────────────────────────────┐
│ 2순위: 서브에이전트 역할 분담             │
│ Task code-review-specialist             │
│ Task security-specialist                │
└─────────────────────────────────────────┘
    ↓
   완료

    ↓ NO (품질 덜 중요)
┌─────────────────────────────────────────┐
│ 단일 AI 또는 서브에이전트 직접 사용      │
│ codex exec, Task specialist             │
└─────────────────────────────────────────┘
```

### Multi-AI MCP 우선 사용 상황

**높은 비용 정당화**:
1. ✅ 코드 리뷰 (버그 누락 방지)
2. ✅ 보안 감사 (취약점 검증)
3. ✅ 아키텍처 결정 (장기 영향)
4. ✅ PR 검증 (프로덕션 배포 전)
5. ✅ 중요 리팩토링 (Side-Effect 분석)

### 서브에이전트 적극 활용 상황

**역할 분담 및 병렬 작업**:
1. ✅ Multi-AI 교차검증 후 상세 분석
2. ✅ 역할 분담 필요 (보안+설계+성능)
3. ✅ 병렬 작업 (테스트+문서+구현)
4. ✅ 특화 도메인 (DB, UI, 배포)

### 시나리오별 조합 패턴

#### 시나리오 1: 코드 리뷰 (품질 중요)

```typescript
// 1단계: Multi-AI MCP로 교차검증
mcp__multi_ai__queryAllAIs({
  query: "LoginClient.tsx 코드 검증"
})
// 결과:
// - Codex: 타이밍 공격 취약점 발견
// - Gemini: SoC 원칙 위반 지적
// - Qwen: 메모이제이션 제안

// 2단계: 서브에이전트로 역할 분담 상세 분석
Task code-review-specialist "보안 취약점 심화"
Task structure-refactor-specialist "SoC 리팩토링 계획"
Task performance-specialist "성능 최적화 구체안"
```

#### 시나리오 2: 긴급 버그 수정

```bash
# 1단계: 단일 AI로 빠른 해결
codex exec "TypeError at line 42 긴급 수정"

# 2단계: Multi-AI MCP로 배포 전 검증
mcp__multi_ai__queryWithPriority({
  query: "버그 수정 코드 검증",
  includeCodex: true,
  includeGemini: true,
  includeQwen: false  # 성능 분석 불필요
})
```

#### 시나리오 3: 아키텍처 설계 (복잡도 높음)

```typescript
// 1단계: Sequential-thinking으로 단계 분해
mcp__sequential_thinking__sequentialthinking(...)

// 2단계: Multi-AI MCP로 각 단계 검증
mcp__multi_ai__queryAllAIs({
  query: "Step 1: 서비스 경계 설정 검증"
})

// 3단계: 서브에이전트로 상세 구현
Task structure-refactor-specialist "서비스 분리 구현"
Task database-administrator "DB 분리 전략"
```

---

## 📚 히스토리 자동 저장 (v2.3.0)

### 저장 시스템

**위치**: `packages/multi-ai-mcp/history/`

**자동 저장 내용**:
```typescript
{
  timestamp: "2025-10-06T18:00:00Z",
  query: "코드 검증",
  mode: { codex: true, gemini: true, qwen: true },
  results: { /* 각 AI 응답 */ },
  synthesis: {
    consensus: ["3개 AI 합의 항목"],
    conflicts: [/* 충돌 항목 */],
    reasoning: "3개 AI 합의, 충돌 없음, 성공률 100%"  // v2.3.0
  },
  performance: {  // v2.3.0
    codexTime: 9,
    geminiTime: 19,
    qwenTime: 8,
    parallelEfficiency: 0.95
  },
  metadata: {
    version: "2.3.0",
    nodeVersion: "v22.19.0",  // v2.3.0
    platform: "linux"  // v2.3.0
  }
}
```

### 조회 API

```typescript
// 최근 10개 검증 히스토리
mcp__multi_ai__getHistory({ limit: 10 })

// 패턴 검색
mcp__multi_ai__searchHistory({ pattern: "성능 최적화" })

// 전체 통계
mcp__multi_ai__getHistoryStats()
// 반환: totalVerifications, averageSuccessRate, aiUsage

// 마지막 쿼리 성능
mcp__multi_ai__getPerformanceStats()
// 반환: totalTime, breakdown, successRate
```

---

## 🔗 관련 문서

- [Multi-AI 전략](../environment/multi-ai-strategy.md) - 3-AI 협업 시스템 상세
- [AI 교차검증 워크플로우](../workflows/ai-cross-verification-workflow.md) - Claude 필터링 방식
- [MCP 우선순위 가이드](../environment/mcp/mcp-priority-guide.md) - MCP 도구 활용 전략
- [개인 워크플로우](../environment/workflows.md) - 일상 개발 패턴

---

## 💡 핵심 원칙

1. **개별 AI 협업은 MCP 직접 사용** - `queryWithPriority`로 Codex/Gemini/Qwen 선택
2. **AI 교차검증은 서브에이전트 활용** - Multi-AI Verification Specialist가 `queryAllAIs` 자동 실행
3. **Claude 최종 결정 필수** - AI 판단을 맹신하지 말고 실제 코드와 대조하여 선택적 적용
4. **히스토리 기반 개선** - 반복 문제 식별 및 추세 추적 (v2.3.0: reasoning, performance)
5. **비용 대비 효과 고려** - 중요한 작업에만 Multi-AI MCP 투자

**Multi-AI MCP v2.3.0**: 품질 보장을 위한 메타 오케스트레이션 전략
