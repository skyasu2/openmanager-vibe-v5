# 🔄 코드 중복 제거 리팩토링 계획

## 📊 분석 결과

- **분석된 파일**: 537개
- **발견된 중복 그룹**: 5507개
- **예상 절약량**: 16.13 KB

## 🎯 우선순위별 리팩토링 계획

### 1. 중복 코드 블록 (19개 위치에서 발견, 2161B)

- **우선순위**: 1
- **노력도**: High
- **절약량**: 1.27 KB
- **영향 파일**: 9개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `hooks\api\useMCPMonitoring.ts`
- `hooks\api\useRealtimeServers.ts`
- `hooks\useSequentialServerGeneration.ts`
- `modules\ai-agent\adapters\index.ts`
- `modules\ai-agent\infrastructure\AIAgentService.ts`
- `modules\ai-sidebar\hooks\useAIActions.ts`
- `modules\ai-sidebar\hooks\useAIChat.ts`
- `modules\prometheus-integration\PrometheusDataHub.ts`
- `services\collectors\custom-api-collector.ts`

---

### 2. 중복 함수 "getServerIcon" (2개 파일에서 발견)

- **우선순위**: 2
- **노력도**: Low
- **절약량**: 1.22 KB
- **영향 파일**: 2개
- **권장사항**: 공통 유틸리티 함수로 추출하여 src/utils/ 또는 src/lib/에 배치

**영향받는 파일들:**

- `components\dashboard\AnimatedServerCard.tsx`
- `components\dashboard\EnhancedServerCard.tsx`

---

### 3. 중복 코드 블록 (14개 위치에서 발견, 2044B)

- **우선순위**: 3
- **노력도**: High
- **절약량**: 1.20 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `stories\SimulateProgressBar.stories.tsx`

---

### 4. 중복 코드 블록 (15개 위치에서 발견, 1875B)

- **우선순위**: 4
- **노력도**: High
- **절약량**: 1.10 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `stories\SimulateProgressBar.stories.tsx`

---

### 5. 중복 코드 블록 (6개 위치에서 발견, 1754B)

- **우선순위**: 5
- **노력도**: High
- **절약량**: 1.03 KB
- **영향 파일**: 3개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `services\data-generator\generators\MetricsGenerator.ts`
- `services\data-generator\managers\MetricsGenerator.ts`
- `services\data-generator\MetricsGenerator.ts`

---

### 6. 중복 코드 블록 (12개 위치에서 발견, 1752B)

- **우선순위**: 6
- **노력도**: High
- **절약량**: 1.03 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `services\ai\AISidebarService.ts`

---

### 7. 중복 코드 블록 (11개 위치에서 발견, 1710B)

- **우선순위**: 7
- **노력도**: High
- **절약량**: 1.00 KB
- **영향 파일**: 3개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `hooks\api\useMCPMonitoring.ts`
- `hooks\api\useRealtimeServers.ts`
- `utils\aiEngineConfig.ts`

---

### 8. 중복 코드 블록 (12개 위치에서 발견, 1575B)

- **우선순위**: 8
- **노력도**: High
- **절약량**: 0.92 KB
- **영향 파일**: 11개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `components\ai\enhanced-ai-interface.tsx`
- `components\ai\QAPanel.tsx`
- `components\ErrorBoundary.tsx`
- `core\ai\smart-routing-engine.ts`
- `hooks\api\useRealAI.ts`
- `hooks\useSequentialServerGeneration.ts`
- `modules\ai-sidebar\hooks\useAIActions.ts`
- `modules\ai-sidebar\hooks\useAIChat.ts`
- `services\ai\hybrid-failover-engine.ts`
- `services\ai\RealAIProcessor.ts`
- `services\SlackNotificationService.ts`

---

### 9. 중복 코드 블록 (5개 위치에서 발견, 1560B)

- **우선순위**: 9
- **노력도**: Medium
- **절약량**: 0.91 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `services\ai\engines\intent-handlers\IntentHandlers.ts`

---

### 10. 중복 코드 블록 (6개 위치에서 발견, 1554B)

- **우선순위**: 10
- **노력도**: High
- **절약량**: 0.91 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `services\ai\engines\intent-handlers\IntentHandlers.ts`

---

### 11. 중복 코드 블록 (6개 위치에서 발견, 1404B)

- **우선순위**: 11
- **노력도**: High
- **절약량**: 0.82 KB
- **영향 파일**: 3개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `services\data-generator\generators\MetricsGenerator.ts`
- `services\data-generator\managers\MetricsGenerator.ts`
- `services\data-generator\MetricsGenerator.ts`

---

### 12. 중복 코드 블록 (11개 위치에서 발견, 1389B)

- **우선순위**: 12
- **노력도**: High
- **절약량**: 0.81 KB
- **영향 파일**: 10개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `app\dashboard\components\SystemStatusWidget.tsx`
- `components\ai\PatternAnalysisWidget.tsx`
- `components\ai\sidebar\GoogleAIBetaSettings.tsx`
- `components\dashboard\AISidebar.tsx`
- `components\prediction\PredictionDashboard.tsx`
- `components\ui\InlineFeedbackSystem.tsx`
- `components\ui\SlackOnlyToastSystem.tsx`
- `modules\ai-sidebar\components\DynamicQuestionTemplates.tsx`
- `modules\ai-sidebar\components\ui\CompactQuestionTemplates.tsx`
- `modules\ai-sidebar\components\ui\ResponseDisplay.tsx`

---

### 13. 중복 코드 블록 (6개 위치에서 발견, 1386B)

- **우선순위**: 13
- **노력도**: High
- **절약량**: 0.81 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `app\admin\mcp-monitoring\page.tsx`

---

### 14. 중복 코드 블록 (15개 위치에서 발견, 1365B)

- **우선순위**: 14
- **노력도**: High
- **절약량**: 0.80 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `stories\SimulateProgressBar.stories.tsx`

---

### 15. 중복 코드 블록 (10개 위치에서 발견, 1314B)

- **우선순위**: 15
- **노력도**: High
- **절약량**: 0.77 KB
- **영향 파일**: 2개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `hooks\api\useMCPMonitoring.ts`
- `hooks\api\useRealtimeServers.ts`

---

### 16. 중복 코드 블록 (6개 위치에서 발견, 1314B)

- **우선순위**: 16
- **노력도**: High
- **절약량**: 0.77 KB
- **영향 파일**: 2개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `services\error-handling\ErrorHandlingService.ts`
- `services\ErrorHandlingService.ts`

---

### 17. 중복 코드 블록 (8개 위치에서 발견, 1288B)

- **우선순위**: 17
- **노력도**: High
- **절약량**: 0.75 KB
- **영향 파일**: 1개
- **권장사항**: 공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상

**영향받는 파일들:**

- `components\realtime\RealtimeStatus.stories.tsx`

---

## 🚀 실행 가이드

1. **Phase 1**: Low effort 항목부터 시작 (1-5번)
2. **Phase 2**: Medium effort 항목 진행 (6-12번)
3. **Phase 3**: High effort 항목 마무리 (13-17번)

각 단계마다 테스트를 실행하여 기능 정상 작동 확인 필요.
