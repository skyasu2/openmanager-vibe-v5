# Vercel 프로덕션 테스트 시나리오

**작성일**: 2025-10-12
**목적**: Vercel 프로덕션 환경에서 게스트+관리자 모드 기반 대시보드 및 AI 사이드바 점검을 위한 단계별 테스트 시나리오

> ⚠️ **Legacy 안내 (2025-11)**  
> 관리자 모드와 /admin 페이지가 제거되면서 본 문서는 참고용으로만 유지됩니다.  
> 게스트 중심 최신 시나리오는 `tests/e2e/guest-dashboard-flow.spec.ts` 및 `docs/testing/e2e-testing-guide.md`를 참조하세요.

---

## 테스트 시나리오 구조

```
Vercel 프로덕션 종합 점검
├── Phase 1: 게스트 로그인
│   ├── 1-1. 홈페이지 접속
│   ├── 1-2. 게스트 로그인 버튼 클릭
│   ├── 1-3. /main 리다이렉트 확인
│   └── 1-4. localStorage 인증 상태 확인
│
├── Phase 2: PIN 4231 인증
│   ├── 2-1. API 기반 관리자 모드 활성화
│   ├── 2-2. /api/test/admin-auth 응답 200 OK
│   ├── 2-3. localStorage admin_mode 설정
│   ├── 2-4. 테스트 모드 쿠키/헤더 설정
│   └── 2-5. 관리자 상태 검증 (verifyAdminState)
│
├── Phase 3: 대시보드 점검
│   ├── 3-1. 시스템 시작 버튼 또는 직접 /dashboard 접근
│   ├── 3-2. 대시보드 페이지 로드 확인
│   ├── 3-3. 서버 카드 렌더링 확인
│   ├── 3-4. 모니터링 지표 확인 (CPU, Memory, Response)
│   └── 3-5. 스크린샷 캡처
│
└── Phase 4: AI 어시스턴트 사이드바 점검
    ├── 4-1. AI 사이드바 렌더링 확인
    ├── 4-2. 입력 필드 및 전송 버튼 확인
    ├── 4-3. AI 질의 기능 테스트 (선택적)
    └── 4-4. 스크린샷 캡처
```

---

## Phase 1: 게스트 로그인

### 목표

- Vercel 프로덕션 환경에서 게스트 로그인 성공
- /main 페이지로 정상 리다이렉트
- localStorage 인증 상태 확인 (auth_type=guest)

### 체크리스트

- [ ] **1-1. 홈페이지 접속**

  ```typescript
  await page.goto('https://openmanager-vibe-v5.vercel.app');
  await page.waitForLoadState('domcontentloaded');
  ```

  - 타임아웃: 10초
  - 예상 결과: 홈페이지 로딩 완료

- [ ] **1-2. 게스트 로그인 버튼 클릭**

  ```typescript
  const guestButton = page.locator('button:has-text("게스트로 체험하기")');
  await expect(guestButton).toBeVisible({ timeout: 10000 });
  await guestButton.click();
  ```

  - 타임아웃: 10초
  - 예상 결과: 버튼 클릭 성공

- [ ] **1-3. /main 리다이렉트 확인**

  ```typescript
  await page.waitForURL(/\/main/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  ```

  - 타임아웃: 15초 (프로덕션 네트워크 레이턴시 고려)
  - 예상 결과: URL이 /main으로 변경

- [ ] **1-4. localStorage 인증 상태 확인**

  ```typescript
  const authState = await page.evaluate(() => ({
    authType: localStorage.getItem('auth_type'),
    authUser: localStorage.getItem('auth_user'),
  }));
  expect(authState.authType).toBe('guest');
  ```

  - 예상 결과: authType='guest', authUser 존재

### 성공 기준

- ✅ 게스트 로그인 버튼 클릭 성공
- ✅ /main 페이지 리다이렉트 성공 (15초 이내)
- ✅ localStorage 인증 상태 정상 (auth_type=guest)

### 실패 시 대응

- **게스트 버튼 미발견**: 셀렉터 변경 가능성, 스크린샷 확인
- **리다이렉트 타임아웃**: 네트워크 문제, 타임아웃 20초로 증가
- **localStorage 미설정**: 클라이언트 코드 문제, 브라우저 콘솔 확인

---

