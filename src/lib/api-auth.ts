/**
 * 🔐 간단한 API 보호 미들웨어
 *
 * 포트폴리오용 기본 보안 - 민감한 API만 보호
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * API 인증 확인
 * - GitHub OAuth 로그인 여부만 확인
 * - 복잡한 권한 시스템 없음
 */
export async function checkAPIAuth(request: NextRequest) {
  // 🧪 개발 환경에서는 AI 테스트를 위해 인증 우회 (임시)
  console.log('🧪 checkAPIAuth 호출됨 - NODE_ENV:', process.env.NODE_ENV);
  console.log('🧪 Request URL:', request.url);
  console.log('🧪 Request method:', request.method);
  
  // FORCE DEBUG: Always return development bypass error to test
  return NextResponse.json(
    { error: `🧪 DEBUG: checkAPIAuth called - NODE_ENV: ${process.env.NODE_ENV}, URL: ${request.url}` },
    { status: 401 }
  );
  
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === 'test') {
    console.log('🧪 Development mode: AI auth bypass enabled for testing');
    return null; // 개발환경에서 인증 우회
  }
  
  // 세션 쿠키 확인 (NextAuth 사용)
  const cookieHeader = request.headers.get('cookie');
  const hasAuthSession =
    cookieHeader?.includes('next-auth.session-token') ||
    cookieHeader?.includes('__Secure-next-auth.session-token');

  if (!hasAuthSession) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login first' },
      { status: 401 }
    );
  }

  return null; // 인증 통과
}

/**
 * 간단한 API 보호 래퍼
 * 사용법:
 * export const GET = withAuth(async (request) => { ... })
 */
export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authError = await checkAPIAuth(request);
    if (authError) return authError;

    return handler(request);
  };
}

/**
 * 관리자 전용 API 보호
 * - 현재는 로그인만 확인 (포트폴리오용이므로 복잡한 권한 체계 없음)
 */
export function withAdminAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withAuth(handler); // 포트폴리오용이므로 일반 인증과 동일
}
