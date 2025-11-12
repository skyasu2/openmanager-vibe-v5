# Vercel 프로덕션 테스트 방식 분석 보고서

**작성일**: 2025-10-12
**목적**: 기존 E2E 테스트의 게스트+관리자 모드 구현 방식 분석 및 프로덕션 환경 적용 전략 수립

---

## 1. 기존 테스트 파일 분석 결과

### 1-1. guest-mode-comprehensive.spec.ts

**테스트 범위**: 게스트 로그인 → PIN 인증 → 관리자 모드 활성화

#### 핵심 구현 패턴

```typescript
// Phase 1: 게스트 로그인 (UI 기반)
await page.goto('/login');
const guestButton = page.locator('button:has-text("게스트로 체험하기")');
await guestButton.click();
await page.waitForURL(/\/main/, { timeout: 10000 });

// Phase 2: PIN 인증 (하이브리드 - UI 우선, API 백업)
try {
  // UI 플로우 시도
  await completeAdminModeActivationViaUI(page);
} catch {
  // API 백업 (실패 시 대체)
  await activateAdminMode(page, { method: 'password', password: '4231' });
}

// Phase 3: 관리자 기능 확인 (UI 검증)
const adminFeatures = ['button:has-text("시스템 시작")', ...];
```

#### 검증 항목

- ✅ localStorage 기반 인증 상태 (auth_type, auth_user)
- ✅ 메인 페이지 렌더링 (main, header, h1)
- ✅ PIN 인증 API 응답 (간접 검증)
- ✅ 관리자 기능 UI (시스템 시작 버튼)

#### 특징

1. **환경**: localhost:3000 전용
2. **인증 방식**: UI 클릭 기반 (백업: API)
3. **검증 방식**: UI 요소 존재 여부
4. **타임아웃**: 단계별 5-15초 (총 30초 이내)

---

### 1-2. dashboard-monitoring-test.spec.ts

**테스트 범위**: 대시보드 UI 요소 및 실시간 데이터 모니터링

#### 핵심 구현 패턴

```typescript
// Phase 1: 게스트 로그인 (간소화)
const guestButton = page.locator('button:has-text("게스트"), button:has-text("체험")');
await guestButton.first().click();

// Phase 2: 시스템 시작 버튼 클릭
const systemStartButton = page.locator('button:has-text("시스템 시작")');
if (await systemStartButton.isEnabled()) {
  await systemStartButton.click();
  await page.waitForTimeout(4000); // 카운트다운 대기
}

// Phase 3: 대시보드 요소 검증
const dashboardIndicators = ['Server', '서버', 'CPU', 'Memory', 'Response'];
const monitoringSelectors = ['[data-testid^="server-card"]', '.server-card', ...];
```

#### 검증 항목

- ✅ 대시보드 접근 (직접 또는 system-boot 경유)
- ✅ 서버 카드 렌더링
- ✅ 모니터링 지표 (CPU, Memory, Response)
- ✅ 실시간 데이터 업데이트 (10초 간격 비교)

#### 특징

1. **환경**: localhost:3000 전용
2. **접근 방식**: 시스템 시작 버튼 또는 직접 /dashboard 이동
3. **검증 방식**: 텍스트 기반 + 셀렉터 기반
4. **스크린샷**: 단계별 캡처 (test-results/)

---

### 1-3. ai-sidebar-v3-comprehensive.spec.ts

**테스트 범위**: AI 어시스턴트 사이드바 렌더링 및 질의 기능

#### 핵심 구현 패턴

```typescript
// Phase 1: AI 사이드바 렌더링 확인
const sidebar = page.locator('[data-testid="ai-sidebar"], .ai-sidebar');
await expect(sidebar.first()).toBeVisible({ timeout: 10000 });

// Phase 2: 입력 필드 및 버튼 확인
const inputField = page.locator('input[type="text"], textarea').first();
const sendButton = page
  .locator('button')
  .filter({ hasText: /send|보내기|전송/i });

// Phase 3: AI 질의 기능 테스트
await inputField.fill('서버 상태 알려줘');
await sendButton.click();
await page.waitForSelector('.message, [data-testid*="message"]', {
  timeout: 30000,
});
```

