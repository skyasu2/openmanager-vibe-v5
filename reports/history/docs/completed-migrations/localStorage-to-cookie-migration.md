# localStorage → HttpOnly Cookie 마이그레이션 계획

**생성일**: 2025-11-30
**우선순위**: 중간 (보안 강화 선택 사항)
**예상 소요**: 2-3일

---

## 📋 현재 상태 분석

### 현재 localStorage 사용 현황

**위치**: `src/hooks/useAutoLogout.ts`

```typescript
// 저장 (게스트 모드)
localStorage.setItem('auth_session_id', sessionId);
localStorage.setItem('auth_type', 'guest');

// 읽기
const sessionId = localStorage.getItem('auth_session_id');
const authType = localStorage.getItem('auth_type');

// 삭제 (로그아웃)
localStorage.removeItem('auth_session_id');
localStorage.removeItem('auth_type');
```

### 보안 위험 분석 (AI 리뷰)

> **Note**: 이 분석은 과거 Qwen이 포함된 3-AI 시스템에서 수행되었습니다.

#### 1. XSS 공격 취약성 (중위험)
- **문제**: localStorage는 JavaScript로 직접 접근 가능
- **시나리오**: XSS 공격 시 악의적 스크립트가 세션 ID 탈취 가능
- **영향**: 세션 하이재킹, 권한 상승

#### 2. 세션 토큰 재사용 위험 (저위험)
- **문제**: 서버 측 토큰 무효화 로직 없음
- **시나리오**: 로그아웃 후에도 토큰이 유효할 수 있음
- **영향**: 제한적 (게스트 모드 한정)

### 현재 완화 조치
- ✅ SSR 안전성 체크 (`typeof window !== 'undefined'`) - 2025-11-30 추가
- ✅ 자동 로그아웃 시 토큰 삭제
- ⚠️ XSS 방어 미흡 (CSP 미설정)

---

## 🎯 마이그레이션 계획

### Phase 1: 준비 단계 (1일)

#### 1.1 현재 인증 흐름 분석
- [ ] 게스트 모드 전체 흐름 문서화
- [ ] 세션 ID 생성 및 검증 로직 파악
- [ ] 의존 컴포넌트 식별

#### 1.2 보안 요구사항 정의
- [ ] 쿠키 속성 설정 (HttpOnly, Secure, SameSite)
- [ ] CSRF 토큰 필요성 검토
- [ ] 세션 만료 정책 수립

### Phase 2: 구현 (1일)

#### 2.1 API 라우트 생성
**파일**: `src/app/api/auth/session/route.ts`

```typescript
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/session - 세션 생성
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();

  cookies().set('auth_session_id', sessionId, {
    httpOnly: true,      // JavaScript 접근 차단
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF 방어
    maxAge: 30 * 60,     // 30분
    path: '/',
  });

  cookies().set('auth_type', 'guest', {
    httpOnly: false,     // 클라이언트 접근 허용 (UI 표시용)
    secure: true,
    sameSite: 'strict',
    maxAge: 30 * 60,
    path: '/',
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/auth/session - 세션 삭제
export async function DELETE() {
  cookies().delete('auth_session_id');
  cookies().delete('auth_type');

  return NextResponse.json({ success: true });
}

// GET /api/auth/session - 세션 확인
export async function GET() {
  const sessionId = cookies().get('auth_session_id')?.value;
  const authType = cookies().get('auth_type')?.value;

  return NextResponse.json({
    isAuthenticated: !!sessionId && authType === 'guest',
  });
}
```

#### 2.2 useAutoLogout 훅 리팩토링

**Before** (localStorage):
```typescript
localStorage.setItem('auth_session_id', sessionId);
localStorage.setItem('auth_type', 'guest');
```

**After** (API + Cookie):
```typescript
// 세션 생성
await fetch('/api/auth/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId }),
});

// 세션 확인
const res = await fetch('/api/auth/session');
const { isAuthenticated } = await res.json();

// 세션 삭제
await fetch('/api/auth/session', { method: 'DELETE' });
```

