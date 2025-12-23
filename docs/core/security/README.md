# 🔒 보안 정책 및 가이드

OpenManager VIBE v5의 보안 정책과 구현 가이드입니다.

## 🔐 인증 시스템

### GitHub OAuth
- **Provider**: Supabase Auth + GitHub OAuth
- **Scope**: 기본 프로필 정보 (email, name, avatar)
- **Session**: JWT 토큰 기반 세션 관리
- **Storage**: HttpOnly 쿠키 (XSS 방지)

### 로컬 스토리지 마이그레이션
- **기존**: localStorage 기반 세션
- **현재**: HttpOnly 쿠키로 마이그레이션 완료
- **보안 향상**: XSS 공격 벡터 제거

## 🛡️ Supabase 보안 현황

### 현재 보안 상태 (무료 티어)
- **API 인증**: Admin 인증 시스템 적용
- **환경변수 보호**: 민감한 데이터 노출 제거
- **RLS 정책**: Row Level Security 활용
- **읽기 전용 모드**: 포트폴리오 데모용 안전 설정

### 적용된 보안 조치
- `/api/debug/env` 엔드포인트 Admin 인증 추가
- 민감한 환경변수 완전 보호
- Supabase 기본 보안 정책 활용

## 🔧 보안 설정 가이드

### 환경변수 관리
```bash
# 필수 보안 환경변수
SUPABASE_SERVICE_ROLE_KEY=  # 서버 전용
NEXTAUTH_SECRET=            # JWT 서명 키
GITHUB_CLIENT_SECRET=       # OAuth 시크릿
```

### API 보안
- **Rate Limiting**: Vercel Edge Functions 기본 제한
- **CORS**: 도메인별 접근 제어
- **Input Validation**: Zod 스키마 검증

## 📚 상세 문서

- **[GitHub OAuth](./github-oauth.md)**: GitHub OAuth 설정 및 구현
- **[localStorage 마이그레이션](./localStorage-to-cookie-migration.md)**: 보안 강화를 위한 쿠키 마이그레이션
