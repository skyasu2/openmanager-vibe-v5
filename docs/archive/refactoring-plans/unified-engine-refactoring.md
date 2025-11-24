# 🔄 통합 AI 엔진 리팩토링 계획

> **작성**: 2025-11-20 22:24 KST  
> **목표**: Supabase RAG + GCP Functions + Google AI API 단일 파이프라인  
> **현재 상태**: 이미 통합 파이프라인 작동 중, UI만 정리 필요

---

## 🎯 핵심 개념

### 현재 아키텍처 (이미 통합됨)

```
사용자 쿼리
    ↓
SimplifiedQueryEngine (단일 엔진)
    ↓
┌─────────────────────────────────┐
│  Intelligent Routing            │
│  - Intent Classification        │
│  - Complexity Analysis          │
│  - 자동 엔진 선택               │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  통합 파이프라인                │
│  1. Supabase RAG (문서 검색)    │
│  2. GCP Functions (ML/NLP)      │
│  3. Google AI API (Gemini)      │
└─────────────────────────────────┘
    ↓
통합 응답
```

### 문제점

```
❌ UI에 "LOCAL" / "GOOGLE_AI" 모드 선택 표시
❌ 사용자가 선택해도 무시됨 (자동 라우팅)
❌ 혼란스러운 UX
❌ 불필요한 코드 유지
```

---

## 📊 제거 대상

### 1. 모드 관련 타입

```typescript
// src/types/ai-types.ts
❌ export type AIMode = 'LOCAL' | 'GOOGLE_AI';

✅ // 완전 제거 또는
✅ export type AIMode = 'UNIFIED'; // 단일 값
```

### 2. 모드 선택 UI

```typescript
// 제거 대상
❌ AIEngineSelector.tsx
❌ AIEngineDropdown.tsx
❌ CompactModeSelector.tsx (있다면)
```

### 3. 모드 관련 상태

```typescript
// useAISidebarStore.ts
❌ aiMode: 'LOCAL' | 'GOOGLE_AI'
❌ setAiMode()

✅ // 제거 또는 단순화
✅ engine: 'UNIFIED' // 읽기 전용
```

### 4. 모드 관련 훅

```typescript
// useAIEngine.ts
❌ const { aiMode, setAiMode } = useAIEngine();

✅ // 제거 또는 단순화
✅ const { engineInfo } = useAIEngine(); // 정보만 제공
```

---

## ✅ 유지/개선 대상

### 1. SimplifiedQueryEngine (핵심)

```typescript
✅ 유지: Intelligent Routing
✅ 유지: Intent Classification
✅ 유지: Complexity Analysis
✅ 유지: 자동 엔진 선택
✅ 유지: 통합 파이프라인
```

### 2. 정보 표시 (신규)

```typescript
// 새 컴포넌트: AIEngineInfo.tsx
interface AIEngineInfo {
  pipeline: 'unified';
  currentStep: 'rag' | 'gcp' | 'gemini';
  routingReason: string;
  costSaved?: number;
}

// 표시 예시
('🔄 통합 AI 파이프라인');
('📊 현재: Gemini 분석 중...');
('💰 비용 절약: $0.02');
```

### 3. ThinkingProcessVisualizer

```typescript
✅ 유지: 라우팅 정보 표시
✅ 유지: 단계별 진행 상황
✅ 개선: 통합 파이프라인 강조
```

---

## 🔧 리팩토링 단계

### Phase 1: 타입 정리 (10분)

```typescript
// 1. src/types/ai-types.ts
- export type AIMode = 'LOCAL' | 'GOOGLE_AI';
+ export type AIEngine = 'UNIFIED';

// 2. 모든 AIMode 참조 제거
// 3. 'UNIFIED' 또는 제거
```

### Phase 2: UI 컴포넌트 제거 (15분)

```bash
# 모드 선택 UI 제거
rm src/domains/ai-sidebar/components/AIEngineSelector.tsx
rm src/domains/ai-sidebar/components/AIEngineDropdown.tsx

# Import 정리
# - EnhancedAIChat.tsx
# - AISidebarV3.tsx
# - index.ts
```

### Phase 3: 상태 관리 단순화 (15분)

```typescript
// useAISidebarStore.ts
interface AISidebarStore {
  // 제거
  - aiMode: AIMode;
  - setAiMode: (mode: AIMode) => void;

  // 추가 (선택)
  + engineInfo?: {
  +   pipeline: 'unified';
  +   currentStep?: string;
  + };
}
```

### Phase 4: 훅 단순화 (10분)

```typescript
// useAIEngine.ts
// 전체 제거 또는 정보 제공만

export function useAIEngineInfo() {
  return {
    pipeline: 'unified',
    description: 'Supabase RAG + GCP Functions + Google AI API',
    features: [
      'Intelligent Routing',
      'Auto Engine Selection',
      'Cost Optimization',
    ],
  };
}
```

### Phase 5: API 라우트 정리 (5분)

```typescript
// src/app/api/ai/query/route.ts
// mode 파라미터 제거 또는 무시

- const { query, mode, context } = await req.json();
+ const { query, context } = await req.json();

// 항상 통합 파이프라인 사용
const result = await simplifiedQueryEngine.query({
  query,
  context,
  // mode 파라미터 없음
});
```

---

## 📝 코드 변경 예시

### Before (현재)

```typescript
// EnhancedAIChat.tsx
<CompactModeSelector
  selectedMode={aiMode}
  onModeChange={handleModeChange}
/>

// 사용자가 선택해도 무시됨
```

