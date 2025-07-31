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
  // 세션 쿠키 확인 (NextAuth 사용)
  const cookieHeader = request.headers.get('cookie');
  const hasAuthSession = cookieHeader?.includes('next-auth.session-token') || 
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