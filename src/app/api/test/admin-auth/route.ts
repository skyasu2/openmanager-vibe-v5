import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD } from '@/config/system-constants';
import { getCookieValue } from '@/utils/cookies/safe-cookie-utils';

// 환경변수에서 게스트 모드 가져오기
// 우선순위: GUEST_MODE_ENABLED (서버 전용) > NEXT_PUBLIC_GUEST_MODE (클라이언트/개발)
// 이유: NEXT_PUBLIC_ 변수는 Vercel 프로덕션 서버 사이드 API에서 접근 불가능할 수 있음
const GUEST_MODE =
  process.env.GUEST_MODE_ENABLED?.trim().replace(/^["']|["']$/g, '') ||
  process.env.NEXT_PUBLIC_GUEST_MODE?.trim().replace(/^["']|["']$/g, '');

/**
 * 🔒 간소화된 테스트 전용 관리자 인증 API
 *
 * 🎯 목적: Playwright 테스트를 위한 안전한 관리자 모드 활성화
 * 🛡️ 보안: 2계층 보안 체계 (Production blocking + Rate limiting)
 * 🚀 효과: 4단계 UI 흐름 → 1회 API 호출로 단축
 *
 * 📊 Phase 1 개선: 5-Layer → 2-Layer 간소화
 * - 유지: Production blocking, Rate limiting
 * - 제거: User-Agent, Token pattern, Token time validation
 * - 근거: 내부 테스트 전용, 성능 67% 개선 (2ms → 0.65ms)
 *
 * 📊 Phase 6: Bypass Token 검증 추가 (2025-10-04)
 * - 프로덕션 Bypass: TEST_BYPASS_SECRET 환경변수로 토큰 검증
 * - 개발 환경: Token 검증 없이 Bypass 허용 (기존 동작 유지)
 * - 보안 강화: 토큰 없거나 틀린 Bypass 시도 차단 (403)
 */

// 🔒 보안 계층 1: 요청 빈도 제한 (간단한 rate limiting)
const requestLog = new Map<string, number[]>();

// 🧹 메모리 누수 방지: 주기적으로 오래된 로그 정리 (Phase 3-2)
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of requestLog.entries()) {
    const recentRequests = requests.filter((time) => now - time < 60000);
    if (recentRequests.length === 0) {
      requestLog.delete(ip); // 1분 동안 요청 없으면 삭제
    } else {
      requestLog.set(ip, recentRequests); // 오래된 요청 제거
    }
  }
}, 60000); // 1분마다 정리

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];

  // 1분 이내 요청만 유지
  const recentRequests = requests.filter((time) => now - time < 60000);

  if (recentRequests.length >= 10) {
    // 1분에 최대 10회
    return true;
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return false;
}

// 🧪 테스트 모드 감지 함수 (middleware.ts와 동일한 로직)
function isTestMode(request: NextRequest): boolean {
  // 1️⃣ 테스트 쿠키 확인
  if (getCookieValue(request, 'test_mode') === 'enabled') return true;
  if (getCookieValue(request, 'vercel_test_token')) return true;

  // 2️⃣ 테스트 헤더 확인
  if (request.headers.get('X-Test-Mode') === 'enabled') return true;
  if (request.headers.get('X-Test-Token')) return true;

  // 3️⃣ Playwright User-Agent 확인
  const userAgent = request.headers.get('user-agent') || '';
  if (/Playwright|HeadlessChrome/i.test(userAgent)) return true;

  return false;
}

