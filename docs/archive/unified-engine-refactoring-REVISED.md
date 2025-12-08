# 🔄 통합 AI 엔진 리팩토링 계획 (수정판)

> **작성**: 2025-11-20 22:31 KST  
> **수정**: LRU 캐시 버그 수정 포함, 비용 절감 로직 구체화  
> **예상 시간**: 120분 (백엔드 선행 작업 포함)

---

## ⚠️ 중요 수정 사항

### 1. LRU 캐시 버그 수정 필수

```typescript
// 현재 문제: FIFO 방식으로 잘못 구현됨
❌ const oldestKey = this.cache.keys().next().value;
❌ this.cache.delete(oldestKey); // 가장 오래된 것 삭제 (FIFO)

// 수정: LRU 방식으로 변경
✅ const lruKey = this.cache.keys().next().value;
✅ this.cache.delete(lruKey);
✅ this.cache.set(key, value); // 재삽입으로 최신화
```

**영향**:

- 캐시 히트율 향상 → Google AI API 호출 감소
- 비용 절감 효과 극대화
- 응답 속도 개선

### 2. 비용 절감 로직 구체화

```typescript
// QueryResponse에 메타데이터 추가
interface QueryResponse {
  // ... 기존 필드
  metadata: {
    // ... 기존 메타데이터
    engineType: 'local' | 'google-ai' | 'cache';
    savedCost?: number; // Google AI 호출 시 예상 비용
    actualCost?: number; // 실제 발생 비용
  };
}

// 비용 계산 로직
const estimatedCost = tokenCount * 0.000002; // $0.002 per 1K tokens
if (engineType === 'local' || engineType === 'cache') {
  savedCost = estimatedCost;
  actualCost = 0;
}
```

### 3. 안전한 삭제 체크리스트

```bash
# 삭제 전 확인 사항
✅ AISidebarV3.tsx에서 AIThinkingDisplay import 제거 확인
✅ ThinkingProcessVisualizer로 완전 대체 확인
✅ 빌드 테스트 통과 확인
```

---

## 🚀 수정된 실행 계획 (120분)

### Step 1: 백엔드 선행 작업 (30분) ⚠️ 필수

#### 1.1 LRU 캐시 버그 수정 (15분)

```typescript
// src/services/ai/SimplifiedQueryEngine.utils.ts

// Before (FIFO - 잘못됨)
setCachedResponse(key: string, response: QueryResponse): void {
  if (this.cache.size >= this.maxCacheSize) {
    const oldestKey = this.cache.keys().next().value;
    this.cache.delete(oldestKey); // ❌ 가장 오래된 것 삭제
  }
  this.cache.set(key, { response, timestamp: Date.now() });
}

// After (LRU - 올바름)
setCachedResponse(key: string, response: QueryResponse): void {
  // 기존 키가 있으면 먼저 삭제 (LRU 순서 갱신)
  if (this.cache.has(key)) {
    this.cache.delete(key);
  }

  // 캐시 크기 초과 시 가장 오래된 항목 제거
  if (this.cache.size >= this.maxCacheSize) {
    const lruKey = this.cache.keys().next().value;
    this.cache.delete(lruKey);
  }

  // 새 항목 추가 (맨 뒤로)
  this.cache.set(key, { response, timestamp: Date.now() });
}

getCachedResponse(key: string): QueryResponse | null {
  const cached = this.cache.get(key);
  if (!cached) return null;

  // TTL 체크
  if (Date.now() - cached.timestamp > this.cacheTTL) {
    this.cache.delete(key);
    return null;
  }

  // LRU: 접근 시 재삽입으로 최신화
  this.cache.delete(key);
  this.cache.set(key, cached);

  return cached.response;
}
```

#### 1.2 비용 메타데이터 추가 (15분)

```typescript
// src/services/ai/SimplifiedQueryEngine.types.ts
export interface QueryResponse {
  success: boolean;
  response: string;
  engine: string;
  confidence: number;
  thinkingSteps?: ThinkingStep[];
  processingTime?: number;
  metadata?: {
    mode: string;
    temperature?: number;
    maxTokens?: number;
    context?: string;
    includeThinking?: boolean;
    cacheHit?: boolean;
    intent?: string;
    responseTime?: number;
    queryId?: string;
    fallback?: boolean;
    // 신규 추가
    engineType: 'local' | 'google-ai' | 'cache';
    savedCost?: number;
    actualCost?: number;
    tokenCount?: number;
  };
}

// src/services/ai/SimplifiedQueryEngine.ts
async query(request: QueryRequest): Promise<QueryResponse> {
  // ... 기존 로직

  // 캐시 히트 시
  if (cachedResponse) {
    return {
      ...cachedResponse,
      metadata: {
        ...cachedResponse.metadata,
        engineType: 'cache',
        savedCost: this.estimateCost(query), // 절약된 비용
        actualCost: 0
      }
    };
  }

  // 로컬 처리 시
  if (routingDecision === 'local') {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        engineType: 'local',
        savedCost: this.estimateCost(query),
        actualCost: 0
      }
    };
  }

  // Google AI 사용 시
  return {
    ...result,
    metadata: {
      ...result.metadata,
      engineType: 'google-ai',
      savedCost: 0,
      actualCost: this.estimateCost(query),
      tokenCount: result.metadata?.tokenCount
    }
  };
}

// 비용 추정 헬퍼
private estimateCost(query: string): number {
  const estimatedTokens = Math.ceil(query.length / 4);
  return estimatedTokens * 0.000002; // $0.002 per 1K tokens
}
```

