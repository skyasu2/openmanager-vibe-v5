# 🔍 사이드 이펙트 분석: 게스트 모드 로그인 플로우 변경

> **분석 일자**: 2025-11-20  
> **커밋**: 065f78be  
> **변경 내용**: 게스트 로그인 리다이렉트 경로 변경 및 제한 로직 추가

## 📋 변경 사항 요약

### 1. 로그인 리다이렉트 경로 변경
```typescript
// src/app/login/LoginClient.tsx
// 변경 전: window.location.href = '/dashboard';
// 변경 후: window.location.href = '/main';
```

### 2. 게스트 제한 로직 추가
```typescript
// src/app/main/page.tsx
const isGuest = !isGitHubUser;
if (isGuest && !guestSystemStartEnabled) {
  alert('⚠️ 게스트 모드는 시스템을 시작할 수 없습니다.\n\nGitHub 로그인을 이용해주세요.');
  return;
}
```

---

## 🎯 영향 받는 컴포넌트

### ✅ 직접 영향
| 컴포넌트 | 파일 | 영향 |
|---|---|---|
| LoginClient | `src/app/login/LoginClient.tsx` | 리다이렉트 경로 변경 |
| MainPage | `src/app/main/page.tsx` | 게스트 제한 로직 추가 |

### 🔄 간접 영향
| 컴포넌트 | 파일 | 영향 |
|---|---|---|
| AuthCallback | `src/app/auth/callback/page.tsx` | 변경 없음 (이미 /main) |
| DashboardPage | `src/app/dashboard/page.tsx` | 변경 없음 |
| GuestModeConfig | `src/config/guestMode.ts` | 기존 함수 활용 |

---

## 🔄 사용자 플로우 변경

### Before (이전)
```
게스트 로그인 → /dashboard (직접 접속)
```

### After (현재)
```
게스트 로그인 → /main → 시스템 시작 버튼 → /dashboard
```

### Future (향후 제한 시)
```
게스트 로그인 → /main → 시스템 시작 버튼 → ⚠️ 알림 (접근 차단)
GitHub 로그인 → /main → 시스템 시작 버튼 → /dashboard ✅
```

---

## 🧪 테스트 시나리오

### 1. 게스트 로그인 플로우
- [x] 로그인 페이지에서 "게스트로 시작" 클릭
- [x] `/main` 페이지로 리다이렉트 확인
- [x] localStorage에 게스트 세션 저장 확인
- [x] 쿠키에 `auth_type=guest` 저장 확인

### 2. 메인 페이지 접근
- [x] 게스트 세션으로 `/main` 접근 가능
- [x] UnifiedProfileHeader에 게스트 정보 표시
- [x] "시스템 시작" 버튼 활성화 확인

### 3. 시스템 시작 (현재 동작)
- [x] 게스트 모드에서 "시스템 시작" 버튼 클릭
- [x] 카운트다운 3초 시작
- [x] `/system-boot` → `/dashboard` 이동
- [x] 정상 동작 확인

### 4. 게스트 제한 (향후 활성화 시)
- [ ] `isGuestSystemStartEnabled()` → `false` 변경
- [ ] 게스트 모드에서 "시스템 시작" 버튼 클릭
- [ ] 알림 팝업 표시 확인
- [ ] 대시보드 접근 차단 확인

---

## 🔒 보안 영향 분석

### 1. 인증 상태 관리
```typescript
// localStorage
auth_type: 'guest' | 'github'
auth_session_id: string
auth_user: JSON

// Cookie
guest_session_id: string (게스트만)
auth_type: 'guest' | 'github'
```

**영향**: 없음 (기존 로직 유지)

### 2. 권한 체크
```typescript
// 게스트 여부 확인
const isGuest = !isGitHubUser;

// 제한 플래그
const guestSystemStartEnabled = isGuestSystemStartEnabled();
```

**영향**: 새로운 권한 체크 추가 (현재는 통과)

### 3. 세션 유효성
- 게스트 세션: 2시간 (쿠키 max-age)
- GitHub 세션: Supabase 기본값 (24시간)

**영향**: 없음 (기존 로직 유지)

---

## 📊 성능 영향 분석

### 1. 리다이렉트 횟수
| 시나리오 | Before | After | 차이 |
|---|---|---|---|
| 게스트 로그인 | 1회 | 2회 | +1 |
| GitHub 로그인 | 2회 | 2회 | 0 |

**영향**: 게스트 로그인 시 리다이렉트 1회 추가 (약 100-200ms)

### 2. 페이지 로드
- `/main` 페이지: 기존 페이지, 추가 로드 없음
- 초기 렌더링: ~500ms (변경 없음)

**영향**: 미미함

### 3. 메모리 사용
- 게스트 제한 체크: O(1) 연산
- 추가 상태: `guestSystemStartEnabled` (boolean)

**영향**: 무시 가능

---

## 🐛 잠재적 버그 및 해결

### 1. 무한 리다이렉트 루프
**위험도**: 낮음

**시나리오**:
```
/main → 인증 실패 → /login → 게스트 로그인 → /main → ...
```

**해결책**:
- `useInitialAuth` 훅에서 인증 상태 안정화
- `authReady` 플래그로 리다이렉트 제어
- 이미 구현됨 ✅

### 2. 게스트 세션 만료
**위험도**: 중간