#### 2.3 Middleware 추가 (선택)
**파일**: `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('auth_session_id')?.value;

  // 보호된 경로 체크
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!sessionId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### Phase 3: 테스트 및 검증 (0.5일)

#### 3.1 단위 테스트
- [ ] useAutoLogout 훅 테스트
- [ ] API 라우트 테스트 (POST, GET, DELETE)

#### 3.2 E2E 테스트
- [ ] 게스트 로그인 플로우
- [ ] 자동 로그아웃 시나리오
- [ ] 쿠키 속성 검증 (Playwright)

#### 3.3 보안 검증
- [ ] XSS 방어 테스트
- [ ] CSRF 토큰 검증 (필요 시)
- [ ] 쿠키 속성 확인 (DevTools)

### Phase 4: 배포 및 모니터링 (0.5일)

#### 4.1 점진적 롤아웃
- [ ] Feature flag 설정 (환경변수)
- [ ] 10% 트래픽 테스트
- [ ] 100% 배포

#### 4.2 모니터링
- [ ] 로그인 성공률 모니터링
- [ ] 에러 로그 확인
- [ ] 세션 만료 이슈 추적

---

## ⚖️ 비용 편익 분석

### 장점
- ✅ XSS 공격 방어 강화 (HttpOnly)
- ✅ CSRF 방어 (SameSite=strict)
- ✅ 보안 모범 사례 준수
- ✅ 서버 측 세션 관리 가능

### 단점
- ❌ API 라운드트립 증가 (localStorage 대비 느림)
- ❌ 구현 복잡도 증가
- ❌ 테스트 부담 증가
- ❌ SSR/CSR 하이브리드 복잡성

### 판단
- **현재 프로젝트**: 게스트 모드 한정 (민감 정보 없음)
- **권장 사항**:
  - ⏳ **지금은 보류** (우선순위 낮음)
  - ✅ **조건부 진행**: OAuth 인증 추가 시 필수
  - ✅ **대안**: CSP(Content Security Policy) 강화로 XSS 방어

---

## 🔒 즉시 적용 가능한 보안 강화 (대안)

### 1. Content Security Policy (CSP)

**파일**: `src/app/layout.tsx` 또는 `next.config.js`

```typescript
// next.config.js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },
};
```

### 2. 세션 ID 암호화

**Before**:
```typescript
const sessionId = crypto.randomUUID();
```

**After** (서명 추가):
```typescript
import { createHmac } from 'crypto';

function generateSecureSessionId() {
  const id = crypto.randomUUID();
  const secret = process.env.SESSION_SECRET!;
  const signature = createHmac('sha256', secret).update(id).digest('hex');
  return `${id}.${signature}`;
}

function verifySessionId(signedId: string): string | null {
  const [id, signature] = signedId.split('.');
  const secret = process.env.SESSION_SECRET!;
  const expected = createHmac('sha256', secret).update(id).digest('hex');
  return signature === expected ? id : null;
}
```

---

## 📅 타임라인

| 단계 | 소요 시간 | 우선순위 |
|------|-----------|----------|
| **Phase 1**: 준비 | 1일 | 낮음 |
| **Phase 2**: 구현 | 1일 | 낮음 |
| **Phase 3**: 테스트 | 0.5일 | 중간 |
| **Phase 4**: 배포 | 0.5일 | 중간 |
| **CSP 적용** (대안) | 0.5일 | **높음** ✅ |
| **세션 ID 암호화** (대안) | 0.3일 | **높음** ✅ |

**총 소요**: 3일 (전체 마이그레이션) vs 0.8일 (대안 강화)

---

## 🎯 최종 권장사항

### 단기 (즉시)
1. ✅ **CSP 헤더 설정** (XSS 방어)
2. ✅ **세션 ID 서명** (위변조 방지)

### 중기 (필요 시)
- OAuth 인증 추가 시 HttpOnly Cookie 전환

### 장기 (v6.0)
- 전체 인증 시스템 재설계
- JWT + Refresh Token 패턴 도입

---

**결론**: localStorage는 **현재 게스트 모드 한정**으로 위험도 낮음. CSP + 세션 서명으로 충분한 보안 확보 가능. HttpOnly Cookie 마이그레이션은 **OAuth 인증 도입 시점에 진행 권장**.
