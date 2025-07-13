# 🧪 GitHub OAuth 테스트 완전 가이드

## 🎯 테스트 목표
Supabase에서 GitHub OAuth Provider를 활성화한 후, 실제로 GitHub 로그인이 정상 작동하는지 검증합니다.

## 📋 사전 확인사항

### ✅ Supabase Dashboard 설정 완료 여부
1. **Project**: `vnswjnltnhpsueosfhmw.supabase.co`
2. **Authentication → Providers → GitHub**: **활성화됨** ✅
3. **Client ID**: `Ov23liFnUsRO0ttNegju` ✅
4. **Client Secret**: 설정됨 ✅
5. **Redirect URL**: `https://vnswjnltnhpsueosfhmw.supabase.co/auth/v1/callback` ✅

### ✅ GitHub OAuth App 설정 확인
1. **GitHub → Settings → Developer settings → OAuth Apps**
2. **Authorization callback URL**: `https://vnswjnltnhpsueosfhmw.supabase.co/auth/v1/callback`

## 🚀 실제 테스트 단계

### 1단계: 로그인 페이지 접속
```
https://openmanager-vibe-v5.vercel.app/login
```

**확인 항목:**
- ✅ "GitHub로 로그인" 버튼이 표시되는가?
- ✅ "게스트로 시작하기" 버튼이 표시되는가?
- ✅ GitHub OAuth 설정 가이드가 표시되는가?

### 2단계: 게스트 로그인 테스트 (먼저 확인)
1. **"게스트로 시작하기" 클릭**
2. **예상 결과**: 홈페이지(`/`)로 자동 이동
3. **확인**: 게스트 세션으로 대시보드 접근 가능

### 3단계: GitHub OAuth 로그인 테스트
1. **"GitHub로 로그인" 클릭**
2. **예상 플로우**:
   ```
   로그인 페이지 → GitHub 인증 페이지 → 권한 승인 → 콜백 처리 → 홈페이지
   ```

### 4단계: 성공 시나리오 검증
**GitHub 인증 성공 시:**
- ✅ GitHub 권한 승인 페이지로 리다이렉트
- ✅ 승인 후 `/auth/callback`으로 리다이렉트
- ✅ 콜백 처리 후 홈페이지(`/`)로 이동
- ✅ GitHub 사용자 정보로 로그인됨 (이름, 아바타 등)

### 5단계: 에러 시나리오 확인
**가능한 에러들:**
- ❌ `provider is not enabled` → Supabase Dashboard에서 GitHub Provider 비활성화
- ❌ `Invalid redirect URI` → GitHub OAuth App의 콜백 URL 불일치
- ❌ `Invalid client` → GitHub Client ID/Secret 오류

## 🔬 상세 테스트 체크리스트

### GitHub OAuth 플로우 테스트
- [ ] 로그인 페이지에서 "GitHub로 로그인" 버튼 클릭
- [ ] GitHub 로그인 페이지로 리다이렉트됨
- [ ] GitHub 계정으로 로그인
- [ ] OpenManager 앱 권한 승인 페이지 표시
- [ ] "Authorize" 클릭
- [ ] 콜백 페이지에서 "인증 처리 중..." 메시지 표시
- [ ] 홈페이지로 자동 리다이렉트
- [ ] 우상단에 GitHub 사용자 정보 표시 (이름, 아바타)

### 사용자 데이터 확인
- [ ] GitHub 프로필 이름이 올바르게 표시됨
- [ ] GitHub 아바타 이미지가 올바르게 표시됨
- [ ] 사용자 메뉴에서 "로그아웃" 옵션 확인

### 세션 관리 테스트
- [ ] 새 탭에서 같은 사이트 열기 → 로그인 상태 유지됨
- [ ] 로그아웃 후 다시 접속 → 로그인 페이지로 리다이렉트
- [ ] 재로그인 시 이전 사용자 정보 복원됨

## 🚨 문제 해결 가이드

### 문제 1: "provider is not enabled"
**해결책:**
1. Supabase Dashboard → Authentication → Providers
2. GitHub 토글이 ON인지 확인
3. Client ID/Secret이 올바르게 입력되었는지 확인

### 문제 2: "Invalid redirect URI"
**해결책:**
1. GitHub OAuth App → Authorization callback URL 확인:
   ```
   https://vnswjnltnhpsueosfhmw.supabase.co/auth/v1/callback
   ```
2. Supabase의 정확한 콜백 URL 복사해서 사용

### 문제 3: 무한 로딩 또는 에러 페이지
**해결책:**
1. 브라우저 개발자 도구 → Console 탭에서 에러 확인
2. Network 탭에서 실패한 요청 확인
3. 로그인 페이지에서 에러 메시지 확인

## 🎉 성공 기준

### ✅ 완전 성공
- GitHub OAuth 로그인이 매끄럽게 작동함
- 사용자 정보가 올바르게 표시됨
- 세션이 안정적으로 유지됨
- 로그아웃이 정상 작동함

### ⚠️ 부분 성공
- 게스트 로그인은 작동하지만 GitHub OAuth에 문제
- GitHub OAuth는 작동하지만 사용자 데이터 누락

### ❌ 실패
- 로그인 페이지에서 에러 발생
- GitHub 인증 자체가 실패
- 콜백 처리에서 중단

## 📞 문제 신고

테스트 중 문제가 발생하면 다음 정보와 함께 신고:

1. **브라우저**: Chrome/Firefox/Safari 등
2. **에러 메시지**: 정확한 에러 텍스트
3. **발생 단계**: 어느 단계에서 실패했는지
4. **개발자 도구**: Console 에러 메시지
5. **스크린샷**: 에러 화면 캡처

## 🔗 테스트 URL

- **로그인 페이지**: https://openmanager-vibe-v5.vercel.app/login
- **홈페이지**: https://openmanager-vibe-v5.vercel.app/
- **테스트 API**: https://openmanager-vibe-v5.vercel.app/api/auth/test

---

## 📊 예상 테스트 결과

**예상 시간**: 5-10분
**성공률**: 95% (설정이 올바른 경우)
**가장 흔한 문제**: Supabase Dashboard에서 Provider 비활성화

**테스트 완료 후 이 문서를 업데이트해주세요! ✅**