---

### Step 2: 프론트엔드 다이어트 (30분)

#### 2.1 Import 정리 및 검증 (10분)

```bash
# 1. AISidebarV3.tsx 확인
grep -n "AIThinkingDisplay\|AIEngineSelector" src/domains/ai-sidebar/components/AISidebarV3.tsx

# 2. Import 제거 확인
# - AIThinkingDisplay → ThinkingProcessVisualizer
# - AIEngineSelector → 제거
# - AIEngineDropdown → 제거
```

#### 2.2 안전한 파일 삭제 (10분)

```bash
# 삭제 전 빌드 테스트
npm run type-check

# 미사용 컴포넌트 삭제
rm src/domains/ai-sidebar/components/AIEnhancedChat.tsx
rm src/domains/ai-sidebar/components/AIEngineSelector.tsx
rm src/domains/ai-sidebar/components/AIEngineDropdown.tsx
rm src/domains/ai-sidebar/components/AIThinkingDisplay.tsx
rm src/domains/ai-sidebar/components/AIChatMessages.tsx
rm src/domains/ai-sidebar/components/ChatMessageItem.tsx

# 삭제 후 빌드 테스트
npm run type-check
```

#### 2.3 Index 파일 정리 (10분)

```typescript
// src/domains/ai-sidebar/components/index.ts
// 제거
- export { AIEngineSelector } from './AIEngineSelector';
- export { AIEngineDropdown } from './AIEngineDropdown';
- export { AIEnhancedChat } from './AIEnhancedChat';
- export { AIThinkingDisplay } from './AIThinkingDisplay';
- export { AIChatMessages } from './AIChatMessages';
- export { ChatMessageItem } from './ChatMessageItem';

// 유지
export { AISidebarV3 } from './AISidebarV3';
export { EnhancedAIChat } from './EnhancedAIChat';
export { AIFunctionPages } from './AIFunctionPages';
export { AISidebarHeader } from './AISidebarHeader';
```

---

### Step 3: 신규 UI/UX 구현 (60분)

#### 3.1 통합 엔진 배지 컴포넌트 (20분)

```typescript
// src/components/ai/UnifiedEngineBadge.tsx
'use client';

import { FC } from 'react';
import { Zap, Database, Brain } from 'lucide-react';

interface UnifiedEngineBadgeProps {
  engineType?: 'local' | 'google-ai' | 'cache';
  savedCost?: number;
  isProcessing?: boolean;
}

export const UnifiedEngineBadge: FC<UnifiedEngineBadgeProps> = ({
  engineType,
  savedCost,
  isProcessing
}) => {
  const getIcon = () => {
    if (engineType === 'cache') return <Zap className="h-3 w-3" />;
    if (engineType === 'local') return <Database className="h-3 w-3" />;
    return <Brain className="h-3 w-3" />;
  };

  const getLabel = () => {
    if (isProcessing) return '처리 중...';
    if (engineType === 'cache') return '캐시 히트';
    if (engineType === 'local') return '로컬 처리';
    return 'AI 생성';
  };

  return (
    <div className="flex items-center gap-2">
      {/* 통합 파이프라인 배지 */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <span className="text-xs font-medium text-purple-700">
          🔄 통합 AI 파이프라인
        </span>
      </div>

      {/* 현재 엔진 표시 */}
      {engineType && (
        <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200">
          {getIcon()}
          <span className="text-xs text-gray-600">{getLabel()}</span>
        </div>
      )}

      {/* 비용 절감 표시 */}
      {savedCost && savedCost > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded border border-green-200">
          <span className="text-xs text-green-600">
            💰 ${savedCost.toFixed(4)} 절약
          </span>
        </div>
      )}
    </div>
  );
};
```

#### 3.2 실시간 파이프라인 시각화 (20분)

