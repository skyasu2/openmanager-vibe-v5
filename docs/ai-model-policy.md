# AI Model Policy (Cloud Run + Vercel AI SDK) - 2026.01

이 문서는 OpenManager Vibe의 AI 아키텍처를 정리합니다.
현재 AI 처리는 **Cloud Run 기반 LLM 멀티 에이전트 시스템 (Vercel AI SDK)** 으로 구성되어 있습니다.

> **최종 업데이트**: 2026-01-09 (NLP 아키텍처 문서화)

---

## 🧠 NLP 아키텍처 개요

### 오픈소스 여부
**100% 오픈소스 LLM 기반**입니다. 자체 NLP 엔진은 없으며 외부 LLM API를 사용합니다.

| 구분 | 내용 |
|------|------|
| **NLP 엔진** | 자체 구현 없음 (외부 LLM API 사용) |
| **기반 모델** | Meta Llama 3.3 70B (오픈소스) |
| **호스팅** | Cerebras, Groq, Mistral, OpenRouter 인프라 |
| **비용** | 모두 무료 tier 한도 내 운영 |

### 배치 위치
```
Cloud Run AI Engine (asia-northeast1)
├── cloud-run/ai-engine/src/services/ai-sdk/
│   ├── model-provider.ts     # LLM 프로바이더 관리
│   ├── supervisor.ts         # 메인 에이전트 오케스트레이션
│   └── agents/
│       ├── nlq-agent.ts      # 자연어 쿼리 처리 (NLP)
│       ├── analyst-agent.ts  # 분석
│       ├── advisor-agent.ts  # 조언
│       └── summarizer-agent.ts # 요약
```

### 기술 스택
```
Vercel AI SDK 6 (@ai-sdk)
├── @ai-sdk/cerebras     # Cerebras 통합 (Primary)
├── @ai-sdk/groq         # Groq 통합 (NLQ Agent)
└── @ai-sdk/mistral      # Mistral 통합 (Verifier)
```

### 의도 분류 (Intent Classification)

경량 정규식 기반 라우팅 (CPU 부담 최소화):

| 카테고리 | 패턴 예시 | 라우팅 |
|----------|----------|--------|
| 보고서 | `보고서`, `리포트`, `인시던트` | Multi-Agent |
| 원인 분석 | `왜.*높아`, `원인.*뭐`, `rca` | Multi-Agent |
| 문제 해결 | `어떻게.*해결`, `조치.*방법` | Multi-Agent |
| 예측/추세 | `예측`, `트렌드`, `앞으로` | Multi-Agent |
| 비교 분석 | `어제.*대비`, `비교.*해` | Multi-Agent |
| 용량 계획 | `언제.*부족`, `증설.*필요` | Multi-Agent |
| 이상 분석 | `왜.*이상`, `스파이크.*원인` | Multi-Agent |
| 요약 | `서버.*요약`, `핵심.*알려` | Multi-Agent |
| **기타** | 단순 조회 | **Single-Agent** |

> **설계 원칙**: Python NLP 라이브러리 대신 정규식 사용으로 Cloud Run CPU 부담 최소화

---

## 📊 현재 아키텍처

### LLM 멀티 에이전트 시스템 (Cloud Run)

| Agent | Primary | Fallback | 역할 |
|-------|---------|----------|------|
| **Orchestrator** | Cerebras llama-3.3-70b | Mistral mistral-small-2506 | 빠른 라우팅, 태스크 분배 (~200ms) |
| **NLQ Agent** | Cerebras llama-3.3-70b | Groq llama-3.3-70b-versatile | 자연어 쿼리, 서버 메트릭 조회 |
| **Analyst Agent** | Groq llama-3.3-70b-versatile | Cerebras llama-3.3-70b | 이상 탐지, 트렌드 예측, 패턴 분석 |
| **Reporter Agent** | Groq llama-3.3-70b-versatile | Cerebras llama-3.3-70b | 장애 보고서, 타임라인, GraphRAG |
| **Advisor Agent** | Mistral mistral-small-2506 | Groq llama-3.3-70b-versatile | 트러블슈팅 가이드, 명령어 추천 |
| **Verifier** | Mistral mistral-small-2506 | Cerebras llama-3.3-70b | 응답 검증 |