#### 검증 항목

- ✅ AI 사이드바 렌더링
- ✅ 입력 필드 및 전송 버튼
- ✅ AI 모드 선택기
- ✅ 메시지 전송 및 응답 수신
- ✅ V3 신규 기능 (ThinkingProcessVisualizer)
- ✅ 에러 처리 (네트워크 에러 시뮬레이션)

#### 특징

1. **환경**: localhost:3000 전용
2. **비동기 처리**: 30초 타임아웃 (AI 응답 대기)
3. **에러 시뮬레이션**: page.route() 사용
4. **성능 측정**: Navigation Timing API

---

### 1-4. admin-mode-pin-api-test.spec.ts

**테스트 범위**: Vercel 프로덕션 환경 PIN 인증 API 검증 (축소 범위)

#### 핵심 구현 패턴

```typescript
// 프로덕션 환경 설정
const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';

// Phase 1: 테스트 모드 쿠키 설정
await context.addCookies([
  {
    name: 'test_mode',
    value: 'enabled',
    domain: 'openmanager-vibe-v5.vercel.app',
    path: '/',
    secure: true,
    sameSite: 'Lax',
  },
]);

// Phase 2: 게스트 로그인
await page.goto(BASE_URL);
const guestButton = page.locator('button:has-text("게스트로 체험하기")');
await guestButton.click();
await page.waitForURL('**/main', { timeout: 15000 });

// Phase 3: PIN 인증 (UI 클릭)
const profileButton = page.locator('button').filter({ hasText: /게스트/i });
await profileButton.click();
const adminButton = page
  .locator('[role="menuitem"]')
  .filter({ hasText: /관리자/i });
await adminButton.click();

// Phase 4: API 응답 캡처
page.on('response', async (response) => {
  if (response.url().includes('/api/admin/verify-pin')) {
    const json = await response.json();
    console.log('API 응답:', json);
  }
});
```

#### 검증 항목

- ✅ 게스트 로그인 (프로덕션)
- ✅ PIN 다이얼로그 표시
- ✅ PIN 4231 입력
- ✅ /api/admin/verify-pin 응답 200 OK
- ✅ admin_mode 쿠키 설정
- ⚠️ "관리자 페이지" 메뉴 표시 (타이밍 이슈)
- ❌ /admin 페이지 접근 (Playwright 쿠키 전달 문제)

#### 제약사항

1. **쿠키 전달 문제**: `context.addCookies()`로 설정한 쿠키가 middleware로 전달 안됨
2. **테스트 모드 감지**: 프로덕션에서 `IS_DEV_ENV=false`로 User-Agent 체크 스킵됨
3. **수동 테스트 필요**: /admin 페이지 접근은 브라우저 개발자 도구로 수동 검증

---

## 2. 헬퍼 함수 구조 분석

### 2-1. admin.ts (관리자 모드 헬퍼)

#### 핵심 기능

1. **activateAdminMode()**: API 기반 관리자 모드 활성화 (2-3초)
   - 프로덕션: password 모드 강제
   - localStorage 설정: admin_mode=true
   - 쿠키 설정: test_mode, vercel_test_token
   - 헤더 설정: X-Test-Mode, X-Test-Token

2. **ensureGuestLogin()**: API 기반 게스트 로그인
   - /api/test/vercel-test-auth 호출
   - localStorage 설정: auth_type=guest
   - 테스트 모드 쿠키 설정

3. **verifyAdminState()**: 관리자 상태 검증
   - localStorage + Zustand 상태 확인
   - 이중 검증 (combined OR 로직)

4. **resetAdminState()**: 상태 초기화
   - localStorage 정리
   - 쿠키 삭제
   - HTTP 헤더 정리

#### 보안 강화 메커니즘

- 동적 토큰 생성 (generateSecureTestToken)
- 프로덕션 환경 감지 (isVercelProduction)
- API 사용 가능 여부 확인 (checkTestApiAvailability)