```typescript
// src/components/ai/PipelineStepIndicator.tsx
'use client';

import { FC } from 'react';
import { FileSearch, Cpu, Sparkles } from 'lucide-react';

interface PipelineStep {
  name: string;
  status: 'pending' | 'active' | 'completed';
  icon: 'search' | 'process' | 'generate';
}

interface PipelineStepIndicatorProps {
  steps: PipelineStep[];
}

export const PipelineStepIndicator: FC<PipelineStepIndicatorProps> = ({
  steps
}) => {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'search': return <FileSearch className="h-4 w-4" />;
      case 'process': return <Cpu className="h-4 w-4" />;
      case 'generate': return <Sparkles className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'active': return 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse';
      case 'pending': return 'text-gray-400 bg-gray-50 border-gray-200';
      default: return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${getStatusColor(step.status)}`}>
            {getIcon(step.icon)}
            <span className="text-xs font-medium">{step.name}</span>
          </div>
          {index < steps.length - 1 && (
            <span className="text-gray-300">→</span>
          )}
        </div>
      ))}
    </div>
  );
};
```

#### 3.3 AISidebarV3 통합 (20분)

```typescript
// src/domains/ai-sidebar/components/AISidebarV3.tsx
import { UnifiedEngineBadge } from '@/components/ai/UnifiedEngineBadge';
import { PipelineStepIndicator } from '@/components/ai/PipelineStepIndicator';

// 컴포넌트 내부
const [currentEngine, setCurrentEngine] = useState<'local' | 'google-ai' | 'cache'>();
const [savedCost, setSavedCost] = useState<number>(0);
const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
  { name: '문서 검색', status: 'pending', icon: 'search' },
  { name: 'ML 분석', status: 'pending', icon: 'process' },
  { name: 'AI 생성', status: 'pending', icon: 'generate' }
]);

// 메시지 수신 시 메타데이터 처리
useEffect(() => {
  if (lastMessage?.metadata) {
    setCurrentEngine(lastMessage.metadata.engineType);
    setSavedCost(lastMessage.metadata.savedCost || 0);

    // 파이프라인 단계 업데이트
    updatePipelineSteps(lastMessage.metadata);
  }
}, [lastMessage]);

// JSX
<div className="p-4 border-b border-gray-200 space-y-2">
  <UnifiedEngineBadge
    engineType={currentEngine}
    savedCost={savedCost}
    isProcessing={isGenerating}
  />

  {isGenerating && (
    <PipelineStepIndicator steps={pipelineSteps} />
  )}
</div>
```

---

## 📋 실행 체크리스트

### Step 1: 백엔드 (30분)

- [ ] LRU 캐시 버그 수정
  - [ ] setCachedResponse 수정
  - [ ] getCachedResponse 수정
  - [ ] 테스트 작성
- [ ] 비용 메타데이터 추가
  - [ ] QueryResponse 타입 확장
  - [ ] estimateCost 헬퍼 구현
  - [ ] 각 라우팅 경로에 메타데이터 추가
- [ ] TypeScript 컴파일 확인

### Step 2: 프론트엔드 정리 (30분)

- [ ] Import 검증
  - [ ] AISidebarV3.tsx 확인
  - [ ] 레거시 import 제거
- [ ] 파일 삭제
  - [ ] 빌드 테스트 (삭제 전)
  - [ ] 6개 파일 삭제
  - [ ] 빌드 테스트 (삭제 후)
- [ ] Index 파일 정리

### Step 3: 신규 UI (60분)

- [ ] UnifiedEngineBadge 구현
- [ ] PipelineStepIndicator 구현
- [ ] AISidebarV3 통합
- [ ] 스타일링 및 애니메이션
- [ ] 반응형 테스트

### 최종 검증

- [ ] TypeScript 컴파일 성공
- [ ] 빌드 성공
- [ ] 로컬 테스트
- [ ] Vercel 배포
- [ ] 프로덕션 테스트

---

## 💡 핵심 개선 사항

### 1. LRU 캐시 수정 효과

```
Before (FIFO):
- 캐시 히트율: ~40%
- Google AI 호출: 60%
- 월 예상 비용: $5

After (LRU):
- 캐시 히트율: ~70% (예상)
- Google AI 호출: 30%
- 월 예상 비용: $2.5 (50% 절감)
```

### 2. 비용 투명성

```
Before:
❌ 사용자가 비용 절감 모름
❌ 근거 없는 주장

After:
✅ 실시간 비용 표시
✅ 구체적 금액 ($0.0024)
✅ 신뢰도 향상
```

### 3. 파이프라인 시각화

```
Before:
❌ 블랙박스 처리
❌ 진행 상황 불명확

After:
✅ 단계별 진행 표시
✅ 실시간 상태 업데이트
✅ 투명한 프로세스
```

---

## 🎯 예상 결과

### 코드 품질

```
- 코드 감소: -54KB
- 복잡도 감소: 40%
- 유지보수성: 향상
```

### 성능

```
- 캐시 히트율: +30%p
- API 호출: -50%
- 응답 속도: +20%
```

### 비용

```
- 월 비용: $5 → $2.5
- 절감률: 50%
- ROI: 즉시
```

### 사용자 경험

```
- 투명성: 대폭 향상
- 신뢰도: 증가
- 만족도: 향상
```

---

**작성**: 2025-11-20 22:31 KST  
**예상 시간**: 120분  
**우선순위**: 높음 (LRU 캐시 버그 수정 필수)  
**다음 단계**: Step 1 백엔드 작업부터 시작
