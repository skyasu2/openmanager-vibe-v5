# P2: 대용량 파일 분리 작업계획서

**작성일**: 2026-01-10
**버전**: v5.84.2
**작성자**: Claude Opus 4.5

---

## 개요

코드베이스 품질 기준(파일당 500줄 이하)을 충족하기 위해 800줄 이상 파일 4개를 분리합니다.

| 파일 | 현재 | 목표 | 우선순위 |
|------|:----:|:----:|:--------:|
| `AutoReportPage.tsx` | 941줄 | ~300줄 | 1 |
| `postgres-vector-db.ts` | 911줄 | ~300줄 | 2 |
| `lib/ai/core/types.ts` | 816줄 | ~200줄 | 3 |
| `types/server.ts` | 806줄 | ~200줄 | 4 |

---

## 1. AutoReportPage.tsx (941줄) → ~300줄

### 현재 구조 분석

```
AutoReportPage.tsx
├── Interface: IncidentReport (12 properties)
├── Function: extractNumericValue
├── Function: AutoReportPage (main component)
│   ├── State: reports, filter, selectedReport, etc.
│   ├── Handlers: handleGenerateReport, handleDownload, handleResolve
│   ├── Helper: getSeverityIcon
│   └── Render: tabs, filters, report cards, detail view
```

### 분리 계획

```
src/components/ai/pages/auto-report/
├── index.tsx                    (~150줄) - 메인 페이지, re-export
├── AutoReportHeader.tsx         (~100줄) - 헤더, 탭, 필터
├── AutoReportCard.tsx           (~150줄) - 리포트 카드 컴포넌트
├── AutoReportDetail.tsx         (~200줄) - 상세 보기 모달
├── AutoReportActions.tsx        (~100줄) - 생성, 다운로드, 해결 버튼
├── hooks/
│   └── useAutoReport.ts         (~150줄) - 상태 관리 로직
├── utils/
│   └── report-helpers.ts        (~50줄) - extractNumericValue 등
└── types.ts                     (~50줄) - IncidentReport 인터페이스
```

### 예상 효과
- 컴포넌트 테스트 용이성 향상
- 재사용 가능한 UI 컴포넌트 분리
- 로직과 표현 분리 (hooks)

---

## 2. postgres-vector-db.ts (911줄) → ~300줄

### 현재 구조 분석

```
postgres-vector-db.ts
├── Interfaces (6개): DocumentMetadata, SearchResult, VectorDocument, etc.
├── Class: PostgresVectorDB
│   ├── Properties: supabase, tableName, dimension, isInitialized
│   ├── Core Methods: store, search, getDocument, deleteDocument
│   ├── Advanced Search: hybridSearch, searchByKeywords, searchByMetadata
│   ├── Utility: bulkStore, updateMetadata, getStats, getCategoryStats
│   └── Internal: _initialize, cosineSimilarity, fallbackSearch
└── Export: postgresVectorDB (singleton)
```

### 분리 계획

```
src/services/ai/vector-db/
├── index.ts                     (~50줄) - re-export, singleton
├── PostgresVectorDB.ts          (~200줄) - 메인 클래스 (core methods)
├── VectorSearchService.ts       (~200줄) - 검색 관련 메서드
│   └── search, hybridSearch, searchByKeywords, searchByMetadata
├── VectorStorageService.ts      (~150줄) - 저장 관련 메서드
│   └── store, bulkStore, deleteDocument, updateMetadata
├── VectorStatsService.ts        (~100줄) - 통계 관련
│   └── getStats, getCategoryStats, benchmarkSearch
├── utils/
│   └── vector-utils.ts          (~80줄) - cosineSimilarity, fallback
└── types.ts                     (~120줄) - 모든 인터페이스
```

### 예상 효과
- 단일 책임 원칙(SRP) 준수
- 검색/저장/통계 기능 독립적 테스트 가능
- 의존성 주입(DI) 패턴 적용 용이

---

## 3. lib/ai/core/types.ts (816줄) → ~200줄

### 현재 구조 분석

```
types.ts
├── Request/Response Types (8개): UnifiedQueryRequest, UnifiedQueryResponse, etc.
├── Provider Types (12개): ProviderContext, RAGData, MLData, RuleData, etc.
├── Config Types (6개): EngineConfig, CacheConfig, ProvidersConfig, etc.
├── Error Classes (3개): CloudRunAIError, ProviderError, UnifiedEngineError
├── Utility Types (6개): DeepPartial, DeepRequired, PickByValue, etc.
└── Type Guards (4개): isValidScenario, isRAGData, isMLData, isRuleData
```

### 분리 계획

```
src/lib/ai/core/types/
├── index.ts                     (~40줄) - re-export all
├── request-response.ts          (~150줄) - 요청/응답 타입
│   └── UnifiedQueryRequest, UnifiedQueryResponse, RequestContext
├── provider.ts                  (~200줄) - 프로바이더 관련 타입
│   └── ProviderContext, RAGData, MLData, RuleData, ProviderOptions
├── config.ts                    (~120줄) - 설정 타입
│   └── EngineConfig, CacheConfig, ProvidersConfig
├── errors.ts                    (~100줄) - 에러 클래스
│   └── CloudRunAIError, ProviderError, UnifiedEngineError
├── utilities.ts                 (~80줄) - 유틸리티 타입
│   └── DeepPartial, DeepRequired, PickByValue, OmitByValue
└── guards.ts                    (~60줄) - 타입 가드 함수
    └── isValidScenario, isRAGData, isMLData, isRuleData
```

