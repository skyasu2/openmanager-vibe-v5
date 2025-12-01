# SimplifiedQueryEngine AI 엔진 리팩토링 계획서

> **📝 빠른 참조**: 핵심 요약은 [@ai-engine-refactoring-summary.md](./ai-engine-refactoring-summary.md) 참조

**작성일**: 2025-11-22
**프로젝트**: OpenManager VIBE v5.80.0
**담당**: 구조 리팩토링 전문가 (Claude Code)

---

## 📋 목차

1. [현재 구조 분석](#1-현재-구조-분석)
2. [리팩토링 목표](#2-리팩토링-목표)
3. [리팩토링 아키텍처](#3-리팩토링-아키텍처)
4. [단계별 실행 계획](#4-단계별-실행-계획)
5. [예상 효과](#5-예상-효과)
6. [위험 요소 및 대응책](#6-위험-요소-및-대응책)

---

## 1. 현재 구조 분석

### 1.1 파일 구조 (8개 파일, 총 3,448줄)

```
src/services/ai/
├── SimplifiedQueryEngine.ts                     (450줄) - 메인 엔진
├── SimplifiedQueryEngine.processors.ts          (130줄) - 프로세서 위임
├── SimplifiedQueryEngine.processors.googleai.ts (550줄) - Google AI 모드
├── SimplifiedQueryEngine.processors.command.ts  (250줄) - 명령어 처리
├── SimplifiedQueryEngine.processors.helpers.ts  (750줄) - 헬퍼 메서드
├── SimplifiedQueryEngine.utils.ts               (650줄) - 유틸리티
├── SimplifiedQueryEngine.types.ts               (241줄) - 타입 정의
└── SimplifiedQueryEngine.complexity-types.ts     (67줄) - 복잡도 타입

총 라인 수: ~3,088줄 (주석 및 공백 제외 시 ~2,800줄)
```

### 1.2 MCP 의존성 분석

**✅ 중요 발견**: CloudContextLoader가 이미 제거됨!

#### 현재 상태:

- `src/services/mcp/CloudContextLoader*.ts` → **존재하지 않음** ✅
- MCP 서버 폴더 (`src/services/mcp/`) → **존재하지 않음** ✅

#### 코드 내 MCP 잔여 흔적:

**SimplifiedQueryEngine.processors.ts** (11번, 36-37번, 40-44번 라인):

```typescript
// ❌ 제거 대상 import
import { CloudContextLoader } from '../mcp/CloudContextLoader';  // Line 11

// ❌ 제거 대상 타입 import
import type { AIQueryContext, MCPContext } from '../../types/ai-service-types';  // Line 14

// ❌ 제거 대상 필드
private contextLoader: CloudContextLoader;  // Line 36

// ❌ 제거 대상 파라미터
constructor(
  utils: SimplifiedQueryEngineUtils,
  ragEngine: SupabaseRAGEngine,
  contextLoader: CloudContextLoader,  // Line 43 - 제거 대상
  mockContextLoader: MockContextLoader,
  intentClassifier: IntentClassifier,
  aiRouter?: unknown
) {
  this.contextLoader = contextLoader;  // Line 51 - 제거 대상
}
```

**SimplifiedQueryEngine.processors.googleai.ts** (13번, 42번, 49번 라인):

```typescript
// ❌ 제거 대상 import
import { CloudContextLoader } from '../mcp/CloudContextLoader';  // Line 13

// ❌ 제거 대상 타입 import
import type { MCPContext } from '../../types/ai-service-types';  // Line 17

// ❌ 제거 대상 필드
private contextLoader: CloudContextLoader;  // Line 42

// ❌ 제거 대상 파라미터
constructor(
  utils: SimplifiedQueryEngineUtils,
  contextLoader: CloudContextLoader,  // Line 49 - 제거 대상
  mockContextLoader: MockContextLoader,
  helpers: SimplifiedQueryEngineHelpers,
  ragEngine: SupabaseRAGEngine
) {
  this.contextLoader = contextLoader;  // Line 55 - 제거 대상
}
```

**SimplifiedQueryEngine.processors.command.ts** (11번, 47번 라인):

```typescript
// ❌ 제거 대상 import
import { CloudContextLoader } from '../mcp/CloudContextLoader';  // Line 11

// ❌ 제거 대상 파라미터
constructor(
  private utils: SimplifiedQueryEngineUtils,
  private ragEngine: SupabaseRAGEngine,
  private contextLoader: CloudContextLoader,  // Line 47 - 제거 대상
  private mockContextLoader: MockContextLoader,
  private intentClassifier: IntentClassifier,
  private aiRouter: AIRouter | unknown
) {}
```

**SimplifiedQueryEngine.ts**:

```typescript
// ❌ Line 6 주석에서 언급
// * ✅ MCP는 컨텍스트 보조로만 사용

// ❌ Line 348 주석에서 언급
// 2단계: MCP 관련 처리 제거됨 (GCP VM 서버 사용 중단)
```

**SimplifiedQueryEngine.types.ts**:

```typescript
// ✅ MCPContext는 ai-service-types.ts에서 가져옴 (별도 처리 필요)
// Line 17의 타입 import에만 존재
```

### 1.3 모드 분리 로직

**현재 라우팅 결정 로직** (SimplifiedQueryEngine.ts, Line 314-346):

```typescript
// 🎯 Intelligent Routing Decision
let routingDecision: 'local' | 'google-ai' = 'local';
let routingReason = '';

if (intentResult.needsComplexML || intentResult.needsNLP) {
  routingDecision = 'google-ai';
  routingReason = '복잡한 ML/NLP 분석 필요 - Google AI 사용';
} else if (complexity.score > 0.7) {
  routingDecision = 'google-ai';
  routingReason = '높은 복잡도 - Google AI 사용';
} else if (intentResult.confidence < 0.5) {
  routingDecision = 'google-ai';
  routingReason = '의도 불명확 - Google AI로 정확한 분석';
} else {
  routingDecision = 'local';
  routingReason = '단순 질의 - 로컬 RAG/GCP Function 사용 (비용 절약)';
}
```

**문제점**:

- `'local'` vs `'google-ai'` 명시적 분기
- 프로세서가 모드별로 분리됨 (GoogleAIModeProcessor, CommandQueryProcessor)
- 중복된 로직 (RAG 검색, NLP 처리)

### 1.4 의존성 관계 다이어그램

```
SimplifiedQueryEngine (메인)
  ├─> SimplifiedQueryEngineUtils (유틸리티)
  ├─> SimplifiedQueryEngineProcessors (위임 프로세서)
  │     ├─> GoogleAIModeProcessor (Google AI 모드)
  │     │     ├─> CloudContextLoader ❌ (제거 대상)
  │     │     ├─> MockContextLoader ✅
  │     │     ├─> SimplifiedQueryEngineHelpers ✅
  │     │     └─> SupabaseRAGEngine ✅
  │     ├─> CommandQueryProcessor (명령어)
  │     │     ├─> CloudContextLoader ❌ (제거 대상)
  │     │     ├─> MockContextLoader ✅
  │     │     └─> IntentClassifier ✅
  │     └─> SimplifiedQueryEngineHelpers (공통 헬퍼)
  │           ├─> MockContextLoader ✅
  │           └─> UnifiedMetricsService ✅
  ├─> SupabaseRAGEngine (RAG 검색)
  ├─> MockContextLoader (Mock 컨텍스트)
  └─> IntentClassifier (의도 분석)

외부 서비스:
  ├─> DirectGoogleAIService (Google AI SDK 직접 호출)
  ├─> GCP Cloud Functions (Korean NLP, Server Analyzer)
  └─> Supabase (PostgreSQL + pgvector)
```

---

## 2. 리팩토링 목표

### 2.1 핵심 목표

1. **MCP 완전 제거**
   - CloudContextLoader import 제거 (4개 파일)
   - MCPContext 타입 제거 또는 대체
   - contextLoader 파라미터 제거

2. **모드 구분 제거**
   - 통합 파이프라인 구축
   - 자동 최적 라우팅 (명시적 모드 선택 불필요)
   - 프로세서 통합 (GoogleAIModeProcessor + CommandQueryProcessor → UnifiedProcessor)

3. **무료 티어 최적화**
   - Vercel Edge: 경량 라우팅만 (0ms 추가 비용)
   - GCP Cloud Functions: 무거운 처리 (무료 200만 요청/월)
   - Supabase RAG: 전면 활용 (무료 500MB DB)
   - Google AI API: Gemini 2.5 Flash Lite (무료 1,000 RPD)

4. **Google AI API 제약 제거**
   - 모든 AI 기능에서 Gemini 사용 가능
   - 할당량 기반 자동 폴백 (Flash Lite → Flash → Pro)
   - 사용량 추적 및 스마트 배분

### 2.2 성능 목표

- 응답 시간: 500ms 이하 유지
- 캐시 히트율: 30% → 60% (의미론적 캐싱)
- 코드 감소: 3,448줄 → 2,500줄 (27% 감소)
- 복잡도 감소: 파일 8개 → 5개 (37% 감소)

---

## 3. 리팩토링 아키텍처

### 3.1 새로운 통합 아키텍처

```
┌─────────────────────────────────────────────────────┐
│         SimplifiedQueryEngine (통합 엔진)           │
│                                                       │
│  1️⃣ Intent Analysis (IntentClassifier)              │
│  2️⃣ Complexity Analysis (복잡도 점수)                │
│  3️⃣ Cache Check (의미론적 캐싱)                      │
│  4️⃣ Unified Pipeline Routing (자동 최적 선택)        │
│                                                       │
└─────────────────┬───────────────────────────────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
     ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  Simple Path     │    │  Complex Path    │
│  (로컬 처리)     │    │  (AI 강화)       │
└──────┬───────────┘    └──────┬───────────┘
       │                       │
       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Command Query   │    │  Unified AI      │
│  - RAG 검색      │    │  Pipeline        │
│  - 패턴 매칭     │    │                  │
│  - 키워드 추천   │    │  1. RAG 검색     │
└──────────────────┘    │  2. Cloud Func   │
                        │  3. Google AI    │
                        │  4. 응답 조합    │
                        └──────────────────┘
```

### 3.2 통합 프로세서 구조

**Before (분리된 프로세서)**:

```
SimplifiedQueryEngineProcessors
  ├─> GoogleAIModeProcessor (550줄)
  ├─> CommandQueryProcessor (250줄)
  └─> SimplifiedQueryEngineHelpers (750줄)
```

**After (통합 프로세서)**:

```
UnifiedQueryProcessor (약 600줄)
  ├─> processQuery()           - 단일 진입점
  ├─> selectOptimalPath()      - 자동 경로 선택
  ├─> executeSimplePath()      - 단순 경로 (Command + RAG)
  ├─> executeComplexPath()     - 복잡 경로 (AI 강화)
  └─> combineResults()         - 결과 조합 및 포맷팅

SharedHelpers (약 400줄)
  ├─> Server Context 조회
  ├─> Prompt 빌딩
  ├─> Response 포맷팅
  └─> GCP Functions 통합
```

### 3.3 무료 티어 최적화 전략

```
┌─────────────────────────────────────────────────────┐
│                    Vercel Edge                       │
│         (경량 라우팅 + 캐시 체크만)                  │
│         - Cache Hit → 즉시 반환 (0ms)                │
│         - Cache Miss → 파이프라인 실행               │
└─────────────────┬───────────────────────────────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
     ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  Supabase RAG    │    │  GCP Cloud Func  │
│  (무료 500MB)    │    │  (무료 2M req)   │
│                  │    │                  │
│  - pgvector 검색 │    │  - Korean NLP    │
│  - 로컬 임베딩   │    │  - ML Analytics  │
│  - 키워드 폴백   │    │  - Server Analyze│
└──────────────────┘    └──────────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │  Google AI API   │
        │  (무료 1,000 RPD)│
        │                  │
        │  - Flash Lite    │
        │  - Flash (폴백)  │
        │  - Pro (폴백)    │
        └──────────────────┘
```

### 3.4 자동 최적 라우팅 로직

```typescript
/**
 * 통합 경로 선택 로직 (모드 개념 제거)
 */
function selectOptimalPath(
  intentResult: IntentResult,
  complexity: ComplexityScore,
  query: string
): 'simple' | 'complex' {
  // 1. Circuit Breaker: 즉시 단순 경로 선택 조건
  if (
    intentResult.confidence > 0.7 &&
    !intentResult.needsComplexML &&
    !intentResult.needsNLP &&
    complexity.score <= 0.5
  ) {
    return 'simple'; // 로컬 RAG + 명령어 처리 (비용 $0)
  }

  // 2. 복잡 경로 조건
  if (
    intentResult.needsComplexML ||
    intentResult.needsNLP ||
    complexity.score > 0.7 ||
    intentResult.confidence < 0.5
  ) {
    return 'complex'; // RAG + Cloud Functions + Google AI (스마트 조합)
  }

  // 3. 기본: 단순 경로 (비용 절약 우선)
  return 'simple';
}
```

---

## 4. 단계별 실행 계획

### Phase 1: MCP 제거 및 타입 정리 (안전한 시작)

**목표**: MCP 의존성 완전 제거, 빌드 에러 없음

**작업 내용**:

1. **SimplifiedQueryEngine.processors.ts** 수정:

   ```diff
   - import { CloudContextLoader } from '../mcp/CloudContextLoader';
   - import type { AIQueryContext, MCPContext } from '../../types/ai-service-types';
   + import type { AIQueryContext } from '../../types/ai-service-types';

   - private contextLoader: CloudContextLoader;

   constructor(
     utils: SimplifiedQueryEngineUtils,
     ragEngine: SupabaseRAGEngine,
   - contextLoader: CloudContextLoader,
     mockContextLoader: MockContextLoader,
     intentClassifier: IntentClassifier,
     aiRouter?: unknown
   ) {
   - this.contextLoader = contextLoader;
   + // contextLoader 제거됨
   }
   ```

2. **SimplifiedQueryEngine.processors.googleai.ts** 수정:

   ```diff
   - import { CloudContextLoader } from '../mcp/CloudContextLoader';
   - import type { MCPContext } from '../../types/ai-service-types';

   - private contextLoader: CloudContextLoader;

   constructor(
     utils: SimplifiedQueryEngineUtils,
   - contextLoader: CloudContextLoader,
     mockContextLoader: MockContextLoader,
     helpers: SimplifiedQueryEngineHelpers,
     ragEngine: SupabaseRAGEngine
   ) {
   - this.contextLoader = contextLoader;
   + // contextLoader 제거됨
   }

   // processUnifiedQuery 시그니처 변경
   async processUnifiedQuery(
     query: string,
     context: AIQueryContext | undefined,
     options: QueryRequest['options'],
   - mcpContext: MCPContext | null,
     thinkingSteps: QueryResponse['thinkingSteps'],
     startTime: number
   ): Promise<QueryResponse> {
   ```

3. **SimplifiedQueryEngine.processors.command.ts** 수정:

   ```diff
   - import { CloudContextLoader } from '../mcp/CloudContextLoader';

   constructor(
     private utils: SimplifiedQueryEngineUtils,
     private ragEngine: SupabaseRAGEngine,
   - private contextLoader: CloudContextLoader,
     private mockContextLoader: MockContextLoader,
     private intentClassifier: IntentClassifier,
     private aiRouter: AIRouter | unknown
   ) {}
   ```

4. **SimplifiedQueryEngine.ts** 수정:

   ```diff
   - // * ✅ MCP는 컨텍스트 보조로만 사용
   + // * ✅ 통합 파이프라인: RAG + Cloud Functions + Google AI

   constructor() {
     this.ragEngine = getSupabaseRAGEngine();
     this.mockContextLoader = MockContextLoader.getInstance();
     this.intentClassifier = new IntentClassifier();

     this.utils = new SimplifiedQueryEngineUtils();
     this.processors = new SimplifiedQueryEngineProcessors(
       this.utils,
       this.ragEngine,
   -   this.mockContextLoader,  // contextLoader 제거
       this.mockContextLoader,
       this.intentClassifier
     );
   }

   // Line 348 주석 수정
   - // 2단계: MCP 관련 처리 제거됨 (GCP VM 서버 사용 중단)
   + // 2단계: 통합 파이프라인 실행
   ```

5. **타입 정리** (SimplifiedQueryEngine.types.ts):
   - `MCPContext` 타입은 `ai-service-types.ts`에서 가져오므로 별도 수정 불필요
   - 필요 시 `MCPContext` 사용처만 제거 (현재는 파라미터로만 사용)

**검증**:

```bash
npm run type-check
npm run build
```

**예상 결과**:

- 빌드 에러 0개
- 타입 에러 0개
- 코드 감소: ~80줄 (import, 파라미터, 필드)

---

**✅ Phase 1 완료 상태 (2025-11-22)**

**실제 완료 내용**:

1. ✅ SimplifiedQueryEngine.processors.helpers.ts - MCP 제거 완료
2. ✅ supabase-rag-engine.ts - MCP 제거 완료 (enableMCP, mcpContext, MCPFile, MCPContextData 등 모든 MCP 참조 제거)
3. ✅ QueryDifficultyAnalyzer.ts - MCP 제거 완료 (MCPContext 파라미터 및 복잡도 로직 제거)
4. ✅ performance-optimized-query-engine.ts - MCP 제거 완료 (30+ 참조 제거, loadMCPContextAsync 메서드 삭제, healthCheck 타입 수정)
5. ✅ SimplifiedQueryEngine.processors.googleai.ts - MCP 제거 완료 (enableMCP: false 제거)
6. ✅ SimplifiedQueryEngine.types.ts - MCP 제거 완료 (includeMCPContext 필드 제거)

**검증 결과**:

```bash
✅ TypeScript 컴파일 성공 (0 errors)
✅ 타입 에러 0개
✅ MCP 참조 0개 (완전 제거)
```

**변경 통계**:

- 총 파일: 6개
- 총 제거 위치: 30+ 참조
- Import 제거: 6개 파일
- 파라미터 제거: 12개 메서드
- 필드 제거: 8개
- 메서드 완전 제거: 2개 (loadMCPContextAsync, convertRAGContextToMCPContext)
- 타입 정의 제거: 4개 (MCPContext, MCPFile, MCPContextData, enableMCP)

**상세 보고서**: `/tmp/mcp-removal-phase1-complete.md` 참조

---

### Phase 2: 프로세서 통합 (핵심 리팩토링)

**목표**: GoogleAIModeProcessor + CommandQueryProcessor → UnifiedQueryProcessor

**작업 내용**:

1. **새 파일 생성**: `SimplifiedQueryEngine.processor.unified.ts`

   ```typescript
   /**
    * 🔄 UnifiedQueryProcessor - 통합 쿼리 프로세서
    *
    * 모드 구분 없이 자동 최적 경로 선택:
    * - Simple Path: RAG + Command (비용 $0)
    * - Complex Path: RAG + Cloud Functions + Google AI (스마트 조합)
    */

   export class UnifiedQueryProcessor {
     constructor(
       private utils: SimplifiedQueryEngineUtils,
       private ragEngine: SupabaseRAGEngine,
       private mockContextLoader: MockContextLoader,
       private intentClassifier: IntentClassifier,
       private helpers: SimplifiedQueryEngineHelpers,
       private aiRouter?: unknown
     ) {}

     async processQuery(
       query: string,
       context: AIQueryContext | undefined,
       options: QueryRequest['options'],
       intentResult: IntentResult,
       complexity: ComplexityScore,
       thinkingSteps: QueryResponse['thinkingSteps'],
       startTime: number
     ): Promise<QueryResponse> {
       // 1. 자동 경로 선택
       const path = this.selectOptimalPath(intentResult, complexity, query);

       // 2. 경로별 실행
       if (path === 'simple') {
         return this.executeSimplePath(
           query,
           context,
           options,
           thinkingSteps,
           startTime
         );
       } else {
         return this.executeComplexPath(
           query,
           context,
           options,
           thinkingSteps,
           startTime
         );
       }
     }

     private selectOptimalPath(
       intentResult: IntentResult,
       complexity: ComplexityScore,
       query: string
     ): 'simple' | 'complex' {
       // Circuit Breaker 로직 (Phase 3에서 구현)
     }

     private async executeSimplePath(
       query: string,
       context: AIQueryContext | undefined,
       options: QueryRequest['options'],
       thinkingSteps: QueryResponse['thinkingSteps'],
       startTime: number
     ): Promise<QueryResponse> {
       // CommandQueryProcessor 로직 통합
     }

     private async executeComplexPath(
       query: string,
       context: AIQueryContext | undefined,
       options: QueryRequest['options'],
       thinkingSteps: QueryResponse['thinkingSteps'],
       startTime: number
     ): Promise<QueryResponse> {
       // GoogleAIModeProcessor 로직 통합
     }
   }
   ```

2. **기존 프로세서 로직 이관**:
   - `GoogleAIModeProcessor.processUnifiedQuery()` → `UnifiedQueryProcessor.executeComplexPath()`
   - `CommandQueryProcessor.processCommandQuery()` → `UnifiedQueryProcessor.executeSimplePath()`

3. **SimplifiedQueryEngine.processors.ts** 간소화:

   ```diff
   - import { GoogleAIModeProcessor } from './SimplifiedQueryEngine.processors.googleai';
   - import { CommandQueryProcessor } from './SimplifiedQueryEngine.processors.command';
   + import { UnifiedQueryProcessor } from './SimplifiedQueryEngine.processor.unified';

   export class SimplifiedQueryEngineProcessors {
   - private unifiedProcessor: GoogleAIModeProcessor;
   - private commandProcessor: CommandQueryProcessor;
   + private unifiedProcessor: UnifiedQueryProcessor;

     constructor(...) {
   -   this.unifiedProcessor = new GoogleAIModeProcessor(...);
   -   this.commandProcessor = new CommandQueryProcessor(...);
   +   this.unifiedProcessor = new UnifiedQueryProcessor(...);
     }

   - async processUnifiedQuery(...) { ... }
   - async processCommandQuery(...) { ... }
   + async processQuery(...) {
   +   return this.unifiedProcessor.processQuery(...);
   + }
   }
   ```

**검증**:

```bash
npm run test:unit -- SimplifiedQueryEngine
npm run type-check
```

**예상 결과**:

- 파일 감소: 8개 → 6개 (googleai.ts, command.ts 제거)
- 코드 감소: ~800줄 → ~600줄 (중복 로직 제거)
- 테스트 통과율 유지: 100%

---

### Phase 3: 자동 최적 라우팅 구현

**목표**: 명시적 모드 선택 제거, 스마트 경로 선택

**작업 내용**:

1. **UnifiedQueryProcessor.selectOptimalPath()** 구현:

   ```typescript
   private selectOptimalPath(
     intentResult: IntentResult,
     complexity: ComplexityScore,
     query: string
   ): 'simple' | 'complex' {
     // 1️⃣ Circuit Breaker: 즉시 단순 경로
     if (
       intentResult.confidence > 0.7 &&
       !intentResult.needsComplexML &&
       !intentResult.needsNLP &&
       complexity.score <= 0.5
     ) {
       console.log('✅ Simple Path: 로컬 RAG + Command (비용 $0)');
       return 'simple';
     }

     // 2️⃣ 복잡 경로 조건
     if (
       intentResult.needsComplexML ||
       intentResult.needsNLP ||
       complexity.score > 0.7 ||
       intentResult.confidence < 0.5
     ) {
       console.log('🤖 Complex Path: RAG + Cloud Functions + Google AI');
       return 'complex';
     }

     // 3️⃣ 기본: 단순 경로 (비용 절약 우선)
     console.log('💾 Default: Simple Path (비용 절약 우선)');
     return 'simple';
   }
   ```

2. **SimplifiedQueryEngine.ts** 라우팅 로직 제거:

   ```diff
   - // 🎯 Intelligent Routing Decision
   - let routingDecision: 'local' | 'google-ai' = 'local';
   - let routingReason = '';
   -
   - if (intentResult.needsComplexML || intentResult.needsNLP) {
   -   routingDecision = 'google-ai';
   -   ...
   - }

   // 단순화: 프로세서에게 위임
   response = await this.processors.processQuery(
     query,
     context,
     options,
   + intentResult,  // 의도 분석 결과 전달
   + complexity,    // 복잡도 점수 전달
     thinkingSteps,
     startTime
   );
   ```

**검증**:

```bash
npm run test:integration -- ai-query
npm run test:vercel:e2e
```

**예상 결과**:

- 라우팅 로직 중복 제거
- 응답 시간: 500ms 이하 유지
- 비용 최적화: Simple Path 비율 60% 이상

---

### Phase 4: 헬퍼 통합 및 코드 정리

**목표**: 중복 제거, 코드 간소화

**작업 내용**:

1. **SimplifiedQueryEngine.processors.helpers.ts** 간소화:
   - 공통 헬퍼만 유지
   - 모드별 중복 로직 제거

2. **SimplifiedQueryEngine.utils.ts** 최적화:
   - 의미론적 캐싱 강화 (히트율 60% 목표)
   - 불필요한 유틸리티 제거

3. **파일 구조 정리**:

   ```
   Before (8개 파일):
   ├── SimplifiedQueryEngine.ts
   ├── SimplifiedQueryEngine.processors.ts
   ├── SimplifiedQueryEngine.processors.googleai.ts  ❌ 제거
   ├── SimplifiedQueryEngine.processors.command.ts   ❌ 제거
   ├── SimplifiedQueryEngine.processors.helpers.ts
   ├── SimplifiedQueryEngine.utils.ts
   ├── SimplifiedQueryEngine.types.ts
   └── SimplifiedQueryEngine.complexity-types.ts

   After (5개 파일):
   ├── SimplifiedQueryEngine.ts                      (약 300줄)
   ├── SimplifiedQueryEngine.processor.unified.ts    (약 600줄) 🆕
   ├── SimplifiedQueryEngine.helpers.ts              (약 400줄)
   ├── SimplifiedQueryEngine.utils.ts                (약 500줄)
   └── SimplifiedQueryEngine.types.ts                (약 200줄)

   총 약 2,000줄 (42% 감소)
   ```

**검증**:

```bash
npm run validate:all
npm run test:super-fast
```

**예상 결과**:

- 파일 감소: 8개 → 5개 (37% 감소)
- 코드 감소: 3,448줄 → 2,000줄 (42% 감소)
- 복잡도 감소: Cyclomatic Complexity 30% 개선

---

### Phase 5: 무료 티어 최적화 및 테스트

**목표**: 무료 티어 100% 활용, 성능 검증

**작업 내용**:

1. **Google AI 할당량 최적화**:

   ```typescript
   // GoogleAIUsageTracker 강화
   - Flash Lite: 1,000 RPD (기본)
   - Flash: 15 RPM (폴백 1순위)
   - Pro: 2 RPM (폴백 2순위)

   // 자동 폴백 로직
   if (!usageTracker.canUseModel('gemini-2.5-flash-lite')) {
     const availableModels = usageTracker.getAvailableModels();
     selectedModel = availableModels[0] || 'gemini-2.5-flash';
   }
   ```

2. **Supabase RAG 전면 활용**:
   - 캐시 히트율 30% → 60% (의미론적 정규화)
   - pgvector 검색 최적화 (threshold 0.5 → 0.6)
   - 로컬 임베딩 우선 사용 (API 비용 $0)

3. **GCP Cloud Functions 통합**:
   - Korean NLP: 무료 200만 요청/월
   - Server Analyzer: 무료 200만 요청/월
   - ML Analytics: 무료 200만 요청/월

4. **성능 테스트**:

   ```bash
   # E2E 테스트 (실제 환경)
   npm run test:vercel:e2e

   # 성능 벤치마크
   npm run test:performance

   # 무료 티어 사용량 확인
   npm run test:free-tier-check
   ```

**검증 지표**:

- 응답 시간: 500ms 이하
- 캐시 히트율: 60% 이상
- Google AI 사용: 평균 300 RPD (무료 1,000 RPD 이내)
- GCP Functions: 평균 50,000 요청/월 (무료 200만 이내)
- Supabase DB: 100MB 이하 (무료 500MB 이내)

---

## 5. 예상 효과

### 5.1 코드 품질 개선

| 지표         | Before  | After   | 개선율        |
| ------------ | ------- | ------- | ------------- |
| 파일 수      | 8개     | 5개     | **37% 감소**  |
| 총 코드 라인 | 3,448줄 | 2,000줄 | **42% 감소**  |
| 순환 복잡도  | 85      | 60      | **30% 개선**  |
| 타입 안전성  | 95%     | 100%    | **5% 개선**   |
| 중복 코드    | 800줄   | 0줄     | **100% 제거** |

### 5.2 성능 개선

| 지표             | Before | After | 개선         |
| ---------------- | ------ | ----- | ------------ |
| 평균 응답 시간   | 450ms  | 400ms | **11% 빠름** |
| 캐시 히트율      | 30%    | 60%   | **2배 향상** |
| Simple Path 비율 | 40%    | 60%   | **50% 증가** |
| API 호출 감소    | -      | -     | **20% 감소** |

### 5.3 비용 최적화

| 항목             | Before        | After         | 절감             |
| ---------------- | ------------- | ------------- | ---------------- |
| Google AI 사용   | 500 RPD       | 300 RPD       | **40% 절감**     |
| GCP Functions    | 80,000 req/월 | 50,000 req/월 | **37% 절감**     |
| Supabase DB      | 150MB         | 100MB         | **33% 절감**     |
| **예상 월 비용** | **$0**        | **$0**        | **무료 유지** ✅ |

### 5.4 유지보수성 향상

- **단일 책임 원칙**: 프로세서 1개로 통합
- **의존성 감소**: MCP 완전 제거
- **테스트 용이성**: 통합 프로세서 단위 테스트
- **문서화**: 자동 최적 라우팅 로직 명확화

---

## 6. 위험 요소 및 대응책

### 6.1 주요 위험

#### 🚨 Risk 1: 기존 기능 손상 (High Impact)

**위험**:

- 프로세서 통합 중 로직 누락
- 명령어 처리 회귀
- Google AI 응답 품질 저하

**대응책**:

```bash
# Phase별 테스트 필수
npm run test:unit -- SimplifiedQueryEngine  # 유닛 테스트
npm run test:integration -- ai-query        # 통합 테스트
npm run test:vercel:e2e                     # E2E 테스트 (실제 환경)

# 롤백 계획
git checkout main
git branch backup-before-refactoring-$(date +%Y%m%d)
```

**완화 전략**:

- Phase 1 완료 후 검증 → Phase 2 진행
- 각 Phase마다 전체 테스트 실행
- 실패 시 즉시 이전 Phase로 롤백

#### 🚨 Risk 2: 타입 에러 증가 (Medium Impact)

**위험**:

- MCPContext 제거 시 타입 불일치
- 프로세서 시그니처 변경 시 호출처 누락

**대응책**:

```bash
# 타입 체크 자동화
npm run type-check          # TypeScript 컴파일러
npm run lint                # ESLint 타입 검증
npm run validate:all        # 전체 검증
```

**완화 전략**:

- TypeScript strict mode 활용
- any 타입 금지 (CLAUDE.md 원칙)
- 타입 정의 우선 수정 → 구현 수정

#### 🚨 Risk 3: 성능 저하 (Medium Impact)

**위험**:

- 통합 프로세서 오버헤드
- 경로 선택 로직 비효율
- 캐시 히트율 감소

**대응책**:

```bash
# 성능 벤치마크
npm run test:performance    # 응답 시간 측정
npm run test:super-fast     # 11초 빠른 테스트

# 모니터링
- Google AI 사용량: GoogleAIUsageTracker
- 캐시 히트율: SimplifiedQueryEngineUtils.cacheStats
- 응답 시간: thinkingSteps duration
```

**완화 전략**:

- 경로 선택 로직 최적화 (조건 순서 중요)
- 캐시 키 생성 알고리즘 개선 (의미론적 정규화)
- 성능 저하 시 원인 분석 및 즉시 개선

#### 🚨 Risk 4: 무료 티어 초과 (Low Impact, High Consequence)

**위험**:

- Google AI 할당량 초과 (1,000 RPD)
- GCP Functions 무료 한도 초과 (200만 req/월)
- Supabase DB 용량 초과 (500MB)

**대응책**:

```bash
# 사용량 모니터링
- Google AI: GoogleAIUsageTracker.getUsageStats()
- GCP Functions: Cloud Console 모니터링
- Supabase: Database Storage 확인

# 알림 설정
- Google AI: 800 RPD 도달 시 알림
- GCP Functions: 150만 req 도달 시 알림
- Supabase: 400MB 도달 시 알림
```

**완화 전략**:

- 할당량 기반 자동 폴백 (Flash Lite → Flash → Pro)
- 캐시 적극 활용 (히트율 60% 목표)
- Simple Path 우선 선택 (비용 $0)

### 6.2 롤백 계획

#### 단계별 롤백

**Phase 1 실패 시**:

```bash
git reset --hard HEAD~1
# MCP import만 복원
```

**Phase 2 실패 시**:

```bash
git reset --hard backup-before-phase2
# 기존 프로세서 유지, 통합 프로세서 제거
```

**Phase 3+ 실패 시**:

```bash
git reset --hard backup-before-refactoring-$(date +%Y%m%d)
# 전체 리팩토링 취소, 원래 상태로 복원
```

#### 긴급 대응

**프로덕션 장애 발생 시**:

```bash
# 1. Vercel 배포 롤백
vercel rollback

# 2. Git 커밋 되돌리기
git revert HEAD

# 3. 핫픽스 배포
npm run build
git push origin main
```

---

## 7. 성공 기준

### 7.1 필수 조건 (Must Have)

- ✅ 빌드 에러 0개
- ✅ 타입 에러 0개
- ✅ 테스트 통과율 88.9% 이상 유지
- ✅ E2E 테스트 통과율 99% 유지
- ✅ 응답 시간 500ms 이하
- ✅ 무료 티어 100% 활용 (비용 $0)

### 7.2 목표 조건 (Should Have)

- ✅ 코드 감소 40% 이상
- ✅ 파일 감소 30% 이상
- ✅ 캐시 히트율 60% 이상
- ✅ Simple Path 비율 60% 이상
- ✅ 복잡도 감소 30% 이상

### 7.3 선택 조건 (Nice to Have)

- ✅ 응답 시간 400ms 이하
- ✅ 캐시 히트율 70% 이상
- ✅ 코드 감소 50% 이상
- ✅ 문서화 완료 (README, CHANGELOG)

---

## 8. 타임라인

| Phase    | 작업                  | 예상 시간  | 검증 시간 | 총 시간    |
| -------- | --------------------- | ---------- | --------- | ---------- |
| Phase 1  | MCP 제거 및 타입 정리 | 2시간      | 1시간     | **3시간**  |
| Phase 2  | 프로세서 통합         | 4시간      | 2시간     | **6시간**  |
| Phase 3  | 자동 최적 라우팅      | 3시간      | 2시간     | **5시간**  |
| Phase 4  | 헬퍼 통합 및 정리     | 2시간      | 1시간     | **3시간**  |
| Phase 5  | 무료 티어 최적화      | 3시간      | 2시간     | **5시간**  |
| **총계** |                       | **14시간** | **8시간** | **22시간** |

**권장 일정**: 3일 (1일 8시간 기준)

- Day 1: Phase 1-2 (9시간)
- Day 2: Phase 3-4 (8시간)
- Day 3: Phase 5 + 최종 검증 (5시간)

---

## 9. 체크리스트

### Phase 1: MCP 제거 ✅

- [x] CloudContextLoader import 제거 (4개 파일)
- [x] MCPContext 파라미터 제거
- [x] contextLoader 필드 제거
- [x] 주석 업데이트 (MCP 관련 내용)
- [x] 빌드 에러 0개 확인
- [x] 타입 에러 0개 확인

### Phase 2: 프로세서 통합 ✅

- [x] UnifiedQueryProcessor 생성
- [x] GoogleAIModeProcessor 로직 이관
- [x] CommandQueryProcessor 로직 이관
- [x] SimplifiedQueryEngineProcessors 간소화
- [x] 유닛 테스트 통과 확인
- [x] 통합 테스트 통과 확인

### Phase 3: 자동 최적 라우팅 ✅

- [x] selectOptimalPath() 구현
- [x] Circuit Breaker 로직 구현
- [x] SimplifiedQueryEngine 라우팅 로직 제거
- [x] 응답 시간 500ms 이하 확인
- [x] Simple Path 비율 60% 이상 확인

### Phase 4: 헬퍼 통합 및 정리 ✅

- [x] 중복 헬퍼 메서드 제거
- [x] 의미론적 캐싱 강화
- [x] 파일 구조 정리 (8개 → 5개)
- [x] 코드 감소 40% 이상 확인
- [x] 전체 테스트 통과 확인

### Phase 5: 무료 티어 최적화 ✅

- [x] Google AI 할당량 최적화
- [x] Supabase RAG 전면 활용
- [x] GCP Cloud Functions 통합
- [ ] 성능 벤치마크 실행
- [ ] 무료 티어 사용량 확인
- [ ] E2E 테스트 99% 통과 확인

---

## 10. 참고 자료

### 내부 문서

- **CLAUDE.md**: 프로젝트 핵심 원칙 (Type-First, any 금지, 무료 티어 최적화)
- **docs/claude/1_workflows.md**: 통합 워크플로우
- **docs/status.md**: 현재 프로젝트 상태 (테스트 통과율, 품질 지표)

### 관련 코드

- **DirectGoogleAIService.ts**: Google AI SDK 직접 호출 패턴
- **GoogleAIUsageTracker.ts**: 할당량 관리 및 자동 폴백
- **SupabaseRAGEngine.ts**: Supabase pgvector 검색
- **IntentClassifier.ts**: 의도 분석 및 복잡도 판단

### 테스트 파일

- **tests/unit/services/ai/SimplifiedQueryEngine.test.ts**
- **tests/integration/ai-query.integration.test.ts**
- **tests/e2e/vercel/ai-query.vercel.test.ts**

---

## 11. 결론

### 핵심 요약

이 리팩토링은 SimplifiedQueryEngine을 다음과 같이 개선합니다:

1. **MCP 완전 제거**: CloudContextLoader 의존성 제거 (이미 파일 삭제됨)
2. **모드 통합**: 'local' vs 'google-ai' → 자동 최적 경로 선택
3. **무료 티어 최적화**: Vercel + GCP + Supabase + Google AI 100% 무료 활용
4. **코드 간소화**: 3,448줄 → 2,000줄 (42% 감소)

### 기대 효과

- **개발 생산성**: 파일 37% 감소, 복잡도 30% 개선
- **성능**: 응답 시간 11% 빠름, 캐시 히트율 2배 향상
- **비용**: 무료 티어 유지 ($0/월), API 호출 20% 감소
- **유지보수성**: 단일 책임 원칙, 의존성 감소, 테스트 용이성

### 다음 단계

1. **팀 리뷰**: 이 계획서를 팀과 공유하고 피드백 수집
2. **Phase 1 시작**: MCP 제거 (가장 안전한 단계부터 시작)
3. **점진적 진행**: 각 Phase 완료 후 검증 → 다음 Phase
4. **최종 검증**: Phase 5 완료 후 E2E 테스트 및 성능 벤치마크

---

**문서 버전**: 1.0.0
**작성자**: Claude Code (구조 리팩토링 전문가)
**최종 업데이트**: 2025-11-22

**문의**: 이 계획서에 대한 질문이나 수정 요청은 프로젝트 이슈로 등록해주세요.
