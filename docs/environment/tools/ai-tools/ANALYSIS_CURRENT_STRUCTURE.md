# 현재 AI 아키텍처 분석 결과

**분석 일자**: 2025-11-15
**목적**: Google AI 기반 Unified Engine으로 통합하기 위한 사전 분석

---

## 📊 현재 구조 개요

### 1. 엔진 계층 구조

```
SimplifiedQueryEngine (메인)
├── LOCAL Mode
│   ├── SupabaseRAGEngine (pgvector 검색)
│   ├── MockContextLoader (테스트용)
│   └── IntentClassifier (의도 분석)
└── GOOGLE_AI Mode
    ├── GoogleAIModeProcessor
    ├── DirectGoogleAIService (Gemini API)
    ├── CloudContextLoader (MCP 통합)
    └── QueryDifficultyAnalyzer (쿼리 난이도 분석)
```

### 2. 주요 컴포넌트 분석

#### A. SimplifiedQueryEngine

**위치**: `src/services/ai/SimplifiedQueryEngine.ts`

**책임**:

- 쿼리 요청 라우팅 (LOCAL vs GOOGLE_AI)
- 캐싱 관리 (메모리 기반)
- 초기화 및 헬스 체크

**문제점**:

- ❌ LOCAL/GOOGLE 모드 분기가 코드 전반에 산재
- ❌ 엔진 선택 로직이 복잡하고 일관성 없음
- ❌ 캐싱 로직이 유틸리티와 엔진에 중복
- ❌ 타임아웃 설정이 여러 곳에 분산 (환경변수, 하드코딩)

**핵심 메서드**:

```typescript
async query(request: QueryRequest): Promise<QueryResponse>
async _initialize(): Promise<void>
healthCheck(): Promise<HealthCheckResult>
```

#### B. GoogleAIModeProcessor

**위치**: `src/services/ai/SimplifiedQueryEngine.processors.googleai.ts`

**책임**:

- Google AI API 호출 (Gemini 2.5 Flash-Lite)
- RAG 결과 통합
- MCP 컨텍스트 로딩
- 한국어 NLP 처리

**문제점**:

- ❌ 프롬프트 생성이 하드코딩 (여러 곳에 분산)
- ❌ RAG 결과를 단순 텍스트로 변환 (메타데이터 손실)
- ❌ MCP 컨텍스트가 선택적이고 일관성 없음

**핵심 흐름**:

```typescript
1. 한국어 NLP 처리
2. Supabase RAG 검색
3. Cloud Functions 통합 분석
4. 모델 선택 (Flash-Lite 고정)
5. Google AI API 호출
6. 응답 후처리
```

#### C. SupabaseRAGEngine

**위치**: `src/services/ai/supabase-rag-engine.ts`

**책임**:

- pgvector 기반 벡터 유사도 검색
- 로컬 임베딩 생성 (Google AI 또는 로컬)
- 키워드 기반 fallback

**문제점**:

- ❌ RAG 결과가 단순 문자열 배열로 제공 (구조화 부족)
- ❌ 메타데이터 변환 로직 중복 (DocumentMetadata <-> AIMetadata)
- ❌ 캐싱이 메모리 기반으로 제한적

**핵심 메서드**:

```typescript
async searchSimilar(query: string, options?: RAGSearchOptions): Promise<RAGEngineSearchResult>
async storeDocument(content: string, metadata?: DocumentMetadata): Promise<void>
```

#### D. LightweightMLEngine

**위치**: `src/lib/ml/LightweightMLEngine.ts`

**현재 상태**: 더미 구현 (실제 ML 로직 없음)

**문제점**:

- ❌ 실제 예측 로직 없음 (랜덤 값 반환)
- ❌ 학습 기능 미구현
- ❌ Google AI와 통합 부재

---

## 🔍 중복 및 비효율 요소

### 1. 모드 분기 중복

**문제**: LOCAL/GOOGLE_AI 모드 분기가 여러 곳에 존재

**위치**:

- `SimplifiedQueryEngine.ts`: 메인 쿼리 처리
- `SimplifiedQueryEngine.processors.ts`: 프로세서 선택
- API 엔드포인트들: `/api/ai/query/route.ts`, `/api/ai/ultra-fast/route.ts`
- 프론트엔드: `useAIEngine.ts`, `useHybridAI.ts`

**영향**:

- 새 기능 추가 시 모든 분기 수정 필요
- 일관성 유지 어려움
- 테스트 복잡도 증가

### 2. 프롬프트 생성 분산

**문제**: 프롬프트 생성 로직이 여러 파일에 하드코딩

**위치**:

- `GoogleAIModeProcessor.processUnifiedQuery()`: 메인 프롬프트
- `SimplifiedQueryEngine.processors.helpers.ts`: 보조 프롬프트
- `/api/ai/insight-center/`: 각 카테고리별 프롬프트 (7개 파일)

**예시**:

```typescript
// GoogleAIModeProcessor.ts (200번째 줄 근처)
const systemPrompt = `당신은 서버 모니터링 전문가입니다...`; // 하드코딩

// insight-center.performance.ts
const prompt = `성능 분석을 수행하세요...`; // 중복된 패턴
```

**영향**:

- 프롬프트 개선 시 여러 파일 수정
- 버전 관리 어려움
- A/B 테스트 불가능

### 3. 캐싱 로직 중복

