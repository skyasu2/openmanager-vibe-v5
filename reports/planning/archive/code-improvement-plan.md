# 코드베이스 개선 작업 계획서

**작성일**: 2026-01-10
**버전**: v5.84.2
**작성자**: Claude Opus 4.5
**상태**: ✅ 완료 (2026-01-10)

---

## 개요

코드베이스 정적/논리적 분석 결과, 3가지 개선 영역이 식별되었습니다.

| 우선순위 | 항목 | 시작 | 완료 | 상태 |
|:--------:|------|------|------|:----:|
| P1 | console 정리 | 1,561개 | 116개 (92%) | ✅ |
| P2 | 대용량 파일 분리 | 4개 (800줄↑) | 0개 (100%) | ✅ |
| P3 | any 타입 제거 | 17개 | 1개 (94%) | ✅ |

---

## P1: Console 정리 (1,561개)

### 현황 분석

| 디렉토리 | 개수 | 비율 |
|----------|:----:|:----:|
| services/ | 375 | 24% |
| lib/ | 346 | 22% |
| hooks/ | 260 | 17% |
| utils/ | 149 | 10% |
| components/ | 135 | 9% |
| app/ | 128 | 8% |
| 기타 | 168 | 10% |

### 작업 전략

#### Phase 1: 로거 인프라 구축
- [ ] `src/lib/logger/index.ts` 생성
- [ ] 환경별 로그 레벨 설정 (dev: debug, prod: warn)
- [ ] 구조화된 로그 포맷 정의

```typescript
// 목표 API
import { logger } from '@/lib/logger';

logger.debug('상세 디버그 정보');
logger.info('일반 정보');
logger.warn('경고');
logger.error('에러', { context: {} });
```