---

### 2-2. ui-flow.ts (UI 플로우 헬퍼)

#### 핵심 기능

1. **openProfileDropdown()**: data-testid 기반 프로필 클릭
2. **clickAdminModeMenuItem()**: 관리자 모드 메뉴 클릭
3. **enterPinAndSubmit()**: PIN 입력 및 제출
4. **completeAdminModeActivationViaUI()**: 전체 플로우 통합

#### 특징

- data-testid 우선 (안정적 셀렉터)
- 애니메이션 대기 (300ms)
- networkidle 대기 (API 완료 보장)

---

### 2-3. timeouts.ts (타임아웃 표준화)

#### 분류

- **QUICK** (5초 이하): API_RESPONSE, DOM_UPDATE, CLICK_RESPONSE
- **STANDARD** (10-30초): DASHBOARD_LOAD, MODAL_DISPLAY, FORM_SUBMIT
- **EXTENDED** (60초 이상): E2E_TEST, AI_QUERY

#### 환경별 조정

```typescript
TimeoutUtils.adjustForEnvironment(baseTimeout, isProduction);
// 프로덕션: 1.5배 (네트워크 레이턴시 고려)
```

---

## 3. localhost vs Vercel 환경 차이점

### 3-1. 인증 메커니즘

| 환경          | 인증 방식     | 상태 저장           | 쿠키 전달    |
| ------------- | ------------- | ------------------- | ------------ |
| **localhost** | UI 클릭 + API | localStorage        | ✅ 완벽      |
| **Vercel**    | API 직접 호출 | localStorage + 쿠키 | ⚠️ 부분 실패 |

### 3-2. 테스트 모드 감지

```typescript
// localhost (개발 환경)
IS_DEV_ENV = true
→ User-Agent: 'Playwright Test Agent' 체크
→ test_mode 쿠키 우회 가능

// Vercel (프로덕션)
IS_DEV_ENV = false
→ User-Agent 체크 스킵
→ test_mode 쿠키만 의존 → 쿠키 전달 실패 시 차단
```

### 3-3. Middleware 동작 차이

```typescript
// localhost
page.goto('/admin') → middleware가 test_mode 쿠키 읽음 ✅

// Vercel
page.goto('/admin') → middleware가 test_mode 쿠키 못 읽음 ❌
→ 원인: Playwright context.addCookies()가 서버 요청에 포함 안됨
```

---

## 4. 대시보드 + AI 사이드바 통합 테스트 부재

### 4-1. 현재 상황

- **dashboard-monitoring-test.spec.ts**: 대시보드만 테스트 (AI 사이드바 미포함)
- **ai-sidebar-v3-comprehensive.spec.ts**: AI 사이드바만 테스트 (대시보드 미포함)
- **통합 시나리오 없음**: 관리자 모드 활성화 → 대시보드 + AI 사이드바 동시 검증

### 4-2. 필요한 통합 시나리오

```typescript
// 통합 시나리오 (현재 없음)
1. 게스트 로그인
2. PIN 4231 인증
3. 대시보드 접근 → 서버 카드, 모니터링 지표 확인
4. AI 사이드바 렌더링 확인
5. AI 질의 → 서버 상태 조회
6. 대시보드 + AI 사이드바 상호작용 검증
```

---

## 5. 프로덕션 환경 전용 테스트 부족

### 5-1. localhost 중심 테스트 현황

| 파일                        | 환경      | BASE_URL                               | 프로덕션 대응 |
| --------------------------- | --------- | -------------------------------------- | ------------- |
| guest-mode-comprehensive    | localhost | 미지정 (상대 경로)                     | ❌            |
| dashboard-monitoring-test   | localhost | 미지정 (상대 경로)                     | ❌            |
| ai-sidebar-v3-comprehensive | localhost | http://localhost:3000 (하드코딩)       | ❌            |
| admin-mode-pin-api-test     | Vercel    | https://openmanager-vibe-v5.vercel.app | ✅ (부분)     |

### 5-2. 프로덕션 테스트 요구사항

