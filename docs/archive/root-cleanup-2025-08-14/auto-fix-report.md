# 🚨 자동 수정 실패 보고서

**날짜**: 2025. 8. 14. 오후 5:35:46
**시도 횟수**: 4/5

## 📊 시도 내역

### 시도 1
- **시간**: 오후 5:34:39
- **에러 수**: 12개
- **수정 적용**: 7개

#### 에러 목록:
- **typescript** [src/components/performance/LazyComponentLoader.tsx:41]: Expression expected.
- **typescript** [src/components/performance/PerformanceMonitor.tsx:107]: Expression expected.
- **typescript** [src/components/performance/PerformanceMonitor.tsx:107]: Expression expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: Expression expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: ';' expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: Expression expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: Expression expected.
- **typescript** [src/core/system/SystemWatchdog.refactored.ts:98]: Expression expected.
- **typescript** [src/domains/ai-sidebar/components/AIEnhancedChat.tsx:152]: Expression expected.
- **typescript** [src/domains/ai-sidebar/components/ChatMessageItem.tsx:30]: Expression expected.
- ... 외 2개

#### 적용된 수정:
- TypeScript: src/components/performance/LazyComponentLoader.tsx - Expression expected.
- TypeScript: src/components/performance/PerformanceMonitor.tsx - Expression expected.
- TypeScript: src/core/system/SystemBootstrapper.ts - Expression expected.
- TypeScript: src/core/system/SystemWatchdog.refactored.ts - Expression expected.
- TypeScript: src/domains/ai-sidebar/components/AIEnhancedChat.tsx - Expression expected.
- TypeScript: src/domains/ai-sidebar/components/ChatMessageItem.tsx - Expression expected.
- TypeScript: src/hooks/useAIAssistantData.ts - Expression expected.

### 시도 2
- **시간**: 오후 5:35:32
- **에러 수**: 354개
- **수정 적용**: 10개

#### 에러 목록:
- **typescript** [src/app/dashboard/DashboardClient.tsx:48]: A 'const' assertions can only be applied to references to enum members, or string, number, boolean, array, or object literals.
- **typescript** [src/app/test/supabase-realtime/page.tsx:106]: Block-scoped variable 'loadExistingSteps' used before its declaration.
- **typescript** [src/app/test/supabase-realtime/page.tsx:106]: Variable 'loadExistingSteps' is used before being assigned.
- **typescript** [src/components/admin/LogAnalyticsDashboard.tsx:329]: Type '{ children: Element; width: string; height: number; }' is not assignable to type 'IntrinsicAttributes'.
- **typescript** [src/components/admin/LogAnalyticsDashboard.tsx:330]: Type '{ children: Element[]; data: { engine: string; requests: number; avgResponseTime: number; successRate: number; reliability: number; }[]; }' is not assignable to type 'IntrinsicAttributes'.
- **typescript** [src/components/admin/LogAnalyticsDashboard.tsx:331]: Type '{ strokeDasharray: string; }' is not assignable to type 'IntrinsicAttributes'.
- **typescript** [src/components/admin/LogAnalyticsDashboard.tsx:332]: Type '{ dataKey: string; }' is not assignable to type 'IntrinsicAttributes'.
- **typescript** [src/components/admin/LogAnalyticsDashboard.tsx:335]: Type '{ dataKey: string; fill: string; }' is not assignable to type 'IntrinsicAttributes'.
- **typescript** [src/components/admin/LogAnalyticsDashboard.tsx:347]: Type '{ children: Element; width: string; height: number; }' is not assignable to type 'IntrinsicAttributes'.
- **typescript** [src/components/admin/LogAnalyticsDashboard.tsx:348]: Type '{ children: Element[]; data: { engine: string; requests: number; avgResponseTime: number; successRate: number; reliability: number; }[]; }' is not assignable to type 'IntrinsicAttributes'.
- ... 외 344개

#### 적용된 수정:
- TypeScript: src/components/performance/LazyComponentLoader.tsx - Property 'DashboardContent' does not exist on type 'typeof import("D:/cursor/openmanager-vibe-v5/src/components/dashboard/DashboardContent")'.
- TypeScript: src/components/performance/PerformanceMonitor.tsx - Property 'navigationStart' does not exist on type 'PerformanceNavigationTiming'.
- TypeScript: src/core/system/SystemBootstrapper.ts - Property 'watchdogReport' does not exist on type '{ running: boolean; processes: Map<string, ProcessState>; metrics: SystemMetrics; }'.
- TypeScript: src/core/system/SystemWatchdog.refactored.ts - Property 'SYSTEM_ERROR' does not exist on type 'typeof SystemEventType'.
- TypeScript: src/domains/ai-sidebar/components/AIEnhancedChat.tsx - Property 'shouldGenerate' does not exist on type 'AutoReportTrigger'.
- TypeScript: src/domains/ai-sidebar/components/ChatMessageItem.tsx - Property 'type' does not exist on type 'ChatMessage'.
- TypeScript: src/hooks/useAIAssistantData.ts - Property 'query' does not exist on type 'Partial<PatternSuggestion>'.
- TypeScript: src/hooks/useRealTimeAILogs.ts - Argument of type '(prev: Set<string>) => Set<string | undefined>' is not assignable to parameter of type 'SetStateAction<Set<string>>'.
- TypeScript: src/lib/mock/SmartFallback.ts - Argument of type 'Error | null' is not assignable to parameter of type 'Error'.
- TypeScript: src/middleware.ts - Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

### 시도 3
- **시간**: 오후 5:35:46
- **에러 수**: 12개
- **수정 적용**: 7개

#### 에러 목록:
- **typescript** [src/components/performance/LazyComponentLoader.tsx:41]: Expression expected.
- **typescript** [src/components/performance/PerformanceMonitor.tsx:107]: Expression expected.
- **typescript** [src/components/performance/PerformanceMonitor.tsx:107]: Expression expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: Expression expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: ';' expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: Expression expected.
- **typescript** [src/core/system/SystemBootstrapper.ts:159]: Expression expected.
- **typescript** [src/core/system/SystemWatchdog.refactored.ts:98]: Expression expected.
- **typescript** [src/domains/ai-sidebar/components/AIEnhancedChat.tsx:152]: Expression expected.
- **typescript** [src/domains/ai-sidebar/components/ChatMessageItem.tsx:30]: Expression expected.
- ... 외 2개

#### 적용된 수정:
- TypeScript: src/components/performance/LazyComponentLoader.tsx - Expression expected.
- TypeScript: src/components/performance/PerformanceMonitor.tsx - Expression expected.
- TypeScript: src/core/system/SystemBootstrapper.ts - Expression expected.
- TypeScript: src/core/system/SystemWatchdog.refactored.ts - Expression expected.
- TypeScript: src/domains/ai-sidebar/components/AIEnhancedChat.tsx - Expression expected.
- TypeScript: src/domains/ai-sidebar/components/ChatMessageItem.tsx - Expression expected.
- TypeScript: src/hooks/useAIAssistantData.ts - Expression expected.

### 시도 4
- **시간**: 오후 5:35:46
- **에러 수**: 0개
- **수정 적용**: 0개

## 💡 권장 조치

1. 위 에러들을 수동으로 검토하고 수정하세요.
2. 특히 비즈니스 로직과 관련된 에러는 자동 수정이 어렵습니다.
3. 필요시 ESLint 규칙을 조정하거나 TypeScript 설정을 검토하세요.
4. 수정 후 `npm run validate:all`로 전체 검증을 실행하세요.
