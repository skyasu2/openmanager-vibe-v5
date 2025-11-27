# GCP Functions 최적화 및 활용 가이드

**목적**: GCP Functions를 효과적으로 활용하여 Vercel 부하 분산  
**전략**: 무거운 ML/NLP 작업은 GCP, 가벼운 API는 Vercel  
**목표**: 무료 티어 내 최적 성능

---

## 📊 현재 상황

### 구현된 기능

```typescript
// src/lib/gcp/
├── gcp-functions-client.ts      // HTTP 클라이언트
├── gcp-functions.config.ts      // 설정 관리
├── gcp-functions.types.ts       // 타입 정의
├── gcp-functions.utils.ts       // 유틸리티
└── resilient-ai-client.ts       // Circuit Breaker + Retry
```

### 실제 사용 위치

```typescript
// 1. Korean NLP (한국어 자연어 처리)
/api/ai/korean-nlp → GCP Functions

// 2. ML Analytics (머신러닝 분석)
/api/ai/ml-analytics → GCP Functions

// 3. Edge AI Router (엣지 라우팅)
edge-ai-router.ts → GCP Functions
```

---

## 🎯 최적화 전략

### 원칙: **작업 복잡도 기반 라우팅**

```typescript
if (작업 복잡도 > 임계값) {
  → GCP Functions (무거운 ML/NLP)
} else {
  → Vercel Edge Functions (가벼운 API)
}
```

---

## ✅ 유지할 핵심 기능

### 1. **Korean NLP (한국어 자연어 처리)**

#### 역할

```typescript
// 복잡한 한국어 의도 분석
interface KoreanNLPRequest {
  query: string; // "서버 상태 확인해줘"
  context?: unknown;
}

interface KoreanNLPResponse {
  intent: string; // "server_status_check"
  entities: KoreanNLPEntity[]; // ["서버", "상태"]
  semantic_analysis: {
    main_topic: string;
    urgency_level: 'low' | 'medium' | 'high';
  };
  server_context: {
    target_servers: string[];
    metrics: string[];
  };
}
```

#### 왜 GCP Functions?

- ✅ 복잡한 NLP 모델 (오픈소스 도구)
- ✅ 처리 시간 1-3초 (Vercel 10초 제한 안전)
- ✅ 메모리 사용량 높음 (GCP에서 처리)

#### 최적화

```typescript
// 캐싱 강화 (동일 쿼리 반복 방지)
const cacheKey = `nlp:${query}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await gcpFunctions.koreanNLP(query);
await cache.set(cacheKey, result, 3600); // 1시간 캐싱
```

---

### 2. **ML Analytics (머신러닝 분석)**

#### 역할

```typescript
// 서버 메트릭 이상 탐지 및 예측
interface MLAnalyticsRequest {
  metrics: ServerMetric[];
  context?: {
    analysis_type: 'anomaly' | 'prediction' | 'trend';
  };
}

interface MLAnalyticsResponse {
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
  }>;
  predictions: Array<{
    metric: string;
    next_hour: number;
    confidence: number;
  }>;
}
```

#### 왜 GCP Functions?

- ✅ 통계 분석 (scikit-learn, pandas)
- ✅ 대량 데이터 처리 (17개 서버 × 24시간)
- ✅ CPU 집약적 작업

#### 최적화

```typescript
// 배치 처리 (한 번에 여러 서버 분석)
const batchSize = 5;
const batches = chunk(servers, batchSize);

for (const batch of batches) {
  await gcpFunctions.mlAnalytics({
    metrics: batch.flatMap((s) => s.metrics),
    context: { analysis_type: 'anomaly' },
  });
}
```

---

### 3. **Circuit Breaker + Retry (장애 대응)**

#### 역할

```typescript
// GCP Functions 장애 시 자동 폴백
class ResilientAIClient {
  async callWithFallback(gcpEndpoint: string, vercelFallback: string) {
    try {
      return await this.callGCP(gcpEndpoint);
    } catch (error) {
      // Circuit Breaker 열림
      return await this.callVercel(vercelFallback);
    }
  }
}
```

#### 왜 필요?

- ✅ GCP Functions 콜드 스타트 대응
- ✅ 네트워크 장애 대응
- ✅ 무료 티어 제한 초과 대응

---

## 🗑️ 제거할 불필요한 기능

### 1. **중복된 설정 파일**

```bash
# 현재: 여러 곳에 분산된 설정
src/lib/api-config.ts          # GCP URL
src/lib/gcp/gcp-functions.config.ts  # GCP 설정
src/config/system-components.ts      # 시스템 설정

# 개선: 단일 설정 파일로 통합
src/lib/gcp/gcp-functions.config.ts (유지)
```

### 2. **사용하지 않는 타입**

```typescript
// 제거 대상
export interface UnifiedAIRequest {} // 사용 안 함
export interface UnifiedAIResponse {} // 사용 안 함
```

### 3. **과도한 로깅**

```typescript
// Before: 모든 요청 로깅
debugLog(functionName, 'Starting request', { data });
debugLog(functionName, 'Making HTTP request', { url });
debugLog(functionName, 'Response received', { response });

// After: 에러만 로깅
if (error) {
  console.error('GCP Functions error:', error);
}
```

---

## 🚀 신규 오픈소스 도입 제안

### 1. **TensorFlow.js Lite** (클라이언트 사이드 ML)

#### 용도

```typescript
// 간단한 예측은 브라우저에서 직접 처리
import * as tf from '@tensorflow/tfjs';

