# 🤖 AI 자동 코드 리뷰 리포트 (Engine: CLAUDE-CODE-AUTO)

**날짜**: 2025-12-01 15-17-42
**커밋**: `97ec426d`
**브랜치**: `main`
**AI 엔진**: **CLAUDE-CODE-AUTO**

---

## 🔍 실시간 검증 결과 (N/A)

```
ESLint: 실행 안 됨
TypeScript: 실행 안 됨
```

**검증 로그 파일**:
- ESLint: `N/A`
- TypeScript: `N/A`

---

## 📊 변경사항 요약

[0;34mℹ️    📄 파일 10개의 변경사항 수집 중...[0m
**커밋**: `97ec426d4cc05619a6acd4a185a904035aa7a3a2`
**메시지**: docs: reorganize analysis files to archive directory

## 📄 docs/archive/AI-ENGINE-OPTIMIZATION-2025-11-20.md

```diff
diff --git a/docs/archive/AI-ENGINE-OPTIMIZATION-2025-11-20.md b/docs/archive/AI-ENGINE-OPTIMIZATION-2025-11-20.md
new file mode 100644
index 00000000..4a51662a
--- /dev/null
+++ b/docs/archive/AI-ENGINE-OPTIMIZATION-2025-11-20.md
@@ -0,0 +1,157 @@
+# 🎯 AI Engine Optimization - Option A Implementation
+
+> **날짜**: 2025-11-20  
+> **전략**: GCP Functions 유지 + Vercel 최적화  
+> **목표**: 무료 티어 내 최대 성능
+
+---
+
+## 📊 선택한 전략: 옵션 A
+
+### 아키텍처
+
+```
+프론트엔드 → Vercel /api/ai/query (Node.js)
+              ↓
+         SimplifiedQueryEngine
+              ↓
+    ├─ Supabase RAG (직접 호출, 3분 캐시)
+    ├─ GCP enhanced-korean-nlp (10분 캐시)
+    ├─ GCP ml-analytics-engine (10분 캐시)
+    └─ Gemini API (직접 호출)
+```
+
+### 선택 이유
+
+1. **GCP 무료 티어 97.5% 여유** - 200만 호출/월 중 2.5%만 사용
+2. **Python NLP/ML 기능 유지** - 고급 한국어 처리 및 ML 분석
+3. **전문화된 마이크로서비스** - 각 기능별 독립 스케일링
+4. **향후 확장성** - 배치 처리, 백그라운드 작업 가능
+
+---
+
+## ✅ 구현 완료 사항
+
+### 1. /api/ai/query 최적화
+
+- **Runtime**: Node.js (의존성 호환성)
+- **캐싱**: 5분 TTL (성공 응답만)
+- **GCP 호출**: Provider 레이어에서 선택적 호출
+
+### 2. GCP Functions 캐싱 전략
+
+```typescript
+// Korean NLP Provider
+private readonly cacheTTL = 10 * 60 * 1000; // 10분
+
+// ML Provider
+private readonly cacheTTL = 10 * 60 * 1000; // 10분
+
+// Supabase RAG
+TTL: 3분 (문서 검색)
+```
+
+### 3. Graceful Degradation
+
+- Korean NLP CORS 403 → 빈 결과 반환
+- ML Analytics 실패 → 기본 분석 사용
+- 모든 Provider 실패 → Gemini 직접 호출
+
+---
+
+## 📈 예상 성능
+
+### 응답 시간
+
+```
+캐시 HIT (70%): 50-100ms
+GCP 호출 (20%): 200-500ms
+Gemini 직접 (10%): 300-800ms
+평균: 150-300ms
+```
+
+### 무료 티어 사용량
+
+```
+Vercel Functions: 7만 호출/월 (70% 한도)
+GCP Functions: 2만 호출/월 (1% 한도)
+Supabase: 5만 호출/월 (10% 한도)
+Gemini API: 1만 호출/월 (무료 티어)
+
+총 비용: $0/월 ✅
+```
+
+---
+
+## 🔧 최적화 포인트
+
+### 1. 캐시 계층 구조
+
+```
+L1: Vercel 메모리 (5분) - 즉시 응답
+L2: GCP Provider (10분) - NLP/ML 결과
+L3: Supabase (3분) - RAG 문서
+```
```

## 📄 docs/archive/ai-engine-comprehensive-status-2025-11-22.md

```diff
diff --git a/docs/archive/ai-engine-comprehensive-status-2025-11-22.md b/docs/archive/ai-engine-comprehensive-status-2025-11-22.md
new file mode 100644
index 00000000..4efb9236
--- /dev/null
+++ b/docs/archive/ai-engine-comprehensive-status-2025-11-22.md
@@ -0,0 +1,495 @@
+# 🤖 AI 어시스턴트 엔진 종합 상태 리포트
+
+**작성일**: 2025-11-22
+**분석 범위**: SimplifiedQueryEngine 생태계 전체 (UI/UX, API, 테스트, 문서)
+**종합 평가**: 🟡 **7.2/10** (핵심 기능 작동, Provider 레이어 개선 필요)
+
+---
+
+## 📊 Executive Summary
+
+### ✅ **정상 작동**
+
+- SimplifiedQueryEngine → GoogleAiUnifiedEngine 통합 성공
+- UI/UX 연결 정상 (4가지 엔진 모드 지원)
+- Google AI 직접 호출 경로 안정적
+- 캐싱 시스템 (5분 TTL) 작동
+- MCP 의존성 완전 제거
+
+### 🔴 **주요 문제**
+
+- **Provider 레이어 에러 핸들링 취약** (RAG, KoreanNLP, ML)
+- **테스트 실패 57개** (모킹 이슈 + Provider 초기화)
+- **문서 불일치** (발견된 문제점 미반영)
+
+---
+
+## 🏗️ 1. 아키텍처 상태
+
+### 1.1 전체 구조
+
+```
+[UI Layer]
+  useAIEngine.ts (4 modes: UNIFIED, LOCAL, GOOGLE_AI, AUTO)
+    ↓
+[API Layer]
+  /api/ai/query → getQueryEngine()
+    ↓
+[Adapter Layer]
+  SimplifiedQueryEngineAdapter
+    ↓
+[Core Engine]
+  GoogleAiUnifiedEngine (616줄)
+    ├─ selectProviders() - 7 scenarios
+    ├─ collectContexts() - Provider 통합
+    ├─ callGoogleAI() - Google AI API
+    └─ Cache (5분 TTL) + Stats
+    ↓
+[Provider Layer] ⚠️ **취약 지점**
+  ├─ RAGProvider → SupabaseRAGEngine
+  ├─ MLProvider → 메트릭 분석
+  ├─ KoreanNLPProvider → 외부 API
+  └─ RuleProvider → 규칙 기반
+```
+
+### 1.2 핵심 발견
+
+#### ✅ **SimplifiedQueryEngineAdapter 역할 명확**
+
+- GoogleAiUnifiedEngine을 SimplifiedQueryEngine 인터페이스로 래핑
+- 타입 변환 (QueryRequest ↔ UnifiedQueryRequest)
+- 시나리오 자동 감지 (detectScenario 함수)
+- 싱글톤 패턴 구현
+
+#### ✅ **GoogleAiUnifiedEngine 통합 성공**
+
+- Provider 패턴으로 확장 가능한 구조
+- 7가지 시나리오 지원 (failure-analysis, performance-report, etc.)
+- 캐싱 + 통계 추적
+- 헬스 체크 API 제공
+
+---
+
+## 🎨 2. UI/UX 연결 상태
+
+### 2.1 useAIEngine.ts 분석
+
+```typescript
+// 4가지 엔진 모드 제공
+const ENGINE_CONFIG = {
+  UNIFIED: {
+    displayName: '통합 AI 엔진',
+    description: 'Provider 패턴 통합 - RAG + ML + Google AI',
+    endpoint: '/api/ai/query', // SimplifiedQueryEngineAdapter
+  },
+  LOCAL: {
+    displayName: '로컬 RAG',
+    description: 'Supabase RAG 엔진 (레거시, UNIFIED 사용 권장)',
+    endpoint: '/api/ai/query',
+  },
+  GOOGLE_AI: {
+    displayName: 'Google AI',
+    description: 'Google AI 직접 호출',
+    endpoint: '/api/ai/google-ai/generate',
+  },
```

## 📄 docs/archive/ai-engine-refactoring-analysis-2025-11-22.md

```diff
diff --git a/docs/archive/ai-engine-refactoring-analysis-2025-11-22.md b/docs/archive/ai-engine-refactoring-analysis-2025-11-22.md
new file mode 100644
index 00000000..46433071
--- /dev/null
+++ b/docs/archive/ai-engine-refactoring-analysis-2025-11-22.md
@@ -0,0 +1,393 @@
+# AI 어시스턴트 엔진 리팩토링 분석 리포트
+
+**분석일**: 2025-11-22
+**프로젝트**: OpenManager VIBE v5.80.0
+
+---
+
+## 📊 종합 평가
+
+**전체 달성률**: ⭐ **85.2%** (17/20 항목 완료)
+
+---
+
+## ✅ 완료된 항목 (Phase 1-3)
+
+### Phase 1: MCP 제거 및 타입 정리 ✅ 100% 완료
+
+**달성 사항**:
+
+- ✅ CloudContextLoader import 완전 제거 (6개 파일)
+- ✅ MCPContext 파라미터 제거 (12개 메서드)
+- ✅ contextLoader 필드 제거 (8개)
+- ✅ 메서드 완전 제거 (loadMCPContextAsync, convertRAGContextToMCPContext)
+- ✅ TypeScript 컴파일 성공 (0 errors)
+- ✅ 타입 에러 0개
+
+**검증 결과**:
+
+```bash
+✅ TypeScript 컴파일: 성공
+✅ 타입 에러: 0개
+✅ MCP 참조: 0개 (주석에만 2개 남음 - 무해)
+```
+
+**상세**: `/tmp/mcp-removal-phase1-complete.md` 참조
+
+---
+
+### Phase 2: 프로세서 통합 ✅ 100% 완료
+
+**달성 사항**:
+
+- ✅ UnifiedQueryProcessor 생성 완료
+  - `processQuery()` - 단일 진입점
+  - `selectOptimalPath()` - 자동 경로 선택
+  - `executeSimplePath()` - 단순 경로 (RAG + Command)
+  - `executeComplexPath()` - 복잡 경로 (RAG + Cloud Functions + Google AI)
+
+- ✅ GoogleAIModeProcessor, CommandQueryProcessor 파일 제거
+  - `ls` 결과: 파일 존재하지 않음 ✅
+
+**코드 예시** (selectOptimalPath):
+
+```typescript
+private selectOptimalPath(
+  intentResult: IntentResult,
+  complexity: ComplexityScore,
+  query: string
+): 'simple' | 'complex' {
+  // 1. Circuit Breaker: 즉시 단순 경로
+  if (
+    intentResult.confidence > 0.7 &&
+    !intentResult.needsComplexML &&
+    !intentResult.needsNLP &&
+    complexity.score <= 0.5
+  ) {
+    return 'simple'; // 비용 $0
+  }
+
+  // 2. 복잡 경로 조건
+  if (
+    intentResult.needsComplexML ||
+    intentResult.needsNLP ||
+    complexity.score > 0.7 ||
+    intentResult.confidence < 0.5
+  ) {
+    return 'complex'; // 스마트 조합
+  }
+
+  // 3. 기본: 단순 경로 (비용 절약 우선)
+  return 'simple';
+}
+```
+
+**계획서 준수도**: ✅ 100% (모든 메서드 구현됨)
+
+---
+
+### Phase 3: 자동 최적 라우팅 ✅ 90% 완료
+
+**달성 사항**:
+
+- ✅ SimplifiedQueryEngine.ts에서 명시적 라우팅 로직 제거
+  - ❌ 제거됨: `'local' | 'google-ai'` 모드 구분
```

## 📄 docs/archive/ai-improvements-summary-2025-11-23.md

```diff
diff --git a/docs/archive/ai-improvements-summary-2025-11-23.md b/docs/archive/ai-improvements-summary-2025-11-23.md
new file mode 100644
index 00000000..20020475
--- /dev/null
+++ b/docs/archive/ai-improvements-summary-2025-11-23.md
@@ -0,0 +1,454 @@
+# AI Assistant Engine 개선사항 종합 분석
+
+**분석 일시**: 2025-11-23 23:30 KST
+**대상 범위**: 최근 10개 커밋 (e42a8f74 ~ 50752ea2)
+**변경 파일**: 22개 (3개 삭제, 1개 신규)
+**코드 영향**: +601줄 / -1,787줄 = **-1,186줄 순감**
+
+---
+
+## 📊 전체 변경사항 요약
+
+### 1. 코드 통계
+
+| 항목                | 변경 전  | 변경 후  | 차이         |
+| ------------------- | -------- | -------- | ------------ |
+| **총 코드 라인**    | -        | -        | **-1,186줄** |
+| **GCP Functions**   | ~2,500줄 | ~2,000줄 | **-500줄**   |
+| **Admin 관련 코드** | ~600줄   | 0줄      | **-600줄**   |
+| **신규 컴포넌트**   | -        | 76줄     | **+76줄**    |
+| **문서 업데이트**   | -        | -        | **+180줄**   |
+
+### 2. 변경 파일 분류
+
+#### 🟢 신규 파일 (1개)
+
+- `src/domains/ai-sidebar/components/AIEngineIndicator.tsx` (76줄) - AI 엔진 표시기
+
+#### 🔴 삭제 파일 (3개)
+
+- `src/domains/ai-sidebar/components/AIChatMessages.tsx` (100줄) - 미사용 컴포넌트
+- `src/app/api/test/admin-auth/route.ts` (345줄) - Admin API 제거
+- 기타 admin 관련 파일들
+
+#### 🟡 수정 파일 (18개)
+
+- **GCP Functions**: 2개 파일 대폭 간소화
+- **AI 컴포넌트**: 5개 파일 admin 기능 제거
+- **프로필 컴포넌트**: 4개 파일 간소화
+- **설정 파일**: 3개 파일 업데이트
+- **문서**: 4개 파일 업데이트
+
+---
+
+## 🎯 주요 개선사항 상세 분석
+
+### 1. 신규 기능: AI Engine Indicator ⭐
+
+**파일**: `src/domains/ai-sidebar/components/AIEngineIndicator.tsx`
+
+**목적**: 사용자에게 현재 어떤 AI 엔진이 쿼리를 처리하고 있는지 실시간으로 표시
+
+**주요 기능**:
+
+```typescript
+interface AIEngineIndicatorProps {
+  currentEngine?: string; // 'GOOGLE' | 'LOCAL' | 'UNIFIED'
+  routingReason?: string; // 라우팅 사유 (툴팁에 표시)
+  className?: string;
+}
+```
+
+**UI 특징**:
+
+- **Google AI**: 파란색 배지 + Cloud 아이콘 (`bg-blue-100 text-blue-700`)
+- **Local RAG**: 초록색 배지 + Cpu 아이콘 (`bg-green-100 text-green-700`)
+- **Tooltip**: Radix UI Tooltip으로 상세 정보 제공
+  - 엔진 설명
+  - 라우팅 사유 (있을 경우)
+
+**통합 위치**:
+
+```typescript
+// EnhancedAIChat.tsx에 통합
+<AIEngineIndicator
+  currentEngine={currentEngine}
+  routingReason={routingReason}
+/>
+```
+
+**사용자 가치**:
+
+- ✅ AI 엔진 투명성 제공
+- ✅ 비용 최적화 가시화 (Local RAG 사용 시 비용 절감)
+- ✅ 라우팅 로직 이해 도움
+
+---
+
+### 2. GCP Functions 대폭 간소화 (-500줄)
+
+#### 2.1 enhanced-korean-nlp/main.py
+
+**변경 규모**: -999줄 (대부분 삭제, 핵심만 유지)
+
+**Before (복잡한 구현)**:
```

## 📄 docs/archive/ai-sidebar-analysis-2025-11-20.md

```diff
diff --git a/docs/archive/ai-sidebar-analysis-2025-11-20.md b/docs/archive/ai-sidebar-analysis-2025-11-20.md
new file mode 100644
index 00000000..10c8ce6f
--- /dev/null
+++ b/docs/archive/ai-sidebar-analysis-2025-11-20.md
@@ -0,0 +1,467 @@
+# 🔍 AI 사이드바 기능 분석 보고서
+
+> **분석 일시**: 2025-11-20 22:17 KST  
+> **대상**: AI Assistant Sidebar 전체 기능  
+> **목적**: 중복/미사용/개선 필요 기능 식별
+
+---
+
+## 📊 현재 구성 요소
+
+### 컴포넌트 목록 (10개)
+
+```
+1. AISidebarV3.tsx (17KB) - 메인 사이드바 ✅ 사용 중
+2. EnhancedAIChat.tsx (7.5KB) - 채팅 UI ✅ 사용 중
+3. AIEnhancedChat.tsx (12KB) - 구버전 채팅 ⚠️ 미사용
+4. AIEngineSelector.tsx (5.5KB) - 엔진 선택기 ⚠️ 폐기됨
+5. AIEngineDropdown.tsx (5.3KB) - 드롭다운 ⚠️ 미사용
+6. AIThinkingDisplay.tsx (6.1KB) - Thinking 표시 ⚠️ 중복
+7. AIChatMessages.tsx (3.8KB) - 메시지 목록 ⚠️ 미사용
+8. ChatMessageItem.tsx (4.1KB) - 메시지 아이템 ⚠️ 미사용
+9. AIFunctionPages.tsx (3.4KB) - 기능 페이지 ✅ 사용 중
+10. AISidebarHeader.tsx (2.0KB) - 헤더 ✅ 사용 중
+```
+
+---
+
+## 🚨 발견된 문제
+
+### 1. AI 엔진 선택 기능 (폐기됨)
+
+#### 문제
+
+```typescript
+// AIEngineSelector.tsx - 더 이상 사용되지 않음
+export const AIEngineSelector: FC<AIEngineSelectorProps> = ({
+  selectedEngine, // LOCAL | GOOGLE_AI
+  onEngineChange,
+  disabled = false,
+}) => {
+  // ...
+};
+```
+
+**현재 상태**:
+
+- ❌ SimplifiedQueryEngine이 자동으로 엔진 선택
+- ❌ 사용자 선택 불필요 (Intelligent Routing 구현됨)
+- ❌ UI에 표시되지만 기능 없음
+
+**영향**:
+
+- 사용자 혼란 (선택해도 무시됨)
+- 불필요한 코드 유지보수
+- UI 공간 낭비
+
+**해결 방안**:
+
+```typescript
+// Option 1: 완전 제거 (권장)
+- AIEngineSelector.tsx 삭제
+- AIEngineDropdown.tsx 삭제
+- 관련 import 제거
+
+// Option 2: 정보 표시로 변경
+- 현재 사용 중인 엔진 표시 (읽기 전용)
+- "자동 선택됨" 표시
+```
+
+---
+
+### 2. 중복된 채팅 컴포넌트
+
+#### 문제
+
+```
+AIEnhancedChat.tsx (12KB) - 구버전, 미사용
+EnhancedAIChat.tsx (7.5KB) - 신버전, 사용 중
+```
+
+**차이점**:
+
+```typescript
+// AIEnhancedChat.tsx (구버전)
+- AIEngineSelector 포함
+- 복잡한 상태 관리
+- 12KB 크기
+
+// EnhancedAIChat.tsx (신버전)
+- 엔진 선택기 없음
+- 단순화된 props
+- 7.5KB 크기 (40% 감소)
+```
+
```

## 📄 docs/archive/gcp-functions-analysis-2025-11-22.md

```diff
diff --git a/docs/archive/gcp-functions-analysis-2025-11-22.md b/docs/archive/gcp-functions-analysis-2025-11-22.md
new file mode 100644
index 00000000..5fc2fff9
--- /dev/null
+++ b/docs/archive/gcp-functions-analysis-2025-11-22.md
@@ -0,0 +1,339 @@
+# GCP Functions 사용 현황 분석 및 정리 방안
+
+**분석 일시**: 2025-11-22
+**목적**: Google AI API 직접 호출 전환에 따른 GCP Functions 필요성 재검토
+
+---
+
+## 📊 현재 배포된 GCP Functions (asia-northeast3-openmanager-free-tier)
+
+| Function 이름            | 역할                                 | 현재 사용 여부   | 판단            |
+| ------------------------ | ------------------------------------ | ---------------- | --------------- |
+| **enhanced-korean-nlp**  | 한국어 NLP 분석 (6-Phase 파이프라인) | ✅ **사용 중**   | **유지**        |
+| **ml-analytics-engine**  | ML 기반 메트릭 분석 (scikit-learn)   | ✅ **사용 중**   | **유지**        |
+| **unified-ai-processor** | 통합 AI 처리 (레거시)                | ❌ 미사용        | **제거 권장**   |
+| **ai-gateway**           | GCP Functions 라우팅 게이트웨이      | ❌ 미사용        | **제거 권장**   |
+| **rule-engine**          | 규칙 기반 엔진                       | ❌ 미사용        | **제거 권장**   |
+| **health-check**         | 헬스 체크                            | ℹ️ 모니터링 전용 | **선택적 유지** |
+
+---
+
+## ✅ 유지할 Functions (2개)
+
+### 1. **enhanced-korean-nlp** ✅ 필수
+
+**사용처**:
+
+- `src/lib/ai/providers/korean-nlp-provider.ts` (line 110)
+
+**역할**:
+
+```typescript
+// 6-Phase Korean NLP Pipeline
+- Phase 1: Security Validation (악성 입력 차단)
+- Phase 2: Tokenization (형태소 분석)
+- Phase 3: Normalization (표준화)
+- Phase 4: Entity Extraction (개체명 인식)
+- Phase 5: Intent Classification (의도 분류)
+- Phase 6: Domain Enhancement (도메인 어휘 매핑)
+```
+
+**유지 이유**:
+
+- KoreanNLPProvider가 실제로 호출하여 사용 중
+- Google AI SDK로는 대체 불가능한 한국어 전문 처리 기능
+- 서버 모니터링 도메인 특화 기능 포함
+
+**비용**: 무료 티어 범위 내 (10분 TTL 캐싱)
+
+---
+
+### 2. **ml-analytics-engine** ✅ 필수
+
+**사용처**:
+
+- `src/lib/ai/providers/ml-provider.ts` (line 103)
+
+**역할**:
+
+```python
+# scikit-learn 기반 ML 분석
+- Anomaly Detection: 3-sigma 통계 방법
+- Trend Analysis: 선형 회귀
+- Pattern Recognition: Peak hour, Weekly cycle
+```
+
+**유지 이유**:
+
+- MLProvider가 실제로 호출하여 사용 중
+- Google AI SDK로는 대체 불가능한 수치 분석 기능
+- 성능 모니터링에 필수적인 이상 탐지 기능
+
+**비용**: 무료 티어 범위 내 (5분 TTL 캐싱)
+
+---
+
+## ❌ 제거 권장 Functions (3개)
+
+### 1. **unified-ai-processor** ❌ 더 이상 불필요
+
+**현재 상태**:
+
+- ❌ 코드에서 호출되지 않음
+- 정의만 존재: `src/lib/gcp/resilient-ai-client.ts:371` (`processUnifiedAIResilient`)
+
+**대체 시스템**:
+
+- ✅ `GoogleAiUnifiedEngine` (src/lib/ai/engines/GoogleAiUnifiedEngine.ts)
+  - Google AI SDK 직접 호출 (`@google/generative-ai`)
+  - 7가지 시나리오 지원 (failure-analysis, performance-report 등)
+  - Gemini 2.0 Flash Lite 모델 사용
+
+**제거 이유**:
+
+- Google AI API 직접 호출로 완전히 대체됨
```

## 📄 docs/archive/idle-computing-analysis-2025-11-21.md

```diff
diff --git a/docs/archive/idle-computing-analysis-2025-11-21.md b/docs/archive/idle-computing-analysis-2025-11-21.md
new file mode 100644
index 00000000..c60d550b
--- /dev/null
+++ b/docs/archive/idle-computing-analysis-2025-11-21.md
@@ -0,0 +1,397 @@
+# 🔍 시스템 중단 상태 컴퓨팅 사용량 분석
+
+> **분석 일시**: 2025-11-21 07:42 KST  
+> **목적**: 시스템 시작 버튼을 누르지 않았는데도 발생하는 컴퓨팅 사용량 원인 파악 및 최적화
+
+---
+
+## 📊 현재 상황
+
+### 문제
+- **시스템 중단 상태**에서도 Vercel 컴퓨팅 사용량이 조금씩 발생
+- 사용자가 "시스템 시작" 버튼을 누르지 않았는데도 리소스 소비
+
+### 예상 원인
+1. **항상 동작하는 API 엔드포인트**
+2. **Middleware 실행**
+3. **Edge Functions 자동 실행**
+4. **헬스체크 및 모니터링**
+
+---
+
+## 🔍 분석 결과
+
+### 1. 항상 동작하는 API 엔드포인트 (시스템 상태 무관)
+
+#### ⚡ Edge Runtime API (무료 100만 호출/월)
+```typescript
+// 1. /api/ping - 초경량 헬스체크
+export const runtime = 'edge';
+- 응답시간: ~5ms
+- 캐싱: 60초
+- 사용량: 거의 0 (Edge Functions)
+
+// 2. /api/time - 시간 정보
+export const runtime = 'edge';
+- 응답시간: ~3ms
+- 캐싱: 1초
+- 사용량: 거의 0 (Edge Functions)
+
+// 3. /api/vercel-usage - 사용량 모니터링
+export const runtime = 'edge';
+- 응답시간: ~10ms
+- 캐싱: 없음 (실시간)
+- 사용량: 거의 0 (Edge Functions)
+```
+
+#### 🔧 Node.js Runtime API (컴퓨팅 사용)
+```typescript
+// 4. /api/health - 종합 헬스체크
+export const runtime = 'nodejs';
+export const dynamic = 'force-dynamic';
+
+✅ 체크 항목:
+- Database (Supabase) - 2초 타임아웃
+- Cache (메모리) - 즉시
+- AI (GCP VM) - 3초 타임아웃
+
+⚠️ 문제점:
+- 매 요청마다 3개 서비스 체크
+- 총 응답시간: 50-200ms
+- 캐싱 없음 (force-dynamic)
+
+💰 비용 영향:
+- 1회 호출: ~0.15초 컴퓨팅
+- 1분마다 호출 시: 9초/시간 = 216초/일
+```
+
+---
+
+### 2. Middleware 실행 (모든 요청에 실행)
+
+```typescript
+// middleware.ts
+export const runtime = 'edge'; // ✅ Edge Runtime 사용
+
+실행 조건:
+1. 모든 페이지 접근 (/*)
+2. 모든 API 호출 (/api/*)
+3. 정적 파일 제외 (_next/static/*)
+
+주요 작업:
+- IP 화이트리스트 체크 (Module-level 캐싱)
+- CSRF 토큰 검증
+- Supabase 인증 체크
+- Rate Limiting
+
+💰 비용 영향:
+- Edge Runtime이므로 무료 (100만 호출/월)
+- 실제 컴퓨팅 비용 거의 없음
+```
+
+---
+
+### 3. 자동 실행되는 백그라운드 작업
```

## 📄 docs/archive/opensource-evaluation-2025-11-22.md

```diff
diff --git a/docs/archive/opensource-evaluation-2025-11-22.md b/docs/archive/opensource-evaluation-2025-11-22.md
new file mode 100644
index 00000000..5ce380fc
--- /dev/null
+++ b/docs/archive/opensource-evaluation-2025-11-22.md
@@ -0,0 +1,342 @@
+# 오픈소스 도입 여부 평가 및 권장사항
+
+**작성 일시**: 2025-11-22
+**목적**: Google AI API 직접 호출 전환 후 새로운 오픈소스 도입 필요성 검토
+
+---
+
+## 📊 현재 시스템 구성 (2025-11-22 기준)
+
+### 1. AI 핵심 기술 스택
+
+| 기술                       | 버전    | 용도                      | 상태            |
+| -------------------------- | ------- | ------------------------- | --------------- |
+| **@google/generative-ai**  | ^0.24.1 | Gemini 2.0 Flash Lite API | ✅ 안정적       |
+| **@supabase/supabase-js**  | ^2.48.0 | pgvector 기반 RAG         | ✅ 무료 티어 3% |
+| **GCP Functions** (Python) | -       | Korean NLP + ML 분석      | ✅ 무료 티어 내 |
+
+### 2. 보조 기술
+
+| 기술                      | 버전    | 용도                        | 활용도 |
+| ------------------------- | ------- | --------------------------- | ------ |
+| **@tanstack/react-query** | ^5.66.1 | 데이터 fetching & 캐싱      | 높음   |
+| **@vitest/ui**            | ^3.2.4  | 테스트 시각화 (이미 설치됨) | 낮음   |
+| **@playwright/test**      | ^1.49.1 | E2E 테스트 (UI 내장)        | 높음   |
+
+---
+
+## 🔍 오픈소스 도입 고려 영역 분석
+
+### 영역 1: 한국어 NLP 라이브러리 (JavaScript)
+
+**현재 상태**:
+
+- GCP Function: `enhanced-korean-nlp` (Python 기반)
+- 6-Phase 파이프라인: Tokenization, Normalization, Entity Extraction, Intent Classification, Domain Enhancement
+- 10분 TTL 캐싱, 무료 티어 내 안정 작동
+
+**도입 가능 대안**:
+
+- `mecab-ko-dic-node`: MeCab 형태소 분석기 (Node.js 바인딩)
+- `korean-tokenizer`: JavaScript 한국어 토크나이저
+- `hangul-js`: 한글 자모 분리/결합
+
+**평가**:
+| 항목 | 현재 (GCP Python) | 대안 (JS 라이브러리) |
+|------|-------------------|----------------------|
+| 정확도 | ⭐⭐⭐⭐⭐ (KoNLPy 생태계) | ⭐⭐⭐ (제한적) |
+| 유지보수 | 쉬움 (Python 생태계) | 어려움 (커뮤니티 작음) |
+| 성능 | 우수 (C 바인딩) | 보통 (Pure JS) |
+| 비용 | $0 (무료 티어) | $0 |
+
+**권장사항**: ❌ **도입 불필요**
+
+- **이유**: Python 기반 NLP 생태계가 훨씬 성숙, 현재 시스템 안정적
+- **무료 티어 충분**: 10분 캐싱으로 호출 횟수 최소화
+
+---
+
+### 영역 2: ML 분석 라이브러리 (JavaScript)
+
+**현재 상태**:
+
+- GCP Function: `ml-analytics-engine` (scikit-learn 기반)
+- 기능: Anomaly Detection (3-sigma), Trend Analysis (선형회귀), Pattern Recognition
+- 5분 TTL 캐싱, 무료 티어 내 안정 작동
+
+**도입 가능 대안**:
+
+- `TensorFlow.js`: 머신러닝 프레임워크
+- `Brain.js`: 신경망 라이브러리
+- `ml.js`: 범용 ML 라이브러리
+- `simple-statistics`: 통계 라이브러리 (가벼움)
+
+**평가**:
+| 항목 | 현재 (scikit-learn) | 대안 (TensorFlow.js/ml.js) |
+|------|---------------------|----------------------------|
+| 통계 분석 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
+| 번들 크기 | 0 (서버 사이드) | 큼 (500KB+) |
+| 성능 | 우수 (NumPy) | 보통 (WebAssembly 필요) |
+| 비용 | $0 (무료 티어) | $0 (번들 비용만) |
+
+**권장사항**: ❌ **도입 불필요**
+
+- **이유**: 통계 분석(3-sigma, 선형회귀)은 Python/NumPy가 최적
+- **번들 크기**: TensorFlow.js 도입 시 500KB+ 증가
+- **현재 성능 충분**: 5분 캐싱으로 효율적 운영
+
+---
+
+### 영역 3: AI 프레임워크/래퍼
+
+#### 3-1. LangChain.js
+
+**개요**: AI 체인 구축 프레임워크 (OpenAI, Anthropic, Google AI 지원)
```

## 📄 docs/core/README.md

```diff
diff --git a/docs/core/README.md b/docs/core/README.md
index dca65672..0788119a 100644
--- a/docs/core/README.md
+++ b/docs/core/README.md
@@ -61,33 +61,39 @@ core/
 - **warnings.md** - 배포 주의사항
 
 ---
-
-## 🏗️ 시스템 (architecture/)
-
-**시스템 아키텍처 전체 구조**
-
-- SYSTEM-ARCHITECTURE-CURRENT.md - v5.80.0 전체 구조
-- TECH-STACK-DETAILED.md - 기술 스택 상세
-- api/ - API 설계
-- decisions/ - ADR
-
+category: core
+purpose: core_system_documentation
+ai_optimized: true
+query_triggers:
+  - '핵심 아키텍처'
+  - '시스템 구조'
+  - '보안 정책'
+related_docs:
+  - 'docs/architecture/WEB_ARCHITECTURE.md'
+  - 'docs/architecture/BACKEND_ARCHITECTURE.md'
+last_updated: '2025-12-01'
 ---
 
-## 🔒 보안 & 성능
-
-### security/
+# 🧩 Core Documentation
 
-- 보안 정책 및 취약점 관리
+프로젝트의 핵심 아키텍처, 보안, 성능 표준을 정의하는 문서입니다.
 
-### performance/
+## 📚 주요 문서
 
-- 성능 최적화 전략
+### Architecture
+- **[Web Architecture](../architecture/WEB_ARCHITECTURE.md)**: 프론트엔드 구조
+- **[Backend Architecture](../architecture/BACKEND_ARCHITECTURE.md)**: 백엔드 및 서비스 레이어
+- **[AI Engine Architecture](../architecture/AI_ENGINE_ARCHITECTURE.md)**: AI 엔진 구조
 
-### monitoring/
+### Security
+- **[Security Guidelines](../security/README.md)**: 보안 가이드라인 (RLS, Auth)
 
-- 시스템 모니터링
+### Performance
+- **[Performance Standards](./performance/README.md)**: 성능 목표 및 측정 표준
 
----
+## 🔍 디렉터리 구조
 
-**Last Updated**: 2025-11-27
-**용도**: 메인 프로젝트 (배포/운영)
+- `architecture/`: 시스템 설계 및 구조
+- `security/`: 보안 정책 및 가이드
+- `performance/`: 성능 최적화 및 기준
+- `platforms/`: 플랫폼별 설정 (Vercel, Supabase, GCP)(배포/운영)
```

## 📄 docs/deploy/README.md

```diff
diff --git a/docs/deploy/README.md b/docs/deploy/README.md
index 70087413..88d71c37 100644
--- a/docs/deploy/README.md
+++ b/docs/deploy/README.md
@@ -62,63 +62,6 @@ const platformStatus = {
 };
 ```
 
-## 🔧 Quick Deploy Commands
-
-```bash
-# Full production deployment
-npm run build
-npm run validate:all
-vercel --prod
-
-# Environment setup
-npm run env:setup
-npm run env:check
-
-# Monitor deployment
-vercel logs --follow
-npm run monitor:free-tier
-```
-
-## 📈 Deployment Workflow
-
-### 1. Pre-deployment Checks
-
-```bash
-# Code quality
-npm run type-check    # TypeScript validation
-npm run lint:fix      # ESLint fixes
-npm run test          # Unit tests
-
-# Build validation
-npm run build         # Production build test
-npm run validate:all  # Complete validation
-```
-
-### 2. Environment Configuration
-
-```bash
-# Vercel dashboard setup
-1. Add environment variables
-2. Configure domains
-3. Set up redirects
-
-# Production variables
-NEXT_PUBLIC_SUPABASE_URL
-NEXT_PUBLIC_SUPABASE_ANON_KEY
-SUPABASE_SERVICE_ROLE_KEY
-```
-
-### 3. Deployment Execution
-
-```bash
-# Deploy to production
-vercel --prod
-
-# Verify deployment
-vercel inspect
-curl -I https://openmanager-vibe-v5.vercel.app
-```
-
 ## 🛡️ Security & Optimization
 
 ### Security Headers
```

---

## 🤖 AI 리뷰 결과

[0;34mℹ️  🎯 Primary AI: CLAUDE (1:1:1:1 균등 분배)[0m
[0;32m✅ CLAUDE 리뷰 성공![0m
[0;35m🤖 🤖 Claude Code 서브에이전트 리뷰 시작 (code-review-specialist)...[0m
[0;34mℹ️  Claude CLI 감지됨. 직접 실행을 시도합니다.[0m
# 📋 코드 리뷰 결과

**커밋**: `97ec426d` - docs: reorganize analysis files to archive directory

---

## 1. 🐛 버그 위험

이 커밋은 문서 파일의 재구성이므로 **런타임 버그 위험은 없습니다**.

다만, 문서 관련 잠재적 문제가 있습니다:

1. **docs/core/README.md 구문 오류**: YAML frontmatter와 Markdown 콘텐츠가 혼재되어 있음
   ```markdown
   ---
   category: core
   purpose: core_system_documentation
   ...
   ---
   
   # 🧩 Core Documentation
   ```
   - 원래 Markdown 콘텐츠 중간에 YAML frontmatter가 삽입되어 파싱 오류 가능성

2. **docs/deploy/README.md 불완전한 섹션**: Quick Deploy Commands와 Deployment Workflow 섹션이 삭제되었으나, 대체 문서 링크가 없음

---

## 2. 💡 개선 제안

### 2.1 아카이브 파일명 일관성
```
AI-ENGINE-OPTIMIZATION-2025-11-20.md  # 대문자, 하이픈
ai-engine-comprehensive-status-2025-11-22.md  # 소문자, 하이픈
```
**제안**: 소문자 + 하이픈 형식으로 통일 (`ai-engine-optimization-2025-11-20.md`)

### 2.2 아카이브 인덱스 파일 추가
`docs/archive/README.md` 또는 `docs/archive/INDEX.md` 생성 권장
- 8개 분석 파일의 목적과 날짜를 한눈에 파악 가능

### 2.3 docs/core/README.md 구조 정리
현재 diff에서 기존 콘텐츠와 새 콘텐츠가 충돌:
```diff
-- ## 🏗️ 시스템 (architecture/)
-+ category: core
-+ purpose: core_system_documentation
```
**제안**: YAML frontmatter를 파일 최상단으로 이동하거나, 기존 Markdown 구조 유지

---

## 3. 🔷 TypeScript 안전성

**해당 없음** - 이 커밋은 순수 문서 변경이며 TypeScript 코드가 포함되지 않음

---

## 4. 🔒 보안 이슈

**해당 없음** - 문서 재구성으로 보안 취약점 없음

다만 아카이브된 문서에 민감 정보가 없는지 확인 권장:
- ✅ API 키, 시크릿 노출 없음
- ✅ 내부 인프라 상세 정보는 일반적인 아키텍처 설명 수준

---

## 5. ⭐ 종합 평가

| 항목 | 점수 |
|------|------|
| 코드 품질 | N/A (문서) |
| 구조화 | 8/10 |
| 일관성 | 7/10 |
| 완성도 | 7/10 |

**종합 점수: 8/10**

### 한 줄 요약
> 분석 문서를 archive로 이동하여 docs 구조를 정리한 좋은 변경이나, README.md 편집 오류와 파일명 일관성 개선 필요

### 승인 여부: ✅ **조건부 승인**

**조건**:
1. `docs/core/README.md`의 구문 오류 수정 (YAML frontmatter 위치 정리)
2. (선택) 아카이브 파일명 일관성 통일

---

**리뷰어**: Claude Code Review Specialist  
**리뷰 일시**: 2025-12-01

---

## 📋 체크리스트

- [ ] 버그 위험 사항 확인 완료
- [ ] 개선 제안 검토 완료
- [ ] TypeScript 안전성 확인 완료
- [ ] 보안 이슈 확인 완료
- [ ] 종합 평가 확인 완료

---

**생성 시간**: 2025-12-01 15:20:17
**리뷰 파일**: `/mnt/d/cursor/openmanager-vibe-v5/logs/code-reviews/review-claude-code-auto-2025-12-01-15-17-42.md`
**AI 엔진**: CLAUDE-CODE-AUTO
