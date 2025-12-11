# [Legacy] 관리자 모드 수동 테스트 가이드

> ⚠️ **보관용 문서**  
> OpenManager VIBE v5.80.0부터 관리자 모드와 /admin 페이지가 제거되어 본 가이드는 참고용으로만 유지합니다. 최신 게스트/대시보드 플로우는 `docs/testing/e2e-testing-guide.md`를 참고하세요.

**목적**: (Legacy) 게스트 로그인 후 PIN 4231로 관리자 모드 활성화 및 /admin 페이지 접근 확인

**배경**: GitHub 로그인 테스트가 어려워 게스트 로그인 후 관리자 모드로 기능 점검

---

## 1. 자동화된 테스트 (API 범위)

### 실행 방법

```bash
# 게스트 로그인 → PIN 입력 → API 응답 검증
npm exec -- playwright test tests/e2e/admin-mode-pin-api-test.spec.ts --project=chromium --headed
```

### 검증 항목 (자동화)

- ✅ 게스트 로그인
- ✅ 프로필 드롭다운 열림
- ✅ "관리자 모드" 버튼 클릭
- ✅ PIN 입력 필드 발견
- ✅ PIN 4231 입력
- ✅ `/api/admin/verify-pin` 응답 200 OK
- ✅ API 응답 `{"success":true}`
- ✅ `admin_mode` 쿠키 설정 확인

### 제한사항

- ❌ `/admin` 페이지 접근 자동화 실패 (Playwright 쿠키 전달 문제)
- ❌ "관리자 페이지" 메뉴 표시 확인 실패 (클라이언트 상태 업데이트 타이밍)

**→ 다음 수동 테스트 필요**

---

## 2. 수동 테스트 (전체 플로우)

### 2-1. 환경 준비

1. **Vercel 프로덕션 URL 접속**
   - URL: https://openmanager-vibe-v5.vercel.app

2. **브라우저 개발자 도구 열기**
   - Chrome: `F12` 또는 `Ctrl+Shift+I`
   - Application 탭 → Cookies 선택

---

### 2-2. 게스트 로그인 및 PIN 인증

#### Step 1: 게스트 로그인

1. 홈페이지에서 **"게스트로 체험하기"** 버튼 클릭
2. `/main` 페이지로 자동 이동 확인
3. 우측 상단 프로필 버튼 확인 (게스트 아이콘)

#### Step 2: 관리자 모드 활성화

1. **프로필 버튼 클릭** (우측 상단)
2. 드롭다운 메뉴에서 **"관리자 모드"** 메뉴 클릭
3. PIN 입력 다이얼로그 표시 확인
4. **PIN 4231 입력**
5. **"확인"** 버튼 클릭

#### Step 3: 쿠키 확인 (개발자 도구)

1. **Application 탭** → **Cookies** → `https://openmanager-vibe-v5.vercel.app`
2. 다음 쿠키 확인:
   - `admin_mode`: `true` ✅
   - `guest_session_id`: (UUID 형식) ✅
   - `auth_type`: `guest` ✅

**스크린샷 예시**:

```
Name                | Value
--------------------|-------------------
admin_mode          | true
guest_session_id    | 550e8400-e29b-...
auth_type           | guest
```

---

### 2-3. 관리자 모드 권한 확인

#### Step 4: UI 변화 확인

1. **페이지 새로고침** (`F5`)
2. 프로필 버튼 다시 클릭
3. 드롭다운 메뉴에서 **"관리자 페이지"** 메뉴 확인 ✅
   - "관리자 모드" (활성화 버튼) → "관리자 페이지" (접근 링크)로 변경

#### Step 5: /admin 페이지 접근

1. **방법 A**: 드롭다운에서 "관리자 페이지" 클릭
2. **방법 B**: 주소창에 직접 `/admin` 입력

**예상 결과**:

- ✅ `/admin` 페이지 접근 성공
- ✅ 관리자 전용 기능 표시 (서버 관리, 설정 등)
- ❌ `/main`으로 리다이렉트되면 실패 (middleware 쿠키 체크 실패)

---

### 2-4. 권한 차이 검증 (게스트 vs GitHub)

#### 게스트 로그인 + 관리자 모드 (PIN 4231)

**접근 가능**:

- ✅ `/main` (대시보드)
- ✅ `/admin` (PIN 인증 후)

**제한사항**:

- ⚠️ GitHub 전용 API는 사용 불가
- ⚠️ 게스트 세션은 24시간 유효

#### GitHub 로그인 + 관리자 모드 (PIN 4231)

