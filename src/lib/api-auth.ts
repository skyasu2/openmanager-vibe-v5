/**
 * 🔐 간단한 API 보호 미들웨어
 *
 * 포트폴리오용 기본 보안 - 민감한 API만 보호
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * API 인증 확인
 * - GitHub OAuth 로그인 여부만 확인
 * - 복잡한 권한 시스템 없음
 * - 테스트용 API 키 지원 (프로덕션 환경에서 외부 도구 테스트용)
 *
 * ⚠️ 보안 참고:
 * - API 키 인증 시 사용자 세션 컨텍스트 없음
 * - 다른 로직에서 session.user.id 사용 시 에러 발생 가능
 * - 테스트 목적으로만 사용 권장
 */
export async function checkAPIAuth(request: NextRequest) {
  // 개발 환경에서는 AI 테스트를 위해 인증 우회
  if (
    process.env.NODE_ENV === 'development' ||
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === 'test'
  ) {
    return null; // 개발환경에서 인증 우회
  }

  // 🔑 테스트용 API 키 확인 (프로덕션 환경에서 Postman/curl 테스트용)
  const apiKey = request.headers.get('x-api-key');
  const envApiKey = process.env.TEST_API_KEY;

  if (apiKey && envApiKey) {
    // 보안: 빈 키 방지 (최소 8자 이상)
    if (envApiKey.length < 8) {
      console.error(
        '[Security] TEST_API_KEY too short, must be at least 8 characters'
      );
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API configuration' },
        { status: 401 }
      );
    }

    // 보안: 타이밍 공격 방지 (constant-time comparison)
    try {
      const keyBuffer = Buffer.from(apiKey);
      const envKeyBuffer = Buffer.from(envApiKey);

      // 길이가 다르면 즉시 실패
      if (keyBuffer.length !== envKeyBuffer.length) {
        console.warn(
          '[Security] Invalid API key attempt from',
          request.headers.get('x-forwarded-for') || 'unknown IP'
        );
        return NextResponse.json(
          { error: 'Unauthorized - Invalid API key' },
          { status: 401 }
        );
      }

      // 타이밍 안전한 비교
      if (timingSafeEqual(keyBuffer, envKeyBuffer)) {
        return null; // API 키 인증 통과
      }

      // 실패 로깅 (보안 모니터링용)
      console.warn(
        '[Security] Invalid API key attempt from',
        request.headers.get('x-forwarded-for') || 'unknown IP'
      );
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    } catch (error) {
      console.error('[Security] API key validation error:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }
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