**시나리오**:
```
게스트 로그인 → 2시간 경과 → 세션 만료 → 접근 차단
```

**해결책**:
- 쿠키 만료 시 자동 로그아웃
- `/login` 페이지로 리다이렉트
- 이미 구현됨 ✅

### 3. GitHub 로그인 후 게스트 쿠키 잔존
**위험도**: 낮음

**시나리오**:
```
게스트 로그인 → GitHub 로그인 → 게스트 쿠키 남음
```

**해결책**:
- `AuthCallback` 페이지에서 게스트 쿠키 정리
- 이미 구현됨 ✅

```typescript
// src/app/auth/callback/page.tsx
document.cookie = `guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
localStorage.removeItem('auth_type');
```

---

## 🔄 데이터 플로우 다이어그램

### 게스트 로그인 플로우
```mermaid
graph TD
    A[로그인 페이지] --> B[게스트로 시작 클릭]
    B --> C[게스트 세션 생성]
    C --> D[localStorage 저장]
    D --> E[쿠키 저장]
    E --> F[/main 리다이렉트]
    F --> G[메인 페이지 로드]
    G --> H{게스트 제한 활성화?}
    H -->|No| I[시스템 시작 가능]
    H -->|Yes| J[알림 표시]
    I --> K[/dashboard 접근]
    J --> L[접근 차단]
```

### GitHub 로그인 플로우
```mermaid
graph TD
    A[로그인 페이지] --> B[GitHub 로그인 클릭]
    B --> C[OAuth 리다이렉트]
    C --> D[/auth/callback]
    D --> E[세션 확인]
    E --> F[게스트 쿠키 정리]
    F --> G[/main 리다이렉트]
    G --> H[메인 페이지 로드]
    H --> I[시스템 시작 가능]
    I --> J[/dashboard 접근]
```

---

## 🎯 향후 개선 사항

### 1. 게스트 제한 UI 개선
**현재**: `alert()` 팝업
**개선안**: 모달 컴포넌트 + GitHub 로그인 버튼

```typescript
// 예시
<Modal>
  <h2>⚠️ 게스트 모드 제한</h2>
  <p>시스템을 시작하려면 GitHub 로그인이 필요합니다.</p>
  <button onClick={handleGitHubLogin}>
    GitHub로 로그인
  </button>
</Modal>
```

### 2. 게스트 권한 세분화
**현재**: 시스템 시작만 제한
**개선안**: 기능별 권한 설정

```typescript
export const GUEST_PERMISSIONS = {
  systemStart: false,
  aiAssistant: true,
  serverView: true,
  settingsChange: false,
};
```

### 3. 게스트 사용 통계
**추가**: 게스트 사용 패턴 분석

```typescript
// Supabase 로그
await supabase.from('guest_analytics').insert({
  action: 'system_start_blocked',
  timestamp: new Date(),
  session_id: guestSessionId,
});
```

---

## 📝 체크리스트

### 코드 변경
- [x] 로그인 리다이렉트 경로 변경
- [x] 게스트 제한 로직 추가
- [x] 타입 체크 통과
- [x] 테스트 통과 (125/125)
- [x] 커밋 및 푸시

### 문서화
- [x] 사이드 이펙트 분석 문서
- [x] 코드 주석 추가
- [x] TODO 주석 추가

### 테스트
- [x] 게스트 로그인 플로우
- [x] GitHub 로그인 플로우
- [x] 메인 페이지 접근
- [x] 시스템 시작 (현재 동작)
- [ ] 게스트 제한 (향후 테스트)

### 배포
- [x] GitHub 푸시
- [ ] Vercel 자동 배포 확인
- [ ] 프로덕션 테스트

---

## 🚀 배포 영향

### Vercel 배포
- **빌드 시간**: 변경 없음 (~2분)
- **번들 크기**: +0.5KB (게스트 제한 로직)
- **런타임**: 변경 없음

### 사용자 영향
- **게스트 사용자**: 리다이렉트 1회 추가 (~100ms)
- **GitHub 사용자**: 영향 없음
- **기존 세션**: 영향 없음 (쿠키 유지)

### 롤백 계획
```bash
# 문제 발생 시 롤백
git revert 065f78be
git push origin main
```

---

## 📊 결론

### ✅ 긍정적 영향
1. **사용자 플로우 통일**: 게스트/GitHub 모두 메인 페이지 경유
2. **향후 확장성**: 게스트 제한 로직 준비 완료
3. **코드 가독성**: 명확한 권한 체크 로직
4. **유지보수성**: 한 줄 수정으로 제한 활성화 가능

### ⚠️ 주의사항
1. **리다이렉트 증가**: 게스트 로그인 시 1회 추가
2. **UX 변경**: 사용자가 메인 페이지를 거쳐야 함
3. **테스트 필요**: 게스트 제한 활성화 시 추가 테스트

### 🎯 권장 사항
1. **현재**: 게스트/GitHub 동일하게 동작 (테스트 용이)
2. **향후**: `isGuestSystemStartEnabled()` → `false` 변경
3. **개선**: 알림 UI를 모달로 교체
4. **모니터링**: 게스트 사용 패턴 분석 추가

---

**분석 완료**: 2025-11-20  
**다음 단계**: Vercel 배포 확인 및 프로덕션 테스트
