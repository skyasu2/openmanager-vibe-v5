---
category: architecture
purpose: system_architecture_and_standards
ai_optimized: true
query_triggers:
  - '시스템 아키텍처'
  - 'API 설계'
  - '데이터베이스'
  - '기술 스택'
related_docs:
  - 'architecture/SYSTEM-ARCHITECTURE-CURRENT.md'
  - 'architecture/TECH-STACK-DETAILED.md'
  - 'architecture/api/endpoints.md'
last_updated: '2025-11-27'
---

# 🏗️ 아키텍처 문서

> **📝 상세 가이드**:
>
> - [기술 스택 전체 가이드](./TECH-STACK-DETAILED.md) (Frontend, Backend, 데이터 계층)
> - [현재 시스템 아키텍처](./SYSTEM-ARCHITECTURE-CURRENT.md) (v5.80.0 전체 구조)
> - [API 엔드포인트 레퍼런스](./api/endpoints.md) (85개 전체 목록)

**목적**: 시스템 아키텍처, API 설계, 데이터베이스 구조 문서

---

## 📂 디렉터리 구조

```
architecture/
├── SYSTEM-ARCHITECTURE-CURRENT.md  # 현재 시스템 아키텍처 (v5.80.0) ⭐
├── SYSTEM-ARCHITECTURE-REVIEW.md   # 아키텍처 검토 보고서
├── TECH-STACK-DETAILED.md          # 기술 스택 상세 가이드 🆕
├── api/                            # API 설계 (4개)
│   ├── endpoints.md               # 85개 엔드포인트 레퍼런스 ⭐
│   ├── routes.md                  # 라우팅 구조
│   ├── schemas.md                 # 스키마 정의
│   └── validation.md              # 검증 규칙
├── db/                            # 데이터베이스 (3개)
│   ├── schema.md                  # Supabase 스키마
│   ├── queries.md                 # 쿼리 최적화
│   └── optimization.md            # 성능 최적화
└── decisions/                     # ADR (2개)
    ├── adr-001-unified-ai-engine-cache-and-providers.md
    └── adr-002-server-card-rendering-strategy.md
```

---

## 🎯 핵심 문서

### 1. 시스템 아키텍처

#### **SYSTEM-ARCHITECTURE-CURRENT.md** ⭐

**현재 시스템의 전체 구조 (v5.80.0)**

```
Frontend (Next.js 15)
    ↓
API Layer (85개 Routes)
    ↓
Service Layer (AI, Data)
    ↓
Data Layer (StaticDataLoader, Supabase, Google AI)
```

**포함 내용**: 계층별 컴포넌트, 85개 API Routes, 데이터 플로우, 성능 지표, 배포 구성

---

### 2. API 설계 (api/)

#### **endpoints.md** ⭐

**85개 API 엔드포인트 완전 레퍼런스**

카테고리:

- 🤖 AI 관련 (20개)
- 🖥️ 서버 관리 (30개)
- 📈 메트릭 (15개)
- 🔐 인증 (5개)
- 🔧 유틸리티 (15개)

**기타**: routes.md (라우팅), schemas.md (스키마), validation.md (검증 규칙)

---

### 3. 데이터베이스 (db/)

#### **schema.md**

Supabase PostgreSQL 스키마

테이블:

- `ai_conversations` - AI 대화 이력
- `ai_context_cache` - 컨텍스트 캐시 (3분 TTL)
- `embeddings` - RAG 벡터 (pgvector)

**기타**: queries.md (최적화), optimization.md (성능 전략)

---

### 4. 아키텍처 결정 기록 (decisions/)

- **ADR-001**: Unified AI Engine (통합 AI 엔진 및 캐싱 전략)
- **ADR-002**: Server Card Rendering (서버 카드 렌더링 최적화)

---

## 🔄 기술 스택 요약

### Frontend

```
Next.js 15.4.5 + React 18 + TypeScript 5.7.2
Zustand (상태) + React Query (서버 상태)
shadcn/ui + Tailwind CSS (UI)
```

### Backend

```
Vercel Edge Functions (85개 Routes)
Google AI (Gemini 2.5 Flash)
Supabase PostgreSQL + pgvector
```

### 데이터

```
StaticDataLoader (Mock 데이터, 99.6% CPU 절약)
24시간 고정 + 1분 보간
17개 서버 시뮬레이션
```

**상세**: [기술 스택 전체 가이드](./TECH-STACK-DETAILED.md)

---

## 📊 성능 지표

| 항목              | 값       |
| ----------------- | -------- |
| API 평균 응답     | 152ms    |
| Google AI 응답    | 1초 이내 |
| 페이지 로드       | 1.2초    |
| E2E 테스트 통과율 | 100%     |

---

## 🎯 주요 특징

### 1. 무료 티어 최적화

- Vercel: ~30% 사용 (100GB 중)
- Supabase: ~3% 사용 (500MB 중)
- Google AI: ~20% 사용 (1,500 요청/일 중)
- **총 운영비**: $0/월

### 2. 계층 분리

```
Presentation → API → Service → Data
```

각 계층 독립적 테스트 가능

### 3. 캐싱 전략

```
메모리 (1분) → Supabase (3분) → Vercel Edge (5분)
```

### 4. StaticDataLoader

- 99.6% CPU 절약
- 92% 메모리 절약
- 캐시 히트율 3배 향상

---

## 🔗 관련 문서

### 시스템 이해

- **[현재 아키텍처](SYSTEM-ARCHITECTURE-CURRENT.md)** - 전체 구조 (v5.80.0)
- **[기술 스택](TECH-STACK-DETAILED.md)** - Frontend/Backend/데이터 계층
- **[API 레퍼런스](api/endpoints.md)** - 85개 엔드포인트
- **[DB 스키마](db/schema.md)** - 데이터베이스 구조

### 개발 가이드

- **[AI 시스템](../ai/README.md)** - AI 통합 가이드
- **[개발 환경](../development/README.md)** - 설정 가이드
- **[테스트](../environment/testing/README.md)** - 테스트 전략

### 배포

- **[Vercel 배포](../deploy/README.md)** - 프로덕션 배포
- **[GCP Functions](../ai/GCP_FUNCTIONS_INTEGRATION.md)** - 클라우드 함수

---

**Last Updated**: 2025-11-27 by Claude Code
**핵심 원칙**: "계층 분리 + 무료 티어 최적화 + Type-First 개발"