### 예상 효과
- 도메인별 타입 그룹화
- Import 최적화 (필요한 타입만 가져오기)
- 타입 변경 시 영향 범위 최소화

---

## 4. types/server.ts (806줄) → ~200줄

### 현재 구조 분석

```
server.ts
├── Core Types (6개): Server, ServerInstance, EnhancedServerMetrics
├── Metric Types (4개): MetricsHistory, TimeSeriesMetrics, NetworkInfo
├── Status Types (4개): ServerStatus, ServerAlert, SystemOverview
├── Config Types (4개): ServerTypeDefinition, FailureScenario
├── Response Types (2개): RealtimeServersResponse, PaginationInfo
├── Constants (2개): SERVER_TYPE_DEFINITIONS, FAILURE_IMPACT_GRAPH
└── Type Guards (4개): isServer, isEnhancedServerMetrics, etc.
```

### 분리 계획

```
src/types/server/
├── index.ts                     (~40줄) - re-export all
├── core.ts                      (~180줄) - 기본 서버 타입
│   └── Server, ServerInstance, EnhancedServerMetrics, ServerMetadata
├── metrics.ts                   (~150줄) - 메트릭 관련 타입
│   └── MetricsHistory, TimeSeriesMetrics, NetworkInfo, ProcessInfo
├── status.ts                    (~120줄) - 상태/알림 타입
│   └── ServerStatus, ServerAlert, SystemOverview, Service
├── config.ts                    (~150줄) - 설정/시나리오 타입
│   └── ServerTypeDefinition, FailureScenario, SimulationState
├── response.ts                  (~80줄) - API 응답 타입
│   └── RealtimeServersResponse, PaginationInfo, DataStorage
├── constants.ts                 (~100줄) - 상수 정의
│   └── SERVER_TYPE_DEFINITIONS, FAILURE_IMPACT_GRAPH
└── guards.ts                    (~50줄) - 타입 가드 함수
    └── isServer, isEnhancedServerMetrics, isValidAlertSeverity
```

### 예상 효과
- 서버 관련 타입의 명확한 분류
- 상수와 타입의 분리
- 타입 가드 함수 집중 관리

---

## 실행 순서

```
Phase 1: 타입 파일 분리 (영향도 낮음, 빠른 검증)
├── Step 1.1: types/server.ts 분리
└── Step 1.2: lib/ai/core/types.ts 분리

Phase 2: 서비스 파일 분리
└── Step 2.1: postgres-vector-db.ts 분리

Phase 3: 컴포넌트 파일 분리 (UI 테스트 필요)
└── Step 3.1: AutoReportPage.tsx 분리
```

---

## 리팩토링 원칙

### 1. 하위 호환성 유지
```typescript
// 기존 import 유지
import { Server, ServerStatus } from '@/types/server';

// 새 구조에서 re-export
// src/types/server/index.ts
export * from './core';
export * from './status';
// ...
```

### 2. 점진적 마이그레이션
- 기존 파일 → 새 디렉토리 구조 생성 → re-export 설정 → 기존 파일 삭제
- 각 단계에서 TypeScript 컴파일 및 테스트 검증

### 3. Import 경로 일관성
```typescript
// 권장: 배럴 파일에서 import
import { Server, MetricsHistory } from '@/types/server';

// 필요시: 특정 파일에서 직접 import (tree-shaking)
import { Server } from '@/types/server/core';
```

---

## 검증 체크리스트

각 파일 분리 후 검증:
- [ ] `npm run type-check` - TypeScript 컴파일 성공
- [ ] `npm run test:quick` - 단위 테스트 통과
- [ ] `npm run lint` - Biome 린트 통과
- [ ] 기존 import 경로에서 정상 작동 확인

전체 완료 후 검증:
- [ ] `npm run build` - 프로덕션 빌드 성공
- [ ] 800줄 이상 파일 0개 확인
- [ ] 모든 테스트 통과

---

## 리스크 및 완화

| 리스크 | 영향도 | 완화 방안 |
|--------|:------:|----------|
| Import 경로 변경으로 인한 빌드 실패 | 높음 | re-export로 기존 경로 유지 |
| 순환 참조 발생 | 중간 | 의존성 방향 설계 시 주의 |
| 타입 추론 실패 | 낮음 | 명시적 타입 선언 추가 |

---

## 예상 결과

| 항목 | Before | After |
|------|:------:|:-----:|
| 800줄+ 파일 수 | 4개 | 0개 |
| 평균 파일 크기 | ~870줄 | ~150줄 |
| 모듈 수 | 4개 | ~25개 |
| 테스트 커버리지 | 유지 | 향상 예상 |

---

**작성 완료**: 2026-01-10 12:45 KST
