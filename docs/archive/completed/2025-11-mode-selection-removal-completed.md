# AI 모드 선택 UI 제거 (v4.0)

**날짜**: 2025-11-26
**버전**: v4.0
**작업 시간**: 6-7시간 (계획)
**상태**: 구현 완료 (Phase 4/7)

---

## 📋 변경 사항 요약

### 제거된 컴포넌트 (4개, ~1,196줄)

- `AIModeSelector.tsx` (200줄) - AI 모드 선택 UI
- `CompactModeSelector.tsx` (223줄) - 컴팩트 모드 선택 UI
- `AIEngineTest.tsx` (372줄) - AI 엔진 테스트 도구
- `AIEnginesPanel.tsx` (401줄) - 개발자 패널

### 타입 시스템 단순화

**변경 전** (`src/types/ai-types.ts`):

```typescript
export type AIMode = 'UNIFIED' | 'LOCAL' | 'GOOGLE_AI' | 'AUTO';
```

**변경 후**:

```typescript
/**
 * AI 모드 정의 v4.0 (단순화 완료)
 * - UNIFIED: 단일 통합 엔진 (Supabase RAG + Google Cloud Functions + Gemini)
 * @since v3.2.0 - 자동 라우팅으로 단일 모드 사용
 * @since v4.0 - 타입 단순화 (LOCAL, GOOGLE_AI, AUTO 제거)
 */
export type AIMode = 'UNIFIED';

/**
 * 레거시 AI 모드 (하위 호환성)
 * @deprecated v6.0에서 완전 제거 예정
 */
export type LegacyAIMode = 'LOCAL' | 'GOOGLE_AI' | 'AUTO';
```

### 상태 관리 정리

#### Zustand Store (useAISidebarStore)

- `currentEngine` 필드 제거 (6개 위치)
- persist 설정에서 currentEngine 제거
- 초기 상태 단순화

#### useAIEngine Hook

- 193줄 → 132줄 (61줄 감소, 31% 축소)
- 모든 메서드가 UNIFIED 고정값 반환
- localStorage 자동 마이그레이션 추가

#### localStorage 마이그레이션

**새 파일**: `src/utils/migrations/ai-mode-cleanup.ts`

- `selected-ai-engine`: 모든 값 → UNIFIED
- `ai-sidebar-storage`: currentEngine 필드 제거
- 레거시 키 삭제: `ai-mode`, `aiMode`, `selected-mode`

### API 레이어 업데이트

#### `/src/app/api/ai/query/route.ts`

```typescript
// AI 모드 (v4.0: UNIFIED로 고정, 자동 라우팅)
// Legacy mode 파라미터는 무시됨 (하위 호환성 유지)
const aiMode = 'UNIFIED';

// 레거시 모드 파라미터 경고
const bodyWithMode = body as AIQueryRequest & {
  mode?: string;
  aiMode?: string;
};
if (bodyWithMode.mode && bodyWithMode.mode !== 'UNIFIED') {
  console.warn(
    `[Deprecated] AI mode "${bodyWithMode.mode}"는 더 이상 지원되지 않습니다. UNIFIED 사용.`
  );
}
```

#### `/src/domains/ai-sidebar/services/RealAISidebarService.ts`

```typescript
// 변경 전
body: JSON.stringify({
  query: question,
  mode: 'local-ai', // 제거됨
  // ...
});

// 변경 후
body: JSON.stringify({
  query: question,
  // v4.0: mode 파라미터 제거 (UNIFIED로 자동 선택)
  // ...
});
```

---

## 🎯 변경 이유

### 1. 시스템 자동화

v3.2.0부터 AI 엔진은 자동 라우팅을 통해 최적 엔진을 선택합니다:

- **Supabase RAG**: 벡터 검색 기반 지식 베이스
- **ML 예측**: 기계학습 모델 추론
- **Google AI Gemini**: 자연어 처리 및 복잡한 쿼리

수동 선택이 불필요하므로 UI를 제거하여 사용자 경험을 단순화했습니다.

### 2. 코드베이스 단순화

- **제거된 코드**: ~1,196줄
- **단순화된 타입**: AIMode 값 4개 → 1개
- **유지보수성 향상**: 복잡한 모드 전환 로직 제거

### 3. 일관된 사용자 경험

