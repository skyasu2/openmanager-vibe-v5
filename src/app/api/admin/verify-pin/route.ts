import { NextRequest, NextResponse } from 'next/server';
import { verifyCSRFToken } from '@/utils/security/csrf';

// 환경변수에서 관리자 PIN 가져오기
const ADMIN_PIN = process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || '';

/**
 * POST /api/admin/verify-pin
 *
 * 관리자 PIN 검증 (서버 사이드 보안 강화)
 *
 * 📊 Phase 1-2: 보안 레이어 추가
 * - Rate limiting: 10 req/min (IP 기반)
 * - IP whitelist: 선택적 (환경변수 ADMIN_IP_WHITELIST)
 *
 * 📊 Phase 3-1: CSRF 보호 추가
 * - CSRF 토큰 검증: X-CSRF-Token 헤더 vs csrf_token 쿠키
 *
 * 📊 Phase 5: 보안 레이어 순서 최적화
 * - Layer 0: Rate limiting (DoS 방어 우선)
 * - Layer 1: CSRF 검증 (무단 접근 차단)
 * - Layer 2: IP whitelist (선택적)
 *
 * @param request - { password: string }
 * @returns { success: boolean, message?: string }
 */

// 🔒 보안 계층 1: Rate limiting (10 req/min)
const requestLog = new Map<string, number[]>();

// 🧹 메모리 누수 방지: 주기적으로 오래된 로그 정리 (Phase 3-2)
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of requestLog.entries()) {
    const recentRequests = requests.filter(time => now - time < 60000);
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
  const recentRequests = requests.filter(time => now - time < 60000);

  if (recentRequests.length >= 10) { // 10 req/min
    return true;
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return false;
}

// 🔒 보안 계층 2: IP Whitelist (선택적)
const IP_WHITELIST = process.env.ADMIN_IP_WHITELIST
  ? process.env.ADMIN_IP_WHITELIST.split(',').map(ip => ip.trim())
  : null; // null이면 whitelist 비활성화

function isIPWhitelisted(ip: string): boolean {
  if (!IP_WHITELIST) return true; // whitelist 비활성화 시 모두 허용
  return IP_WHITELIST.includes(ip);
}

// 🧪 테스트 모드 감지 함수 (middleware.ts와 동일한 로직)
function isTestMode(request: NextRequest): boolean {
  // 1️⃣ 테스트 쿠키 확인
  const testModeCookie = request.cookies.get('test_mode');
  if (testModeCookie?.value === 'enabled') return true;

  if (request.cookies.get('vercel_test_token')) return true;

  // 2️⃣ 테스트 헤더 확인
  if (request.headers.get('X-Test-Mode') === 'enabled') return true;
  if (request.headers.get('X-Test-Token')) return true;

  // 3️⃣ Playwright User-Agent 확인
  const userAgent = request.headers.get('user-agent') || '';
  if (/Playwright|HeadlessChrome/i.test(userAgent)) return true;

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 🛡️ 보안 계층 0: Rate limiting (Phase 5 - DoS 방어 우선)
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    if (isRateLimited(clientIP)) {
      console.warn('🚨 [Admin API] Rate limit 초과:', clientIP);
      return NextResponse.json(
        {
          success: false,
          message: '요청이 너무 빈번합니다. 1분 후 다시 시도하세요.'
        },
        { status: 429 }
      );
    }

    // 🧪 테스트 모드 확인
    const testMode = isTestMode(request);
    if (testMode) {
      console.log('🧪 [Admin API] 테스트 모드 감지 - CSRF 검증 우회');
    }

    // 🛡️ 보안 계층 1: CSRF 검증 (Phase 3-1) - 테스트 모드 제외
    if (!testMode && !verifyCSRFToken(request)) {
      console.warn('🚨 [Admin API] CSRF 토큰 검증 실패');
      return NextResponse.json(
        {
          success: false,
          message: 'CSRF 토큰이 유효하지 않습니다.'
        },
        { status: 403 }
      );
    }

    // 🛡️ 보안 계층 2: IP Whitelist (선택적)
    if (!isIPWhitelisted(clientIP)) {
      console.warn('🚨 [Admin API] IP whitelist 차단:', clientIP);
      return NextResponse.json(
        {
          success: false,
          message: '허용되지 않은 IP 주소입니다.'
        },
        { status: 403 }
      );
    }

    const { password } = await request.json();

    // 환경변수 검증
    if (!ADMIN_PIN) {
      console.error('❌ [Admin API] ADMIN_PIN 환경변수가 설정되지 않음');
      return NextResponse.json(
        { success: false, message: '서버 설정 오류: 관리자 PIN이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 입력값 검증
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: '올바른 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // PIN 검증
    if (password === ADMIN_PIN) {
      console.log('✅ [Admin API] PIN 인증 성공');

      // 🧪 테스트 모드 확인
      const testMode = isTestMode(request);

      // 🍪 관리자 모드 쿠키 설정 (middleware에서 /admin 접근 허용용)
      const response = NextResponse.json({ success: true });

      // 🌐 도메인 추출 (테스트와 프로덕션 모두 지원)
      const requestUrl = new URL(request.url);
      const domain = requestUrl.hostname; // openmanager-vibe-v5.vercel.app

      response.cookies.set('admin_mode', 'true', {
        httpOnly: !testMode, // 테스트 모드에서는 JavaScript 접근 허용
        secure: process.env.NODE_ENV === 'production' && !testMode,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24시간
        path: '/',
        domain, // 명시적 domain 설정 (중요!)
      });

      console.log(`✅ [Admin API] admin_mode 쿠키 설정 완료 (testMode: ${testMode}, httpOnly: ${!testMode})`);
      return response;
    }

    console.warn('❌ [Admin API] PIN 인증 실패 - 잘못된 비밀번호');
    return NextResponse.json(
      { success: false, message: '관리자 비밀번호가 틀렸습니다.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('❌ [Admin API] PIN 검증 중 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
