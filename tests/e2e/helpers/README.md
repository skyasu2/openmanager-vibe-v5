# E2E Test Helpers 사용 가이드

## 📚 개요

E2E 테스트를 위한 헬퍼 파일들의 목적과 사용법을 안내합니다.

---

## 🗂️ 헬퍼 파일 목록

### 1. **config.ts** - 환경 설정 중앙 관리
**목적**: 테스트 환경별 URL 및 환경 감지

**주요 함수**:
- `getTestBaseUrl()` - 테스트 베이스 URL 반환
- `isVercelProduction(url?)` - Vercel 프로덕션 환경 여부
- `isLocalEnvironment(url?)` - 로컬 환경 여부

**사용 예시**:
```typescript
import { getTestBaseUrl } from './helpers/config';

const baseUrl = getTestBaseUrl();
await page.goto(baseUrl + '/dashboard');
```

---

### 2. **timeouts.ts** - 타임아웃 상수 중앙 관리
**목적**: 테스트 타임아웃 값을 의미있는 이름으로 통일

**주요 상수**:
- `TIMEOUTS.API_RESPONSE` - 5초 (빠른 API 응답)
- `TIMEOUTS.MODAL_DISPLAY` - 10초 (모달/컴포넌트 표시)
- `TIMEOUTS.FORM_SUBMIT` - 15초 (폼 제출)
- `TIMEOUTS.NETWORK_REQUEST` - 30초 (네트워크 요청)
- `TIMEOUTS.E2E_TEST` - 60초 (전체 E2E 테스트)

**사용 예시**:
```typescript
import { TIMEOUTS } from './helpers/timeouts';

await page.waitForURL('**/login', { timeout: TIMEOUTS.API_RESPONSE });
await expect(button).toBeVisible({ timeout: TIMEOUTS.MODAL_DISPLAY });
```

---

### 3. **admin.ts** - 보안 중심 수동 테스트 헬퍼
**목적**: 세밀한 제어가 필요한 수동 E2E 테스트

**핵심 특징**:
- ✅ **프로덕션 인식**: Vercel에서는 password 강제, 로컬에서만 bypass 허용
- ✅ **단계별 제어**: 6개 독립 함수로 세밀한 제어 가능
- ✅ **보안 토큰**: 동적 보안 토큰 생성
- ✅ **상태 검증**: localStorage + Zustand 이중 확인
- ✅ **디버깅 친화적**: 요청 인터셉션, 상세 로깅

**주요 함수**:
```typescript
// 1. 게스트 로그인
await ensureGuestLogin(page);

// 2. 관리자 모드 활성화 (환경별 자동 감지)
await activateAdminMode(page, {
  method: 'password',  // 또는 'bypass'
  password: '4231'
});

// 3. 대시보드 이동
await navigateToAdminDashboard(page);

// 4. 상태 검증
const isAdmin = await verifyAdminState(page);

// 5. 정리
await resetAdminState(page);
```

**사용 대상**:
- 수동 E2E 테스트 작성자
- 단계별 제어가 필요한 테스트
- 프로덕션 보안을 고려한 테스트

**예시 테스트**:
```typescript
import { activateAdminMode, verifyAdminState } from './helpers/admin';

test('관리자 모드 인증 테스트', async ({ page }) => {
  // 수동으로 각 단계 제어
  await activateAdminMode(page, { method: 'password' });

  const isAdmin = await verifyAdminState(page);
  expect(isAdmin).toBe(true);
});
```

---

### 4. **vercel-test-auth.ts** - AI 자동화 편의성 극대화
**목적**: AI 에이전트가 원-콜로 테스트 모드 활성화

**핵심 특징**:
- ✅ **원-콜 솔루션**: `enableVercelTestMode()` 한 번으로 모든 설정
- ✅ **자동 네비게이션**: `aiNavigate()` - 자동 테스트 모드 + 페이지 이동
- ✅ **헤더 자동 주입**: 모든 요청에 테스트 헤더 자동 추가
- ✅ **AI 친화적**: 최소한의 코드로 최대 효과

**주요 함수**:
```typescript
// 🤖 AI가 가장 쉽게 사용하는 방법

// 1. 한 번에 모든 설정
await enableVercelTestMode(page);

// 2. 자동 네비게이션 (테스트 모드 자동 체크)
await aiNavigate(page, '/dashboard');
await aiNavigate(page, '/admin');

// 3. 상태 확인
const status = await getVercelTestStatus(page);

// 4. 정리
await cleanupVercelTestMode(page);
```

