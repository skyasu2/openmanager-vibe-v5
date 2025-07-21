# 🤖 AI 시스템 통합 가이드 v5.45.0

## 📋 목차

1. [개요](#개요)
2. [2-Mode 시스템](#2-mode-시스템)
3. [API 사용법](#api-사용법)
4. [성능 최적화](#성능-최적화)
5. [문제 해결](#문제-해결)
6. [마이그레이션 가이드](#마이그레이션-가이드)

---

## 🎯 개요

OpenManager Vibe v5.45.0은 **Edge Runtime 최적화된 2-Mode AI 시스템**으로, 단순화된 아키텍처를 통해 높은 성능과 안정성을 제공합니다.

### 핵심 특징

- **2-Mode 시스템**: LOCAL (기본) / GOOGLE_ONLY (자연어 전용)
- **Edge Runtime 최적화**: Vercel 환경에 최적화된 성능
- **통합 라우터**: UnifiedAIEngineRouter v5.45.0
- **Supabase RAG 우선**: 벡터 검색 기반 고성능 처리
- **Google AI 조건부**: 환경변수 기반 선택적 활성화
- **캐싱 시스템**: Edge Runtime 캐시로 성능 향상

### 성능 지표

| 지표           | LOCAL 모드 | GOOGLE_ONLY 모드 |
| -------------- | ---------- | ---------------- |
| 평균 응답 시간 | 100-300ms  | 500-2000ms       |
| 정확도         | 95%        | 98%              |
| 가동률         | 99.9%      | 99.5%            |
| 비용           | 무료       | 할당량 제한      |

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 요청 처리 흐름                        │
├─────────────────────────────────────────────────────────────┤
│ 1. 요청 분석 → 2. 캐시 확인 → 3. 모드 선택 → 4. 엔진 처리  │
└─────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼───────┐           ┌──────────▼──────────┐
        │  Google AI    │           │   Local Engines     │
        │   (자연어)    │           │                     │
        └───────────────┘           ├─────────────────────┤
                                    │ • Supabase RAG      │
                                    │ • Korean AI Engine  │
                                    │ • MCP Context       │
                                    └─────────────────────┘
```

---

## 🎯 2-Mode 시스템

### 1. LOCAL 모드 (기본값) 🏠

**특징:**

- ✅ Supabase RAG 우선 처리
- ✅ Korean AI Engine 폴백
- ✅ MCP Context 지원
- ✅ 무료 사용 가능
- ✅ 개인정보 보호
- ✅ 오프라인 부분 지원

**처리 순서:**

1. Supabase RAG Engine (벡터 검색)
2. Korean AI Engine (한국어 특화)
3. MCP Context (컨텍스트 기반)

### 2. GOOGLE_ONLY 모드 🚀

**특징:**

- ✅ 자연어 질의 전용
- ✅ Gemini 2.0 Flash 모델
- ✅ 고급 추론 능력
- ⚠️ 할당량 제한 (일일 1,000회, 분당 12회)
- ⚠️ 환경변수 의존성

**처리 순서:**

1. Google AI Service (Gemini)
2. 폴백 없음 (명확한 에러 반환)

### 모드 선택 방법

#### 환경변수 설정

```bash
# Google AI 활성화 (GOOGLE_ONLY 모드 사용 가능)
GOOGLE_AI_ENABLED=true

# Google AI 비활성화 (LOCAL 모드만 사용)
GOOGLE_AI_ENABLED=false
```

#### 프로그래밍 방식

```typescript
// API 호출 시 모드 지정
const response = await fetch('/api/ai/unified-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '질문',
    mode: 'LOCAL', // 또는 'GOOGLE_ONLY'
  }),
});
```

---

## 📡 API 사용법

### 통합 API 엔드포인트

```typescript
// POST /api/ai/unified-query
interface AIRequest {
  query: string;
  mode?: 'LOCAL' | 'GOOGLE_ONLY';
  context?: any;
  options?: {
    useCache?: boolean;
    timeout?: number;
  };
}

interface AIResponse {
  success: boolean;
  response: string;
  mode: 'LOCAL' | 'GOOGLE_ONLY';
  enginePath: string[];
  processingTime: number;
  confidence: number;
  metadata: {
    mainEngine: string;
    ragUsed: boolean;
    googleAIUsed: boolean;
  };
}
```

### 사용 예시

#### LOCAL 모드 (기본)

```typescript
const response = await fetch('/api/ai/unified-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '서버 CPU 사용률이 높은데 어떻게 해결하나요?',
    mode: 'LOCAL',
  }),
});

const result = await response.json();
console.log(result.response); // Supabase RAG 기반 응답
```

#### GOOGLE_ONLY 모드

```typescript
const response = await fetch('/api/ai/unified-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '복잡한 시스템 아키텍처에 대한 분석을 해주세요',
    mode: 'GOOGLE_ONLY',
  }),
});

