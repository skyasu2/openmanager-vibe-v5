---
id: system-architecture-current
title: Current System Architecture
keywords: [architecture, system, structure, components]
priority: critical
ai_optimized: true
related_docs:
  - 'architecture/api/endpoints.md'
  - 'architecture/decisions/adr-001-unified-ai-engine-cache-and-providers.md'
  - 'ai/README.md'
updated: '2025-11-20'
---

# 🏗️ 현재 시스템 아키텍처 (v5.79.1)

## 📊 시스템 개요

```
┌─────────────────────────────────────────────────────────────┐
│                Frontend (Next.js 15.4.5)                     │
│  - React 18 + TypeScript 5.7.2 (strict)                     │
│  - 실시간 대시보드 (StaticDataLoader)                        │
│  - Zustand 상태 관리                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         Vercel Edge Functions (85개 API Routes)             │
│  - /api/ai/query (통합 쿼리 엔진)                           │
│  - /api/ai/google-ai/generate (Google AI 직접)             │
│  - /api/servers/* (서버 관리)                               │
│  - /api/metrics/* (메트릭 수집)                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────┬──────────────────┬──────────────────────┐
│ StaticDataLoader │  Google AI API   │  Supabase PostgreSQL │
│  (Mock 데이터)    │  (Gemini 2.5)    │  (RAG + 대화 이력)   │
│  - 17개 서버     │  - 자연어 처리   │  - pgvector          │
│  - 24시간 데이터 │  - 1500 요청/일  │  - 500MB 무료        │
│  - 99.6% CPU 절약│  - 1초 응답      │  - 3분 TTL 캐시      │
└──────────────────┴──────────────────┴──────────────────────┘
```

## 🎯 핵심 컴포넌트

### 1. Frontend Layer

#### 주요 디렉토리
```
src/
├── app/                   # Next.js 15 App Router
│   ├── (auth)/           # 인증 페이지
│   ├── (dashboard)/      # 대시보드 페이지
│   └── api/              # 85개 API Routes
├── components/           # React 컴포넌트
│   ├── dashboard/        # 대시보드 UI
│   ├── ai/              # AI 사이드바
│   └── ui/              # shadcn/ui 컴포넌트
├── lib/                  # 유틸리티 라이브러리
│   ├── ai/              # AI 클라이언트
│   ├── supabase/        # Supabase 클라이언트
│   └── config/          # 설정 관리
└── services/            # 비즈니스 로직
    ├── ai/              # AI 서비스
    └── data/            # 데이터 서비스
```

#### 상태 관리
- **Zustand**: 전역 상태 (서버, 메트릭, AI)
- **React Query**: 서버 상태 캐싱
- **Context API**: 인증, 테마

### 2. API Layer (85개 Routes)

#### AI 관련 (20개)
```typescript
/api/ai/
├── query                 # 통합 쿼리 엔진 (메인)
├── google-ai/
│   ├── generate         # Google AI 직접 호출
│   └── status           # 상태 확인
├── cache-stats          # 캐시 통계
├── incident-report      # 장애 보고서
├── insight-center       # 인사이트 센터
├── intelligent-monitoring # 지능형 모니터링
├── korean-nlp           # 한국어 NLP
├── ml-analytics         # ML 분석
├── monitoring           # 모니터링
├── performance          # 성능 분석
├── rag/benchmark        # RAG 벤치마크
├── raw-metrics          # 원시 메트릭
├── thinking/stream-v2   # 스트리밍 응답
└── ultra-fast           # 초고속 라우터
```

#### 서버 관리 (30개)
```typescript
/api/servers/
├── [id]                 # 서버 상세
├── list                 # 서버 목록
├── metrics              # 메트릭 수집
├── health               # 헬스 체크
└── scenarios/           # 시나리오 관리
```

#### 메트릭 (15개)
```typescript
/api/metrics/
├── overview             # 전체 개요
├── [serverId]          # 서버별 메트릭
├── stream              # 실시간 스트림
├── aggregations        # 집계 데이터
└── historical          # 히스토리
```

#### 기타 (20개)
- 인증, 헬스체크, A/B 테스트, 로깅 등

### 3. Service Layer

#### AI 서비스 (src/services/ai/)
```typescript
// 핵심 엔진
SimplifiedQueryEngine          # 통합 쿼리 엔진
DirectGoogleAIService          # Google AI 직접 호출
SupabaseRAGEngine             # RAG 검색

// 지원 서비스
GoogleAIUsageTracker          # 사용량 추적
QueryDifficultyAnalyzer       # 쿼리 난이도 분석
IncidentReportService         # 장애 보고서
MockContextLoader             # Mock 컨텍스트

// 최적화
PerformanceOptimizedQueryEngine  # 성능 최적화
UltrafastAIRouter               # 초고속 라우팅
VectorSearchOptimizer           # 벡터 검색 최적화
```

#### 데이터 서비스 (src/services/data/)
```typescript
StaticDataLoader              # 24시간 Mock 데이터
UnifiedMetricsManager         # 메트릭 관리
ScalingSimulationEngine       # 스케일링 시뮬레이션
```

### 4. Data Layer

#### StaticDataLoader (v5.71.0)
```typescript
class StaticDataLoader {
  // 특징
  - 24시간 고정 데이터 (hourly JSON)
  - 1분 간격 보간 (UI용)
  - 99.6% CPU 절약
  - 92% 메모리 절약
  - 캐시 히트율 3배 향상
  
  // 데이터 구조
  servers: 17개 (web, api, db, cache 등)
  metrics: CPU, Memory, Disk, Network
  timeRange: 24시간 (1440분)
}
```

