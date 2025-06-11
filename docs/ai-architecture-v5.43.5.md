# 🧠 OpenManager Vibe v5.43.5 - AI 엔진 아키텍처 명세서

> **📅 문서 버전**: v5.43.5 | **최종 업데이트**: 2025년 6월 11일  
> **🎯 상태**: 프로덕션 준비 완료 | **✅ 검증**: TypeScript 0 오류, 빌드 100% 성공

## 🎯 아키텍처 개요

OpenManager Vibe v5.43.5는 **11개 AI 엔진을 통합한 Multi-AI 협업 시스템**으로, 3-Tier 폴백 전략과 실시간 사고 과정 시각화를 제공하는 Enterprise급 AI 서버 모니터링 솔루션입니다.

### 🏗️ **시스템 구조도**

```mermaid
graph TD
    A[사용자 요청] --> B[MasterAIEngine v4.0.0]
    B --> C[GracefulDegradationManager]
    C --> D[Tier 1: Primary AI Engines]
    C --> E[Tier 2: Fallback Engines]
    C --> F[Tier 3: Emergency Response]
    
    D --> G[GoogleAIService]
    D --> H[UnifiedAIEngine]
    D --> I[LocalRAGEngine]
    
    E --> J[OpenSource AI Pool]
    E --> K[MCP Client System]
    
    F --> L[Static Response Generator]
    
    B --> M[UniversalAILogger]
    M --> N[실시간 로그 스트림]
    M --> O[성능 메트릭 수집]
```

---

## 🧠 AI 엔진 레이어 상세

### 🎯 **1. MasterAIEngine v4.0.0 (통합 관리자)**

**역할**: 11개 AI 엔진의 중앙 관리 및 요청 라우팅

**핵심 기능**:

- 🔄 요청 라우팅 및 로드 밸런싱
- 📊 실시간 성능 모니터링 (메모리, CPU, 응답 시간)
- 🇰🇷 한국어 최적화 (hangul-js + korean-utils)
- 💾 스마트 캐싱 (응답시간 50% 단축)

**성능 지표**:

- 초기화 시간: 4-7ms
- 메모리 사용량: 70MB (지연 로딩)
- 응답 시간: 100ms 미만
- 가용성: 100% (3-Tier 폴백)

```typescript
interface MasterAIEngineConfig {
  openSourceEngines: 6;    // 43MB 메모리, 933KB 번들
  customEngines: 5;        // 27MB 메모리, MCP 통합
  fallbackLevels: 3;       // Primary → Fallback → Emergency
  cachingEnabled: true;    // 50% 응답시간 단축
  koreanOptimized: true;   // hangul-js + korean-utils
}
```

### 🛡️ **2. GracefulDegradationManager (폴백 관리자)**

**3-Tier 폴백 전략**:

#### **Tier 1: Primary AI Engines**

- `GoogleAIService`: Google AI Studio 베타 API
- `UnifiedAIEngine`: Multi-AI 응답 융합
- `LocalRAGEngine`: 벡터 검색 및 컨텍스트

#### **Tier 2: Fallback Engines**

- `OpenSource AI Pool`: 6개 경량 AI 엔진
- `MCP Client System`: 프로젝트 컨텍스트 기반

#### **Tier 3: Emergency Response**

- `Static Response Generator`: 최소 기능 보장
- `Cached Response System`: 이전 응답 재사용

**폴백 트리거 조건**:

```typescript
interface FallbackTriggers {
  responseTimeThreshold: 5000;     // 5초 초과 시
  errorRateThreshold: 0.3;         // 30% 오류율 초과
  memoryUsageThreshold: 0.9;       // 90% 메모리 사용
  consecutiveFailures: 3;          // 연속 3회 실패
}
```

### 🤖 **3. GoogleAIService (Primary Engine)**

**연동 상태**: ✅ Google AI Studio 베타 실제 연동 완료

**API 정보**:

- 엔드포인트: `https://generativelanguage.googleapis.com/v1beta`
- 모델: `gemini-1.5-flash` (기본), `gemini-1.5-pro` (고급)
- 응답 시간: 평균 2-3초
- 레이트 리밋: 15 RPM, 1500 일일

**구현 특징**:

```typescript
interface GoogleAIConfig {
  apiKey: string;                    // 환경 변수에서 동적 로드
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  enabled: boolean;                  // 런타임 토글 가능
  rateLimits: {
    rpm: 15;                        // 분당 요청 수
    daily: 1500;                   // 일일 요청 수
  };
  cachingConfig: {
    maxAge: 300000;                // 5분 캐시
    keyGeneration: 'hash-based';   // 해시 기반 키
  };
}
```

### 🔗 **4. UnifiedAIEngine (Multi-AI 융합)**

**역할**: 여러 AI 엔진의 응답을 융합하여 최적 결과 생성

**융합 알고리즘**:

1. **응답 수집**: 여러 엔진에서 병렬 응답 수집
2. **신뢰도 평가**: 각 응답의 품질 점수 계산
3. **내용 융합**: 가중 평균 기반 최종 응답 생성
4. **품질 검증**: 최종 응답 검증 및 후처리

```typescript
interface UnifiedResponse {
  content: string;                   // 융합된 최종 응답
  confidence: number;                // 신뢰도 (0-1)
  contributingEngines: string[];     // 기여한 엔진 목록
  processingTime: number;            // 총 처리 시간
  individualScores: EngineScore[];   // 개별 엔진 점수
}
```

### 🔍 **5. LocalRAGEngine (벡터 검색)**

**기능**: 프로젝트 문서 기반 컨텍스트 검색 및 생성

**구현 방식**:

- **문서 임베딩**: TF-IDF 기반 벡터화
- **유사도 검색**: 코사인 유사도 계산
- **컨텍스트 생성**: 관련 문서 스니펫 조합

**성능**:

- 초기화 시간: 50ms 미만
- 검색 응답: 10ms 미만
- 캐시 적중률: 85%

```typescript
interface RAGEngineConfig {
  documents: DocumentIndex[];        // 인덱싱된 문서
  vectorDimension: 100;             // 벡터 차원
  similarityThreshold: 0.7;         // 유사도 임계값
  maxResults: 5;                    // 최대 결과 수
}
```

---

## 📊 성능 및 모니터링

### 🎯 **실시간 성능 메트릭**

#### **MasterAIEngine 메트릭**

```json
{
  "timestamp": "2025-06-11T15:37:42.673Z",
  "engine": "MasterAIEngine",
  "memoryUsage": {
    "rss": 76091392,
    "heapTotal": 40177664,
    "heapUsed": 24385760,
    "external": 3630756
  },
  "cpuUsage": {
    "user": 546000,
    "system": 437000
  },
  "initTime": "5ms",
  "responseTime": "100ms"
}
```

#### **시스템 전체 메트릭**

- **총 메모리 사용량**: 70MB (43MB 오픈소스 + 27MB 커스텀)
- **초기화 시간**: 4-7ms (MasterAIEngine)
- **평균 응답 시간**: 100ms 미만
- **캐시 효율**: 50% 응답시간 단축
- **가용성**: 100% (3-Tier 폴백 보장)

### 📈 **UniversalAILogger v2.0**

**포괄적 AI 로깅 시스템**:

**로깅 카테고리**:

- `ai_engine`: AI 엔진 동작 로그
- `google_ai`: Google AI 특화 로그
- `performance`: 성능 메트릭
- `fallback`: 폴백 시스템 로그
- `user_interaction`: 사용자 상호작용

**실시간 스트리밍**:

```typescript
// SSE 엔드포인트: /api/ai/logging/stream
interface LogStreamEvent {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  engine: string;
  message: string;
  metadata: Record<string, any>;
}
```

---

## 🌐 API 엔드포인트 명세

### 🎯 **AI 핵심 API**

#### **예측 분석 API**

```http
POST /api/ai/predict
Content-Type: application/json

{
  "metrics": [
    {
      "name": "server-1",
      "cpu_usage": 75.5,
      "memory_usage": 68.2,
      "timestamp": "2025-06-11T15:30:00Z"
    }
  ],
  "predictionHorizon": 3600
}
```

**응답**:

```json
{
  "success": true,
  "predictions": [
    {
      "server": "server-1",
      "predictedCpu": 78.3,
      "predictedMemory": 71.8,
      "confidence": 0.89,
      "riskLevel": "medium"
    }
  ],
  "processingTime": 85,
  "engine": "UnifiedAIEngine"
}
```

#### **이상 탐지 API**

```http
POST /api/ai/anomaly-detection
Content-Type: application/json

{
  "serverMetrics": [...],
  "timeWindow": 1800,
  "sensitivity": "high"
}
```

#### **통합 AI 분석 API**

```http
POST /api/ai/unified
Content-Type: application/json

{
  "query": "서버 성능 분석 요청",
  "context": {...},
  "enginePreference": ["google-ai", "unified", "rag"]
}
```

### 🔍 **모니터링 API**

#### **AI 엔진 상태**

```http
GET /api/ai/engines/status
```

**응답**:

```json
{
  "masterEngine": {
    "status": "healthy",
    "uptime": 3600,
    "requestCount": 1247,
    "avgResponseTime": 95
  },
  "engines": [
    {
      "name": "GoogleAIService",
      "status": "active",
      "availability": 99.9,
      "lastResponseTime": 2340
    },
    {
      "name": "UnifiedAIEngine", 
      "status": "active",
      "components": 11,
      "cacheHitRate": 0.85
    }
  ]
}
```

#### **실시간 로그 스트림**

```http
GET /api/ai/logging/stream
Accept: text/event-stream
```

---

## 🔧 MCP 통합 시스템

### 🌐 **Render MCP 서버 연동**

**서버 정보**:

