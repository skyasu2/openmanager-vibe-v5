# 코드 단순화 작업 계획서

**작성일**: 2026-01-22
**완료일**: 2026-01-22
**상태**: ✅ 완료
**목표**: AI 코드 과잉 설계 해소 및 대용량 파일 분리
**버전**: v5.88.2

---

## 1. 분석 결과 요약

### 개선 대상

| # | 항목 | 현황 | 문제점 |
|:-:|------|------|--------|
| 2 | 에러 처리 과잉 설계 | 7개 파일, 2,520줄 | 실제 사용 3곳 (등록만) |
| 3 | AI 코드 과도한 추상화 | AIErrorHandler 420줄 | 1곳에서만 사용 |
| 4 | ReactFlowDiagram.tsx | 996줄, 7개+ 컴포넌트 | 단일 파일에 모든 코드 |

### Catch 문 분포 (569개 / 224개 파일)

| 파일 | catch 수 | 비고 |
|------|:--------:|------|
| supabase-auth.ts | 14 | 인증 로직 |
| RecoveryService.ts | 12 | 에러 복구 (미사용) |
| supabase-rag-engine.ts | 12 | AI RAG |
| process-configs.ts | 12 | 시스템 프로세스 |
| useSystemControl.ts | 12 | 시스템 제어 훅 |

---

## 2. 개선 대상 #2: 에러 처리 과잉 설계

### 2.1 현황

```
src/services/error-handling/
├── ErrorHandlingService.ts     (251줄) - 통합 서비스
├── core/
│   └── ErrorHandlingCore.ts    (266줄) - 핵심 로직
├── handlers/
│   └── DefaultErrorHandlers.ts (339줄) - 핸들러 모음
├── monitoring/
│   └── ErrorMonitoringService.ts (506줄) - 모니터링
├── recovery/
│   └── RecoveryService.ts      (632줄) - 복구 로직
└── types/
    └── ErrorTypes.ts           (357줄) - 타입 정의

총 2,351줄, 실제 사용처: service-registry.ts (등록만)
```

### 2.2 문제 분석

1. **과도한 계층화**: 5개 레이어 (Service → Core → Handlers → Monitoring → Recovery)
2. **미사용 기능**: 복구 서비스, 모니터링 서비스가 실제로 호출되지 않음
3. **중복**: 기존 Pino 로거와 Sentry가 이미 에러 로깅/모니터링 담당

### 2.3 개선 방안

#### Option A: 완전 제거 (권장)

```typescript
// Before: 복잡한 계층
ErrorHandlingService → ErrorHandlingCore → Handlers → Monitoring → Recovery

// After: Pino + Sentry로 대체
logger.error('에러 발생', { error, context });
Sentry.captureException(error);
```

**삭제 대상:**
- `src/services/error-handling/` 전체 (7개 파일)
- `src/lib/service-registry.ts`에서 등록 코드 제거

#### Option B: 최소 유지

```
src/services/error-handling/
└── index.ts (100줄 이하) - 단순 래퍼만 유지
```

### 2.4 체크리스트 ✅

- [x] 에러 처리 서비스 사용처 확인 (0곳 실제 호출, DI 등록만)
- [x] Pino + Sentry로 대체 가능 여부 검증 → 이미 대체됨
- [x] service-registry.ts에서 등록 코드 제거
- [x] 6개 파일 삭제 (-2,407줄)
- [x] 테스트 통과 확인 (228개 테스트)

---

## 3. 개선 대상 #3: AI 코드 과도한 추상화

### 3.1 현황

```
src/lib/ai/errors/
└── AIErrorHandler.ts (420줄)
    - AIErrorType enum (17개 에러 타입)
    - AIError class
    - AIErrorHandler class (retry 로직)
    - withRetry 유틸리티

사용처: 1곳 (src/lib/ai/)
```

### 3.2 문제 분석

1. **중복 로직**: Vercel AI SDK가 이미 retry 로직 내장
2. **과도한 에러 타입**: 17개 타입 중 실제 사용 5개 미만
3. **복잡한 클래스**: 단순 함수로 대체 가능

### 3.3 개선 방안

#### Before (420줄)
```typescript
// 복잡한 클래스 기반
const handler = new AIErrorHandler();
await handler.withRetry(async () => {
  return await aiCall();
}, { maxRetries: 3 });
```

#### After (50줄)
```typescript
// 단순 유틸리티 함수
import { retry } from '@/lib/utils/retry';

await retry(() => aiCall(), {
  attempts: 3,
  delay: 1000
});
```

### 3.4 체크리스트 ✅

- [x] AIErrorHandler 사용처 분석 → 0곳 (import만 존재, 호출 없음)
- [x] Vercel AI SDK retry 옵션으로 대체 → 이미 SDK에서 처리
- [x] AIErrorHandler.ts 전체 삭제 (-421줄)
- [x] 테스트 통과 확인 (228개 테스트)

---

## 4. 개선 대상 #4: ReactFlowDiagram.tsx 분리

### 4.1 현황

