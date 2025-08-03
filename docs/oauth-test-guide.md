# GitHub OAuth 로그인 테스트 가이드

## 📍 현재 상태 (2025-08-03 14:28 KST)

- **배포 URL**: https://openmanager-vibe-v5.vercel.app/
- **버전**: v5.44.3
- **서버 상태**: ✅ 정상 (모든 서비스 작동 중)
- **최신 수정사항**: GitHub OAuth 쿠키 Secure 속성 추가 (커밋: 990248e1b)

## 🧪 테스트 방법

### 1. 브라우저 준비

1. Chrome 또는 Edge 브라우저 사용 권장
2. 개발자 도구 열기 (F12)
3. Network 탭과 Application → Cookies 탭 준비

### 2. GitHub OAuth 로그인 테스트

1. **메인 페이지 접속**
   ```
   https://openmanager-vibe-v5.vercel.app/
   ```
   - 자동으로 `/login` 페이지로 리다이렉트 확인

2. **GitHub 로그인 버튼 클릭**
   - "GitHub로 계속하기" 버튼 클릭
   - GitHub 인증 페이지로 이동 확인

3. **GitHub 인증**
   - GitHub 계정으로 로그인
   - 앱 권한 승인

4. **콜백 처리 확인**
   - `/auth/callback` 페이지로 리다이렉트
   - "인증 처리 중..." 메시지 표시
   - 개발자 도구에서 쿠키 확인:
     - `auth_verified` 쿠키 (Secure 속성 확인)
     - `sb-*` 쿠키들 (Supabase 세션)

5. **메인 페이지 이동**
   - `/main` 페이지로 성공적 리다이렉트
   - 대시보드 정상 표시

### 3. 문제 발생 시 확인사항

#### A. 무한 루프 발생 시

1. **쿠키 확인**
   - Application → Cookies → openmanager-vibe-v5.vercel.app
   - `auth_verified` 쿠키 존재 여부
   - `Secure` 속성 설정 여부

2. **콘솔 로그 확인**
   ```javascript
   // 개발자 도구 Console에서 확인할 로그들:
   "🔐 OAuth 콜백 페이지 로드..."
   "✅ 세션 확인됨:"
   "🚀 메인 페이지로 이동!"
   ```

3. **네트워크 흐름**
   - Network 탭에서 리다이렉트 체인 확인
   - 302 응답과 Location 헤더 확인

#### B. 디버깅 정보 수집

1. **브라우저 정보**
   ```javascript
   console.log({
     protocol: window.location.protocol,
     hostname: window.location.hostname,
     cookies: document.cookie,
     userAgent: navigator.userAgent
   });
   ```

2. **쿠키 테스트**
   ```javascript
   // 쿠키 설정 테스트
   document.cookie = "test=value; path=/; Secure; SameSite=Lax";
   console.log("Test cookie set:", document.cookie.includes("test"));
   ```

### 4. 게스트 로그인 테스트

1. **게스트 버튼 클릭**
   - "게스트로 체험하기" 버튼 클릭
   - 즉시 `/main` 페이지로 이동 확인

2. **게스트 쿠키 확인**
   - `guest_session_id` 쿠키
   - `auth_type=guest` 쿠키
   - 둘 다 `Secure` 속성 있어야 함

## 📊 예상 결과

### ✅ 성공 시나리오

1. GitHub 로그인 → 콜백 → 메인 페이지 (3-5초 내)
2. 쿠키에 `Secure` 속성 포함
3. 세션 유지되어 새로고침해도 로그인 상태 유지

### ❌ 실패 시나리오

1. 로그인 → 콜백 → 다시 로그인 페이지 (무한 루프)
2. 쿠키에 `Secure` 속성 없음
3. 콘솔에 세션 없음 에러

## 🐛 버그 리포트 제출 시 포함 정보

1. **환경 정보**
   - 브라우저 종류 및 버전
   - 운영체제
   - 시도한 시간 (KST)

2. **스크린샷**
   - Network 탭 리다이렉트 체인
   - Application → Cookies 화면
   - Console 로그

3. **재현 단계**
   - 정확한 클릭 순서
   - 각 단계별 URL 변화
   - 표시된 메시지

## 🔗 관련 리소스

- **Supabase 대시보드**: 프로젝트 → Authentication → Providers → GitHub 설정 확인
- **GitHub OAuth App**: Settings → Developer settings → OAuth Apps
- **Vercel 대시보드**: https://vercel.com/skyasus-projects/openmanager-vibe-v5

---

**문의**: 테스트 중 문제 발생 시 GitHub Issue에 등록해주세요.