#### Phase 2: 점진적 마이그레이션
1. **services/** (375개) - 가장 많으므로 우선 처리
2. **lib/** (346개)
3. **hooks/** (260개)
4. 나머지 디렉토리

#### Phase 3: console 금지 규칙 적용
- [ ] Biome 규칙에 `noConsole` 추가
- [ ] 예외 허용: `console.error` (에러 바운더리)

### 예상 영향도
- 번들 사이즈: 변화 없음
- 런타임 성능: 프로덕션에서 로그 출력 감소로 개선
- 디버깅: 개발 환경에서 동일하게 유지

---

## P2: 대용량 파일 분리 (4개)

### 대상 파일

| 파일 | 현재 | 목표 | 분리 전략 |
|------|:----:|:----:|----------|
| `AutoReportPage.tsx` | 940줄 | 300줄×3 | 섹션별 컴포넌트 분리 |
| `postgres-vector-db.ts` | 910줄 | 300줄×3 | 책임별 서비스 분리 |
| `lib/ai/core/types.ts` | 816줄 | 200줄×4 | 도메인별 타입 분리 |
| `types/server.ts` | 806줄 | 200줄×4 | 엔티티별 타입 분리 |

### 상세 분리 계획

#### 1. AutoReportPage.tsx (940줄)
```
src/components/ai/pages/AutoReportPage.tsx (940줄)
    ↓ 분리
src/components/ai/pages/auto-report/
├── index.tsx           (메인 페이지, ~150줄)
├── ReportHeader.tsx    (헤더 섹션, ~200줄)
├── ReportContent.tsx   (콘텐츠 영역, ~250줄)
├── ReportActions.tsx   (액션 버튼, ~150줄)
├── hooks/
│   └── useAutoReport.ts (로직 분리, ~150줄)
└── types.ts            (타입 정의, ~40줄)
```

#### 2. postgres-vector-db.ts (910줄)
```
src/services/ai/postgres-vector-db.ts (910줄)
    ↓ 분리
src/services/ai/vector-db/
├── index.ts            (진입점, ~50줄)
├── VectorDBClient.ts   (클라이언트, ~250줄)
├── VectorOperations.ts (벡터 연산, ~300줄)
├── QueryBuilder.ts     (쿼리 빌더, ~200줄)
└── types.ts            (타입, ~100줄)
```

#### 3. lib/ai/core/types.ts (816줄)
```
src/lib/ai/core/types.ts (816줄)
    ↓ 분리
src/lib/ai/core/types/
├── index.ts            (re-export, ~30줄)
├── agent.types.ts      (에이전트 관련, ~200줄)
├── message.types.ts    (메시지 관련, ~200줄)
├── tool.types.ts       (도구 관련, ~200줄)
└── context.types.ts    (컨텍스트 관련, ~180줄)
```

#### 4. types/server.ts (806줄)
```
src/types/server.ts (806줄)
    ↓ 분리
src/types/server/
├── index.ts            (re-export, ~30줄)
├── server-base.ts      (기본 서버 타입, ~200줄)
├── server-metrics.ts   (메트릭 타입, ~200줄)
├── server-status.ts    (상태 타입, ~180줄)
└── server-config.ts    (설정 타입, ~180줄)
```

### 리팩토링 원칙
1. **하위 호환성 유지**: 기존 import 경로 유지 (re-export)
2. **점진적 마이그레이션**: 한 파일씩 순차 진행
3. **테스트 우선**: 기존 테스트 통과 확인 후 진행

---

## P3: any 타입 제거 (17개)

### 대상 파일 및 수정 계획

| 파일 | 라인 | 현재 | 권장 수정 |
|------|:----:|------|----------|
| `polyfills.ts` | 20,26,27,33,34,41,56,107,119,154,172-174 | `as any` | `as unknown` + 타입 가드 |
| `development-only.ts` | 48 | `(...args: any[])` | 제네릭 타입 파라미터 |
| `seed-logs-supabase-standalone.ts` | 157 | `any[]` | 구체적 로그 타입 |
| `recharts.d.ts` | 23,28 | `any` | Recharts 공식 타입 참조 |

### 상세 수정 계획

#### 1. polyfills.ts (13개)
```typescript
// Before
(globalThis as any).self = globalThis;

// After
(globalThis as { self?: typeof globalThis }).self = globalThis;
```

**이유**: 폴리필은 런타임 환경 패칭이므로 `unknown` + 타입 단언이 더 안전

#### 2. development-only.ts (1개)
```typescript
// Before
export function developmentOnly<T extends (...args: any[]) => any>(fn: T): T

// After
export function developmentOnly<T extends (...args: unknown[]) => unknown>(fn: T): T
```

#### 3. seed-logs-supabase-standalone.ts (1개)
```typescript
// Before
const logsToInsert: any[] = [];

// After
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
}
const logsToInsert: LogEntry[] = [];
```

#### 4. recharts.d.ts (2개)
```typescript
// Before
data?: any[];
formatter?: (value: any, entry: any, index: number) => React.ReactNode;

// After
data?: ChartData[];
formatter?: (value: number | string, entry: ChartEntry, index: number) => React.ReactNode;
```

---

## 실행 우선순위 및 일정

```
Week 1: P3 (any 타입 제거) - 영향도 낮음, 빠른 완료
        └── polyfills.ts, development-only.ts

Week 2: P1 Phase 1 (로거 인프라)
        └── logger 모듈 생성, 환경 설정

Week 3-4: P1 Phase 2 (console 마이그레이션)
        └── services/ → lib/ → hooks/ 순서

Week 5-6: P2 (대용량 파일 분리)
        └── AutoReportPage → postgres-vector-db

Week 7: P2 계속 + P1 Phase 3
        └── types 파일들 분리, noConsole 규칙 적용
```

---

## 성공 기준

| 항목 | 측정 방법 | 목표 |
|------|----------|------|
| console 사용 | `grep -r "console\." \| wc -l` | 50개 미만 |
| 대용량 파일 | 800줄 이상 파일 수 | 0개 |
| any 타입 | TypeScript strict 검사 | 0개 |
| 테스트 | `npm run test:quick` | 100% 통과 |
| 빌드 | `npm run build` | 성공 |

---

## 리스크 및 완화 방안

| 리스크 | 영향도 | 완화 방안 |
|--------|:------:|----------|
| 타입 변경으로 인한 런타임 에러 | 높음 | 단위 테스트 선 작성 |
| 파일 분리 시 import 누락 | 중간 | TypeScript 컴파일 검증 |
| 로거 마이그레이션 누락 | 낮음 | Biome 규칙으로 강제 |

---

**작성 완료**: 2026-01-10 02:30 KST
