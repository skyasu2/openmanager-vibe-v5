# 코드 단순화 작업 계획서

**작성일**: 2026-01-22
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

### 2.4 체크리스트

- [ ] 에러 처리 서비스 사용처 확인 (3곳)
- [ ] Pino + Sentry로 대체 가능 여부 검증
- [ ] service-registry.ts에서 등록 코드 제거
- [ ] 7개 파일 삭제
- [ ] 테스트 통과 확인

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

### 3.4 체크리스트

- [ ] AIErrorHandler 사용처 분석 (1곳)
- [ ] Vercel AI SDK retry 옵션으로 대체
- [ ] 필요한 에러 타입만 유지 (5개 이하)
- [ ] AIErrorHandler.ts 420줄 → 50줄 이하로 축소
- [ ] 테스트 통과 확인

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

### 4.3 체크리스트

- [ ] 디렉토리 구조 생성
- [ ] types.ts 분리
- [ ] constants.ts 분리
- [ ] nodes/ 컴포넌트 분리
- [ ] layout/ 함수 분리
- [ ] utils/converter.ts 분리
- [ ] components/ 분리
- [ ] index.tsx에서 re-export
- [ ] 기존 import 경로 호환성 유지
- [ ] 테스트 통과 확인

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

## 6. 예상 결과

### 코드량 변화

| 항목 | Before | After | 감소량 |
|------|:------:|:-----:|:------:|
| error-handling/ | 2,351줄 | 0줄 | -2,351줄 |
| AIErrorHandler.ts | 420줄 | 50줄 | -370줄 |
| ReactFlowDiagram.tsx | 996줄 | 200줄 | -796줄 (분산) |
| **총계** | 3,767줄 | 250줄 | **-3,517줄** |

### 품질 개선

- 코드 복잡도 감소
- 유지보수 용이성 향상
- 단일 책임 원칙 준수
- 불필요한 추상화 제거

---

## 7. 롤백 계획

각 단계별 커밋 후 문제 발생 시:
```bash
git revert HEAD  # 해당 커밋 되돌리기
```

---

## 8. 성공 기준

| 항목 | 측정 방법 | 목표 |
|------|----------|------|
| 에러 처리 파일 | `ls src/services/error-handling` | 0개 (제거) |
| AIErrorHandler | `wc -l` | 50줄 이하 |
| ReactFlowDiagram | 메인 파일 | 200줄 이하 |
| 테스트 | `npm run test:quick` | 100% 통과 |
| 빌드 | `npm run build` | 성공 |

---

## 9. 참고 자료

- [KISS 원칙](https://en.wikipedia.org/wiki/KISS_principle)
- [YAGNI 원칙](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)
- [Vercel AI SDK Retry](https://sdk.vercel.ai/docs/ai-sdk-core/settings)
- [기존 계획서: code-improvement-plan.md](./code-improvement-plan.md)

---

**작성 완료**: 2026-01-22 07:20 KST