## Phase 2: PIN 4231 인증

### 목표

- API 기반으로 관리자 모드 활성화
- localStorage 및 쿠키/헤더 설정 완료
- 관리자 상태 검증 통과

### 체크리스트

- [ ] **2-1. API 기반 관리자 모드 활성화**

  ```typescript
  const result = await activateAdminMode(page, {
    method: 'password',
    password: '4231',
    skipGuestLogin: true,
  });
  expect(result.success).toBe(true);
  ```

  - 타임아웃: 15초 (FORM_SUBMIT)
  - 예상 결과: result.success=true

- [ ] **2-2. /api/test/admin-auth 응답 200 OK**

  ```typescript
  // activateAdminMode() 내부에서 API 호출
  // 브라우저 콘솔 로그 확인
  ```

  - 예상 응답:
    ```json
    {
      "success": true,
      "message": "관리자 인증 성공",
      "mode": "password_auth",
      "adminMode": true
    }
    ```

- [ ] **2-3. localStorage admin_mode 설정**

  ```typescript
  const adminMode = await page.evaluate(() =>
    localStorage.getItem('admin_mode')
  );
  expect(adminMode).toBe('true');
  ```

  - 예상 결과: localStorage.admin_mode='true'

- [ ] **2-4. 테스트 모드 쿠키/헤더 설정**

  ```typescript
  // activateAdminMode() 내부에서 자동 설정
  // - 쿠키: test_mode=enabled, vercel_test_token
  // - 헤더: X-Test-Mode=enabled, X-Test-Token
  ```

  - 예상 결과: 쿠키 및 헤더 설정 완료

- [ ] **2-5. 관리자 상태 검증 (verifyAdminState)**

  ```typescript
  const isAdminActive = await verifyAdminState(page);
  expect(isAdminActive).toBe(true);
  ```

  - 예상 결과: true (localStorage + Zustand 이중 검증)

### 성공 기준

- ✅ API 응답 200 OK, success=true
- ✅ localStorage admin_mode='true'
- ✅ 관리자 상태 검증 통과

### 실패 시 대응

- **API 401 Unauthorized**: PIN 잘못 입력, password 재확인
- **localStorage 미설정**: activateAdminMode() 로직 문제, 콘솔 로그 확인
- **관리자 상태 검증 실패**: Zustand 상태 미동기화, 페이지 새로고침 시도

---

## Phase 3: 대시보드 점검

### 목표

- 대시보드 페이지 접근 성공
- 서버 카드 및 모니터링 지표 렌더링 확인
- 실시간 데이터 정상 동작 확인

### 체크리스트

- [ ] **3-1. 시스템 시작 버튼 또는 직접 /dashboard 접근**

  ```typescript
  // 방법 A: 시스템 시작 버튼 클릭
  const systemStartButton = page.locator('button:has-text("시스템 시작")');
  if (
    (await systemStartButton.isVisible()) &&
    (await systemStartButton.isEnabled())
  ) {
    await systemStartButton.click();
    await page.waitForTimeout(4000); // 카운트다운 대기
  }

  // 방법 B: 직접 접근
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  ```

  - 타임아웃: 20초 (DASHBOARD_LOAD)
  - 예상 결과: 대시보드 페이지 로드 완료

- [ ] **3-2. 대시보드 페이지 로드 확인**

  ```typescript
  await page.waitForSelector('main, [data-testid="main-content"], .dashboard', {
    timeout: 20000 * 1.5, // 프로덕션 30초
  });
  ```

  - 예상 결과: main 또는 dashboard 요소 발견

- [ ] **3-3. 서버 카드 렌더링 확인**

  ```typescript
  const serverCardSelectors = [
    '[data-testid^="server-card"]',
    '.server-card',
    '[class*="server"]',
  ];
  // 최소 1개 이상 발견
  ```

  - 예상 결과: 서버 카드 요소 최소 1개 발견

- [ ] **3-4. 모니터링 지표 확인 (CPU, Memory, Response)**

  ```typescript
  const dashboardIndicators = [
    'Server',
    '서버',
    'CPU',
    'Memory',
    'Response',
    'Dashboard',
    '대시보드',
  ];
  // 텍스트 기반 검증
  ```

  - 예상 결과: 최소 1개 이상 지표 텍스트 발견