### After (개선)

```typescript
// EnhancedAIChat.tsx
<AIEngineInfo
  pipeline="unified"
  description="자동 최적화된 AI 파이프라인"
/>

// 정보만 표시, 선택 불가
```

---

## 🎨 새로운 UI 제안

### 1. 통합 파이프라인 배지

```typescript
<div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
  <span className="text-sm font-medium text-purple-700">
    🔄 통합 AI 파이프라인
  </span>
  <span className="text-xs text-gray-600">
    자동 최적화
  </span>
</div>
```

### 2. 실시간 단계 표시

```typescript
<div className="text-xs text-gray-500">
  {currentStep === 'rag' && '📚 문서 검색 중...'}
  {currentStep === 'gcp' && '🔧 ML 분석 중...'}
  {currentStep === 'gemini' && '🤖 AI 생성 중...'}
</div>
```

### 3. 비용 절감 표시

```typescript
<div className="flex items-center gap-1 text-xs text-green-600">
  <span>💰</span>
  <span>비용 절약: $0.02</span>
</div>
```

---

## 📊 예상 효과

### 코드 감소

```
제거 대상:
- AIEngineSelector.tsx (5.5KB)
- AIEngineDropdown.tsx (5.3KB)
- useAIEngine.ts (일부)
- 모드 관련 타입 및 상태

총 감소: ~15KB
```

### UX 개선

```
Before:
❌ "LOCAL 모드" vs "GOOGLE_AI 모드" 선택
❌ 선택해도 무시됨
❌ 혼란스러움

After:
✅ "통합 AI 파이프라인" 단일 표시
✅ 자동 최적화 강조
✅ 명확한 정보 제공
```

### 유지보수 개선

```
Before:
❌ 2개 모드 관리
❌ 모드 전환 로직
❌ 조건부 렌더링

After:
✅ 단일 파이프라인
✅ 단순한 로직
✅ 명확한 구조
```

---

## 🚀 실행 계획

### Step 1: 분석 및 계획 (완료)

```
✅ 현재 상태 분석
✅ 제거 대상 식별
✅ 리팩토링 계획 수립
```

### Step 2: 타입 및 인터페이스 정리 (10분)

```bash
# 1. AIMode 타입 제거/단순화
# 2. 관련 인터페이스 업데이트
# 3. Import 정리
```

### Step 3: UI 컴포넌트 제거 (15분)

```bash
# 1. 모드 선택 컴포넌트 삭제
# 2. Import 제거
# 3. Props 정리
```

### Step 4: 상태 관리 단순화 (15분)

```bash
# 1. useAISidebarStore 정리
# 2. useAIEngine 단순화
# 3. 관련 훅 업데이트
```

### Step 5: 새 UI 구현 (20분)

```bash
# 1. AIEngineInfo 컴포넌트 생성
# 2. 통합 파이프라인 배지 추가
# 3. 실시간 단계 표시 추가
```

### Step 6: 테스트 및 검증 (10분)

```bash
# 1. TypeScript 컴파일
# 2. 빌드 테스트
# 3. 기능 테스트
```

**총 예상 시간**: 80분

---

## 💡 추가 개선 제안

### 1. 파이프라인 시각화

```typescript
<PipelineVisualizer
  steps={[
    { name: 'RAG 검색', status: 'completed', time: '120ms' },
    { name: 'GCP 분석', status: 'completed', time: '340ms' },
    { name: 'Gemini 생성', status: 'active', time: '...' }
  ]}
/>
```

### 2. 성능 메트릭 표시

```typescript
<PerformanceMetrics
  totalTime="1.2s"
  cacheHit={false}
  costSaved="$0.02"
  tokensUsed={450}
/>
```

### 3. 파이프라인 설정 (고급)

```typescript
// 관리자 전용
<PipelineSettings
  enableRAG={true}
  enableGCP={true}
  enableGemini={true}
  fallbackStrategy="graceful"
/>
```

---

## 📋 체크리스트

### 제거 작업

- [ ] AIMode 타입 제거/단순화
- [ ] AIEngineSelector.tsx 삭제
- [ ] AIEngineDropdown.tsx 삭제
- [ ] aiMode 상태 제거
- [ ] setAiMode 함수 제거
- [ ] 모드 관련 Import 정리

### 신규 구현

- [ ] AIEngineInfo 컴포넌트
- [ ] 통합 파이프라인 배지
- [ ] 실시간 단계 표시
- [ ] 비용 절감 표시

### 테스트

- [ ] TypeScript 컴파일
- [ ] 빌드 성공
- [ ] UI 정상 표시
- [ ] 기능 정상 작동

---

## 🎯 결론

### 현재 상태

```
✅ 백엔드: 이미 통합 파이프라인 작동 중
❌ 프론트엔드: 불필요한 모드 선택 UI
❌ 사용자 경험: 혼란스러움
```

### 개선 후

```
✅ 백엔드: 통합 파이프라인 유지
✅ 프론트엔드: 단순하고 명확한 UI
✅ 사용자 경험: 자동 최적화 강조
```

### 핵심 메시지

**"Supabase RAG + GCP Functions + Google AI API = 하나의 통합 파이프라인"**

---

**작성**: 2025-11-20 22:24 KST  
**예상 시간**: 80분  
**코드 감소**: ~15KB  
**다음 단계**: Phase 1 타입 정리부터 시작
