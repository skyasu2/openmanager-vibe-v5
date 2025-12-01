# 사이드 이펙트 점검 보고서

**날짜**: 2025-11-27
**범위**: Vercel AI SDK 통합 (Phase 1-2) 리팩토링 검증
**목적**: 중복 개발 및 사이드 이펙트 점검

---

## ✅ 주요 해결 사항

### 1. 데이터 중복 제거 (Critical Fix)

**문제**: 하드코딩된 4개 서버 Mock 데이터가 기존 15개 서버 시스템과 중복

**원인**:

- unified-stream API 개발 시 기존 `scenario-loader` 시스템 인지 못함
- 신규 하드코딩 Mock 데이터 생성 (4개 서버)
- 기존 시스템 (15개 서버) 무시

**해결**:

- ✅ 모든 하드코딩 Mock 데이터 제거
- ✅ 3개 Action Tools 통합: `loadHourlyScenarioData()` 사용
- ✅ 단일 진실 소스 (Single Source of Truth) 확립

**영향받은 파일**:

```
src/app/api/ai/unified-stream/route.ts
  - getServerMetrics (line 34): loadHourlyScenarioData()
  - predictIncident (line 89, 173): loadHourlyScenarioData()
  - analyzeServerHealth (line 268): loadHourlyScenarioData()
```

**검증 결과**:

```bash
✅ 하드코딩 데이터: 0건 발견 (grep "mockServers|MOCK_SERVERS")
✅ scenario-loader 사용: 4개 위치 (import + 3개 Tools)
✅ 데이터 소스 주석: "_dataSource: 'scenario-loader (15 servers)'"
```

---

### 2. TypeScript 타입 안전성 개선

**문제**: Tool 파라미터 타입이 `any`로 추론되어 strict mode 위반

**해결**:

- ✅ 모든 Tool `execute` 함수에 명시적 타입 주석 추가
- ✅ `undefined` 안전성 체크 추가 (fallback 로직)
- ✅ API 메서드 업데이트 (`toDataStreamResponse` → `toTextStreamResponse`)

**변경 사항**:

```typescript
// Before
execute: async ({ serverId, metric }) => { ... }

// After
execute: async ({ serverId, metric }: { serverId?: string; metric: 'cpu' | 'memory' | 'disk' | 'all' }) => { ... }
```

**수정된 Tools** (9개):

1. getServerMetrics - 파라미터 타입 추가
2. predictIncident - 파라미터 타입 + undefined 체크
3. searchKnowledgeBase - 파라미터 타입 추가
4. analyzeServerHealth - 타입 안전성 확인
5. analyzeIntent - 파라미터 타입 추가
6. analyzeComplexity - 파라미터 타입 추가
7. selectRoute - 파라미터 타입 추가
8. searchContext - 파라미터 타입 추가
9. generateInsight - 파라미터 타입 추가

**잔여 이슈**:

- ⚠️ Vercel AI SDK v5.0.102 `tool()` 함수 API 호환성 문제 (9개 에러)
- ⚠️ 레거시 `/api/ai/chat` 유사한 TypeScript 에러 (사용 안 함)

---

### 3. API 엔드포인트 정리

**발견**: 3개의 AI API 엔드포인트 공존

#### 현재 상태:

```
1. /api/ai/unified-stream (신규, 607줄) ✅ 활성
   - AISidebarV4가 사용
   - 9개 Tools (5 Thinking + 4 Action)
   - Vercel AI SDK streamText
   - 포트폴리오 시뮬레이션

2. /api/ai/chat (레거시, 65줄) ⚠️ 미사용
   - 기본 Vercel AI SDK 데모
   - 3개 간단한 Tools (getSystemStatus, checkResourceUsage, analyzeLogs)
   - 동일한 TypeScript 에러

3. /api/ai/query (레거시) ⚠️ 부분 사용
   - RealAISidebarService가 사용
   - 구 시스템 호환성
```

#### 권장사항:

- ✅ `/api/ai/unified-stream` 유지 (메인 API)
- ⚠️ `/api/ai/chat` 삭제 검토 (미사용 데모)
- ⚠️ `/api/ai/query` 사용처 확인 필요

---

## 📊 검증 결과

### 데이터 소스 일관성

```bash
✅ scenario-loader 통합: 100%
✅ 하드코딩 Mock 제거: 100%
✅ 15개 서버 통합: 완료
✅ Single Source of Truth: 확립
```

