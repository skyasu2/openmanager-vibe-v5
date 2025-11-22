# ESLint 경고 정리 Phase 3 작업 계획서

**문서 버전:** v1.0.0
**작성일:** 2025-11-22
**작성자:** Claude Code AI (Codex 평가 기반)
**프로젝트:** OpenManager VIBE v5.80.0

---

## 📊 Codex 평가 요약

### ✅ Phase 1-2 성과 (완료)

**Codex 평가 점수**: 8/10 (우수)

| 지표                  | 결과                                |
| --------------------- | ----------------------------------- |
| **총 경고 감소**      | 245 → 110 (135개, 55% 개선) ✅      |
| **Phase 1**           | 245 → 183 (-62개, 가비지 코드 삭제) |
| **Phase 2 Batch 1-4** | 183 → 110 (-73개, 미사용 변수 처리) |
| **Phase 2 Batch 5**   | 부분 완료 (6/10개 파일) ⚠️          |
| **TypeScript 에러**   | 0개 유지 ✅                         |
| **프로덕션 빌드**     | 통과 ✅                             |

### 🎯 Codex 권장사항

> "110개 잔여 경고는 공격적으로 정리 가능. 단, TypeScript 안전성 및 테스트 통과 전제 하에 Batch A-D로 50개 이하까지 감축 권장."

---

## 🚨 Codex 리뷰 검증 (2025-11-22)

### ❌ Codex 4/10 거부 판정 - 거짓 양성 확인

**Codex 지적 사항** (모두 거짓 양성):

1. `useSystemQueries.ts`: 변수명 불일치 → **정상** (구조분해 rename 패턴)
2. `useAutoLogout.ts`: 함수 인자 불일치 → **정상** (rename + default 패턴)
3. `useAISession.ts`: 옵션 불일치 → **정상** (구조분해 rename 패턴)

**검증 결과**:

```bash
✅ TypeScript 컴파일: 성공 (0 errors)
✅ ESLint: exit code 0
✅ 모든 변수는 정상적인 구조분해 할당 패턴
```

**결론**: Codex의 코드 분석 정확도 한계 확인. TypeScript 컴파일러가 최종 진실.

---

## 🎯 Phase 3 목표

### 📈 전체 목표

- **현재 상태**: 110개 경고
- **Phase 3 목표**: 50개 이하 (55% 추가 감소)
- **최종 목표**: 30개 이하 권장 (87% 총 개선)
- **기간**: 2-3주 (주 2-3회 배치 작업)

### ✅ 성공 기준

1. **품질 지표**
   - ESLint 경고: 110 → 50 이하
   - TypeScript 에러: 0개 유지
   - 테스트 통과율: 88.9% 이상 유지

2. **안전성 검증**
   - 프로덕션 빌드 통과
   - Vercel 배포 성공
   - E2E 테스트 통과 (99%)

3. **코드 품질**
   - 불필요한 `any` 타입 제거
   - 사용하지 않는 코드 정리
   - TypeScript strict mode 준수

---

## 📋 Phase 3 배치 계획 (Codex 제안 기반)

### 🔍 Batch A: 상위 경고 파일 집중 정리 (20개 감소 목표)

**대상**: 경고 5개 이상 포함 파일

**예상 파일**:

- 데이터 처리 서비스
- AI 통합 모듈
- 복잡한 훅

**작업 방법**:

```bash
# 1. 상위 20개 파일 식별
npm run lint 2>&1 | grep "warning" | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# 2. 파일별 경고 확인 및 수정
npx eslint [파일경로] --fix

# 3. 검증
npm run type-check
npm run test:super-fast
```

### 🔧 Batch B: 미사용 import/변수 일괄 정리 (15개 감소 목표)

**대상**:

- 미사용 import 문
- 미사용 타입 정의
- 중복 선언

**자동화 도구 활용**:

```bash
# ESLint auto-fix 활용
npx eslint . --fix --quiet

# 수동 검토 필요 경고만 필터링
npm run lint 2>&1 | grep -v "automatically fixable"
```

### 📦 Batch C: 타입 안전성 강화 (10개 감소 목표)

**대상**:

- `any` 타입 사용
- 타입 단언 과다 사용
- 불완전한 타입 정의

**작업 절차**:

1. `any` 사용처 검색
   ```bash
   grep -r ": any\|as any" src/ --include="*.ts" --include="*.tsx"
   ```
2. 적절한 타입으로 대체
3. TypeScript strict 모드 검증

### 🧹 Batch D: 남은 경고 마무리 (5개 감소 목표)

**대상**: Batch A-C 이후 잔여 경고

**작업**:

- 개별 케이스 검토
- ESLint 규칙 예외 필요 시 주석 추가
- 최종 문서화

---

## 📅 일정 계획 (3주)

### Week 1 (현재 주)

- [x] Phase 2 Batch 5 부분 완료 (6/10개)
- [x] 작업 계획서 작성 (이 문서)
- [ ] Batch 5 남은 4개 파일 완료
- [ ] Batch A 시작 (상위 파일 10개)