const result = await response.json();
console.log(result.response); // Google AI 기반 응답
```

### 에러 처리

```typescript
try {
  const response = await fetch('/api/ai/unified-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '질문' }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    console.error('AI 처리 실패:', result.error);
  }
} catch (error) {
  console.error('API 호출 실패:', error);
}
```

---

## ⚡ 성능 최적화

### Edge Runtime 최적화

```typescript
// src/config/vercel-edge-config.ts
export const getVercelConfig = () => ({
  isVercel: process.env.VERCEL === '1',
  enableGoogleAI: process.env.GOOGLE_AI_ENABLED === 'true',
  maxTimeout: 8000, // Vercel 8초 제한
  enableCaching: true,
  logLevel: 'warn',
});
```

### 캐싱 전략

- **Edge Runtime 캐시**: 5분 TTL
- **쿼리 기반 캐시 키**: 해시 기반
- **모드별 캐시 분리**: LOCAL/GOOGLE_ONLY
- **자동 캐시 무효화**: 설정 변경 시

### 성능 모니터링

```typescript
// 성능 통계
interface PerformanceStats {
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  modeUsage: {
    LOCAL: number;
    GOOGLE_ONLY: number;
  };
}
```

### 최적화 팁

1. **LOCAL 모드 우선 사용**: 빠른 응답과 무료 사용
2. **캐시 활성화**: 반복 질의 성능 향상
3. **타임아웃 설정**: 적절한 응답 시간 제한
4. **에러 처리**: 명확한 폴백 전략

---

## 🔧 문제 해결

### 일반적인 문제

#### 1. Google AI 할당량 초과

```bash
# 환경변수 확인
echo $GOOGLE_AI_ENABLED

# LOCAL 모드로 전환
GOOGLE_AI_ENABLED=false
```

#### 2. Supabase RAG 연결 실패

```typescript
// 연결 상태 확인
const status = await fetch('/api/ai/status');
const health = await status.json();
console.log('RAG 엔진 상태:', health.supabaseRAG);
```

#### 3. 응답 시간 초과

```typescript
// 타임아웃 설정
const response = await fetch('/api/ai/unified-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '질문',
    options: { timeout: 5000 }, // 5초 타임아웃
  }),
});
```

### 디버깅

#### 로그 확인

```bash
# 개발 환경 로그
npm run dev

# 프로덕션 로그 (Vercel)
vercel logs
```

#### 상태 확인

```typescript
// 시스템 상태 확인
const status = await fetch('/api/ai/status');
const systemStatus = await status.json();

console.log('AI 엔진 상태:', systemStatus);
console.log('활성 엔진:', systemStatus.activeEngines);
console.log('실패한 엔진:', systemStatus.failedEngines);
```

### 성능 튜닝

#### 캐시 최적화

```typescript
// 캐시 설정 조정
const response = await fetch('/api/ai/unified-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '질문',
    options: { useCache: true },
  }),
});
```

#### 모드 선택 가이드

- **LOCAL 모드**: 일반적인 질의, 빠른 응답 필요
- **GOOGLE_ONLY 모드**: 복잡한 자연어 분석, 고급 추론 필요

---

## 🔄 마이그레이션 가이드

### v5.44.x → v5.45.0

#### 주요 변경사항

1. **3-Tier 시스템 제거**: 2-Mode 시스템으로 단순화
2. **UnifiedAIEngineRouter 통합**: 모든 AI 처리를 통합 라우터로
3. **Edge Runtime 최적화**: Vercel 환경에 최적화
4. **캐싱 시스템 개선**: Edge Runtime 캐시 활용

#### 마이그레이션 단계

1. **환경변수 업데이트**

```bash
# 기존
THREE_TIER_AI_ENABLED=true
THREE_TIER_STRATEGY=performance

# 새로운 설정
GOOGLE_AI_ENABLED=true  # Google AI 사용 시
```

2. **API 호출 업데이트**

```typescript
// 기존
const response = await fetch('/api/ai/three-tier', { ... });

// 새로운
const response = await fetch('/api/ai/unified-query', { ... });
```

3. **응답 형식 확인**

```typescript
// 새로운 응답 형식
interface AIResponse {
  success: boolean;
  response: string;
  mode: 'LOCAL' | 'GOOGLE_ONLY';
  enginePath: string[];
  processingTime: number;
  confidence: number;
  metadata: {
    mainEngine: string;
    ragUsed: boolean;
    googleAIUsed: boolean;
  };
}
```

### 환경변수 설정

```bash
# 필수 환경변수
GOOGLE_AI_ENABLED=false  # 기본값: LOCAL 모드만 사용
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 선택적 환경변수
GOOGLE_AI_API_KEY=your-google-ai-key  # GOOGLE_ONLY 모드 사용 시
```

---

## 📚 추가 자료

- [AI 시스템 완전 가이드](./ai-complete-guide.md) - 핵심 개념과 개요
- [시스템 아키텍처](./system-architecture.md) - 전체 시스템 구조
- [GCP 완전 가이드](./gcp-complete-guide.md) - 클라우드 서비스 활용
- [배포 완전 가이드](./deployment-complete-guide.md) - 배포 및 운영