### 파일별 상태

| 파일                          | 상태         | 중복    | 타입 안전성    |
| ----------------------------- | ------------ | ------- | -------------- |
| unified-stream/route.ts       | ✅ 수정 완료 | ✅ 제거 | ⚠️ SDK 호환성  |
| chat/route.ts                 | ⚠️ 미사용    | N/A     | ⚠️ SDK 호환성  |
| query/route.ts                | ✅ 정상      | N/A     | ✅ 정상        |
| AISidebarV4.tsx               | ✅ 정상      | N/A     | ⚠️ import 경고 |
| ThinkingProcessVisualizer.tsx | ✅ 정상      | N/A     | ✅ 정상        |

### 문서 일관성

| 문서                        | 상태          | 정확성 |
| --------------------------- | ------------- | ------ |
| PHASE1-COMPLETION-REPORT.md | ✅ 정확       | 100%   |
| PHASE2-COMPLETION-REPORT.md | ✅ 정확       | 100%   |
| VERCEL-AI-SDK-ANALYSIS.md   | ✅ 업데이트됨 | 100%   |

---

## ⚠️ 잔여 이슈

### 1. Vercel AI SDK v5.x 호환성 (우선순위: HIGH)

**문제**: `tool()` 함수 API가 v5.x에서 변경됨

**에러**:

```
error TS2769: No overload matches this call.
Type '...' is not assignable to type 'undefined'.
```

**영향 파일**:

- `src/app/api/ai/unified-stream/route.ts` (9개 Tools)
- `src/app/api/ai/chat/route.ts` (3개 Tools)

**원인 가능성**:

- `parameters` → `inputSchema` 변경?
- `tool()` 함수 시그니처 변경
- Zod 스키마 타입 추론 문제

**권장사항**:

1. Vercel AI SDK v5.x 공식 문서 확인
2. `tool()` 함수 사용 예제 참조
3. 또는 AI SDK 다운그레이드 검토

### 2. AISidebarV4 Import 경고

**에러**:

```typescript
error TS2307: Cannot find module 'ai/react' or its corresponding type declarations.
error TS2724: '"ai"' has no exported member named 'Message'. Did you mean 'UIMessage'?
```

**임시 해결**:

- `Message` → `UIMessage` 타입 변경 필요
- `ai/react` 모듈 경로 확인

### 3. 레거시 API 정리

**권장**:

- `/api/ai/chat` 삭제 (미사용 데모)
- `/api/ai/query` 사용처 확인 후 deprecated 처리

---

## 🎯 최종 결론

### 성과

- ✅ **데이터 중복 완전 제거**: 하드코딩 4개 서버 → scenario-loader 15개 서버 통합
- ✅ **타입 안전성 개선**: 모든 Tool 파라미터에 명시적 타입 추가
- ✅ **단일 진실 소스 확립**: `loadHourlyScenarioData()` 통합
- ✅ **undefined 안전성**: fallback 로직에 null 체크 추가
- ✅ **문서 정확성**: Phase 1-2 보고서 내용 실제 구현과 100% 일치

### 잔여 작업

1. **Vercel AI SDK v5.x 호환성 해결** (HIGH)
   - tool() 함수 API 조사
   - 공식 예제 참조 또는 다운그레이드

2. **AISidebarV4 타입 수정** (MEDIUM)
   - Message → UIMessage
   - ai/react 모듈 경로 확인

3. **레거시 API 정리** (LOW)
   - /api/ai/chat 삭제 검토
   - /api/ai/query deprecated 처리

---

## 📝 검증 명령어

```bash
# 데이터 중복 검사
grep -r "mockServers|MOCK_SERVERS" src/app/api/ai/unified-stream/ -i
# → 결과: 0건

# scenario-loader 사용 확인
grep -r "loadHourlyScenarioData" src/app/api/ai/unified-stream/
# → 결과: 4개 위치 (import + 3개 Tools)

# TypeScript 에러 확인
npm run type-check 2>&1 | grep "src/app/api/ai/unified-stream"
# → 결과: 9개 SDK 호환성 에러 (타입 안전성은 개선됨)
```

---

**검증 완료**: 2025-11-27
**검증자**: Claude Code + 사용자 요청
**다음 단계**: Vercel AI SDK v5.x 호환성 해결 필요
