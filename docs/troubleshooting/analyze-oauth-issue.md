# GitHub OAuth 무한 리다이렉트 문제 분석

## 🔍 현재 증상

1. **콘솔 로그 분석**:

```
🔄 Auth 상태 변경: INITIAL_SESSION skyasu@naver.com
🔐 Auth state changed: Authenticated
👤 사용자 정보 로드: Object
```

- 클라이언트에서는 인증된 세션이 존재함
- skyasu@naver.com으로 이미 로그인됨
- 하지만 로그인 페이지로 계속 리다이렉트됨

## 🎯 문제의 핵심

1. **클라이언트 vs 서버 세션 불일치**:
   - 클라이언트: 세션 있음 (skyasu@naver.com)
   - 미들웨어/서버: 세션 없음으로 판단

2. **가능한 원인들**:
   - Supabase 쿠키가 미들웨어에 전달되지 않음
   - 쿠키 도메인/경로 설정 문제
   - httpOnly 쿠키 접근 문제
   - Edge Runtime과 Node.js 런타임 간 차이

## 📊 분석할 부분

1. **미들웨어 디버깅**:
   - 실제로 어떤 쿠키가 전달되는지
   - Supabase 세션 쿠키 존재 여부
   - getSession() 실패 원인

2. **쿠키 설정 확인**:
   - sb-auth-token 쿠키
   - sb-refresh-token 쿠키
   - 도메인, 경로, SameSite 설정

3. **세션 동기화**:
   - 클라이언트와 서버 간 세션 상태
   - 쿠키 기반 vs 로컬 스토리지 기반 인증