### Embedding (Cloud Run)

| 역할 | 모델 | 차원 | 비고 |
|------|------|------|------|
| **Vector Search** | mistral-embed | 1024d | Supabase pgvector 연동 |

### Frontend Layer (Vercel)

| 역할 | 기능 | 비고 |
|------|------|------|
| **Proxy** | API 라우팅 | Cloud Run으로 요청 전달 |
| **Cache** | 응답 캐싱 | Rate Limiting 보호 |
| **UI** | 사용자 인터페이스 | React 19 + Next.js 16 |

---

## 🛠️ 기술 스택

### Vercel AI SDK (`ai` v6.0.3)

```typescript
// Provider 패키지
"@ai-sdk/cerebras": "^2.0.2"   // Orchestrator, NLQ
"@ai-sdk/groq": "^2.0.33"      // Analyst, Reporter
"@ai-sdk/mistral": "^3.0.1"    // Advisor, Embedding
```

### Agent Framework

```typescript
"@ai-sdk-tools/agents": "^1.2.0"  // Multi-agent orchestration
```

---

## 🔄 Agent 라우팅

### Multi-Agent Mode
```
User Query → Orchestrator (Cerebras)
                ├→ NLQ Agent (Cerebras)
                ├→ Analyst Agent (Groq)
                ├→ Reporter Agent (Groq)
                └→ Advisor Agent (Mistral)
```

### Direct Routes
| Route | Agent | 용도 |
|-------|-------|------|
| `/analyze-server` | Analyst | 서버 분석 직접 호출 |
| `/incident-report` | Reporter | 인시던트 리포트 생성 |
| `/troubleshoot` | Advisor | RAG 기반 가이드 |

---

## 🚨 아키텍처 변경 배경 (2025.12)

### Google AI → LLM 멀티 에이전트 마이그레이션

1. **무료 티어 제한 강화**: Google AI 무료 할당량 급감
2. **임베딩 차원 변경**: 384d (Google) → 1024d (Mistral)
3. **LLM 멀티 에이전트 도입**: 역할별 최적화된 LLM 배치
4. **통합 인프라**: Cloud Run 단일 서비스로 통합

### 무료 티어 활용 (2026-01 기준)

| Provider | 무료 할당량 | 용도 | 모델 |
|----------|-------------|------|------|
| **Cerebras** | 24M tokens/day | Primary (Supervisor, NLQ) | llama-3.3-70b |
| **Groq** | 100K tokens/day | NLQ Agent 전용 | llama-3.3-70b-versatile |
| **Mistral** | 1M tokens/mo | Verifier, Advisor | mistral-small-2506 |

### Fallback 체인

```
Cerebras (Primary)
    ↓ quota 80% 초과 시
Mistral (Fallback 1)
    ↓ 실패 시
Groq (Fallback 2)
```

> **참고**: Groq은 NLQ Agent 전용으로 예약되어 Supervisor fallback 체인에서 제외됩니다.

---

## 🔧 환경 변수 설정

```env
# Cloud Run AI Engine
CLOUD_RUN_AI_URL=https://ai-engine-xxx.asia-northeast1.run.app
CLOUD_RUN_AI_ENABLED=true

# Provider API Keys (Cloud Run 내부)
CEREBRAS_API_KEY=xxx
GROQ_API_KEY=xxx
MISTRAL_API_KEY=xxx

# Note: Vercel에서는 Cloud Run URL만 필요
# API 키는 Cloud Run 환경에서 관리
```

---

## 💡 요약

**"LLM 멀티 에이전트 시스템 on Cloud Run with Vercel AI SDK"**

- **Orchestrator**: Cerebras (빠른 라우팅)
- **Analysis**: Groq (이상 탐지, 리포팅)
- **RAG/Embedding**: Mistral (1024d)
- **Vector DB**: Supabase pgvector
- **Vercel**: Proxy + Cache only

_Last Updated: 2026-01-09_