- [ ] **3-5. 스크린샷 캡처**

  ```typescript
  await page.screenshot({
    path: 'test-results/vercel-dashboard-loaded.png',
    fullPage: true,
  });
  ```

  - 예상 결과: 스크린샷 저장 완료

### 성공 기준

- ✅ 대시보드 페이지 로드 성공 (30초 이내)
- ✅ 서버 카드 또는 모니터링 지표 최소 1개 이상 발견
- ✅ 스크린샷 캡처 성공

### 실패 시 대응

- **대시보드 로드 타임아웃**: 네트워크 문제, 타임아웃 60초로 증가
- **서버 카드 미발견**: UI 변경 가능성, 스크린샷으로 수동 확인
- **모니터링 지표 미발견**: 백엔드 API 문제, 네트워크 탭 확인

---

## Phase 4: AI 어시스턴트 사이드바 점검

### 목표

- AI 사이드바 렌더링 확인
- 입력 필드 및 전송 버튼 정상 동작
- AI 질의 기능 테스트 (선택적)

### 체크리스트

- [ ] **4-1. AI 사이드바 렌더링 확인**

  ```typescript
  const sidebarSelectors = [
    '[data-testid="ai-sidebar"]',
    '.ai-sidebar',
    '[class*="sidebar"]',
    '[id*="ai"]',
  ];
  // 최소 1개 이상 발견
  ```

  - 예상 결과: AI 사이드바 요소 발견

- [ ] **4-2. 입력 필드 및 전송 버튼 확인**

  ```typescript
  const inputField = page.locator('input[type="text"], textarea').first();
  const sendButton = page
    .locator('button')
    .filter({ hasText: /send|보내기|전송/i });
  await expect(inputField).toBeVisible();
  expect(await sendButton.count()).toBeGreaterThan(0);
  ```

  - 예상 결과: 입력 필드 및 전송 버튼 발견

- [ ] **4-3. AI 질의 기능 테스트 (선택적, TEST_AI_QUERY=true)**

  ```typescript
  await inputField.fill('서버 상태 알려줘');
  await sendButton.click();
  await page.waitForSelector('.message, [data-testid*="message"]', {
    timeout: 30000,
  });
  ```

  - 타임아웃: 30초 (NETWORK_REQUEST)
  - 예상 결과: AI 응답 메시지 수신

- [ ] **4-4. 스크린샷 캡처**

  ```typescript
  await page.screenshot({
    path: 'test-results/vercel-ai-sidebar-rendered.png',
    fullPage: true,
  });
  ```

  - 예상 결과: 스크린샷 저장 완료

### 성공 기준

- ✅ AI 사이드바 렌더링 확인
- ✅ 입력 필드 및 전송 버튼 발견
- ✅ (선택) AI 응답 수신 (30초 이내)

### 실패 시 대응

- **AI 사이드바 미발견**: UI 변경 가능성, 스크린샷으로 수동 확인
- **입력 필드 미발견**: data-testid 추가 필요, 개발팀 협의
- **AI 응답 타임아웃**: 백엔드 API 문제, 네트워크 탭 확인

---

## 통합 시나리오 실행 방법

### 자동화 테스트 실행

```bash
# Vercel 프로덕션 환경 테스트
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check

# AI 질의 기능 포함 (선택적)
BASE_URL=https://openmanager-vibe-v5.vercel.app TEST_AI_QUERY=true npm run test:e2e -- vercel-guest-admin-full-check

# 특정 시나리오만 실행
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check -g "대시보드 전용"
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check -g "AI 사이드바 전용"
```

### 수동 테스트 가이드

**제약사항**: Playwright 쿠키 전달 문제로 /admin 페이지 자동 접근 불가 → 수동 테스트 필요

1. **브라우저 개발자 도구 열기** (F12)
2. **Application 탭 → Cookies** 선택
3. **자동화 테스트 실행 후 쿠키 확인**:
   - `admin_mode`: `true` 확인
   - `test_mode`: `enabled` 확인
4. **수동으로 /admin 접근**:
   - 주소창에 `https://openmanager-vibe-v5.vercel.app/admin` 입력
   - 또는 프로필 드롭다운에서 "관리자 페이지" 클릭
5. **성공 기준**:
   - ✅ /admin 페이지 접근 성공
   - ✅ 관리자 전용 기능 표시
   - ❌ /main으로 리다이렉트되면 실패 (middleware 쿠키 체크 실패)

