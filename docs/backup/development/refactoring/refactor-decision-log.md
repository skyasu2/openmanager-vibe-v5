# 🔍 코드베이스 리팩토링 결정 로그

**생성일시:** 2025-05-31T10:56:07.001Z

## 📋 중복 파일 비교 결과

### 1. AISidebar

**선택된 파일:** `src/modules/ai-sidebar/components/AISidebar.tsx` (점수: 640)

**이유:** 사용횟수: 56회, TypeScript 타입 정의, Props 타입 정의, 주석 포함, React Hooks 사용, 성능 최적화 (memo), 적절한 코드 길이

**보관된 파일:**

- `src/components/ai/AISidebar.tsx` → `archive/duplicates/`

### 2. MessageBubble

**선택된 파일:** `src/components/ai/MessageBubble.tsx` (점수: 225)

**이유:** 사용횟수: 15회, TypeScript 타입 정의, Props 타입 정의, 주석 포함, React Hooks 사용, 적절한 코드 길이, Default export

**보관된 파일:**

- `src/modules/ai-sidebar/components/MessageBubble.tsx` → `archive/duplicates/`

### 3. ServerCard

**선택된 파일:** `src/components/dashboard/ServerCard/ServerCard.tsx` (점수: 665)

**이유:** 사용횟수: 58회, TypeScript 타입 정의, Props 타입 정의, 주석 포함, React Hooks 사용, 성능 최적화 (memo), 적절한 코드 길이, Default export

**보관된 파일:**

- `src/components/dashboard/ServerCard.tsx` → `archive/duplicates/`

### 4. ActionButtons

**선택된 파일:** `src/components/dashboard/ServerCard/ActionButtons.tsx` (점수: 361)

**이유:** 사용횟수: 28회, TypeScript 타입 정의, Props 타입 정의, 주석 포함, React Hooks 사용, 구조화된 함수: 3개, 적절한 코드 길이, Default export

**보관된 파일:**

- `src/modules/ai-sidebar/components/ActionButtons.tsx` → `archive/duplicates/`

### 5. ContextManager

**선택된 파일:** `src/modules/ai-agent/processors/ContextManager.ts` (점수: 490)

**이유:** 사용횟수: 45회, TypeScript 타입 정의, 주석 포함, 적절한 코드 길이

**보관된 파일:**

- `src/services/ai-agent/ContextManager.ts` → `archive/duplicates/`

## 🧹 미사용 파일 정리

**총 30개 파일 정리 (307.3KB 절약)**

- `src/lib/dummy-data.ts` (20.4KB)
- `src/lib/api-client.ts` (5.1KB)
- `src/lib/error-prevention.ts` (8.2KB)
- `src/lib/failure-pattern-engine.ts` (9.4KB)
- `src/lib/hybrid-metrics-bridge.ts` (13.2KB)
- `src/lib/react-query/queryClient.ts` (5.4KB)
- `src/lib/serverDataFactory.ts` (30.2KB)
- `src/lib/websocket.ts` (6.6KB)
- `src/utils/performance-optimizer.ts` (6.7KB)
- `src/services/ai/analytics/CorrelationAnalysisEngine.ts` (10.1KB)
- `src/services/ai/intent/UnifiedIntentClassifier.ts` (13.5KB)
- `src/services/ai/TimeSeriesPredictor.ts` (16.1KB)
- `src/services/ai-agent/AIAnalysisService.ts` (30.0KB)
- `src/services/collection-manager.ts` (6.2KB)
- `src/services/dataManager.ts` (7.6KB)
- `src/services/OptimizedRedisTimeSeriesService.ts` (18.2KB)
- `src/services/storage.ts` (16.3KB)
- `src/hooks/api/useAdvancedPrefetching.ts` (0.0KB)
- `src/hooks/api/useBackgroundRefetch.ts` (10.5KB)
- `src/hooks/api/useMemoryPoolOptimization.ts` (10.7KB)
- `src/hooks/api/useOptimisticUpdates.ts` (11.1KB)
- `src/hooks/api/useVirtualScrolling.ts` (9.2KB)
- `src/hooks/useAIAnalysis.ts` (3.2KB)
- `src/hooks/useAssistantSession.ts` (3.9KB)
- `src/hooks/useMCPAnalysis.ts` (9.4KB)
- `src/hooks/usePerformanceMonitor.ts` (10.8KB)
- `src/hooks/usePreloadComponents.ts` (7.0KB)
- `src/hooks/useServerQueries.test.tsx` (4.2KB)
- `src/hooks/useSmartQuery.ts` (1.6KB)
- `src/hooks/useSystemStatus.ts` (2.5KB)

## 🎯 최적화 효과

- **중복 제거:** 5개 그룹
- **미사용 파일 정리:** 30개
- **예상 빌드 시간 단축:** 2-3초
- **번들 크기 감소:** 약 0.3MB

## 📌 권장사항

1. 선택되지 않은 파일들은 `archive/duplicates/`에 백업됨
2. 통합이 필요한 경우 추가 리팩토링 권장
3. 테스트 코드가 있는 파일들은 추가 검토 필요
4. import 경로 업데이트 필요할 수 있음
