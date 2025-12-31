# AI Model Policy (Cloud Run + Vercel AI SDK) - 2025.12

이 문서는 2025년 12월 기준 OpenManager Vibe의 AI 아키텍처를 정리합니다.
현재 AI 처리는 **Cloud Run 기반 LLM 멀티 에이전트 시스템 (Vercel AI SDK)** 으로 구성되어 있습니다.

> **최종 업데이트**: 2025-12-31 (Multi-Agent Architecture 문서화)

---

## 📊 현재 아키텍처

### LLM 멀티 에이전트 시스템 (Cloud Run)

| Agent | Model | Provider | 역할 |
|-------|-------|----------|------|
| **Orchestrator** | llama-3.3-70b | Cerebras | 빠른 라우팅, 태스크 분배 |
| **NLQ Agent** | llama-3.3-70b | Cerebras | 자연어 쿼리 처리 |
| **Analyst Agent** | llama-3.3-70b | Groq | 이상 탐지, 트렌드 예측 |
| **Reporter Agent** | llama-3.3-70b | Groq | 인시던트 리포트, 타임라인 |
| **Advisor Agent** | mistral-small-latest | Mistral | 트러블슈팅 가이드, RAG 검색 |

### Embedding (Cloud Run)

| 역할 | 모델 | 차원 | 비고 |
|------|------|------|------|
| **Vector Search** | mistral-embed | 1024d | Supabase pgvector 연동 |

### Frontend Layer (Vercel)

| 역할 | 기능 | 비고 |
|------|------|------|
| **Proxy** | API 라우팅 | Cloud Run으로 요청 전달 |
| **Cache** | 응답 캐싱 | Rate Limiting 보호 |
| **UI** | 사용자 인터페이스 | React 19 + Next.js 15 |

---

## 🛠️ 기술 스택

### Vercel AI SDK (`ai` v6.0.3)

```typescript
// Provider 패키지
"@ai-sdk/cerebras": "^2.0.2"  // Orchestrator, NLQ
"@ai-sdk/groq": "^2.0.33"     // Analyst, Reporter
"@ai-sdk/mistral": "^3.0.1"   // Advisor, Embedding
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

### 무료 티어 활용

| Provider | 무료 할당량 | 용도 |
|----------|-------------|------|
| **Cerebras** | 무제한 (Llama) | 빠른 라우팅, NLQ |
| **Groq** | 6K req/day | 분석, 리포팅 |
| **Mistral** | 1M tokens/mo | RAG, 임베딩 |

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

_Last Updated: 2025-12-31_