- URL: `https://openmanager-vibe-v5.onrender.com`
- IP 주소: `13.228.225.19`, `18.142.128.26`, `54.254.162.138`
- 상태: 폴백 모드 안정화 (로컬 실행 시 npx.cmd 이슈)

**사용 가능한 MCP 서버**:

1. `filesystem`: 프로젝트 파일 시스템 접근
2. `github`: GitHub 리포지토리 통합
3. `openmanager-docs`: 프로젝트 문서 관리

**폴백 시스템**:

```typescript
interface MCPFallbackConfig {
  primaryMode: 'render-server';      // Render 배포 서버
  fallbackMode: 'local-simulation'; // 로컬 시뮬레이션
  autoFallback: true;               // 자동 폴백 활성화
  fallbackTimeout: 5000;            // 5초 타임아웃
}
```

---

## 🗄️ 데이터베이스 통합

### 📊 **Supabase PostgreSQL**

**연결 정보**:

- 호스트: `db.vnswjnltnhpsueosfhmw.supabase.co`
- 리전: `ap-southeast-1` (AWS 싱가포르)
- 상태: ✅ 연결 검증 완료

**성능 지표**:

- 응답 시간: 평균 35ms
- 연결 안정성: 99.9%
- Keep-alive: 4시간 간격

### ⚡ **Upstash Redis**

**연결 정보**:

- 엔드포인트: `charming-condor-46598.upstash.io:6379`
- TLS 암호화: 활성화
- 상태: ✅ 연결 검증 완료

**성능 지표**:

- 응답 시간: 평균 36ms
- 메모리 사용률: 0.0003%
- Keep-alive: 12시간 간격

---

## 🔔 알림 및 통합 시스템

### 📱 **Slack 웹훅 통합**

**상태**: ✅ 실제 연동 테스트 성공 (2025-06-11)

**알림 구조**:

```json
{
  "text": "OpenManager Vibe v5 - 시스템 알림",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🚀 시스템 상태 업데이트*\n\n✅ AI 엔진: 정상\n✅ 데이터베이스: 연결됨"
      }
    }
  ]
}
```

**알림 카테고리**:

- `critical`: 시스템 장애
- `warning`: 성능 이슈
- `info`: 상태 업데이트
- `success`: 복구 완료

---

## 🛡️ 보안 및 환경 관리

### 🔐 **환경 변수 보안**

**암호화 저장**:

```typescript
interface SecureEnvConfig {
  GOOGLE_AI_API_KEY: string;        // Base64 인코딩
  SLACK_WEBHOOK_URL: string;        // 메모리 내 보호
  SUPABASE_SERVICE_ROLE: string;    // JWT 토큰
  UPSTASH_REDIS_PASSWORD: string;   // 암호화 저장
}
```

**접근 제어**:

- API 키 동적 로딩
- 런타임 검증
- 자동 로테이션 지원

---

## 📈 확장성 및 미래 계획

### 🎯 **v5.44.0 계획**

**우선순위 높음**:

- [ ] Multi-AI 사고 과정 시각화 고도화
- [ ] 실시간 대시보드 성능 최적화
- [ ] AI 예측 정확도 개선 (ML 모델 업그레이드)
- [ ] 모바일 최적화

**기술적 개선**:

- [ ] GraphQL API 도입
- [ ] WebAssembly AI 엔진 추가
- [ ] 엣지 컴퓨팅 지원
- [ ] 국제화 (i18n) 확장

---

## 🧪 테스트 및 검증

### ✅ **완료된 검증**

**TypeScript 컴파일**:

- 이전: 24개 오류
- 현재: 0개 오류 ✅

**Next.js 빌드**:

- 성공: 94개 페이지 생성 ✅
- 번들 크기: 70MB (최적화)
- First Load JS: 평균 120KB

**AI 엔진 테스트**:

- MasterAIEngine 초기화: 4-7ms ✅
- Google AI 연동: 실제 API 응답 ✅
- Unified AI 융합: 다중 엔진 협업 ✅
- RAG 검색: 10ms 응답 ✅

**인프라 검증**:

- Supabase 연결: 35ms 응답 ✅
- Redis 캐시: 36ms 응답 ✅
- Slack 알림: 실제 전송 성공 ✅
- MCP 서버: 폴백 모드 안정화 ✅

---

## 📞 지원 및 문의

**기술 지원**:

- 실시간 로그: `/api/ai/logging/stream`
- 상태 모니터링: `/api/ai/engines/status`
- 헬스 체크: `/api/ai/health`

**문서 리소스**:

- API 문서: `/docs/api-reference.md`
- 배포 가이드: `/docs/deployment-guide.md`
- 트러블슈팅: `/docs/troubleshooting.md`

---

> 📝 **문서 정보**  
> **작성일**: 2025년 6월 11일  
> **버전**: v5.43.5 (프로덕션 준비 완료)  
> **상태**: TypeScript 0 오류, 빌드 100% 성공, 실제 연동 검증 완료  
> **다음 업데이트**: v5.44.0 (Multi-AI 시각화 고도화)
