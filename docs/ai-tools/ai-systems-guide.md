# 🤖 AI 시스템 통합 가이드

> Claude + Gemini + Qwen 3-way AI 협업 시스템

## 🎯 개요

OpenManager VIBE v5의 AI 시스템은 Claude Code를 메인으로 하고, 필요시 Gemini CLI와 Qwen Code를 병렬 활용하는 유연한 협업 체계입니다.

## 🚀 AI 협업 전략

| 작업 접근법   | Claude Code (메인) | Gemini CLI (요청 시) | Qwen Code (요청 시) |
| ------------- | ------------------ | -------------------- | ------------------- |
| **기본 전략** | ✅ 모든 개발 주도  | 사용자 요청 시만     | 사용자 요청 시만    |
| **활용 시점** | 항상 활성화        | "Gemini로" 명시 시   | "Qwen으로" 명시 시  |
| **병렬 작업** | 조율 및 통합 담당  | 독립적 기능 개발     | 독립적 기능 개발    |
| **비용 효율** | $200/월 (메인)     | $0 (무료, Google)    | $0 (오픈소스)       |
| **토큰 제한** | 5시간 블록         | 1000회/일, 60회/분   | 256K-1M 토큰        |

## 🧠 AI 엔진 아키텍처

### UnifiedAIEngineRouter

모든 AI 서비스를 중앙에서 관리하는 라우터:

```typescript
// AI 엔진 자동 폴백 시스템
const engines = [
  'google-ai', // Google Gemini API (Primary)
  'supabase-rag', // Supabase Vector Search
  'korean-nlp', // GCP Functions Korean NLP
  'ml-analytics', // GCP Functions ML Analytics
];

// 실패 시 자동으로 다음 엔진으로 전환
const result = await aiRouter.processQuery(query, {
  fallback: true,
  engines: engines,
});
```

### AI 엔진별 특징

#### 1. Google AI (Primary)

- **모델**: Gemini 2.0 Flash, Gemini 1.5 Pro
- **특징**: 빠른 응답, 멀티모달, 긴 컨텍스트
- **용도**: 일반적인 AI 쿼리, 코드 분석

#### 2. Supabase RAG (Vector Search)

- **기술**: pgvector + OpenAI Embeddings
- **특징**: 프로젝트 특화 정보 검색
- **용도**: 코드베이스 질의, 문서 검색

#### 3. Korean NLP (GCP Functions)

- **기술**: Python 3.11 + Korean Language Models
- **특징**: 한국어 특화 처리
- **용도**: 한국어 자연어 처리, 감정 분석

#### 4. ML Analytics (GCP Functions)

- **기술**: scikit-learn, pandas
- **특징**: 서버 메트릭 분석
- **용도**: 성능 예측, 이상 징후 탐지

## 🤖 서브에이전트 시스템

### 핵심 서브에이전트 (18개)

#### AI 개발 전문가

- **`ai-systems-engineer`**: AI 시스템 설계 및 최적화
- **`gemini-cli-collaborator`**: Gemini CLI 완전 활용 (1M 토큰)
- **`qwen-cli-collaborator`**: Qwen Code 다국어 특화 (256K-1M 토큰)

#### 코드 품질 관리

- **`code-review-specialist`**: 함수/메서드 레벨 코드 분석
- **`quality-control-checker`**: 프로젝트 규칙 준수 검사
- **`structure-refactor-agent`**: 아키텍처 리팩토링

#### 인프라 전문가

- **`gcp-vm-specialist`**: GCP VM 통합 백엔드 관리
- **`database-administrator`**: Supabase PostgreSQL 전문 관리
- **`vercel-platform-specialist`**: Vercel 플랫폼 최적화

### 서브에이전트 활용 패턴

#### 1. 자동 협업 (Claude Code 주도)

```typescript
// 복잡한 구현 후 자동 검증
await Task({
  subagent_type: 'code-review-specialist',
  prompt: '구현된 AI 엔진 코드 품질 검증',
});
```

#### 2. 병렬 개발 (효율성 극대화)

```typescript
// 여러 작업 동시 진행 (2x 속도 향상)
Promise.all([
  Task({ subagent_type: 'gemini-cli-collaborator', ... }),
  Task({ subagent_type: 'ai-systems-engineer', ... }),
  claude.implement() // 메인 구현
]);
```

#### 3. 사용자 직접 요청

```bash
# 사용자: "Gemini로 전체 AI 시스템 리팩토링해줘"
# → gemini-cli-collaborator 서브에이전트 활용

# 사용자: "3개 AI 모두 활용해서 성능 개선해줘"
# → Claude, Gemini, Qwen 병렬 실행
```

