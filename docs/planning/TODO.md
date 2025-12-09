# TODO - OpenManager VIBE v5

> **갱신**: 2025-12-09
> **버전**: v5.80.0

---

## 🔴 HIGH - 즉시 처리 (1시간)

### 1. Dead Code 정리 (30분)

**파일**: `src/config/serverConfig.ts`

```typescript
// Lines 100-119: serverCount === 8 조건 제거 (DEFAULT_SERVER_COUNT = 15 고정)
// Line 326: getAllServersInfo() 하드코딩 8 → 15 수정
```

### 2. 주석 업데이트 (10분)

**파일**: `src/components/dashboard/ServerDashboard.tsx` Line 266

```typescript
// 수정: "가상 스크롤 (react-window)" → "반응형 그리드 + 더보기 버튼"
```

### 3. resize debounce 추가 (20분)

**파일**: `src/components/dashboard/VirtualizedServerList.tsx`

```typescript
const debouncedCalculate = debounce(calculateCardsPerRow, 150);
```

---

## 🟡 MEDIUM - 주간 작업

### 4. 이미지 최적화 (3시간)

- [ ] Next.js Image 컴포넌트 적용
- [ ] WebP 자동 변환
- [ ] priority/placeholder 설정

### 5. 캐싱 전략 개선 (6시간)

- [ ] SWR 전략 적용
- [ ] TTL 계층화 (5분/30분/1시간)

---

## 🟢 LOW - 장기 계획

### 6. RAG 엔진 리팩토링 (8시간)

**파일**: `src/services/ai/supabase-rag-engine.ts` (1100줄)

분리 대상:
- `src/types/rag/rag-types.ts`
- `src/utils/rag/rag-utils.ts`
- `src/services/rag/memory-rag-cache.ts`
- `src/services/rag/keyword-extractor.ts`

### 7. 기능 확장

| 기능 | 설명 | 난이도 |
|------|------|--------|
| 대화 컨텍스트 | 세션 기반 대화 히스토리 | 중간 |
| 멀티모달 | 이미지 업로드 + Gemini Vision | 높음 |
| 알림 시스템 | Supabase Realtime 기반 | 중간 |

---

## 📊 우선순위 매트릭스

| 작업 | 긴급도 | 난이도 | 시간 |
|------|--------|--------|------|
| Dead Code 정리 | ⭐⭐⭐ | 낮음 | 30분 |
| 주석 업데이트 | ⭐⭐ | 낮음 | 10분 |
| resize debounce | ⭐⭐ | 낮음 | 20분 |
| 이미지 최적화 | ⭐ | 낮음 | 3시간 |
| 캐싱 개선 | ⭐ | 중간 | 6시간 |
| RAG 리팩토링 | ⭐ | 높음 | 8시간 |

---

**최종 업데이트**: 2025-12-09
