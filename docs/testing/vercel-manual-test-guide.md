# Vercel 프로덕션 수동 테스트 가이드

**작성일**: 2025-10-12
**목적**: Playwright 자동화 제약으로 인한 /admin 페이지 접근 수동 검증 가이드

---

## 배경

**문제**: Playwright `context.addCookies()`로 설정한 쿠키가 서버(middleware) 요청에 포함되지 않음

**영향**: /admin 페이지 자동 접근 불가 → 수동 테스트 필요

**자동화 범위**:
- ✅ 게스트 로그인 (자동화 완료)
- ✅ PIN 4231 인증 (자동화 완료)
- ✅ API 응답 검증 (자동화 완료)
- ✅ 대시보드 점검 (자동화 완료)
- ✅ AI 사이드바 점검 (자동화 완료)
- ❌ /admin 페이지 접근 (수동 검증 필요)

---

## 수동 테스트 절차

### 1단계: 자동화 테스트 실행

```bash
# Vercel 프로덕션 환경 통합 테스트
BASE_URL=https://openmanager-vibe-v5.vercel.app npm run test:e2e -- vercel-guest-admin-full-check --headed
```

**예상 결과**:
- ✅ 게스트 로그인 성공
- ✅ PIN 4231 인증 성공
- ✅ 대시보드 렌더링 확인
- ✅ AI 사이드바 렌더링 확인
- ✅ 스크린샷 저장 (test-results/)

**자동화 완료 시점**: 약 18-30초 소요

---

### 2단계: 브라우저 개발자 도구 확인

#### 2-1. 개발자 도구 열기

1. **브라우저 열기**: Chrome 또는 Edge
2. **Vercel 프로덕션 접속**: https://openmanager-vibe-v5.vercel.app
3. **F12 키 또는 Ctrl+Shift+I**: 개발자 도구 열기

#### 2-2. 쿠키 확인

1. **Application 탭** 클릭
2. **Cookies** → `https://openmanager-vibe-v5.vercel.app` 선택
3. 다음 쿠키 확인:

| 쿠키 이름 | 예상 값 | 설명 |
|----------|--------|------|
| `admin_mode` | `true` | 관리자 모드 활성화 상태 |
| `guest_session_id` | UUID 형식 (예: `550e8400-e29b...`) | 게스트 세션 ID |
| `auth_type` | `guest` | 인증 타입 |
| `test_mode` | `enabled` | 테스트 모드 (자동화에서 설정) |

**스크린샷 예시**:

```
Name                | Value              | Domain                     | Path
--------------------|--------------------|-----------------------------|------
admin_mode          | true               | openmanager-vibe-v5.vercel.app | /
guest_session_id    | 550e8400-e29b-...  | openmanager-vibe-v5.vercel.app | /
auth_type           | guest              | openmanager-vibe-v5.vercel.app | /
test_mode           | enabled            | openmanager-vibe-v5.vercel.app | /
```

#### 2-3. localStorage 확인 (선택적)

1. **Console 탭** 클릭
2. 다음 명령어 실행:

```javascript
// localStorage 상태 확인
console.log('admin_mode:', localStorage.getItem('admin_mode'));
console.log('auth_type:', localStorage.getItem('auth_type'));
console.log('auth_user:', localStorage.getItem('auth_user'));
```

**예상 출력**:
```
admin_mode: true
auth_type: guest
auth_user: guest
```

---

### 3단계: /admin 페이지 수동 접근

#### 방법 A: URL 직접 입력

1. **주소창 클릭**
2. **URL 입력**: `https://openmanager-vibe-v5.vercel.app/admin`
3. **Enter 키**

#### 방법 B: 프로필 드롭다운 (권장)

1. **우측 상단 프로필 버튼** 클릭 (게스트 아이콘 또는 "관리자" 텍스트)
2. **드롭다운 메뉴** 확인
3. **"관리자 페이지"** 메뉴 클릭

**예상 메뉴 구조**:
```
[프로필 드롭다운]
├── 게스트 (또는 관리자) ← 현재 상태 표시
├── ━━━━━━━━━━━━━━━━
├── 프로필
├── 설정
├── 관리자 페이지 ← 이 메뉴 클릭
└── 로그아웃
```

---

### 4단계: /admin 페이지 접근 결과 확인

#### ✅ 성공 시

**URL**: `https://openmanager-vibe-v5.vercel.app/admin`

**화면 구성**:
- 관리자 전용 헤더 또는 타이틀 ("관리자 대시보드", "Admin Page")
- 관리자 전용 기능:
  - 서버 관리
  - 사용자 관리
  - 시스템 설정
  - 로그 조회

**스크린샷 캡처** (수동):
1. F12 → 스크린샷 도구 사용
2. 또는 Windows: `Win+Shift+S` / macOS: `Cmd+Shift+4`
3. 저장 경로: `test-results/manual-admin-page-success.png`

---

#### ❌ 실패 시 (리다이렉트)

**URL**: `https://openmanager-vibe-v5.vercel.app/main` (자동 리다이렉트)

**원인**:
1. **admin_mode 쿠키 미설정**: PIN 인증 실패 또는 쿠키 삭제
2. **middleware 쿠키 체크 실패**: Playwright 쿠키 전달 문제 (자동화 제약)
3. **세션 만료**: 24시간 경과 또는 브라우저 재시작

**대응 방법**:

1. **쿠키 재확인** (2단계 반복)
   - `admin_mode=true` 존재 여부 확인

2. **쿠키가 없으면 PIN 재입력**:
   - 우측 상단 프로필 버튼 클릭
   - "관리자 모드" 메뉴 클릭
   - PIN 4231 입력
   - "관리자 페이지" 메뉴로 변경 확인