모든 사용자가 동일한 고품질 AI 응답을 받도록 보장합니다.

---

## 👨‍💻 개발자 가이드

### API 호출 방법

#### ✅ 권장 방법 (v4.0+)

```typescript
const response = await fetch('/api/ai/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '서버 상태를 알려주세요',
    temperature: 0.7,
    maxTokens: 1000,
    context: 'general',
    includeThinking: true,
    // mode 파라미터 생략 (자동 UNIFIED 사용)
  }),
});
```

#### ⚠️ 레거시 호환 (하위 호환성)

```typescript
// mode 파라미터를 전달해도 무시됨
body: JSON.stringify({
  query: '...',
  mode: 'GOOGLE_AI', // 무시됨, console.warn() 발생
});
// 실제로는 UNIFIED 사용
```

### Hook 사용 (하위 호환성)

#### useAIEngine Hook

```typescript
import { useAIEngine } from '@/domains/ai-sidebar/hooks/useAIEngine';

function MyComponent() {
  const {
    currentEngine, // 항상 'UNIFIED'
    selectedEngine, // 항상 'UNIFIED'
    showEngineInfo, // 항상 false
    getEngineEndpoint, // 항상 '/api/ai/query'
  } = useAIEngine();

  // 이 Hook은 하위 호환성을 위해 유지되지만
  // 신규 개발 시에는 직접 API 호출 권장
}
```

### localStorage 마이그레이션

마이그레이션은 자동으로 실행됩니다:

```typescript
// src/utils/migrations/ai-mode-cleanup.ts
import { migrateAIModeStorage } from '@/utils/migrations/ai-mode-cleanup';

// 앱 초기화 시 자동 실행 (useEffect 또는 _app.tsx)
useEffect(() => {
  migrateAIModeStorage();
}, []);
```

**마이그레이션 로직**:

1. `selected-ai-engine`: `LOCAL`, `GOOGLE_AI`, `AUTO` → `UNIFIED`
2. `ai-sidebar-storage`: `currentEngine` 필드 삭제
3. 레거시 키 삭제: `ai-mode`, `aiMode`, `selected-mode`
4. 마이그레이션 플래그 설정: `ai-mode-migration-v4`

---

## 🧪 테스트

### 단위 테스트

```bash
npm run test -- tests/integration/ai-unified-mode.test.ts
```

### 수동 테스트 체크리스트

- [ ] AI 채팅 정상 작동 확인
- [ ] localStorage에 `selected-ai-engine: UNIFIED` 확인
- [ ] 레거시 mode 파라미터 전달 시 console.warn() 확인
- [ ] useAIEngine Hook이 UNIFIED 값 반환 확인

---

## 📊 영향 분석

### 긍정적 영향

- ✅ 코드베이스 단순화 (~1,196줄 제거)
- ✅ 유지보수성 향상 (복잡한 모드 전환 로직 제거)
- ✅ 일관된 사용자 경험 (모든 사용자가 동일한 AI 품질)
- ✅ TypeScript 타입 안정성 향상 (단일 리터럴 타입)

### 하위 호환성

- ✅ 레거시 mode 파라미터 무시 (에러 없음)
- ✅ useAIEngine Hook 유지 (단순화됨)
- ✅ localStorage 자동 마이그레이션
- ⚠️ deprecated 경고 표시 (개발자 콘솔)

### Breaking Changes

- ❌ 없음 (완전한 하위 호환성 유지)

---

## 🔮 향후 계획

### v5.0 (2025 Q2)

- useAIEngine Hook을 완전히 제거하고 직접 API 호출 권장
- LegacyAIMode 타입 제거

### v6.0 (2025 Q3)

- 모든 deprecated 코드 완전 제거
- 마이그레이션 스크립트 제거 (모든 사용자가 마이그레이션 완료 가정)

---

## 📚 관련 문서

- [프로젝트 상태](../status.md) - v4.0 변경사항
- [CLAUDE.md](../../CLAUDE.md) - AI 시스템 개요
- [AI 타입 정의](../../src/types/ai-types.ts) - AIMode 타입
- [마이그레이션 스크립트](../../src/utils/migrations/ai-mode-cleanup.ts)

---

**마지막 업데이트**: 2025-11-26
**작성자**: Claude Code
**버전**: v4.0
