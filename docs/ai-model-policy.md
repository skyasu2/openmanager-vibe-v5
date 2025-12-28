# Google AI (Embedding Only) 정책 및 Free Tier 현황 (2025.12)

이 문서는 2025년 12월 기준 Google AI Studio (Gemini API)의 활용 정책을 정리합니다.
현재 Google AI는 **LLM(생성) 용도가 아닌 `Embedding` 전용 공급자**로 전환되었습니다.

> **최종 업데이트**: 2025-12-28 (Embedding Only 전략 확정)

---

## 📊 모델별 역할 및 상태

| 모델 | 용도 | 상태 | RPM (무료) | 비고 |
|---|---|---|---|---|
| **`text-embedding-004`** | **RAG Embedding** | ✅ **ACTIVE** | **1,500** | **핵심 엔진**. 벡터 검색용으로 계속 유지 |
| `gemini-2.0-flash-exp` | LLM (Test) | ⏸️ STANDBY | 15 | 테스트 용도로만 제한적 사용 |
| `gemini-1.5-flash` | LLM (Legacy) | ❌ **MIGRATED** | - | Cerebras/Groq로 전면 교체됨 |
| `gemini-pro` | LLM (Legacy) | ❌ **REMOVED** | - | 사용 중단 |

---

## 🚨 아키텍처 변경 배경 (2025.12)

### 1. LLM 역할 이동 (Google → AI Alliance)
Google AI의 무료 티어 LLM 사용량이 급격히 제한(1,500 RPD → 50 RPD 미만)됨에 따라, 생성형 AI 역할은 다음 공급자로 **전면 이관**되었습니다.

- **Supervisor**: **Groq** (Llama 3.3 70b)
- **Workers**: **Cerebras** (Llama 3.3 70b, 24M Token/Day)
- **Verifier**: **Mistral AI** (Small 3.2 24B)

### 2. Google AI 유지 이유: **Embedding**
LLM 제한과 달리, **임베딩 모델(`text-embedding-004`)**은 여전히 **분당 1,500회(RPM)**라는 관대한 무료 할당량을 제공합니다.

- **비용 효율성**: 무료로 상용 수준의 RAG 구현 가능
- **호환성**: 기존 384차원 Vector DB 스키마 유지 가능 (마이그레이션 비용 절감)
- **성능**: RAG 검색 및 GraphRAG 관계 탐색에 충분한 성능

---

## 🔧 환경 변수 설정

이제 Google AI API 키는 오직 임베딩 생성을 위해서만 사용됩니다.

```env
# Primary Key for Embedding
GOOGLE_AI_API_KEY=AIzaSy...

# Usage Config
GOOGLE_AI_ENABLED=true
GOOGLE_AI_MODE=embedding_only
```

---

## 💡 요약

**"Brain(추론)은 Cerebras/Groq가, Memory(기억)의 Indexing은 Google AI가 담당합니다."**

- **Brain**: Llama 3.3 70B (via Cerebras/Groq)
- **Embedding**: text-embedding-004 (via Google AI)
- **Vector DB**: Supabase pgvector

_Last Updated: 2025-12-28_