async function predictCPU(history: number[]): Promise<number> {
  const model = await tf.loadLayersModel('/models/cpu-predictor.json');
  const prediction = model.predict(tf.tensor2d([history]));
  return prediction.dataSync()[0];
}
```

#### 장점

- ✅ GCP Functions 호출 감소 (비용 절감)
- ✅ 응답 속도 향상 (네트워크 없음)
- ✅ 오프라인 동작 가능

#### 무료 티어 영향

- 번들 크기 +200KB (허용 범위)
- 클라이언트 CPU 사용 (서버 부하 없음)

---

### 2. **LangChain.js** (AI 체인 구성)

#### 용도

```typescript
// 복잡한 AI 워크플로우 구성
import { LLMChain } from 'langchain/chains';

const chain = new LLMChain({
  llm: geminiModel,
  prompt: systemPrompt,
  memory: conversationMemory,
});

const response = await chain.call({ query });
```

#### 장점

- ✅ AI 워크플로우 체계화
- ✅ 프롬프트 관리 용이
- ✅ 메모리 관리 자동화

#### 무료 티어 영향

- 번들 크기 +150KB
- Google AI API 호출 최적화

---

### 3. **Bull Queue** (작업 큐)

#### 용도

```typescript
// 무거운 ML 작업을 큐에 넣고 백그라운드 처리
import Queue from 'bull';

const mlQueue = new Queue('ml-analytics', {
  redis: supabaseRedis, // Supabase Redis 활용
});

mlQueue.process(async (job) => {
  return await gcpFunctions.mlAnalytics(job.data);
});

// 사용
await mlQueue.add({ metrics: serverMetrics });
```

#### 장점

- ✅ 사용자 응답 속도 향상
- ✅ GCP Functions 부하 분산
- ✅ 재시도 자동화

#### 무료 티어 영향

- Supabase Redis 사용 (무료 티어 포함)

---

## 📋 최적화 실행 계획

### Phase 1: 정리 (1-2일)

#### 1.1 불필요한 코드 제거

```bash
# 사용하지 않는 타입 제거
# src/lib/gcp/gcp-functions.types.ts
- UnifiedAIRequest
- UnifiedAIResponse

# 중복 설정 통합
# src/lib/api-config.ts에서 GCP 설정 제거
```

#### 1.2 로깅 최적화

```typescript
// 개발 환경에서만 상세 로깅
if (process.env.NODE_ENV === 'development') {
  debugLog(functionName, 'Request', { data });
}
```

---

### Phase 2: 최적화 (3-5일)

#### 2.1 캐싱 강화

```typescript
// Korean NLP 캐싱
const NLP_CACHE_TTL = 3600; // 1시간

// ML Analytics 캐싱
const ML_CACHE_TTL = 300; // 5분
```

#### 2.2 배치 처리

```typescript
// 여러 서버를 한 번에 분석
async function batchMLAnalysis(servers: Server[]) {
  const batches = chunk(servers, 5);
  return await Promise.all(
    batches.map((batch) => gcpFunctions.mlAnalytics(batch))
  );
}
```

---

### Phase 3: 신규 기능 (1-2주)

#### 3.1 TensorFlow.js Lite 도입

```bash
npm install @tensorflow/tfjs
```

```typescript
// 간단한 예측 모델 구현
// src/lib/ml/client-side-predictor.ts
```

#### 3.2 LangChain.js 도입

```bash
npm install langchain
```

```typescript
// AI 체인 구성
// src/lib/ai/langchain-integration.ts
```

---

## 📊 예상 효과

### 성능 개선

| 항목              | 현재   | 최적화 후    | 개선율 |
| ----------------- | ------ | ------------ | ------ |
| **NLP 응답 시간** | 2-3초  | 0.5초 (캐시) | 75% ↓  |
| **ML 분석 시간**  | 5-8초  | 2-3초 (배치) | 50% ↓  |
| **GCP 호출 수**   | 100/일 | 30/일 (캐싱) | 70% ↓  |

### 비용 효율성

```
GCP Functions 무료 티어: 200만 호출/월
현재 사용: ~3,000 호출/월 (0.15%)
최적화 후: ~1,000 호출/월 (0.05%)

→ 여유분 99.95% 확보
```

---

## 🎯 최종 아키텍처

```
사용자 요청
    ↓
┌─────────────────────────────────────┐
│  Vercel Edge Functions (API Layer)  │
│  - 가벼운 API 처리                   │
│  - 라우팅 및 캐싱                    │
└─────────────────────────────────────┘
    ↓
┌──────────────┬──────────────────────┐
│ 간단한 작업  │  복잡한 작업          │
│ (Vercel)     │  (GCP Functions)     │
├──────────────┼──────────────────────┤
│ • 데이터 조회│ • Korean NLP         │
│ • 간단한 계산│ • ML Analytics       │
│ • 캐시 응답  │ • 이상 탐지          │
└──────────────┴──────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  TensorFlow.js (클라이언트)          │
│  - 간단한 예측                       │
│  - 실시간 분석                       │
└─────────────────────────────────────┘
```

---

## 📝 결론

### 유지할 핵심 기능

1. ✅ **Korean NLP** - 복잡한 한국어 처리
2. ✅ **ML Analytics** - 머신러닝 분석
3. ✅ **Circuit Breaker** - 장애 대응

### 제거할 불필요한 기능

1. 🗑️ 중복 설정 파일
2. 🗑️ 사용하지 않는 타입
3. 🗑️ 과도한 로깅

### 신규 도입 제안

1. 🆕 **TensorFlow.js Lite** - 클라이언트 ML
2. 🆕 **LangChain.js** - AI 체인 구성
3. 🆕 **Bull Queue** - 작업 큐 (선택)

### 예상 효과

- 응답 시간 50-75% 단축
- GCP 호출 70% 감소
- 무료 티어 여유분 99.95% 확보

---

**다음 단계**: Phase 1 정리 작업 시작 → Phase 2 최적화 → Phase 3 신규 기능