## 🛠️ AI 엔진 설정 및 사용법

### 환경변수 설정

```env
# Google AI
GOOGLE_AI_API_KEY=your_google_ai_key
GOOGLE_AI_MODEL=gemini-2.0-flash-exp

# Supabase (Vector DB)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GCP Functions
GCP_PROJECT_ID=your_project_id
GCP_FUNCTIONS_REGION=us-central1
```

### AI 쿼리 실행

```typescript
// 프론트엔드에서 AI 쿼리
import { AIService } from '@/services/ai/AIService';

const aiService = new AIService();

// 통합 AI 쿼리 (자동 엔진 선택)
const result = await aiService.query({
  query: "서버 성능 분석해줘",
  context: { serverId: "server-1", metrics: {...} },
  preferredEngine: "google-ai",
  fallback: true
});

// 특정 엔진 직접 사용
const vectorResult = await aiService.searchSimilar({
  query: "MCP 서버 설정 방법",
  engine: "supabase-rag",
  limit: 5
});
```

### AI 엔진 상태 모니터링

```typescript
// AI 엔진 헬스 체크
const healthCheck = await fetch('/api/ai/health');
const status = await healthCheck.json();

/*
{
  "google-ai": { status: "healthy", latency: "120ms" },
  "supabase-rag": { status: "healthy", latency: "45ms" },
  "korean-nlp": { status: "healthy", latency: "280ms" },
  "ml-analytics": { status: "degraded", latency: "1200ms" }
}
*/
```

## 🚀 고급 AI 활용 패턴

### 1. AI 엔진 체이닝

```typescript
// 여러 AI 엔진을 연계한 분석
const analysis = await aiService.chain([
  { engine: 'supabase-rag', query: '관련 문서 검색' },
  { engine: 'korean-nlp', query: '한국어 요약' },
  { engine: 'google-ai', query: '최종 분석 및 권장사항' },
]);
```

### 2. 실시간 AI 스트리밍

```typescript
// 스트리밍 AI 응답
const stream = await aiService.streamQuery({
  query: '실시간 서버 모니터링 분석',
  onChunk: (chunk) => console.log(chunk),
  onComplete: (result) => console.log('완료:', result),
});
```

### 3. AI 학습 및 피드백

```typescript
// AI 응답에 대한 피드백 저장
await aiService.provideFeedback({
  queryId: "query-123",
  rating: 5,
  feedback: "정확한 분석이었습니다",
  corrections: {...}
});
```

## 📊 AI 성능 모니터링

### 메트릭 추적

- **응답 시간**: 각 AI 엔진별 평균 응답 시간
- **정확도**: 사용자 피드백 기반 품질 점수
- **사용량**: 토큰 소비량 및 비용 추적
- **가용성**: 엔진별 가동률 및 실패율

### AI 사용량 대시보드

```typescript
// AI 사용량 통계
const stats = await fetch('/api/ai/stats');
/*
{
  "daily": {
    "google-ai": { requests: 245, tokens: 12500, cost: "$0.15" },
    "supabase-rag": { requests: 89, tokens: 0, cost: "$0.00" },
    "korean-nlp": { requests: 34, tokens: 5600, cost: "$0.00" }
  },
  "performance": {
    "avg_response_time": "152ms",
    "success_rate": "99.2%",
    "user_satisfaction": 4.6
  }
}
*/
```

## 🔧 AI 엔진 관리

### 프로덕션 운영

```bash
# AI 엔진 상태 확인
npm run ai:health

# AI 캐시 정리
npm run ai:clear-cache

# AI 성능 테스트
npm run ai:benchmark
```

### 개발 환경 설정

```bash
# AI 개발 서버 시작
npm run dev:ai

# AI 테스트 실행
npm run test:ai

# AI 로그 모니터링
npm run logs:ai
```

## 📚 상세 기술 문서

### AI 엔진 구현

- **[AI 완전 가이드](../ai/ai-complete-guide.md)**
- **[Query Engine 성능 가이드](../ai/query-engine-performance-guide.md)**
- **[pgvector 마이그레이션](../ai/pgvector-migration-guide.md)**

### 협업 도구

- **[AI Tools 비교](./ai-tools-comparison.md)**
- **[Gemini CLI 가이드](./gemini-cli-guide.md)**
- **[Qwen CLI 가이드](./qwen-cli-guide.md)**

### GCP 통합

- **[GCP VM AI 백엔드](../deployment/gcp-deployment.md)**
- **[GCP Functions 배포](../deployment/gcp-functions.md)**

---

> **AI 시스템 관련 문제가 있나요?** [기술 문서](../ai/)를 확인하거나 이슈를 등록해주세요.
