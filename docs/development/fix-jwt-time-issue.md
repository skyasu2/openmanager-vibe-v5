# 🕐 JWT 시간 동기화 문제 해결 가이드

## 문제 상황

"Session was issued in the future! Check the device clock" 오류 발생

이 오류는 클라이언트(브라우저/WSL)의 시계와 Supabase 서버의 시계가 동기화되지 않았을 때 발생합니다.

## 근본 원인

- JWT 토큰의 `iat` (issued at) 타임스탬프가 현재 시간보다 미래로 설정됨
- 주로 WSL 환경에서 Windows와 시간이 동기화되지 않아 발생
- Vercel Edge Functions과 클라이언트 간 시간대 차이

## 즉시 해결 방법

### 1. WSL 시간 동기화 (권장)

```bash
# 시간 동기화 스크립트 실행
chmod +x scripts/fix-clock-sync.sh
./scripts/fix-clock-sync.sh

# 또는 수동으로
sudo hwclock -s

# 현재 시간 확인
date
```

### 2. Windows PowerShell에서 WSL 재시작

```powershell
# WSL 종료
wsl --shutdown

# WSL 재시작
wsl

# 시간 확인
date
```

### 3. 브라우저 캐시 및 쿠키 정리

1. 브라우저 개발자 도구 (F12) 열기
2. Application → Storage → Clear site data
3. 페이지 새로고침

## 영구적 해결 방법

### 1. WSL 설정 파일 수정

`/etc/wsl.conf` 파일 생성 또는 수정:

```ini
[boot]
systemd=true

[network]
generateResolvConf = false
```

### 2. Windows 작업 스케줄러 설정

1. 작업 스케줄러 열기
2. 새 작업 만들기
3. 트리거: "시스템 시작 시"
4. 동작: `wsl -d Ubuntu -u root -- ntpdate time.windows.com`

### 3. NTP 서비스 설치 (WSL)

```bash
# NTP 설치
sudo apt update
sudo apt install ntp

# NTP 서비스 활성화
sudo systemctl enable ntp
sudo systemctl start ntp

# 상태 확인
sudo systemctl status ntp
```

## 코드 수정 사항 (이미 적용됨)

### 1. Supabase 클라이언트 설정

```typescript
// src/lib/supabase/supabase-client.ts
createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'sb-auth-token',
    // 커스텀 storage로 시간 검증 우회
  },
});
```

### 2. 미들웨어 개선

- PKCE 코드 교환을 명시적으로 처리
- 세션 검증 시 auth_verified 쿠키 확인
- Vercel 환경에서 더 긴 대기시간 적용

### 3. 콜백 페이지 개선

- 세션 확인 재시도 로직 추가
- Vercel 환경 감지 및 처리
- 더 나은 에러 메시지

## 디버깅 방법

### 1. 시간 차이 확인

```javascript
// 브라우저 콘솔에서 실행
console.log('클라이언트 시간:', new Date().toISOString());

// 서버 시간과 비교
fetch('/api/time')
  .then((res) => res.json())
  .then((data) => {
    console.log('서버 시간:', data.serverTime);
    const diff = new Date() - new Date(data.serverTime);
    console.log('시간 차이(ms):', diff);
  });
```

### 2. JWT 토큰 확인

```javascript
// 브라우저 콘솔에서 실행
const token = localStorage.getItem('sb-auth-token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('토큰 발급 시간:', new Date(payload.iat * 1000));
  console.log('토큰 만료 시간:', new Date(payload.exp * 1000));
  console.log('현재 시간:', new Date());
}
```

## 추가 팁

### Vercel 배포 시

1. Vercel 대시보드에서 Function Region 확인
2. 가능하면 사용자와 가까운 지역 선택
3. Edge Functions 사용 시 시간대 고려

### 개발 환경

1. WSL 사용 시 매일 시간 동기화 확인
2. Docker 사용 시 호스트와 시간 동기화
3. VPN 사용 시 시간대 변경 주의

## 관련 이슈

- [Supabase Auth 시간 검증 이슈](https://github.com/supabase/auth/issues)
- [WSL 시간 동기화 문제](https://github.com/microsoft/WSL/issues)

## 문제가 지속될 경우

1. Supabase 대시보드에서 프로젝트 지역 확인
2. 브라우저 시간대 설정 확인
3. 시스템 BIOS 시간 확인
4. NTP 서버 접속 가능 여부 확인

---

💡 **핵심**: 대부분의 경우 WSL 시간 동기화만으로 해결됩니다. `./scripts/fix-clock-sync.sh` 실행을 권장합니다.
