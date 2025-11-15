# ESLint 1,327개 문제 해결 전략 - AI 교차검증 의사결정

**날짜**: 2025-11-14
**상황**: TypeScript 에러 0개 달성 후 ESLint 1,327개 문제 해결 전략 수립

---

## 🤖 AI 의견 요약

### 📊 Codex (실무 관점)
- **핵심 주장**: 55-65% 자동 수정 가능, 3단계 접근으로 15분 내 대부분 해결
- **근거**:
  - TypeScript가 이미 깨끗하므로 스타일/포맷 규칙 대부분 자동 수정 가능
  - `eslint --fix`로 일괄 수정, 나머지는 AST walker로 자동 탐지
- **추천 사항**:
  1. **Step 1** (~15분): `npm run lint -- --fix --max-warnings=0` 실행 → 55-65% 해결
  2. **Step 2**: `require-await` 규칙 임시 비활성화하여 async 스텁 격리 (~150개)
  3. **Step 3**: `ts-node scripts/lint/find-misused-promises.ts` 실행 → 실제 버그 ~50개만 수동 검토
- **토큰 사용**: 3,610 토큰

### 📐 Gemini (아키텍처 관점)
- **핵심 주장**: `no-misused-promises`가 최우선, `unsafe` 규칙 비활성화가 최대 기술 부채
- **근거**:
  - Promise 오용은 시스템 전체 안정성을 해치는 잠재적 버그
  - `unsafe` 규칙 비활성화는 TypeScript 타입 안전성 핵심 가치 저해
  - `require-await`는 설계 명확성 신호 (동기/비동기 역할 모호)
- **추천 사항**:
  1. **최우선**: `no-misused-promises` 해결 (절대 완화 금지)
  2. **구조적 개선**: `require-await` 집중 영역 파악 → 설계 원칙 수정 필요
  3. **장기 전략**: 핵심 데이터 흐름부터 `unsafe` 규칙 점진적 활성화
     - API 클라이언트/DB 모델 경계에 Zod/class-validator 도입
     - 사용자 인증, 결제 등 핵심 로직부터 `any` 타입 제거

### ⚡ Qwen (성능 관점)
- **핵심 주장**: 성능 영향 있는 규칙부터 해결, 4단계 Phased 접근 (7-10일)
- **근거**:
  - 런타임 안전성 이슈 (42개 `no-misused-promises`) → ROI 9/10
  - 번들 크기 영향 (203개 `no-unused-vars`) → ROI 8/10
  - 코드 품질 이슈 (284개 `require-await`) → ROI 6/10, 성능 영향 없음
- **추천 사항**:
  1. **Phase 1** (2-3일): 성능 Critical 이슈 (280개)
     - `no-misused-promises` (42), `no-floating-promises` (27)
     - `no-base-to-string` (32), `restrict-template-expressions` (12)
  2. **Phase 2** (1-2일): 번들 최적화 (203개 `no-unused-vars`)
  3. **Phase 3** (2-3일): 코드 품질 (500+ `require-await`)
  4. **Phase 4** (1-2일): 나머지 일괄 처리
- **자동화**: `eslint --fix` → 패턴 기반 스크립트 → 수동 검토

---

## ⚖️ 합의점과 충돌점

### ✅ 합의
- **`no-misused-promises` 최우선**: 3-AI 모두 동의
  - Codex: Critical 우선순위 (공유 라이브러리/페이지)
  - Gemini: 아키텍처 안정성 핵심 (절대 완화 금지)
  - Qwen: 성능 영향 ROI 9/10 (Phase 1)
- **자동화 가능성**: 55-65% 자동 수정 가능 (Codex), `eslint --fix` 활용 (Qwen)
- **`no-unused-vars` 중요성**: 번들 크기 영향 (Codex, Qwen Phase 2)
- **`require-await` 낮은 우선순위**: 성능 영향 없음 (Codex Low, Qwen ROI 6/10)

### ⚠️ 충돌
- **해결 기간 예상**:
  - Codex: "15분 + α" (Step 1-3 합계 ~2-4시간)
  - Gemini: 기간 미명시 (장기 전략 강조)
  - Qwen: "7-10일" (Phase 1-4 합계)
- **`unsafe` 규칙 우선순위**:
  - Codex: 언급 없음 (실무 Quick Wins 중심)
  - Gemini: **최대 기술 부채** (장기 전략 핵심)
  - Qwen: 언급 없음 (성능 영향 규칙만 집중)
- **접근 방식**:
  - Codex: **80/20 원칙** (Quick Wins 중심, 실용적)
  - Gemini: **아키텍처 우선** (근본 원인 해결, 이상적)
  - Qwen: **ROI 기반 Phase** (성능 영향 순, 체계적)

---

## 🎯 Claude Code 최종 평가 및 결정

### 3-AI 답변 분석
1. **Codex 강점**: 실행 가능한 구체적 명령어, 즉시 적용 가능
2. **Gemini 강점**: 근본 원인 분석, 장기 유지보수성 관점
3. **Qwen 강점**: 성능 영향 정량화, 체계적 단계별 계획

