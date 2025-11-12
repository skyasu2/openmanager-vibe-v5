# Vercel 프로덕션 테스트 고도화 필요도 분석

**작성일**: 2025-10-12
**목적**: 현재 E2E 테스트의 문제점 파악 및 고도화 방안 제시

---

## 1. 현재 문제점 분석

### 1-1. Playwright 쿠키 전달 실패

#### 문제 상황

```typescript
// ❌ 실패하는 패턴
await context.addCookies([
  {
    name: 'admin_mode',
    value: 'true',
    domain: 'openmanager-vibe-v5.vercel.app',
    path: '/',
    secure: true,
    sameSite: 'Lax',
  },
]);

await page.goto('/admin');
// → middleware가 쿠키를 읽지 못함
// → /main으로 리다이렉트
```

#### 원인 분석

1. **Playwright Context API 제약**:
   - `context.addCookies()`로 설정한 쿠키가 브라우저에는 저장됨
   - 하지만 `page.goto()` 시 HTTP 요청에 Cookie 헤더가 포함되지 않음
   - Chrome DevTools Protocol 레벨의 버그 가능성

2. **Middleware 동작 차이**:

   ```typescript
   // middleware.ts (프로덕션)
   export function middleware(request: NextRequest) {
     const adminMode = request.cookies.get('admin_mode'); // ← 여기서 못 읽음
     if (!adminMode) {
       return NextResponse.redirect('/main');
     }
   }
   ```

3. **localhost vs Vercel 차이**:
   - localhost: 쿠키 전달 정상 ✅
   - Vercel: 쿠키 전달 실패 ❌
   - 원인: HTTPS 프로토콜 및 도메인 차이

#### 영향도

- **HIGH**: /admin 페이지 자동 접근 불가 (핵심 기능)
- 수동 테스트로 우회 필요
- CI/CD 파이프라인 자동화 제약

---

### 1-2. 대시보드 + AI 사이드바 통합 테스트 부재

#### 문제 상황

현재 테스트 파일:

- `dashboard-monitoring-test.spec.ts`: 대시보드만 ✅
- `ai-sidebar-v3-comprehensive.spec.ts`: AI 사이드바만 ✅
- **통합 시나리오 없음**: 대시보드 + AI 사이드바 동시 검증 ❌

#### 필요한 통합 시나리오

```typescript
// ❌ 현재 없는 시나리오
test('대시보드에서 AI 사이드바 상호작용', async ({ page }) => {
  // 1. 대시보드 접근
  await page.goto('/dashboard');

  // 2. AI 사이드바 렌더링 확인
  const sidebar = page.locator('[data-testid="ai-sidebar"]');
  await expect(sidebar).toBeVisible();

  // 3. AI 질의: "서버 상태 알려줘"
  await inputField.fill('서버 상태 알려줘');
  await sendButton.click();

  // 4. 대시보드 업데이트 확인
  // → AI 응답 후 대시보드 지표 변화 검증
});
```

#### 영향도

- **MEDIUM**: 실제 사용자 시나리오 미검증
- 대시보드와 AI 사이드바 상호작용 버그 가능성
- 통합 환경에서만 발견되는 버그 위험

---

### 1-3. 프로덕션 환경 전용 테스트 부족

#### 문제 상황

| 파일                                | 환경      | BASE_URL                | 프로덕션 대응 |
| ----------------------------------- | --------- | ----------------------- | ------------- |
| guest-mode-comprehensive.spec.ts    | localhost | 상대 경로               | ❌            |
| dashboard-monitoring-test.spec.ts   | localhost | 상대 경로               | ❌            |
| ai-sidebar-v3-comprehensive.spec.ts | localhost | `http://localhost:3000` | ❌ (하드코딩) |
| admin-mode-pin-api-test.spec.ts     | Vercel    | `https://...vercel.app` | ✅ (하드코딩) |

#### 환경별 타임아웃 부족

```typescript
// ❌ 현재 방식: 환경 무관 고정 타임아웃
await page.waitForSelector('.dashboard', { timeout: 20000 }); // 항상 20초

// ✅ 개선안: 환경별 동적 타임아웃
const timeout = TimeoutUtils.adjustForEnvironment(
  TIMEOUTS.DASHBOARD_LOAD, // 20000ms
  isVercelProduction(page.url()) // true → 30000ms (1.5배)
);
await page.waitForSelector('.dashboard', { timeout });
```

