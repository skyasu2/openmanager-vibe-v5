# Gemini Lint 개선 작업 계획서

**최종 목표:** `npm run lint` 실행 시 발생하는 모든 오류(Error)를 제거하고, 경고(Warning)를 최소화하여 코드 품질을 높입니다.

**현재 상태 (2025-11-18 기준, 최신 실행):**

- **오류:** 0개
- **경고:** 538개 (`npm run lint -- --max-warnings=0` 기준)

---

## 段階 (Phase) 별 작업 계획

각 단계 완료 후, 이 문서에 체크(`[x]`)하여 진행 상황을 표시합니다.

### ☐ Phase 1: 치명적 오류 해결 (108개) → ✅ 완료 (오류 0개)

> **목표:** 런타임 에러를 유발할 수 있는 모든 ESLint 오류를 해결하여 빌드 안정성을 확보합니다.

- [x] **Sub-task 1.1: Promise 관련 오류 해결**
  - [x] `@typescript-eslint/no-misused-promises`
  - [x] `@typescript-eslint/await-thenable`
- [x] **Sub-task 1.2: 타입스크립트 타입 오류 해결**
  - [x] `@typescript-eslint/restrict-template-expressions`
  - [x] `@typescript-eslint/no-unsafe-enum-comparison`
  - [x] `@typescript-eslint/restrict-plus-operands`
- [x] **Sub-task 1.3: 모듈 및 가져오기 오류 해결**
  - [x] `@typescript-eslint/no-require-imports`
  - [x] `@next/next/no-assign-module-variable`
- [x] **Sub-task 1.4: 기타 주요 오류 해결**
  - [x] `no-useless-escape`
  - [x] `@typescript-eslint/unbound-method`
  - [x] `@typescript-eslint/no-namespace`
  - [x] `@typescript-eslint/no-empty-object-type`
  - [x] `@typescript-eslint/only-throw-error`
  - [x] 기타 산발적인 오류 모두 해결

### ☐ Phase 2: 잠재적 버그 경고 해결

> **목표:** 버그로 이어질 가능성이 높은 주요 경고들을 해결합니다.

- [ ] **Sub-task 2.1: 처리되지 않은 Promise 경고 해결**
  - [ ] `@typescript-eslint/no-floating-promises` (19개): `void` 연산자 추가 또는 `await` 처리
- [x] **Sub-task 2.2: 암시적 타입 변환 경고 해결**
  - [x] `@typescript-eslint/no-base-to-string` (2025-11-18 기준 0개)
- [ ] **Sub-task 2.3: React Hook 의존성 배열 경고 해결**
  - [ ] `react-hooks/exhaustive-deps` (4개)

### ☐ Phase 3: 코드 가독성 및 스타일 개선

> **목표:** `any` 타입과 미사용 변수를 정리하여 코드의 가독성과 유지보수성을 향상시킵니다.

- [ ] **Sub-task 3.1: `any` 타입 제거**
  - [ ] `@typescript-eslint/no-explicit-any` (13개): 구체적인 타입으로 교체
- [ ] **Sub-task 3.2: 미사용 변수 및 선언 제거**
  - [ ] `@typescript-eslint/no-unused-vars` (다수): 불필요한 코드 제거
- [ ] **Sub-task 3.3: 기타 코드 스타일 경고 해결**
  - [ ] `no-case-declarations` (4개)

### ☐ Phase 4: 최종 검토 및 확인

> **목표:** 모든 개선 작업 후, 최종적으로 Lint 상태를 확인하고 결과를 문서화합니다.

- [ ] `npm run lint` 재실행하여 모든 오류가 해결되었는지 확인
- [ ] `lint:strict` (경고 0개 목표) 실행하여 추가 개선 가능성 탐색
- [ ] 최종 보고서 작성

---

_이 문서는 다른 AI 에이전트가 작업을 이어받을 수 있도록 상세하게 작성되었습니다._
_각 Sub-task 완료 시점에 `git commit`을 권장합니다._
