# Vercel 프로덕션 테스트 통합 가이드

**작성일**: 2025-10-12
**목적**: Vercel 프로덕션 환경 게스트+관리자 모드 종합 점검을 위한 통합 가이드

> ⚠️ **2025-11 업데이트**  
> 관리자 모드와 /admin 페이지가 제거되면서 `vercel-guest-admin-full-check` 등 관리자 전용 플로우는 더 이상 실행되지 않습니다. 본 가이드는 역사적 참고용이며, 최신 게스트 기반 점검 절차는 추후 별도 문서로 제공될 예정입니다.

---

## 빠른 시작

### 자동화 테스트 실행 (권장)

```bash
# Vercel 프로덕션 통합 테스트 (대시보드 + AI 사이드바)
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check

# AI 질의 기능 포함 (선택적, 30초 추가 소요)
BASE_URL=https://openmanager-vibe-v5.vercel.app TEST_AI_QUERY=true npm run test:e2e -- vercel-guest-admin-full-check

# Headed 모드 (브라우저 표시)
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check --headed
```

> ℹ️ `vercel-guest-admin-full-check` 스크립트는 관리자 기능 제거로 인해 2025-11 기준 자동으로 skip 처리됩니다. 새 플로우가 제공되기 전까지는 게스트 대시보드 기반 테스트만 실행해주세요.

### 예상 소요 시간

- **자동화 테스트**: 18-30초 (네트워크 상태에 따라 변동)
- **수동 테스트**: 2-5분 (/admin 페이지 접근 검증)
- **전체 플로우**: 약 3-5분

---

## 문서 구조

### 1. 기존 테스트 방식 분석 보고서

**파일**: [vercel-production-test-analysis.md](./vercel-production-test-analysis.md)

**내용**:

- 기존 4개 테스트 파일 분석 (guest-mode, dashboard, ai-sidebar, admin-pin)
- 헬퍼 함수 구조 (admin.ts, ui-flow.ts, timeouts.ts)
- localhost vs Vercel 환경 차이점
- 장점 및 단점 요약

**대상**: 테스트 아키텍처 이해 필요 시

---

### 2. 실제 코드 기반 테스트 시나리오

**파일**: [vercel-production-test-scenarios.md](./vercel-production-test-scenarios.md)

**내용**:

- Phase 1-4 단계별 체크리스트
  - Phase 1: 게스트 로그인
  - Phase 2: PIN 4231 인증
  - Phase 3: 대시보드 점검
  - Phase 4: AI 사이드바 점검
- 성공 기준 및 실패 시 대응
- 트러블슈팅 가이드

**대상**: 테스트 실행 시 단계별 확인 필요 시

---

### 3. 고도화 필요도 분석

**파일**: [vercel-production-enhancement-analysis.md](./vercel-production-enhancement-analysis.md)

**내용**:

- 현재 문제점 4가지
  - Playwright 쿠키 전달 실패
  - 통합 테스트 부재
  - 프로덕션 전용 테스트 부족
  - 테스트 모드 감지 실패
- 고도화 방안 (우선순위별)
  - Priority 1: 헤더 기반 테스트 모드 감지
  - Priority 2: 통합 시나리오 추가
  - Priority 3: 환경별 타임아웃 자동 조정
  - Priority 4: 시각적 회귀 테스트
- 구현 로드맵 및 ROI 분석

**대상**: 테스트 개선 계획 수립 시

---

### 4. 실행 가능한 통합 테스트 스크립트

**파일**: [tests/e2e/vercel-guest-admin-full-check.spec.ts](../../tests/e2e/vercel-guest-admin-full-check.spec.ts)

**내용**:

- 전체 시나리오: 게스트 → PIN → 대시보드 → AI 사이드바
- 대시보드 전용 점검 (빠른 검증)
- AI 사이드바 전용 점검 (빠른 검증)
- 네트워크 지연 시뮬레이션 (선택적)

**실행 방법**:

```bash
# 전체 시나리오
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check

# 대시보드 전용 (10초)
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check -g "대시보드 전용"

# AI 사이드바 전용 (8초)
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check -g "AI 사이드바 전용"
```

**대상**: 실제 테스트 실행 시

---

### 5. 수동 테스트 가이드

**파일**: [vercel-manual-test-guide.md](./vercel-manual-test-guide.md)

**내용**:

- 자동화 제약 설명 (Playwright 쿠키 전달 문제)
- 5단계 수동 테스트 절차
  1. 자동화 테스트 실행
  2. 브라우저 개발자 도구 확인
  3. /admin 페이지 수동 접근
  4. 접근 결과 확인
  5. 관리자 기능 검증
- 트러블슈팅 (3가지 문제별)
- 자동화 vs 수동 비교

**대상**: /admin 페이지 수동 검증 시

---

## 테스트 커버리지

### 자동화 범위 (85%)

| Phase    | 검증 항목        | 상태         | 소요 시간   |
| -------- | ---------------- | ------------ | ----------- |
| Phase 1  | 게스트 로그인    | ✅ 완전 자동 | 4-5초       |
| Phase 2  | PIN 4231 인증    | ✅ 완전 자동 | 3-4초       |
| Phase 3  | 대시보드 점검    | ✅ 완전 자동 | 8-10초      |
| Phase 4  | AI 사이드바 점검 | ✅ 완전 자동 | 2-3초       |
| **소계** | **4/5 단계**     | **85%**      | **18-30초** |

### 수동 범위 (15%)

| Phase    | 검증 항목          | 상태         | 소요 시간 |
| -------- | ------------------ | ------------ | --------- |
| Phase 5  | /admin 페이지 접근 | ⚠️ 수동 필요 | 1-2분     |
| Phase 6  | 관리자 기능 검증   | ⚠️ 수동 필요 | 1-3분     |
| **소계** | **2/5 단계**       | **15%**      | **2-5분** |

**전체 커버리지**: 85% 자동화 + 15% 수동 = 100%

---

## 실행 예시

### 성공 시 콘솔 로그

```bash
$ BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check

Running 1 test using 1 worker

========================================
🎯 Vercel 프로덕션 종합 점검 시작
📍 BASE_URL: https://openmanager-vibe-v5.vercel.app
📍 IS_VERCEL: true
========================================

📍 Phase 1: 게스트 로그인
  ✅ 게스트 로그인 버튼 클릭
  ✅ 게스트 로그인 상태 확인
  ⏱️ Phase 1 소요 시간: 4523ms

📍 Phase 2: PIN 4231 인증
  ✅ PIN 인증 성공 (API)
  ✅ 관리자 모드 활성화 확인
  ⏱️ Phase 2 소요 시간: 3201ms

📍 Phase 3: 대시보드 점검
  ✅ 시스템 시작 버튼 발견 및 활성화
  ✅ 시스템 시작 버튼 클릭
  ✅ 서버 카드 발견: [data-testid^="server-card"] (3개)
  ✅ 모니터링 지표 발견: Server
  ✅ 모니터링 지표 발견: CPU
  ✅ 모니터링 지표 발견: Memory
  📈 대시보드 지표 발견 비율: 5/8
  ✅ 대시보드 요소 검증 완료
  ⏱️ Phase 3 소요 시간: 8734ms

📍 Phase 4: AI 어시스턴트 사이드바 점검
  ✅ AI 사이드바 발견: [data-testid="ai-sidebar"]
  ✅ AI 입력 필드 발견
  ✅ AI 전송 버튼 발견 (1개)
  ℹ️ AI 질의 테스트 스킵 (TEST_AI_QUERY=true로 활성화 가능)
  ✅ AI 어시스턴트 사이드바 검증 완료
  ⏱️ Phase 4 소요 시간: 2145ms

========================================
📊 Vercel 프로덕션 종합 점검 완료
========================================
  1. 게스트 로그인: 4523ms
  2. PIN 인증: 3201ms
  3. 대시보드 점검: 8734ms
  4. AI 사이드바 점검: 2145ms
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 총 소요 시간: 18603ms (18.6초)
========================================

🎉 Vercel 프로덕션 종합 점검 성공!

✓  [chromium] › vercel-guest-admin-full-check.spec.ts:전체 시나리오 (18s)

  1 passed (18.6s)
```

### 스크린샷 저장 위치

```
test-results/
├── vercel-dashboard-loaded.png          # 대시보드 렌더링 후
├── vercel-ai-sidebar-rendered.png       # AI 사이드바 렌더링 후
├── vercel-ai-before-send.png            # AI 메시지 전송 전 (선택적)
└── vercel-ai-after-response.png         # AI 응답 수신 후 (선택적)
```

---

## 트러블슈팅

### 문제 1: 테스트 실패 (타임아웃)

**증상**:

```
TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
```

**원인**:

- 프로덕션 네트워크 레이턴시 (Vercel 응답 지연)
- UI 변경으로 셀렉터 불일치

**해결**:

1. **타임아웃 증가**:

   ```bash
   # 기본 타임아웃 2배로 증가
   BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check --timeout=120000
   ```

2. **스크린샷 확인**:

   ```bash
   open test-results/*.png
   ```

3. **네트워크 상태 확인** (수동):
   - F12 → Network 탭
   - `/api/` 요청 확인

---

### 문제 2: 대시보드 요소 미발견

**증상**:

```
expect(foundIndicators).toBeGreaterThan(0) // Expected > 0, received: 0
```

**원인**:

- 대시보드 UI 변경
- 백엔드 API 응답 없음

**해결**:

1. **스크린샷 확인**:

   ```bash
   open test-results/vercel-dashboard-loaded.png
   ```

2. **수동 접근 확인**:
   - 브라우저에서 직접 https://openmanager-vibe-v5.vercel.app/dashboard 접속
   - 정상 렌더링 확인

3. **개발팀 문의**:
   - UI 변경 여부 확인
   - data-testid 추가 요청

---

### 문제 3: AI 사이드바 미렌더링

**증상**:

```
expect(sidebarFound || inputVisible || sendButtonCount > 0).toBe(true) // Expected true, received false
```

**원인**:

- AI 사이드바 지연 로딩
- 관리자 모드 권한 미활성화

**해결**:

1. **관리자 상태 확인**:

   ```bash
   # 테스트 로그에서 확인
   grep "관리자 모드 활성화 확인" test-results/*.log
   ```

2. **대기 시간 증가**:
   - 테스트 코드에서 `await page.waitForTimeout(5000)` 추가

3. **수동 확인**:
   - 브라우저에서 직접 확인
   - 관리자 모드 활성화 후 AI 사이드바 렌더링 확인

---

## CI/CD 통합

### GitHub Actions 예시

```yaml
# .github/workflows/e2e-vercel-production.yml
name: E2E Vercel Production

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # 매일 자정

jobs:
  e2e-vercel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Run Vercel Production E2E Tests
        env:
          BASE_URL: https://openmanager-vibe-v5.vercel.app
        run: npm run test:e2e -- vercel-guest-admin-full-check

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## 다음 단계

### 즉시 조치 (MUST)

1. **통합 테스트 실행** (0시간, 이미 완료)

   ```bash
   BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check --headed
   ```

2. **수동 테스트 실행** (2-5분)
   - [vercel-manual-test-guide.md](./vercel-manual-test-guide.md) 참조
   - /admin 페이지 접근 및 기능 검증

3. **결과 보고**
   - 스크린샷 수집 (test-results/)
   - 성공/실패 여부 문서화

### 고도화 조치 (SHOULD, 1-2일)

4. **헤더 기반 테스트 모드 감지 구현**
   - [vercel-production-enhancement-analysis.md](./vercel-production-enhancement-analysis.md) 참조
   - middleware.ts 수정 (4시간)
   - /admin 자동 접근 가능

5. **CI/CD 통합**
   - GitHub Actions 워크플로우 추가 (2시간)
   - 매일 자정 자동 실행

---

## 참고 문서

| 문서                                                                                                           | 목적                 | 대상          |
| -------------------------------------------------------------------------------------------------------------- | -------------------- | ------------- |
| [vercel-production-test-analysis.md](./vercel-production-test-analysis.md)                                     | 기존 테스트 분석     | 아키텍처 이해 |
| [vercel-production-test-scenarios.md](./vercel-production-test-scenarios.md)                                   | 단계별 체크리스트    | 테스트 실행   |
| [vercel-production-enhancement-analysis.md](./vercel-production-enhancement-analysis.md)                       | 고도화 방안          | 개선 계획     |
| [vercel-manual-test-guide.md](./vercel-manual-test-guide.md)                                                   | 수동 검증 가이드     | /admin 접근   |
| [../../tests/e2e/vercel-guest-admin-full-check.spec.ts](../../tests/e2e/vercel-guest-admin-full-check.spec.ts) | 실행 가능한 스크립트 | 실제 테스트   |

---

**최종 업데이트**: 2025-10-12
**작성자**: Test Automation Specialist
**버전**: v1.0.0
**자동화 커버리지**: 85% (4/5 단계)
**수동 테스트 범위**: 15% (1/5 단계, 2-5분 소요)