#### Supabase PostgreSQL
```typescript
// 테이블
- ai_conversations        # AI 대화 이력
- ai_context_cache       # 컨텍스트 캐시 (3분 TTL)
- server_metrics         # 서버 메트릭 (선택적)
- embeddings            # RAG 벡터 (pgvector)

// 기능
- pgvector 확장 (벡터 검색)
- RLS (Row Level Security)
- Realtime 구독
```

#### Google AI (Gemini 2.5 Flash)
```typescript
// 사용량
- 1500 요청/일 (무료)
- 현재 사용: ~300 요청/일 (20%)
- 평균 응답: 1초 이내

// 기능
- 자연어 처리
- 컨텍스트 이해
- 한국어 지원
```

## 🔄 데이터 플로우

### 1. 일반 쿼리
```
사용자 입력
    ↓
AI 사이드바 (React)
    ↓
/api/ai/query (Vercel Edge)
    ↓
SimplifiedQueryEngine
    ↓
┌─────────────┬──────────────┐
│ RAG 검색    │ Google AI    │
│ (Supabase)  │ (Gemini)     │
└─────────────┴──────────────┘
    ↓
통합 응답 (JSON)
    ↓
AI 사이드바 렌더링
```

### 2. 실시간 메트릭
```
StaticDataLoader (메모리)
    ↓
1분 간격 보간
    ↓
Zustand Store
    ↓
Dashboard 컴포넌트
    ↓
Chart.js / Recharts 렌더링
```

### 3. 캐싱 전략
```typescript
// 3단계 캐싱
1. 메모리 캐시 (1분 TTL)
   - StaticDataLoader
   - UnifiedCache

2. Supabase 캐시 (3분 TTL)
   - ai_context_cache 테이블
   - RAG 검색 결과

3. Vercel Edge 캐시 (5분 TTL)
   - API 응답 캐싱
   - 정적 리소스
```

## 📦 주요 라이브러리

### Frontend
```json
{
  "next": "^15.4.5",
  "react": "^18.3.1",
  "typescript": "^5.7.2",
  "zustand": "^5.0.2",
  "@tanstack/react-query": "^5.62.11",
  "chart.js": "^4.4.7",
  "recharts": "^2.15.0",
  "lucide-react": "^0.468.0"
}
```

### Backend
```json
{
  "@google/generative-ai": "^0.21.0",
  "@supabase/supabase-js": "^2.47.10",
  "zod": "^3.24.1",
  "ai": "^4.0.38"
}
```

### Testing
```json
{
  "vitest": "^2.1.8",
  "@playwright/test": "^1.49.1",
  "@testing-library/react": "^16.1.0"
}
```

## 🎯 성능 지표

### 응답 시간
- **API 평균**: 152ms
- **Google AI**: 1초 이내
- **RAG 검색**: 200ms
- **페이지 로드**: 1.2초

### 리소스 사용
- **Vercel**: ~10GB/월 (100GB 중)
- **Supabase**: ~50MB (500MB 중)
- **Google AI**: ~300 요청/일 (1500 중)

### 테스트 커버리지
- **E2E**: 98.2% 통과율
- **Unit**: 주요 컴포넌트 커버
- **Lint**: 316개 경고 (491에서 35.6% 개선)

## 🔒 보안

### 인증
```typescript
// PIN 기반 인증
- 기본 PIN: 4231
- 세션 관리: Zustand + localStorage
- 권한: 관리자/운영자/게스트
```

### API 보안
```typescript
// Rate Limiting
- 100 요청/분 (IP 기반)
- 1000 요청/시간 (사용자 기반)

// CORS
- 허용 도메인: vercel.app, localhost
```

## 🚀 배포

### Vercel (무료 티어)
```yaml
환경: Production
빌드: Next.js 15 (Turbopack)
배포: Git push 자동 배포
도메인: *.vercel.app
```

### 환경 변수
```bash
# Google AI
GOOGLE_AI_API_KEY=***

# Supabase
NEXT_PUBLIC_SUPABASE_URL=***
NEXT_PUBLIC_SUPABASE_ANON_KEY=***
SUPABASE_SERVICE_ROLE_KEY=***

# 기타
NODE_ENV=production
```

## 📊 모니터링

### 실시간 모니터링
- StaticDataLoader: 17개 서버
- 메트릭: CPU, Memory, Disk, Network
- 업데이트: 1분 간격

### 로깅
```typescript
// 구조화된 로깅
logger.info('API 요청', {
  endpoint: '/api/ai/query',
  duration: 152,
  status: 200
});
```

## 🔄 향후 계획

### 단기 (1개월)
- [ ] Lint 경고 추가 개선 (316 → 200)
- [ ] E2E 테스트 100% 통과
- [ ] 성능 최적화 (응답 시간 100ms 목표)

### 중기 (3개월)
- [ ] 실제 서버 연동 옵션
- [ ] 고급 AI 기능 (예측, 이상 탐지)
- [ ] 다국어 지원

### 장기 (6개월)
- [ ] 엔터프라이즈 기능
- [ ] 플러그인 시스템
- [ ] 모바일 앱

## 📚 참고 문서

- **API 레퍼런스**: [api/endpoints.md](api/endpoints.md)
- **AI 시스템**: [../ai/README.md](../ai/README.md)
- **테스트 가이드**: [../testing/README.md](../testing/README.md)
- **배포 가이드**: [../deploy/README.md](../deploy/README.md)

---

**마지막 업데이트**: 2025-11-20  
**버전**: v5.79.1  
**상태**: ✅ 프로덕션 운영 중
