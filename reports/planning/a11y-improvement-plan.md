# A11y (접근성) 개선 작업 계획서

**작성일**: 2026-01-23
**작성자**: Claude Opus 4.5
**상태**: 진행 중

---

## 1. 현황 분석

### 1.1 Biome A11y 규칙 상태

| 규칙 | 현재 설정 | 위반 수 | 비고 |
|------|:--------:|-------:|------|
| `useKeyWithClickEvents` | **warn** | 0 | ✅ 완료 |
| `useButtonType` | off | 142 | 🔧 개선 필요 |
| `noSvgWithoutTitle` | off | 153 | 🔧 개선 필요 |
| `useAriaPropsSupportedByRole` | warn | 0 | ✅ 준수 |
| `useSemanticElements` | warn | 0 | ✅ 준수 |

### 1.2 이전 작업 (2026-01-23)

| 커밋 | 내용 | 수정량 |
|------|------|--------|
| `082b629e0` | SVG aria-hidden, button type 추가 | 8개 파일, 15개 버튼 |
| `a66ad39d3` | useKeyWithClickEvents warn 활성화 | 1개 파일 |

### 1.3 잔여 위반 분포 (Top 10)

#### useButtonType (142개)
```
4개  src/components/ai/MessageActions.tsx
3개  src/app/login/LoginClient.tsx
3개  src/app/auth/error/page.tsx
2개  src/app/500.tsx
1개  src/components/ai/MarkdownRenderer.tsx
1개  src/components/ai/AnalysisResultsCard.tsx
1개  src/app/main/components/SystemStartSection.tsx
1개  src/app/main/components/MainPageErrorBoundary.tsx
1개  src/app/main/components/LoginPrompt.tsx
1개  src/app/main/components/DashboardSection.tsx
```

#### noSvgWithoutTitle (153개)
```
2개  src/utils/system-checklist-icons.tsx
2개  src/app/login/LoginClient.tsx
2개  src/app/auth/error/page.tsx
1개  src/components/shared/UnifiedCircularGauge.tsx
1개  src/components/shared/Sparkline.tsx
1개  src/components/shared/FeatureCardModal.tsx
1개  src/components/shared/ErrorBoundary.tsx
1개  src/app/global-error.tsx
```

---

## 2. 작업 범위 (이번 세션)

### 2.1 P1 우선순위 파일

| # | 파일 | 버튼 | SVG | 우선순위 근거 |
|:-:|------|:----:|:---:|--------------|
| 1 | `MessageActions.tsx` | 4 | 0 | AI 채팅 핵심 컴포넌트, 높은 사용 빈도 |
| 2 | `LoginClient.tsx` | 3 | 2 | 사용자 진입점, 첫인상 |
| 3 | `auth/error/page.tsx` | 3 | 2 | 에러 상황 접근성 중요 |

**총 작업량**: 14개 요소 (버튼 10개 + SVG 4개)

### 2.2 제외 항목 (이번 세션)

- `system-checklist-icons.tsx`: 아이콘 팩토리 함수, 구조 변경 필요
- `UnifiedCircularGauge.tsx`: 차트 컴포넌트, 복잡한 SVG 구조
- 기타 1개 위반 파일들: 낮은 우선순위

---

## 3. 상세 작업 계획

### 3.1 MessageActions.tsx

**위치**: `src/components/ai/MessageActions.tsx`

**현재 상태**:
```tsx
<button onClick={handleCopy}>복사</button>
<button onClick={() => onFeedback('positive')}>👍</button>
<button onClick={() => onFeedback('negative')}>👎</button>
<button onClick={handleRegenerate}>다시 생성</button>
```

**수정 내용**:
```tsx
<button type="button" onClick={handleCopy}>복사</button>
<button type="button" onClick={() => onFeedback('positive')}>👍</button>
<button type="button" onClick={() => onFeedback('negative')}>👎</button>
<button type="button" onClick={handleRegenerate}>다시 생성</button>
```

**사이드 이펙트**: 없음 (form 외부 버튼)

---

### 3.2 LoginClient.tsx

**위치**: `src/app/login/LoginClient.tsx`

**수정 내용**:
1. 버튼 3개: `type="button"` 추가
2. SVG 2개: `aria-hidden="true"` 추가 (장식용 아이콘)

**사이드 이펙트 분석**:
- 로그인 버튼이 form 내부인지 확인 필요
- form 내부 submit 버튼은 `type="submit"` 유지

---

### 3.3 auth/error/page.tsx

**위치**: `src/app/auth/error/page.tsx`

**수정 내용**:
1. 버튼 3개: `type="button"` 추가
2. SVG 2개: `aria-hidden="true"` 추가

**사이드 이펙트**: 없음 (에러 페이지, form 없음)

---

## 4. 검증 계획

### 4.1 자동 검증

```bash
# Lint 검증
npm run lint

# 타입 검증
npm run type-check

# 빠른 테스트
npm run test:quick
```

### 4.2 수동 검증

| 검증 항목 | 방법 |
|----------|------|
| MessageActions | AI 채팅에서 복사/피드백/재생성 동작 확인 |
| LoginClient | 로그인 페이지 접근, 버튼 클릭 동작 |
| auth/error | `/auth/error` 페이지 접근, 돌아가기 버튼 |

### 4.3 위반 수 확인

```bash
# 수정 전
npx biome lint --only=a11y/useButtonType src/ 2>&1 | tail -5
# Expected: Found 142 errors

# 수정 후
npx biome lint --only=a11y/useButtonType src/ 2>&1 | tail -5
# Expected: Found 132 errors (10개 감소)
```

---

## 5. 롤백 계획

문제 발생 시:
```bash
git revert HEAD  # 마지막 커밋 되돌리기
```

---

## 6. 완료 기준

- [x] P1 파일 3개 수정 완료 (2026-01-23)
- [x] `npm run lint` 통과
- [x] `npm run test:quick` 통과 (228 tests passed)
- [x] useButtonType 위반 142 → 132 (10개 감소)
- [x] noSvgWithoutTitle 위반 153 → 7 (146개 감소, 예상보다 큰 효과)
- [x] 커밋 완료: `fd954e61e`

---

## 7. 향후 계획

### Phase 2 (P2 우선순위)
- `system-checklist-icons.tsx`: 아이콘 컴포넌트 aria-hidden 일괄 적용
- `UnifiedCircularGauge.tsx`: 차트 접근성 개선
- 나머지 1개 위반 파일들 정리

### Phase 3 (최종 목표)
- 모든 위반 해결 후 규칙 활성화:
  ```json
  "useButtonType": "warn",
  "noSvgWithoutTitle": "warn"
  ```

---

_Last Updated: 2026-01-23_