### 프로젝트 컨텍스트 반영
- **1인 개발 환경**: ROI 중심, 빠른 실행 가능성 중요
- **현재 상태**: TypeScript 에러 0개 → ESLint는 점진적 개선 가능
- **우선순위**: 프로덕션 안정성 > 코드 품질 > 완벽주의

### 타당성 평가
- **Codex 방식**: ✅ 즉시 실행 가능, 1인 개발자 ROI 최적
- **Gemini 방식**: ⚠️ 이상적이나 시간 투자 과다 (7-10일 vs 15분)
- **Qwen 방식**: ✅ 체계적이나 기간 다소 긴 편 (7-10일)

### 최종 판단
**채택된 방안**: **Codex 3-Step 접근 (기본) + Gemini 장기 전략 (병행)**

**선택 근거**:
1. **즉시 실행**: Codex Step 1-3로 15분~2시간 내 70-80% 해결
2. **프로덕션 안전성**: `no-misused-promises` 최우선 (3-AI 합의)
3. **장기 개선**: Gemini의 `unsafe` 규칙 점진적 활성화 전략 병행
4. **1인 개발 ROI**: Codex 80/20 원칙이 현실적

**기각된 의견**:
- ❌ Qwen의 7-10일 Phased 접근: 너무 체계적이나 시간 과다
  - 이유: 1인 개발 환경에서 1주일 이상 ESLint만 작업 비현실적
  - 대안: Codex 방식으로 빠르게 해결 후 점진적 개선

---

## 📝 실행 계획

### 즉시 실행 (오늘, ~2시간)

#### Step 1: 자동 수정 일괄 적용 (~15분)
- [ ] `npm run lint -- --fix --max-warnings=0` 실행
- [ ] 예상 결과: 1,327개 → ~500개 (55-65% 자동 해결)
- [ ] Git commit: "🐛 fix(lint): auto-fix ESLint issues (Step 1)"

#### Step 2: async 스텁 격리 및 수동 수정 (~1시간)
- [ ] `.eslintrc.js`에 `require-await: off` 임시 추가
- [ ] `npm run lint` 재실행 → async 스텁 ~150개 격리
- [ ] 격리된 async 함수 수동 검토 및 수정:
  - `async` 키워드 제거 (불필요한 경우)
  - `await` 추가 (비동기 작업 있는 경우)
- [ ] Git commit: "♻️ refactor(lint): resolve require-await issues (Step 2)"

#### Step 3: 실제 버그 탐지 및 수정 (~30분)
- [ ] 간단한 AST walker 스크립트 작성 (또는 수동 검색):
  ```bash
  # no-misused-promises 패턴 검색
  npm run lint | grep "no-misused-promises"
  ```
- [ ] ~50개 실제 버그 수동 검토 및 수정
- [ ] Git commit: "🐛 fix(lint): resolve no-misused-promises bugs (Step 3)"

### 단기 계획 (이번 주, ~3-5시간)

#### Phase A: 번들 최적화 (~2시간)
- [ ] `no-unused-vars` 203개 해결:
  - 미사용 import 제거
  - 미사용 변수는 `_` prefix 추가
- [ ] Git commit: "♻️ refactor(lint): remove unused vars for bundle optimization"

#### Phase B: 성능 Critical 이슈 (~1-2시간)
- [ ] `no-floating-promises` 27개 해결
- [ ] `no-base-to-string` 32개 해결
- [ ] Git commit: "🐛 fix(lint): resolve performance-critical issues"

### 장기 전략 (다음 달)

#### Gemini 제안 적용: `unsafe` 규칙 점진적 활성화
- [ ] 핵심 데이터 흐름 파악 (사용자 인증, API 클라이언트)
- [ ] Zod 도입: API 응답 검증 레이어 구축
- [ ] `no-unsafe-assignment` 규칙 활성화 (핵심 영역만)
- [ ] `any` 타입 제거: API 클라이언트부터 시작

### 참고 사항

**자동화 스크립트 예시**:
```bash
# Step 1: 자동 수정
npm run lint -- --fix --max-warnings=0

# Step 2: require-await 격리 (eslint.config.mjs 수정)
# rules: { '@typescript-eslint/require-await': 'off' }

# Step 3: no-misused-promises 검색
npm run lint 2>&1 | grep -A 3 "no-misused-promises" > /tmp/misused-promises.txt
```

**예상 결과**:
- **즉시 실행 (2시간)**: 1,327개 → ~200-300개 (70-80% 해결)
- **단기 계획 (주말)**: ~200-300개 → ~50-100개 (90% 해결)
- **장기 전략 (다음 달)**: `unsafe` 규칙 활성화 → 타입 안전성 향상

---

**작성**: Claude Code
**검증**: 3-AI 교차검증 (Codex + Gemini + Qwen)
**실행 시간**: Codex 24초, Gemini 29초, Qwen 222초 (총 275초)
