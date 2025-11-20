# Lint Refactor Progress (2025-11-13)

## ✅ 최근 정리한 영역

- `src/app/api/admin/backup-status/route.ts`: `getBackupStatus`를 동기 함수로 전환해 `require-await` 해소, 나머지 관리 액션은 그대로 유지.
- `src/app/api/admin/dashboard-config/route.ts`: GET/DELETE 핸들러의 불필요한 `async` 제거 및 lint 자동 수정.
- `src/app/api/admin/thresholds/route.ts`: GET 핸들러 동기화.
- `src/app/api/agents/health/route.ts`: GET 핸들러 동기화.
- `src/app/api/ai-analysis`, `ai-unified/*`, `ai/ml/train`, `universal-vitals`, 주요 UI/Hook 파일 등은 이전 단계에서 이미 정리되어 ESLint 통과.

## 📋 남은 해결 과제

### Admin/API 라우트

- `src/app/api/admin/{conversations,logs,stats,verify-pin}/route.ts`
- `src/app/api/ai-unified/{core,ml,monitoring}/route.ts`
- `src/app/api/ai/{edge-v2,google-ai/generate,insight-center/*,intelligent-monitoring,monitoring,performance}`, `cache-stats`, `raw-metrics`, `ml-analytics`, `logging/stream`, `thinking/stream-v2`, `ultra-fast`, `rag/benchmark` 등
- `src/app/api/{agents?,cron,debug,dev,enterprise,error-report,health,logs,metrics/*,notifications/browser,performance/*,ping,prediction,realtime/connect,system/*,time,universal-vitals}` — 주로 `require-await`, unused vars, template 타입 검사

### 시스템/모니터링 컴포넌트

- `src/app/system-boot/SystemBootClient.tsx`
- `src/components/PortMonitor.tsx`
- `src/components/accessibility/AriaLabels.tsx`

### Admin UI 및 기타

- `src/components/admin/AdminDashboardCharts.tsx`, `GCPMonitoringDashboard.tsx` 등: promise 처리, `@ts-ignore`, `no-explicit-any` 정리 필요
- 기타 `hooks`/`lib` 파일 중 아직 lint 보고된 것들 (`usePerformanceGuard`, `useRealTimeAILogs`, `useServerDashboard`, `useUnifiedTimer`, `circuit-breaker`, `gcp-functions.utils.ts` 등)

## 🔜 다음 단계

1. 남은 admin/API 라우트들을 묶어서 `require-await`/unused 변수/템플릿 타입 문제 해결 → ESLint 통과.
2. 시스템 모듈 및 Admin UI 정리.
3. `npm run lint` / `npm run test:super-fast` 재검증 후 push.

> 상태: 2025-11-13 기준, admin/agents health 라우트까지 정리 완료.
