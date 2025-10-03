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

    // 🛡️ 보안 계층 1: CSRF 검증 (Phase 3-1)
    if (!verifyCSRFToken(request)) {
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
      return NextResponse.json({ success: true });
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