**사용 대상**:
- AI 자동화 (Playwright AI, Claude Code)
- 빠른 프로토타입 테스트
- 복잡한 설정 없이 즉시 시작

**예시 테스트**:
```typescript
import { enableVercelTestMode, aiNavigate } from './helpers/vercel-test-auth';

test('AI 친화적 대시보드 접근', async ({ page }) => {
  // 한 줄로 완료
  await enableVercelTestMode(page);

  // 자동 네비게이션
  await aiNavigate(page, '/dashboard');
  await aiNavigate(page, '/admin');
});
```

---

## 🎯 **선택 가이드**

### **언제 `admin.ts`를 사용하나요?**
- ✅ 수동 E2E 테스트 작성
- ✅ 단계별 제어가 필요한 경우
- ✅ 프로덕션 보안을 고려한 테스트
- ✅ 상태 검증이 중요한 테스트
- ✅ 디버깅 로그가 필요한 경우

**예시 시나리오**:
- 관리자 인증 흐름 테스트
- 프로덕션 환경에서 password 모드 검증
- 단계별 상태 확인이 필요한 복잡한 테스트

---

### **언제 `vercel-test-auth.ts`를 사용하나요?**
- ✅ AI 자동화 테스트
- ✅ 빠른 프로토타입 테스트
- ✅ 복잡한 설정 없이 즉시 시작
- ✅ 여러 페이지를 빠르게 이동하는 테스트

**예시 시나리오**:
- AI가 자동으로 생성하는 테스트
- 빠른 스모크 테스트
- 프로덕션 접근 권한이 필요한 E2E 테스트

---

## 📊 **비교표**

| 항목 | admin.ts | vercel-test-auth.ts |
|------|----------|---------------------|
| **철학** | 보안 중심 수동 제어 | AI 편의성 극대화 |
| **함수 수** | 6개 (세밀한 제어) | 4개 (간편 API) |
| **호출 횟수** | 3-5회 (단계별) | 1-2회 (원-콜) |
| **프로덕션 보안** | ✅ 환경별 강제 | ⚠️ bypass 허용 |
| **자동 네비게이션** | ❌ 수동 | ✅ `aiNavigate()` |
| **헤더 자동 주입** | ❌ 수동 | ✅ 자동 |
| **사용 난이도** | 중급 | 초급 |
| **AI 친화적** | 보통 | ✅ 최적화됨 |

---

## 🔄 **마이그레이션 가이드**

### `admin.ts` → `vercel-test-auth.ts`

**기존 코드**:
```typescript
await ensureGuestLogin(page);
await activateAdminMode(page, { method: 'bypass' });
await navigateToAdminDashboard(page, false);
```

**새 코드** (AI 친화적):
```typescript
await enableVercelTestMode(page);
await aiNavigate(page, '/dashboard');
```

---

### `vercel-test-auth.ts` → `admin.ts`

**기존 코드**:
```typescript
await enableVercelTestMode(page);
await aiNavigate(page, '/dashboard');
```

**새 코드** (보안 강화):
```typescript
await activateAdminMode(page, {
  method: 'password',  // 프로덕션에서 강제
  password: '4231'
});
await navigateToAdminDashboard(page);
```

---

## 🚀 **Best Practices**

1. **환경별 전략**:
   - **로컬**: `admin.ts` bypass 또는 `vercel-test-auth.ts`
   - **Vercel**: `admin.ts` password (보안 강화)

2. **테스트 시작 패턴**:
   ```typescript
   // 빠른 시작 (AI)
   await enableVercelTestMode(page);

   // 보안 중심 (수동)
   await activateAdminMode(page, { method: 'password' });
   ```

3. **정리 패턴**:
   ```typescript
   // 테스트 종료 시 항상 정리
   test.afterEach(async ({ page }) => {
     await resetAdminState(page);
     // 또는
     await cleanupVercelTestMode(page);
   });
   ```

---

## 📚 **추가 참고 자료**

- **E2E 테스트 전략**: `/docs/claude/testing/vercel-first-strategy.md`
- **CLAUDE.md 프로젝트 가이드**: `/CLAUDE.md`
- **Playwright 공식 문서**: https://playwright.dev/

---

**마지막 업데이트**: 2025-10-05
**작성자**: OpenManager VIBE Team