---

## 성능 기준

| Phase            | 목표 시간 | 최대 시간 | 프로덕션 허용 |
| ---------------- | --------- | --------- | ------------- |
| 게스트 로그인    | 5초       | 10초      | 15초 (1.5배)  |
| PIN 인증         | 5초       | 15초      | 22초 (1.5배)  |
| 대시보드 점검    | 10초      | 20초      | 30초 (1.5배)  |
| AI 사이드바 점검 | 5초       | 10초      | 15초 (1.5배)  |
| **전체 플로우**  | **25초**  | **60초**  | **120초**     |

---

## 트러블슈팅

### 문제 1: 게스트 로그인 버튼 미발견

**증상**:

```
TimeoutError: waiting for locator('button:has-text("게스트로 체험하기")') to be visible
```

**원인**:

- UI 변경으로 버튼 텍스트 변경
- 로딩 지연으로 타임아웃

**해결**:

1. 스크린샷 확인 (`test-results/`)
2. 셀렉터 업데이트:
   ```typescript
   const guestButton = page.locator(
     'button:has-text("게스트"), button:has-text("체험")'
   );
   ```
3. 타임아웃 증가:
   ```typescript
   await expect(guestButton).toBeVisible({ timeout: 20000 });
   ```

---

### 문제 2: PIN 인증 실패

**증상**:

```
Error: 관리자 인증 실패: 잘못된 PIN
```

**원인**:

- PIN 값 잘못 입력 (4231 아님)
- API 엔드포인트 변경

**해결**:

1. PIN 재확인:
   ```typescript
   await activateAdminMode(page, { password: '4231' }); // 정확히 4231
   ```
2. API 응답 확인 (브라우저 콘솔):
   ```
   🌐 API 응답: 200 - {"success": true}
   ```
3. 환경변수 확인:
   ```bash
   echo $TEST_SECRET_KEY
   ```

---

### 문제 3: 대시보드 요소 미발견

**증상**:

```
expect(foundIndicators).toBeGreaterThan(0) // Expected > 0, received: 0
```

**원인**:

- 대시보드 UI 변경
- 백엔드 API 응답 없음
- 네트워크 타임아웃

**해결**:

1. 스크린샷 확인:
   ```bash
   open test-results/vercel-dashboard-loaded.png
   ```
2. 네트워크 탭 확인 (수동):
   - F12 → Network 탭
   - `/api/` 요청 확인
3. 셀렉터 업데이트:
   ```typescript
   const dashboardIndicators = ['Dashboard', '대시보드', 'Main']; // UI 변경 반영
   ```

---

### 문제 4: AI 사이드바 미렌더링

**증상**:

```
expect(sidebarFound || inputVisible || sendButtonCount > 0).toBe(true) // Expected true, received false
```

**원인**:

- AI 사이드바 지연 로딩
- 관리자 모드에서만 표시 (권한 문제)
- UI 변경으로 셀렉터 불일치

**해결**:

1. 대기 시간 증가:
   ```typescript
   await page.waitForTimeout(5000); // AI 사이드바 로드 대기
   ```
2. 권한 확인:
   ```typescript
   const isAdminActive = await verifyAdminState(page);
   console.log('관리자 모드:', isAdminActive); // true 확인
   ```
3. 스크린샷으로 수동 확인:
   ```bash
   open test-results/vercel-ai-sidebar-rendered.png
   ```

---

## 예상 결과 예시

### 성공 시 콘솔 로그

```
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
```

---

## 참고 문서

- [Vercel 프로덕션 테스트 분석 보고서](../archive/testing/vercel-production-test-analysis.md)
- [고도화 필요도 분석](./vercel-production-enhancement-analysis.md)
- [관리자 모드 수동 테스트 가이드](./admin-mode-manual-test-guide.md)
- [Playwright E2E 테스트 가이드](./testing-guide.md)

---

**최종 업데이트**: 2025-10-12
**테스트 환경**: Vercel Production (openmanager-vibe-v5.vercel.app)
**자동화 범위**: 게스트 로그인 → PIN 인증 → 대시보드 → AI 사이드바 (98% 신뢰도)
**수동 테스트 범위**: /admin 페이지 접근 (필수)