3. **쿠키가 있는데도 리다이렉트되면**:
   - **원인**: middleware가 쿠키를 읽지 못함 (Playwright 환경)
   - **해결**: 일반 브라우저에서 재시도 (Playwright 아닌 Chrome 직접 실행)

---

### 5단계: 관리자 페이지 기능 검증

#### 필수 검증 항목

- [ ] **관리자 헤더 표시**
  - "관리자 대시보드" 또는 "Admin Page" 타이틀

- [ ] **관리자 전용 기능 접근**
  - 서버 관리 메뉴
  - 사용자 관리 메뉴
  - 시스템 설정 메뉴

- [ ] **일반 사용자 기능과 차이 확인**
  - 게스트 모드에서는 없던 메뉴 확인
  - "관리자 전용" 배지 또는 표시

#### 선택 검증 항목 (시간 여유 시)

- [ ] **서버 관리 기능**
  - 서버 추가/삭제
  - 서버 상태 변경

- [ ] **사용자 관리 기능**
  - 사용자 목록 조회
  - 권한 변경

- [ ] **시스템 설정**
  - 설정 값 조회
  - 설정 변경 (주의: 실제 프로덕션 데이터)

---

## 트러블슈팅

### 문제 1: "관리자 페이지" 메뉴가 없음

**증상**:
- 프로필 드롭다운에 "관리자 모드" 메뉴만 있고 "관리자 페이지" 없음

**원인**:
- PIN 인증 미완료
- 클라이언트 상태 업데이트 실패

**해결**:
1. **페이지 새로고침** (F5)
2. **프로필 버튼 다시 클릭**
3. "관리자 페이지" 메뉴 확인
4. 여전히 없으면 **PIN 재입력**

---

### 문제 2: PIN 다이얼로그가 열리지 않음

**증상**:
- "관리자 모드" 버튼 클릭해도 아무 반응 없음

**원인**:
- JavaScript 에러
- 다이얼로그 컴포넌트 렌더링 실패

**해결**:
1. **F12 → Console 탭** 확인
2. 에러 메시지 확인
3. **페이지 새로고침** (F5)
4. 재시도

---

### 문제 3: /admin 접근 시 404 Not Found

**증상**:
- URL: `/admin`
- 화면: "404 Page Not Found"

**원인**:
- `/admin` 라우트 미구현
- Next.js 빌드 오류

**해결**:
1. **URL 재확인**: `https://openmanager-vibe-v5.vercel.app/admin` (오타 확인)
2. **Vercel 배포 상태 확인**: https://vercel.com/dashboard
3. **개발팀 문의**: `/admin` 라우트 존재 여부 확인

---

## 자동화 vs 수동 테스트 비교

| 항목 | 자동화 (Playwright) | 수동 테스트 | 비고 |
|------|-------------------|-----------|------|
| 게스트 로그인 | ✅ 완전 자동 | - | - |
| PIN 4231 인증 | ✅ 완전 자동 | - | - |
| API 응답 검증 | ✅ 완전 자동 | - | - |
| 대시보드 점검 | ✅ 완전 자동 | - | - |
| AI 사이드바 점검 | ✅ 완전 자동 | - | - |
| /admin 접근 | ❌ 불가능 | ⚠️ 수동 필요 | Playwright 쿠키 전달 문제 |
| 관리자 기능 검증 | ❌ 불가능 | ⚠️ 수동 필요 | /admin 접근 전제 |

**자동화 커버리지**: 85% (5/6 단계)
**수동 테스트 소요 시간**: 약 2-5분

---

## 고도화 계획

### 현재 제약 해결 방안 (개발팀 조치 필요)

#### 방안 A: 헤더 기반 테스트 모드 감지 (권장)

```typescript
// middleware.ts 수정
export function middleware(request: NextRequest) {
  // 1순위: 헤더 체크 (Playwright 전용)
  const testModeHeader = request.headers.get('x-test-mode');
  if (testModeHeader === 'enabled') {
    return NextResponse.next(); // 우회
  }

  // 2순위: 쿠키 체크
  const adminMode = request.cookies.get('admin_mode');
  if (!adminMode) {
    return NextResponse.redirect('/main');
  }
}
```

**효과**:
- ✅ Playwright에서 `page.setExtraHTTPHeaders()` 사용 시 100% 전달 보장
- ✅ /admin 자동 접근 가능
- ✅ 수동 테스트 불필요

**소요 시간**: 개발 4시간 + 테스트 2시간

---

#### 방안 B: API 기반 세션 설정

```typescript
// /api/test/set-admin-session 엔드포인트 추가
export async function POST(request: NextRequest) {
  // 서버 측에서 직접 쿠키 설정
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_mode', 'true', { ... });
  return response;
}
```

**효과**:
- ✅ 서버에서 쿠키 설정 시 전달 보장
- ✅ /admin 자동 접근 가능

**소요 시간**: 개발 2시간 + 테스트 1시간

---

## 참고 문서

- [Vercel 프로덕션 테스트 분석 보고서](./vercel-production-test-analysis.md)
- [실제 코드 기반 테스트 시나리오](./vercel-production-test-scenarios.md)
- [고도화 필요도 분석](./vercel-production-enhancement-analysis.md)
- [통합 테스트 스크립트](../../tests/e2e/vercel-guest-admin-full-check.spec.ts)

---

**최종 업데이트**: 2025-10-12
**테스트 환경**: Vercel Production (openmanager-vibe-v5.vercel.app)
**자동화 범위**: 게스트 로그인 → PIN 인증 → 대시보드 → AI 사이드바 (85%)
**수동 테스트 범위**: /admin 페이지 접근 및 기능 검증 (15%, 2-5분 소요)
