# 문서 개선 작업 계획서

**작성일**: 2026-01-25
**작성자**: Claude Opus 4.5
**상태**: 진행 중

---

## 1. 분석 요약

### 1.1 실제 구현 아키텍처 (코드 분석 결과)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Vercel (Frontend/BFF)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │   /api/ai/supervisor/stream/v2  (Resumable Stream Proxy)            │   │
│  │                         ↓                                            │   │
│  │   useHybridAIQuery (useChat + resume)                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               ↓ HTTPS                                       │
└──────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         Cloud Run (AI Engine)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Supervisor (Routing)                           │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │  Fast Path (Rule-based)  │  Slow Path (LLM Routing)         │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               ↓                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Multi-Agent Orchestrator                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │  │   NLQ    │ │ Analyst  │ │ Reporter │ │ Advisor  │               │   │
│  │  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │               │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │   │
│  │         ↓           ↓           ↓           ↓                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │               Reporter Pipeline (Evaluator-Optimizer)         │  │   │
│  │  │    Generate → Evaluate (0.75) → Optimize → Re-evaluate        │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               ↓                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Tool Registry (22개 도구)                    │   │
│  │  Metrics │ RCA │ Analyst │ Reporter (Tavily) │ Evaluation │ Control │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               ↓                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Resilience Layer                                 │   │
│  │  Circuit Breaker │ Quota Tracker │ 3-way Fallback │ Retry           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 문서와 코드 비교 결과

| 항목 | 문서 상태 | 코드 실제 | Gap |
|------|:--------:|:--------:|:---:|
| **Resumable Stream v2** | ❌ 미기재 | ✅ 구현됨 | 높음 |
| **Reporter Pipeline** | ❌ 미기재 | ✅ 구현됨 | 높음 |
| **Task Decomposition** | ❌ 미기재 | ✅ 구현됨 | 중간 |
| **Tavily 웹 검색** | 일부 | ✅ 상세 구현 | 중간 |
| **Circuit Breaker** | 일부 | ✅ 상세 구현 | 중간 |
| **Quota Tracker** | ❌ 미기재 | ✅ 구현됨 | 중간 |
| **22개 도구 Registry** | 일부 | ✅ 상세 구현 | 낮음 |
| **finalAnswer 패턴** | ✅ 기재됨 | ✅ 구현됨 | 없음 |
| **UIMessageStream** | ✅ 기재됨 | ✅ 구현됨 | 없음 |

### 1.3 문제점

1. **ai-model-policy.md** (2026-01-09 업데이트)
   - `summarizer-agent.ts` 언급 (현재 코드에 없음)
   - Reporter Pipeline 미기재
   - Tavily 통합 상세 미기재

2. **.claude/rules/architecture.md**
   - `@ai-sdk-tools/agents` 언급 (현재 native AI SDK v6 사용)
   - Multi-agent orchestrator 패턴 미기재

3. **hybrid-split.md**
   - Resumable Stream v2 flow 미기재
   - Circuit Breaker/Quota Tracker 미기재

4. **ai-engine-architecture.md** (2026-01-25)
   - 가장 최신이지만 일부 누락:
     - Reporter Pipeline 상세
     - Task Decomposition 패턴
     - RAG 아키텍처 상세

---

## 2. 개선 작업 목록

### Phase 1: 핵심 문서 업데이트 (우선순위: 높음)

| # | 파일 | 작업 내용 | 예상 영향 |
|:-:|------|----------|:--------:|
| 1 | `docs/ai-model-policy.md` | - summarizer-agent 제거<br>- Reporter Pipeline 추가<br>- Tavily 통합 상세 추가 | 높음 |
| 2 | `.claude/rules/architecture.md` | - @ai-sdk-tools/agents → native AI SDK v6 수정<br>- Multi-agent orchestrator 패턴 추가 | 높음 |
| 3 | `docs/reference/architecture/ai/ai-engine-architecture.md` | - Reporter Pipeline 상세 추가<br>- Task Decomposition 추가<br>- 22개 도구 목록 추가 | 높음 |

### Phase 2: 보조 문서 업데이트 (우선순위: 중간)

| # | 파일 | 작업 내용 | 예상 영향 |
|:-:|------|----------|:--------:|
| 4 | `docs/reference/architecture/infrastructure/hybrid-split.md` | - Resumable Stream v2 flow 추가<br>- Circuit Breaker 상세 추가 | 중간 |
| 5 | `docs/status.md` | - AI SDK v6 세부 패턴 추가<br>- Reporter Pipeline 언급 | 중간 |

### Phase 3: 신규 문서 고려 (우선순위: 낮음)

| # | 파일 | 작업 내용 | 예상 영향 |
|:-:|------|----------|:--------:|
| 6 | `docs/reference/architecture/ai/ai-resilience.md` | 회복성 패턴 전용 문서 (선택) | 낮음 |

---

## 3. 작업 순서

```
Phase 1-1: ai-model-policy.md 업데이트
    ↓
Phase 1-2: architecture.md 업데이트
    ↓
Phase 1-3: ai-engine-architecture.md 업데이트
    ↓
Phase 2-1: hybrid-split.md 업데이트
    ↓
Phase 2-2: status.md 업데이트
    ↓
검증: 문서 간 일관성 확인
```

---

## 4. 성공 기준

- [x] 모든 아키텍처 다이어그램이 실제 코드와 일치
- [x] Reporter Pipeline, Task Decomposition 패턴 문서화
- [x] Resumable Stream v2 흐름 문서화
- [x] 22개 도구 목록 완전 문서화
- [x] 회복성 패턴 (Circuit Breaker, Quota Tracker) 문서화
- [x] 오래된 참조 (summarizer-agent, @ai-sdk-tools/agents) 제거

---

## 5. 완료된 작업 (2026-01-25)

### Phase 1 완료
| 파일 | 변경 내용 | 상태 |
|------|----------|:----:|
| `docs/ai-model-policy.md` | summarizer-agent → reporter-agent, Reporter Pipeline/Tavily 섹션 추가 | ✅ |
| `.claude/rules/architecture.md` | @ai-sdk-tools/agents → Native AI SDK v6 | ✅ |
| `docs/reference/architecture/ai/ai-engine-architecture.md` | Reporter Pipeline, Task Decomposition, 22개 도구 목록 추가 | ✅ |

### Phase 2 완료
| 파일 | 변경 내용 | 상태 |
|------|----------|:----:|
| `docs/reference/architecture/infrastructure/hybrid-split.md` | Resumable Stream v2, Circuit Breaker 섹션 추가 | ✅ |
| `docs/status.md` | AI SDK v6 Native Patterns, Reporter Pipeline, 22개 도구 상세 추가 | ✅ |

---

_작성: Claude Opus 4.5 | 2026-01-25_
_완료: 2026-01-25_
