# 📈 OpenManager VIBE v5 - 남은 과제 정리

> **마지막 갱신**: 2025-12-08
> **현재 버전**: v5.80.0
> **목적**: 실제 적용해야 할 남은 과제만 정리

---

## ✅ 완료된 작업 (아카이브 대상)

| Phase | 작업 | 상태 |
|-------|------|------|
| 1.1 | ESLint 경고 정리 (251→84개) | ✅ 완료 |
| 1.2 | TypeScript strict 모드 | ✅ 유지 중 |
| 2.1 | 게스트 모드 UI (모달) | ✅ 완료 |
| 2.2 | AI 스트리밍 응답 | ✅ 완료 |
| 2.3 | 대시보드 최적화 | ✅ 완료 |
| 3.1 | E2E 테스트 (28개) | ✅ 완료 |
| 3.2 | 통합 테스트 (40+개) | ✅ 완료 |
| 4.1 | 번들 최적화 (<500KB) | ✅ 완료 |
| Major | Next.js 16 + React 19 업그레이드 | ✅ 완료 |

---

## ⏳ 남은 과제 (우선순위 순)

### 🔴 HIGH - 즉시 처리 가능

#### 1. Dead Code 정리 (30분)
**파일**: `src/config/serverConfig.ts`

```typescript
// Lines 100-119: serverCount === 8 조건 - 항상 undefined
// → 제거 필요 (DEFAULT_SERVER_COUNT = 15 고정)

// Line 326: getAllServersInfo() - 하드코딩 8 → 15 수정
export function getAllServersInfo() {
  return Array.from({ length: ACTIVE_SERVER_CONFIG.maxServers }, ...);
}
```

#### 2. 주석 업데이트 (10분)
**파일**: `src/components/dashboard/ServerDashboard.tsx` Line 266

```typescript
// 수정 전: // ⚡ 15개 전체 보기: 가상 스크롤 (react-window)
// 수정 후: // ⚡ 15개 전체 보기: 반응형 그리드 + 더보기 버튼
```

#### 3. resize 이벤트 debounce (20분)
**파일**: `src/components/dashboard/VirtualizedServerList.tsx`

```typescript
// debounce 150ms 추가 - 성능 개선
const debouncedCalculate = debounce(calculateCardsPerRow, 150);
```

---

### 🟡 MEDIUM - 주간 작업

#### 4. 이미지 최적화 (Phase 4.2)
- [ ] Next.js Image 컴포넌트 적용
- [ ] WebP 자동 변환
- [ ] priority/placeholder 설정
- **예상 시간**: 2-3시간

#### 5. 캐싱 전략 개선 (Phase 4.3)
- [ ] SWR 전략 적용
- [ ] 캐시 무효화 로직 개선
- [ ] TTL 계층화 (5분/30분/1시간)
- **예상 시간**: 5-6시간

---

### 🟢 LOW - 장기 계획

#### 6. 기능 확장 (Phase 5)

| 기능 | 설명 | 난이도 |
|------|------|--------|
| 5.1 대화 컨텍스트 | 세션 기반 대화 히스토리 | 중간 |
| 5.2 멀티모달 | 이미지 업로드 + Gemini Vision | 높음 |
| 5.3 알림 시스템 | Supabase Realtime 기반 | 중간 |

#### 7. RAG 엔진 리팩토링
**파일**: `src/services/ai/supabase-rag-engine.ts` (1100줄)

분리 대상:
- `src/types/rag/rag-types.ts` - 타입 정의
- `src/utils/rag/rag-utils.ts` - 유틸리티
- `src/services/rag/memory-rag-cache.ts` - 캐시 서비스
- `src/services/rag/keyword-extractor.ts` - 키워드 추출

#### 8. UI/UX 고도화

| 개선 | 설명 | 우선순위 |
|------|------|----------|
| Sparklines | 카드 내 CPU/메모리 트렌드 라인 | 중간 |
| Bento Grid | 대시보드 요약 레이아웃 | 낮음 |
| AI Insights 배지 | "Unusual Load" 등 자동 표시 | 낮음 |

#### 9. AI 아키텍처 확장 (선택)

| 기능 | 현재 | 목표 |
|------|------|------|
| Code Execution | 정적 생성 | Sandbox (WebAssembly) |
| RAG | pgvector | GraphRAG |
| Voice/Audio | 텍스트만 | Gemini Native Audio |

---

## 📊 우선순위 매트릭스

| 작업 | 중요도 | 긴급도 | 난이도 | 시간 |
|------|--------|--------|--------|------|
| Dead Code 정리 | ⭐⭐ | ⭐⭐⭐ | 낮음 | 30분 |
| 주석 업데이트 | ⭐ | ⭐⭐ | 낮음 | 10분 |
| resize debounce | ⭐⭐ | ⭐⭐ | 낮음 | 20분 |
| 이미지 최적화 | ⭐⭐ | ⭐ | 낮음 | 3시간 |
| 캐싱 개선 | ⭐⭐ | ⭐ | 중간 | 6시간 |
| 대화 컨텍스트 | ⭐⭐ | ⭐ | 중간 | 5시간 |
| RAG 리팩토링 | ⭐⭐ | ⭐ | 높음 | 8시간 |

---

## 🗑️ 아카이브 대상 문서

완료된 계획서들 → `docs/archive/completed/`로 이동:

1. `major-version-upgrade-plan.md` - 모든 업그레이드 완료
2. `analysis/FEATURE-CARDS-REVIEW.md` - 리뷰 완료
3. `archive/ai-engine-refactoring-summary.md` - 이미 아카이브

---

## 📝 다음 단계

### 이번 주 (Quick Wins)
1. [ ] Dead Code 정리 (30분)
2. [ ] 주석 업데이트 (10분)
3. [ ] resize debounce 추가 (20분)

### 다음 주
4. [ ] 이미지 최적화 시작

### 월간
5. [ ] 캐싱 전략 개선
6. [ ] RAG 리팩토링 계획 수립

---

**작성자**: Claude Code
**최종 업데이트**: 2025-12-08