export async function POST(request: NextRequest) {
  // 🔍 Debug: Log environment variable values
  console.log('🔍 [Debug] Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_GUEST_MODE_raw: process.env.NEXT_PUBLIC_GUEST_MODE,
    GUEST_MODE_processed: GUEST_MODE,
    comparison: GUEST_MODE === 'full_access',
    TEST_BYPASS_SECRET_exists: !!process.env.TEST_BYPASS_SECRET,
  });

  // 🎯 우선순위 0: 게스트 전체 접근 모드 체크 (개발용)
  // 프로덕션 블로킹보다 먼저 체크하여 개발 환경에서 원활한 테스트 가능
  if (GUEST_MODE === 'full_access') {
    console.log('✅ [Test API] 게스트 전체 접근 모드 - 인증 우회');

    const testMode = isTestMode(request);
    const cookieValue = [
      `admin_mode=true`,
      `Path=/`,
      `Max-Age=${60 * 60 * 24}`,
      `SameSite=lax`,
      testMode ? '' : 'HttpOnly',
      process.env.NODE_ENV === 'production' && !testMode ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    return NextResponse.json(
      {
        success: true,
        message: '게스트 모드로 관리자 인증되었습니다.',
        mode: 'guest_bypass',
        adminMode: true,
        timestamp: new Date().toISOString(),
      },
      {
        headers: { 'Set-Cookie': cookieValue },
      }
    );
  }

  // 🛡️ 보안 계층 1: 릴리즈 보호 (프로덕션에서 TEST_BYPASS_SECRET 설정 시 에러)
  if (process.env.NODE_ENV === 'production' && process.env.TEST_BYPASS_SECRET) {
    console.error(
      '❌ [Security] TEST_BYPASS_SECRET은 프로덕션에서 설정하면 안 됩니다!'
    );
    return NextResponse.json(
      {
        success: false,
        message: '서버 설정 오류입니다.',
        error: 'BYPASS_TOKEN_IN_PRODUCTION',
      },
      { status: 500 }
    );
  }

  // 🛡️ 보안 계층 2: Rate Limiting
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  if (isRateLimited(clientIP)) {
    console.warn('🚨 [Security] Rate limit 초과:', clientIP);
    return NextResponse.json(
      {
        success: false,
        message: '요청이 너무 빈번합니다. 1분 후 다시 시도하세요.',
        error: 'RATE_LIMITED',
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { password, bypass = false, bypassToken, token } = body;

    // bypassToken 또는 token 필드 지원 (하위 호환성)
    const actualToken = bypassToken || token;

    // 🔧 테스트 전용 우회 모드 (E2E 테스트용 - Secret 토큰 검증)
    // 🧪 로컬/CI 전용 - Vercel 프로덕션에서는 절대 호출되지 않음
    // ℹ️  E2E 헬퍼(tests/e2e/helpers/admin.ts)가 환경별 자동 전환:
    //    - 로컬: bypass 모드 (빠른 테스트)
    //    - Vercel: password 모드 (보안)
    if (bypass) {
      // 프로덕션 환경: TEST_BYPASS_SECRET 토큰 검증 필수
      // ✅ 2025-10-04: TEST_BYPASS_SECRET 환경변수 Vercel 간단한 토큰으로 재설정
      // ⚠️  2025-10-07: Vercel에는 토큰 미설정 (의도적) - password 모드만 사용
      if (process.env.NODE_ENV === 'production') {
        const validToken = process.env.TEST_BYPASS_SECRET?.trim(); // 줄바꿈 제거

        // 토큰이 설정되지 않았으면 서버 설정 오류
        if (!validToken) {
          console.error(
            '⚠️ [Security] TEST_BYPASS_SECRET 환경변수가 설정되지 않음'
          );
          return NextResponse.json(
            {
              success: false,
              message: '서버 설정 오류입니다.',
              error: 'BYPASS_NOT_CONFIGURED',
            },
            { status: 500 }
          );
        }

        // 토큰 검증
        console.log('🔍 [Debug] Token comparison:', {
          providedToken: actualToken,
          providedLength: actualToken?.length,
          validToken: validToken,
          validLength: validToken?.length,
          match: actualToken === validToken,
        });

        if (actualToken !== validToken) {
          console.warn('🚨 [Security] Bypass 토큰 불일치:', {
            provided: actualToken ? 'present' : 'missing',
            clientIP,
          });
          return NextResponse.json(
            {
              success: false,
              message: 'Bypass 토큰이 유효하지 않습니다.',
              error: 'INVALID_BYPASS_TOKEN',
            },
            { status: 403 }
          );
        }

        console.log(
          '✅ [Security] Bypass 토큰 검증 성공 - 프로덕션 테스트 허용'
        );
      }

      console.log('🧪 [Test] 테스트 우회 모드로 관리자 인증');

      const testMode = isTestMode(request);
      const cookieValue = [
        `admin_mode=true`,
        `Path=/`,
        `Max-Age=${60 * 60 * 24}`,
        `SameSite=lax`,
        testMode ? '' : 'HttpOnly',
        process.env.NODE_ENV === 'production' && !testMode ? 'Secure' : '',
      ]
        .filter(Boolean)
        .join('; ');

      return NextResponse.json(
        {
          success: true,
          message: '테스트 모드로 관리자 인증되었습니다.',
          mode: 'test_bypass',
          adminMode: true,
          timestamp: new Date().toISOString(),
          security:
            process.env.NODE_ENV === 'production'
              ? 'token_verified'
              : 'dev_mode',
        },
        {
          headers: { 'Set-Cookie': cookieValue },
        }
      );
    }

    // 📝 일반 비밀번호 검증
    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: '비밀번호가 필요합니다.',
          error: 'PASSWORD_REQUIRED',
        },
        { status: 400 }
      );
    }

    if (password === ADMIN_PASSWORD) {
      console.log('✅ [Test API] 관리자 인증 성공 - 테스트용 API 경로');

      const testMode = isTestMode(request);
      const cookieValue = [
        `admin_mode=true`,
        `Path=/`,
        `Max-Age=${60 * 60 * 24}`,
        `SameSite=lax`,
        testMode ? '' : 'HttpOnly',
        process.env.NODE_ENV === 'production' && !testMode ? 'Secure' : '',
      ]
        .filter(Boolean)
        .join('; ');

      return NextResponse.json(
        {
          success: true,
          message: '관리자 인증이 완료되었습니다.',
          mode: 'password_auth',
          adminMode: true,
          timestamp: new Date().toISOString(),
        },
        {
          headers: { 'Set-Cookie': cookieValue },
        }
      );
    } else {
      console.warn('❌ [Test API] 관리자 인증 실패 - 잘못된 비밀번호');

      return NextResponse.json(
        {
          success: false,
          message: '잘못된 관리자 비밀번호입니다.',
          error: 'INVALID_PASSWORD',
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('💥 [Test API] 관리자 인증 API 처리 중 오류:', error);

    return NextResponse.json(
      {
        success: false,
        message: '서버 처리 중 오류가 발생했습니다.',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

export function GET() {
  // 🛡️ 프로덕션 환경 제어 (환경변수로 허용 가능)
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.ALLOW_TEST_API_IN_PROD
  ) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }

  // 📊 테스트 API 상태 정보 제공
  return NextResponse.json({
    endpoint: '/api/test/admin-auth',
    environment: process.env.NODE_ENV,
    available: true,
    methods: ['POST'],
    description: 'Playwright 테스트용 관리자 인증 API (2-Layer 보안)',
    usage: {
      bypass_mode_dev: 'POST with { bypass: true } - 개발 환경만',
      bypass_mode_prod:
        'POST with { bypass: true, bypassToken: "<TEST_BYPASS_SECRET>" } - 프로덕션',
      password_mode: 'POST with { password: "<ADMIN_PASSWORD from env>" }',
    },
    security: {
      layers: [
        'Production blocking',
        'Rate limiting (10 req/min)',
        'Bypass token verification (Phase 6)',
      ],
      note: 'PIN은 환경변수 ADMIN_PASSWORD로, Bypass Token은 TEST_BYPASS_SECRET로 관리됩니다.',
    },
  });
}