```
src/components/shared/ReactFlowDiagram.tsx (996줄)
├── 상수 (6개): FIT_VIEW_OPTIONS, DEFAULT_VIEWPORT, NODE_*, LABEL_*, SWIMLANE_*
├── 타입 (4개): ReactFlowDiagramProps, CustomNodeData, SwimlaneBgData, 등
├── 컴포넌트 (5개):
│   ├── AutoFitView (함수)
│   ├── DiagramErrorBoundary (클래스)
│   ├── CustomNode (memo)
│   ├── LayerLabelNode (memo)
│   └── SwimlaneBgNode (memo)
├── 레이아웃 함수 (2개):
│   ├── getLayoutedElements
│   └── fallbackDagreLayout
├── 변환 함수 (1개): convertToReactFlow
└── 메인 컴포넌트: ReactFlowDiagram
```

### 4.2 분리 계획

```
src/components/shared/react-flow-diagram/
├── index.tsx               (메인 컴포넌트, ~200줄)
├── types.ts                (타입 정의, ~50줄)
├── constants.ts            (상수, ~40줄)
├── nodes/
│   ├── CustomNode.tsx      (~100줄)
│   ├── LayerLabelNode.tsx  (~40줄)
│   └── SwimlaneBgNode.tsx  (~50줄)
├── layout/
│   ├── dagre-layout.ts     (getLayoutedElements, ~150줄)
│   └── fallback-layout.ts  (fallbackDagreLayout, ~60줄)
├── utils/
│   └── converter.ts        (convertToReactFlow, ~250줄)
├── components/
│   ├── AutoFitView.tsx     (~50줄)
│   └── ErrorBoundary.tsx   (~60줄)
└── styles.ts               (NODE_STYLES, ~40줄)
```

### 4.3 체크리스트 ✅

- [x] 디렉토리 구조 생성 (src/components/shared/react-flow-diagram/)
- [x] types.ts 분리 (46줄)
- [x] constants.ts 분리 (81줄)
- [x] nodes/ 컴포넌트 분리 (CustomNode, LayerLabelNode, SwimlaneBgNode)
- [x] layout/ 함수 분리 (layer-layout.ts, dagre-fallback.ts)
- [x] utils/converter.ts 분리 (253줄)
- [x] components/ 분리 (AutoFitView, DiagramErrorBoundary)
- [x] index.tsx에서 re-export (171줄)
- [x] 기존 import 경로 호환성 유지 (wrapper 파일)
- [x] 테스트 통과 확인 (228개 테스트)

---

## 5. 실행 우선순위

| 순위 | 항목 | 영향도 | 난이도 | 리스크 |
|:----:|------|:------:|:------:|:------:|
| 1 | #4 ReactFlowDiagram 분리 | 낮음 | 중간 | 낮음 |
| 2 | #3 AIErrorHandler 단순화 | 중간 | 낮음 | 낮음 |
| 3 | #2 에러 처리 서비스 제거 | 중간 | 높음 | 중간 |

### 권장 순서

```
Week 1: #4 ReactFlowDiagram 분리
        └── 파일 분리만, 로직 변경 없음

Week 2: #3 AIErrorHandler 단순화
        └── Vercel AI SDK retry로 대체

Week 3: #2 에러 처리 서비스 제거
        └── Pino + Sentry로 대체
        └── 충분한 테스트 후 진행
```

---

## 6. 실제 결과 ✅

### 코드량 변화

| 항목 | Before | After | 감소량 |
|------|:------:|:-----:|:------:|
| error-handling/ | 2,350줄 | 0줄 | **-2,407줄** |
| AIErrorHandler.ts | 421줄 | 0줄 | **-421줄** |
| ReactFlowDiagram.tsx | 996줄 | 15개 모듈 | 분산 (모듈화) |
| **총계** | 3,767줄 | - | **~2,828줄 제거** |

### 품질 개선 ✅

- [x] 코드 복잡도 감소
- [x] 유지보수 용이성 향상
- [x] 단일 책임 원칙 준수
- [x] 불필요한 추상화 제거
- [x] YAGNI 원칙 적용

---

## 7. 롤백 계획

각 단계별 커밋 후 문제 발생 시:
```bash
git revert HEAD  # 해당 커밋 되돌리기
```

---

## 8. 성공 기준 ✅ 달성

| 항목 | 목표 | 결과 |
|------|------|------|
| 에러 처리 파일 | 0개 (제거) | ✅ 0개 |
| AIErrorHandler | 50줄 이하 | ✅ 0줄 (완전 제거) |
| ReactFlowDiagram | 200줄 이하 | ✅ 171줄 (index.tsx) |
| 테스트 | 100% 통과 | ✅ 228/228 통과 |
| TypeScript | 컴파일 성공 | ✅ 성공 |
| Lint | 에러 없음 | ✅ 통과 |

---

## 9. 참고 자료

- [KISS 원칙](https://en.wikipedia.org/wiki/KISS_principle)
- [YAGNI 원칙](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)
- [Vercel AI SDK Retry](https://sdk.vercel.ai/docs/ai-sdk-core/settings)
- [기존 계획서: code-improvement-plan.md](./code-improvement-plan.md)

---

**작성 완료**: 2026-01-22 07:20 KST
**실행 완료**: 2026-01-22 09:25 KST

### 커밋 이력
- `cf8e268fa` - refactor(diagram): split ReactFlowDiagram into modular structure
- `1a923831b` - refactor(ai): remove unused AIErrorHandler module
- `def882f95` - refactor(services): remove unused ErrorHandlingService