1. **환경 변수 기반 BASE_URL**

   ```bash
   BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e
   ```

2. **프로덕션 전용 타임아웃**

   ```typescript
   const timeout = TimeoutUtils.adjustForEnvironment(
     TIMEOUTS.DASHBOARD_LOAD,
     isVercelProduction(page.url())
   );
   // 20초 → 30초 (프로덕션)
   ```

3. **네트워크 레이턴시 대응**
   - networkidle 대기 필수
   - 스크린샷 기반 시각적 검증

---

## 6. 기존 테스트 방식 요약

### 6-1. 장점

1. ✅ **모듈화**: 헬퍼 함수 분리 (admin.ts, ui-flow.ts, timeouts.ts)
2. ✅ **하이브리드 접근**: UI 우선 + API 백업
3. ✅ **타임아웃 표준화**: 207개 하드코딩 값 제거
4. ✅ **보안 강화**: 동적 토큰 생성, 환경별 인증 방식 분리
5. ✅ **상세 로깅**: 단계별 콘솔 로그 + 스크린샷

### 6-2. 단점

1. ❌ **localhost 의존**: 3개 파일이 localhost 전용
2. ❌ **쿠키 전달 문제**: Vercel 환경에서 /admin 접근 불가
3. ❌ **통합 시나리오 부재**: 대시보드 + AI 사이드바 동시 검증 없음
4. ❌ **프로덕션 타임아웃 부족**: 네트워크 레이턴시 미고려
5. ⚠️ **수동 테스트 의존**: /admin 페이지 접근은 개발자 도구로 수동 검증

---

## 7. 개선 방향 제안

### 7-1. 환경 감지 자동화

```typescript
// helpers/config.ts
export function getBaseUrl(): string {
  return (
    process.env.BASE_URL ||
    process.env.PLAYWRIGHT_TEST_BASE_URL ||
    'http://localhost:3000'
  );
}

export function isVercelProduction(url?: string): boolean {
  const targetUrl = url || getBaseUrl();
  return targetUrl.includes('vercel.app');
}
```

### 7-2. 프로덕션 쿠키 전달 우회

```typescript
// Option A: API 기반 세션 설정
await page.evaluate(() => {
  // 클라이언트에서 직접 쿠키 설정
  document.cookie = 'admin_mode=true; path=/; secure; samesite=lax';
});

// Option B: 헤더 기반 우회 (권장)
await page.setExtraHTTPHeaders({
  'X-Admin-Mode': 'true',
  'X-Test-Token': testToken,
});
```

### 7-3. 통합 테스트 시나리오 추가

```typescript
// vercel-guest-admin-full-check.spec.ts
test('프로덕션: 대시보드 + AI 사이드바 통합 점검', async ({ page }) => {
  // 1. 게스트 + 관리자 모드
  await activateAdminMode(page, { method: 'password', password: '4231' });

  // 2. 대시보드 검증
  await verifyDashboard(page);

  // 3. AI 사이드바 검증
  await verifyAISidebar(page);

  // 4. 통합 상호작용 검증
  await verifyIntegration(page);
});
```

---

## 8. 결론

### 8-1. 현재 테스트 커버리지

- ✅ **게스트 로그인**: 완벽 (localhost + Vercel)
- ✅ **PIN 인증 API**: 완벽 (Vercel API 검증)
- ⚠️ **대시보드**: localhost만 (프로덕션 미검증)
- ⚠️ **AI 사이드바**: localhost만 (프로덕션 미검증)
- ❌ **/admin 페이지 접근**: 수동 테스트 의존

### 8-2. 고도화 우선순위

1. **HIGH**: 프로덕션 환경 통합 테스트 (대시보드 + AI 사이드바)
2. **HIGH**: 쿠키 전달 문제 해결 (/admin 자동 접근)
3. **MEDIUM**: 환경별 타임아웃 자동 조정
4. **LOW**: 시각적 회귀 테스트 (스크린샷 기반)

---

**다음 단계**: 실행 가능한 통합 테스트 스크립트 작성 (vercel-guest-admin-full-check.spec.ts)