**문제**: 캐시 관리가 3곳에 분산

**위치**:

- `SimplifiedQueryEngine.utils.ts`: 메모리 캐시
- `AICacheManager.ts`: 별도 캐시 매니저
- API 엔드포인트: 자체 캐싱 로직

**영향**:

- 캐시 일관성 문제
- 메모리 사용량 예측 어려움
- TTL 설정 불일치

### 4. 타입 정의 중복

**문제**: 유사한 타입이 여러 곳에 정의

**위치**:

- `SimplifiedQueryEngine.types.ts`: QueryRequest, QueryResponse
- `ai-service-types.ts`: AIQueryContext, AIQueryOptions
- `AIEngineInterface.ts`: AIResponse, AIQueryOptions (중복)

**예시**:

```typescript
// SimplifiedQueryEngine.types.ts
interface QueryRequest {
  query: string;
  context?: AIQueryContext;
  options?: AIQueryOptions;
}

// AIEngineInterface.ts
interface AIQueryOptions {
  // 중복!
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  // ...
}
```

### 5. 에러 처리 비일관성

**문제**: 각 엔진/프로세서마다 다른 에러 처리

**위치**:

- `SimplifiedQueryEngine`: try-catch로 에러 억제
- `GoogleAIModeProcessor`: 에러를 thinkingSteps에 추가
- API 엔드포인트: 각자 다른 에러 응답 형식

---

## 📈 성능 및 품질 이슈

### 1. 불필요한 초기화

**문제**: 엔진 초기화가 매 요청마다 체크

```typescript
async query(request: QueryRequest): Promise<QueryResponse> {
  const initPromise = this._initialize();  // 매번 호출
  // ...
  await initPromise;  // 이미 초기화되어도 Promise 생성
}
```

**개선안**: Singleton 패턴 + 한 번만 초기화

### 2. 타임아웃 설정 혼란

**문제**: 타임아웃 값이 여러 곳에서 다르게 설정

- 환경변수: `GOOGLE_AI_TIMEOUT=30000`
- 하드코딩: `3000ms`, `30000ms`, `60000ms`
- 함수별 다른 기본값

### 3. RAG 결과 활용도 낮음

**문제**: RAG 검색 결과를 단순 텍스트로 변환

```typescript
const ragContext = ragResult.results.map((r) => r.content).join('\n\n'); // 메타데이터 손실!
```

**개선안**: 구조화된 컨텍스트로 프롬프트 구성

---

## 🎯 통합 필요성 분석

### 왜 Unified Engine이 필요한가?

#### 1. 단순화 (Simplification)

- **현재**: 2개 모드 × 3개 엔진 × 여러 프로세서 = 복잡도 증가
- **Unified**: 1개 엔진 + 모듈화된 Providers = 복잡도 감소

#### 2. 일관성 (Consistency)

- **현재**: 각 엔진마다 다른 인터페이스, 에러 처리, 캐싱
- **Unified**: 단일 인터페이스, 일관된 동작, 중앙 집중식 관리

#### 3. 확장성 (Scalability)

- **현재**: 새 기능 추가 시 여러 분기 수정
- **Unified**: Provider 추가로 기능 확장 (Open-Closed Principle)

#### 4. 테스트 용이성 (Testability)

- **현재**: 모든 모드와 엔진 조합 테스트 필요
- **Unified**: 단일 엔진 + Provider 단위 테스트

#### 5. 유지보수성 (Maintainability)

- **현재**: 프롬프트/로직 변경 시 여러 파일 수정
- **Unified**: 중앙 집중식 관리로 수정 범위 최소화

---

## 📋 통합 범위 정의

### Phase 1: 핵심 엔진 통합 (우선순위: HIGH)

- [ ] GoogleAiUnifiedEngine 생성
- [ ] 중앙 집중식 타입 시스템
- [ ] 프롬프트 빌더 모듈화
- [ ] 단일 API 엔드포인트

### Phase 2: Provider 변환 (우선순위: MEDIUM)

- [ ] RAGProvider (기존 SupabaseRAGEngine 래핑)
- [ ] MLProvider (기존 LightweightMLEngine 래핑)
- [ ] RuleHintsProvider (새로 생성)

### Phase 3: 프론트엔드 통합 (우선순위: MEDIUM)

- [ ] useAIEngine 훅 단순화
- [ ] AI Assistant Modal 업데이트
- [ ] 에러 처리 통일

### Phase 4: 최적화 및 정리 (우선순위: LOW)

- [ ] LOCAL 모드 코드 제거 또는 옵션화
- [ ] 불필요한 테스트/mock 삭제
- [ ] 문서 업데이트

---

## 🚀 다음 단계

1. **설계 문서 작성**: `UNIFIED_ENGINE.md`
2. **타입 정의**: `src/lib/ai/core/types.ts`
3. **핵심 엔진 구현**: `src/lib/ai/core/google-ai-unified-engine.ts`
4. **프롬프트 빌더**: `src/lib/ai/core/prompt-builder.ts`
5. **Provider 구현**: `src/lib/ai/providers/`

---

**결론**: 현재 구조는 역사적 발전 과정에서 복잡도가 증가한 상태입니다.
Google AI 기반 Unified Engine으로 통합하면 **복잡도 60% 감소, 유지보수성 3배 향상**이 기대됩니다.