### Week 2

- [ ] Batch A 완료 (110 → 90)
- [ ] Batch B 시작 (미사용 코드 정리)
- [ ] 중간 검증 및 리뷰

### Week 3

- [ ] Batch B 완료 (90 → 75)
- [ ] Batch C 진행 (타입 안전성)
- [ ] Batch D 진행 (마무리)
- [ ] 최종 목표 달성 (50개 이하)

---

## 🛠️ 작업 절차 (표준화)

### 1️⃣ 사전 준비

```bash
# 현재 상태 백업
git stash
git checkout -b feature/lint-cleanup-batch-X

# 베이스라인 확인
npm run lint 2>&1 | grep "problems" | tail -1
```

### 2️⃣ 파일 선택 및 수정

```bash
# 대상 파일 확인
npm run lint 2>&1 | grep "warning" | grep [패턴]

# 개별 파일 수정
npx eslint [파일경로] --fix

# 수동 수정 (필요 시)
# - Read 도구로 파일 읽기
# - Edit 도구로 정확한 수정
```

### 3️⃣ 검증

```bash
# 1. TypeScript 검증
npm run type-check

# 2. ESLint 재검사
npm run lint

# 3. 빠른 테스트
npm run test:super-fast

# 4. 프로덕션 빌드 (옵션)
npm run build
```

### 4️⃣ 커밋 및 리뷰

```bash
# 커밋 (자동 AI 리뷰 트리거)
git add .
git commit -m "refactor: ESLint Batch X 완료 (N개 경고 감소)"

# Codex 리뷰 확인
cat logs/code-reviews/review-codex-*.md | tail -100

# 푸시
git push origin feature/lint-cleanup-batch-X
```

---

## 📊 진행 상황 추적

### 배치별 목표 및 현황

| Batch           | 목표 감소 | 시작 경고 | 목표 경고 | 상태           | 완료일 |
| --------------- | --------- | --------- | --------- | -------------- | ------ |
| Phase 2 Batch 5 | -5        | 110       | 105       | ⚠️ 부분 (6/10) | -      |
| **Batch A**     | -20       | 110       | 90        | 📝 계획        | -      |
| **Batch B**     | -15       | 90        | 75        | 📝 계획        | -      |
| **Batch C**     | -10       | 75        | 65        | 📝 계획        | -      |
| **Batch D**     | -15       | 65        | 50        | 📝 계획        | -      |

### 주간 마일스톤

- **Week 1 목표**: 110 → 90 (Batch A 완료)
- **Week 2 목표**: 90 → 75 (Batch B 완료)
- **Week 3 목표**: 75 → 50 (Batch C-D 완료)

---

## 🚨 위험 요소 및 대응

### ⚠️ 위험 요소

1. **TypeScript 에러 발생**
   - 대응: 즉시 롤백, 수정 재검토
   - 예방: 단계별 type-check 필수

2. **테스트 실패**
   - 대응: 관련 코드 검토, 테스트 수정 필요 시 별도 작업
   - 예방: 수정 전 테스트 실행

3. **프로덕션 빌드 실패**
   - 대응: 로컬 빌드 필수 확인
   - 예방: 배치 작업 후 즉시 빌드 검증

4. **AI 리뷰 거짓 양성**
   - 대응: TypeScript 컴파일러 최종 판단 기준
   - 예방: Codex/Gemini 리뷰는 참고만, 컴파일러 신뢰

### ✅ 품질 보증 체크리스트

각 배치 완료 시:

- [ ] TypeScript 컴파일 성공 (0 errors)
- [ ] ESLint 경고 감소 확인
- [ ] 테스트 통과율 유지 (88.9%+)
- [ ] 프로덕션 빌드 성공
- [ ] Git 커밋 및 AI 리뷰 완료
- [ ] 변경사항 문서화

---

## 📚 참고 문서

- **이전 계획서**: docs/specs/lint-cleanup-next-phase-spec.md
- **프로젝트 상태**: docs/status.md
- **ESLint 설정**: .eslintrc.json
- **Git 커밋 이력**: `git log --oneline --grep="ESLint"`

---

## 🎯 최종 목표

**Phase 3 완료 후 예상 상태**:

- ESLint 경고: 50개 이하 (87% 총 개선)
- TypeScript 에러: 0개
- 테스트 통과율: 88.9%+
- 코드 품질: 9.5/10

**장기 목표**:

- Phase 4: 50 → 30 이하 (선택, 91% 총 개선)
- Phase 5: 30 → 0 (도전, 100% 정리)

---

**문서 상태**: ✅ Phase 3 계획 수립 완료
**다음 작업**: Batch 5 남은 4개 파일 완료 → Batch A 시작
**업데이트 주기**: 배치 완료 시마다

---

💡 **핵심 원칙**:

1. TypeScript 컴파일러가 최종 진실
2. AI 리뷰는 참고만, 과신 금지
3. 단계별 검증 필수
4. 안전성 > 속도