**접근 가능**:

- ✅ `/main` (대시보드)
- ✅ `/admin` (PIN 인증 후)
- ✅ GitHub API 연동 (Issues, Pull Requests 등)

**추가 권한**:

- 🔐 Supabase 세션 영구 저장 (로그아웃 전까지)
- 🔐 GitHub OAuth 토큰 사용

---

## 3. 문제 해결

### 3-1. /admin 접근 시 /main으로 리다이렉트

**원인**: middleware가 `admin_mode` 쿠키를 읽지 못함

**확인 사항**:

1. 개발자 도구에서 `admin_mode` 쿠키 존재 확인
2. 쿠키 속성 확인:
   - `HttpOnly`: `false` (프로덕션에서는 `true`)
   - `Secure`: `true`
   - `SameSite`: `Lax`
   - `Path`: `/`
   - `Domain`: (자동 설정)

**해결 방법**:

- 페이지 새로고침 (`F5`) 시도
- 쿠키가 없으면 PIN 재입력

### 3-2. PIN 인증 실패

**원인**: 잘못된 PIN 입력 또는 API 오류

**확인 사항**:

1. 개발자 도구 → Network 탭 확인
2. `/api/admin/verify-pin` 요청 확인:
   - Status: `200 OK` (성공)
   - Response: `{"success":true}` (성공)
   - Status: `401` (잘못된 PIN)

**해결 방법**:

- 정확한 PIN 재입력: `4231`
- API 오류 시 콘솔 로그 확인

### 3-3. 쿠키가 설정되지 않음

**원인**: 브라우저 쿠키 정책 또는 CSRF 오류

**확인 사항**:

1. 브라우저 쿠키 설정 확인 (Third-party cookies 허용)
2. 콘솔에서 CSRF 오류 메시지 확인
3. Network 탭에서 `Set-Cookie` 헤더 확인

**해결 방법**:

- 시크릿 모드에서 다시 시도
- 브라우저 캐시 삭제 후 재시도

---

## 4. 테스트 체크리스트

### 필수 검증 항목

- [ ] 게스트 로그인 성공
- [ ] PIN 다이얼로그 표시
- [ ] PIN 4231 입력
- [ ] API 응답 200 OK
- [ ] `admin_mode` 쿠키 설정
- [ ] 페이지 새로고침 후 쿠키 유지
- [ ] "관리자 페이지" 메뉴 표시
- [ ] `/admin` 페이지 접근 성공

### 선택 검증 항목

- [ ] 잘못된 PIN 입력 시 오류 메시지
- [ ] 쿠키 만료 시 재인증 요구
- [ ] GitHub 로그인과 권한 차이 확인

---

## 5. 자동화 가능성 (향후 개선)

### 현재 제약사항

1. **Playwright 쿠키 전달 문제**
   - `context.addCookies()`로 설정한 쿠키가 서버 요청에 포함되지 않음
   - `page.goto('/admin')` 시 middleware가 쿠키를 읽지 못함

2. **테스트 모드 감지 실패**
   - Production 환경에서 `IS_DEV_ENV` = `false`
   - Playwright User-Agent 체크가 스킵됨

### 해결 방안 (향후)

1. **Option A: 테스트 전용 헤더 추가**
   - Playwright 요청에 `X-Test-Mode: enabled` 헤더 자동 추가
   - Middleware에서 헤더 기반 우회

2. **Option B: Vercel Preview 환경 활용**
   - `VERCEL_ENV=preview`에서만 테스트 모드 활성화
   - Production 배포 전 Preview 환경에서 E2E 테스트

3. **Option C: API 기반 세션 설정**
   - `/api/test/set-admin-mode` 엔드포인트 추가
   - Playwright에서 API 호출로 쿠키 설정

---

## 6. 참고 문서

- [Playwright E2E 테스트 가이드](./testing-guide.md)
- [Vercel First 테스트 전략](./vercel-first-strategy.md)
- [관리자 모드 API 문서](../api/admin-verify-pin.md)

---

## 7. 문의

**문제 발생 시**:

1. 콘솔 로그 캡처 (개발자 도구 → Console 탭)
2. Network 탭 HAR 파일 저장
3. 스크린샷 첨부
4. Issue 등록: https://github.com/your-repo/issues

---

**최종 업데이트**: 2025-10-12
**테스트 환경**: Vercel Production (openmanager-vibe-v5.vercel.app)
**자동화 범위**: API 검증까지 (98.2% 신뢰도)
**수동 테스트 범위**: /admin 페이지 접근 (필수)