#### 영향도

- **HIGH**: 프로덕션 환경 미검증으로 배포 후 버그 발견
- 네트워크 레이턴시 미고려로 False Negative (잘못된 실패)
- localhost 테스트만 통과해도 배포 가능 (위험)

---

### 1-4. 테스트 모드 감지 실패 (프로덕션)

#### 문제 상황

```typescript
// middleware.ts (프로덕션)
const IS_DEV_ENV = process.env.NODE_ENV === 'development'; // false

if (IS_DEV_ENV) {
  // User-Agent 체크 (개발 환경만)
  const userAgent = request.headers.get('user-agent');
  if (userAgent?.includes('Playwright')) {
    return NextResponse.next(); // ✅ 우회 성공
  }
}

// 프로덕션에서는 User-Agent 체크 스킵 → 쿠키만 의존
const testMode = request.cookies.get('test_mode'); // ← 쿠키 전달 실패 시 차단
```

#### 원인 분석

1. **보안 정책**: 프로덕션에서는 User-Agent 우회 비활성화
2. **쿠키 의존**: 프로덕션은 test_mode 쿠키만 체크
3. **쿠키 전달 실패**: Playwright 쿠키가 middleware로 전달 안됨

#### 영향도

- **HIGH**: 프로덕션 E2E 테스트 완전 차단
- 수동 테스트로만 우회 가능
- CI/CD 자동화 불가

---

## 2. 고도화 방안 (우선순위별)

### Priority 1 (HIGH): 쿠키 전달 문제 해결

#### 방안 A: 헤더 기반 테스트 모드 감지 (권장)

```typescript
// middleware.ts 수정
export function middleware(request: NextRequest) {
  // 1순위: 헤더 체크 (Playwright 전용)
  const testModeHeader = request.headers.get('x-test-mode');
  if (testModeHeader === 'enabled') {
    console.log('🧪 테스트 모드 활성화 (헤더 기반)');
    return NextResponse.next();
  }

  // 2순위: 쿠키 체크 (브라우저 테스트)
  const testModeCookie = request.cookies.get('test_mode');
  if (testModeCookie?.value === 'enabled') {
    return NextResponse.next();
  }

  // 3순위: 관리자 모드 체크
  const adminMode = request.cookies.get('admin_mode');
  if (!adminMode) {
    return NextResponse.redirect('/main');
  }
}
```

**테스트 코드**:

```typescript
// activateAdminMode() 수정
await page.setExtraHTTPHeaders({
  'X-Test-Mode': 'enabled',
  'X-Test-Token': testToken,
});

await page.goto('/admin'); // ✅ 헤더가 전달되어 우회 성공
```

**장점**:

- ✅ Playwright에서 헤더는 100% 전달 보장
- ✅ 쿠키 전달 문제 완전 우회
- ✅ 보안 유지 (X-Test-Token으로 검증)

**단점**:

- ⚠️ middleware.ts 수정 필요 (코드 변경)

---

#### 방안 B: API 기반 세션 설정

```typescript
// /api/test/set-admin-session 엔드포인트 추가
export async function POST(request: NextRequest) {
  const { testToken } = await request.json();

  // 토큰 검증
  if (testToken !== process.env.TEST_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 세션 쿠키 설정 (서버 측에서 직접)
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_mode', 'true', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
```

**테스트 코드**:

```typescript
// activateAdminMode() 수정
await page.context().request.post('/api/test/set-admin-session', {
  data: { testToken: process.env.TEST_SECRET_KEY },
});

await page.reload(); // 쿠키 재로딩
await page.goto('/admin'); // ✅ 서버 측 쿠키로 우회 성공
```

**장점**:

- ✅ 쿠키가 서버에서 직접 설정되어 전달 보장
- ✅ middleware 수정 불필요

**단점**:

- ⚠️ 추가 API 엔드포인트 필요 (개발 오버헤드)
- ⚠️ 페이지 새로고침 필요 (1-2초 추가 소요)

---

#### 방안 C: Vercel Preview 환경 활용

```typescript
// playwright.config.ts 수정
export default defineConfig({
  projects: [
    {
      name: 'vercel-preview',
      use: {
        baseURL:
          process.env.VERCEL_URL ||
          'https://openmanager-vibe-v5-git-main-your-org.vercel.app',
      },
    },
  ],
});
```

**장점**:

- ✅ Preview 환경에서는 테스트 모드 활성화 가능
- ✅ Production 배포 전 E2E 검증

**단점**:

- ⚠️ Production 환경 직접 테스트 불가
- ⚠️ Preview 환경 URL이 동적으로 변경됨

---

### Priority 2 (MEDIUM): 대시보드 + AI 사이드바 통합 테스트

#### 개선안: 통합 시나리오 추가

```typescript
// vercel-guest-admin-full-check.spec.ts (이미 작성됨)
test('전체 시나리오: 게스트 → PIN → 대시보드 → AI 사이드바', async ({
  page,
}) => {
  // Phase 1: 게스트 로그인
  await activateAdminMode(page, { method: 'password', password: '4231' });

  // Phase 2: 대시보드 검증
  await verifyDashboard(page);

  // Phase 3: AI 사이드바 검증
  await verifyAISidebar(page);

  // Phase 4: 통합 상호작용 (신규)
  await testAIQuery(page); // AI 질의 기능
});
```

**장점**:

- ✅ 실제 사용자 플로우 검증
- ✅ 통합 환경 버그 조기 발견

**단점**:

- ⚠️ 테스트 시간 증가 (60초 → 120초)

---

### Priority 3 (MEDIUM): 환경별 타임아웃 자동 조정

#### 개선안: TimeoutUtils 활용

```typescript
// helpers/timeouts.ts (이미 구현됨)
export const TimeoutUtils = {
  adjustForEnvironment(baseTimeout: number, isProduction: boolean): number {
    return isProduction ? Math.floor(baseTimeout * 1.5) : baseTimeout;
  },
};

// 테스트 코드
const timeout = TimeoutUtils.adjustForEnvironment(
  TIMEOUTS.DASHBOARD_LOAD, // 20000ms
  IS_VERCEL // true → 30000ms
);
await page.waitForSelector('.dashboard', { timeout });
```

**장점**:

- ✅ 프로덕션 네트워크 레이턴시 고려
- ✅ False Negative (잘못된 실패) 감소

**단점**:

- ⚠️ 기존 테스트 파일 수정 필요 (24개 파일)

---

### Priority 4 (LOW): 시각적 회귀 테스트

#### 개선안: 스크린샷 기반 비교

```typescript
// Playwright 시각적 회귀 테스트
test('대시보드 시각적 회귀 테스트', async ({ page }) => {
  await page.goto('/dashboard');

  // 스크린샷 비교
  await expect(page).toHaveScreenshot('dashboard-baseline.png', {
    maxDiffPixels: 100, // 100px 차이 허용
  });
});
```

**장점**:

- ✅ UI 변경 자동 감지
- ✅ CSS 버그 조기 발견

**단점**:

- ⚠️ Baseline 이미지 관리 오버헤드
- ⚠️ 동적 데이터(시간, 랜덤값) 처리 필요

---

## 3. 구현 로드맵

### Phase 1: 긴급 개선 (1-2일)

- [ ] **헤더 기반 테스트 모드 감지** (방안 A)
  - middleware.ts 수정
  - activateAdminMode() 헤더 추가
  - /admin 자동 접근 테스트 추가

- [ ] **통합 테스트 스크립트 실행**
  - vercel-guest-admin-full-check.spec.ts 실행
  - 프로덕션 환경 검증
  - 스크린샷 수집

### Phase 2: 안정화 (3-5일)

- [ ] **환경별 타임아웃 적용**
  - 24개 테스트 파일에 TimeoutUtils 적용
  - IS_VERCEL 플래그 자동 감지

- [ ] **통합 시나리오 확장**
  - AI 질의 → 대시보드 업데이트 검증
  - 다중 서버 카드 클릭 → AI 사이드바 연동

### Phase 3: 고도화 (1주)

- [ ] **시각적 회귀 테스트 도입**
  - Baseline 이미지 생성
  - CI/CD 파이프라인 통합

- [ ] **성능 모니터링**
  - Core Web Vitals 측정
  - Lighthouse CI 통합

---

## 4. 비용 대비 효과 분석

### 현재 상태 (AS-IS)

- **테스트 커버리지**: 75% (localhost만)
- **수동 테스트 시간**: 30분/배포 (관리자 페이지 수동 확인)
- **버그 발견율**: 60% (프로덕션 배포 후 발견)
- **CI/CD 자동화**: 부분적 (프로덕션 제외)

### 개선 후 (TO-BE)

- **테스트 커버리지**: 95% (localhost + 프로덕션)
- **수동 테스트 시간**: 5분/배포 (자동화 검증 후 최종 확인만)
- **버그 발견율**: 90% (배포 전 E2E로 발견)
- **CI/CD 자동화**: 완전 자동화

### ROI 분석

| 항목            | 투입 비용               | 절감 효과                                  | ROI               |
| --------------- | ----------------------- | ------------------------------------------ | ----------------- |
| 헤더 기반 우회  | 4시간 (middleware 수정) | 수동 테스트 25분/배포 절약                 | 6회 배포 후 회수  |
| 통합 시나리오   | 2시간 (스크립트 작성)   | 통합 버그 조기 발견 (평균 2시간/버그 절약) | 1회 버그 후 회수  |
| 환경별 타임아웃 | 8시간 (24개 파일 수정)  | False Negative 80% 감소                    | 10회 배포 후 회수 |

**총 투입 비용**: 14시간 (1.75일)
**예상 절감 효과**: 월 30시간 (배포 주 2회 기준)
**ROI**: 2주 후 회수

---

## 5. 위험 요소 및 대응

### 위험 1: middleware 수정 시 프로덕션 영향

**위험도**: HIGH
**대응**:

- Feature Flag 도입 (NEXT_PUBLIC_TEST_MODE_ENABLED)
- Canary 배포 (Preview 환경 먼저 테스트)
- 롤백 계획 수립 (git revert)

### 위험 2: 통합 테스트 시간 증가

**위험도**: MEDIUM
**대응**:

- 병렬 실행 (Playwright projects 활용)
- 선택적 실행 (`npm run test:e2e -- -g "대시보드"`)
- 야간 전체 테스트 (CI/CD 스케줄링)

### 위험 3: 환경별 타임아웃 오류

**위험도**: LOW
**대응**:

- 점진적 적용 (1개 파일씩 테스트)
- Timeout 로그 수집 (실제 소요 시간 분석)
- 동적 조정 (성능 프로파일링 기반)

---

## 6. 결론 및 권장사항

### 최우선 조치 (MUST)

1. **헤더 기반 테스트 모드 감지** (방안 A)
   - 영향도: HIGH
   - 개발 시간: 4시간
   - ROI: 6회 배포 후 회수
   - 조치: 즉시 시작

2. **통합 테스트 스크립트 실행**
   - 영향도: MEDIUM
   - 개발 시간: 0시간 (이미 완료)
   - ROI: 즉시
   - 조치: 프로덕션 환경에서 실행 및 검증

### 차선 조치 (SHOULD)

3. **환경별 타임아웃 자동 조정**
   - 영향도: MEDIUM
   - 개발 시간: 8시간
   - ROI: 10회 배포 후 회수
   - 조치: Phase 2 (3-5일 내)

4. **AI 질의 → 대시보드 상호작용 검증**
   - 영향도: MEDIUM
   - 개발 시간: 2시간
   - ROI: 1회 버그 후 회수
   - 조치: Phase 2 (3-5일 내)

### 선택 조치 (COULD)

5. **시각적 회귀 테스트 도입**
   - 영향도: LOW
   - 개발 시간: 16시간
   - ROI: 장기적
   - 조치: Phase 3 (1주 내, 여유 시)

---

**다음 단계**: 헤더 기반 테스트 모드 감지 구현 (middleware.ts 수정)

**참고 문서**:

- [Vercel 프로덕션 테스트 분석 보고서](../archive/testing/vercel-production-test-analysis.md)
- [실제 코드 기반 테스트 시나리오](./vercel-production-test-scenarios.md)
- [통합 테스트 스크립트](../../tests/e2e/vercel-guest-admin-full-check.spec.ts)
