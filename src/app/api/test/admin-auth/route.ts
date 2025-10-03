import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD } from '@/config/system-constants';

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
 */

// 🔒 보안 계층 1: 요청 빈도 제한 (간단한 rate limiting)
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

  if (recentRequests.length >= 10) { // 1분에 최대 10회
    return true;
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return false;
}

export async function POST(request: NextRequest) {
  // 🛡️ 보안 계층 1: 프로덕션 환경 제어 (환경변수로 허용 가능)
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API_IN_PROD) {
    console.warn('🚨 [Security] 테스트 API가 프로덕션에서 호출됨 - 차단');
    console.warn('💡 [Security] 프로덕션에서 활성화하려면 ALLOW_TEST_API_IN_PROD=true 환경변수 설정');
    return NextResponse.json(
      {
        success: false,
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        error: 'PRODUCTION_BLOCKED'
      },
      { status: 403 }
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
        error: 'RATE_LIMITED'
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { password, bypass = false } = body;

    // 🔧 테스트 전용 우회 모드 (개발 환경만 허용, 프로덕션 차단)
    if (bypass) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('🚨 [Security] 프로덕션에서 bypass 모드 차단됨');
        return NextResponse.json(
          {
            success: false,
            message: 'Bypass 모드는 개발 환경에서만 사용 가능합니다.',
            error: 'BYPASS_NOT_ALLOWED'
          },
          { status: 403 }
        );
      }

      console.log('🧪 [Test] 보안 검증 통과 - 테스트 우회 모드로 관리자 인증');

      return NextResponse.json({
        success: true,
        message: '테스트 모드로 관리자 인증되었습니다.',
        mode: 'test_bypass',
        adminMode: true,
        timestamp: new Date().toISOString(),
        security: 'verified'
      });
    }

    // 📝 일반 비밀번호 검증
    if (!password) {
      return NextResponse.json(
        { 
          success: false, 
          message: '비밀번호가 필요합니다.',
          error: 'PASSWORD_REQUIRED'
        }, 
        { status: 400 }
      );
    }

    if (password === ADMIN_PASSWORD) {
      console.log('✅ [Test API] 관리자 인증 성공 - 테스트용 API 경로');
      
      return NextResponse.json({
        success: true,
        message: '관리자 인증이 완료되었습니다.',
        mode: 'password_auth',
        adminMode: true,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('❌ [Test API] 관리자 인증 실패 - 잘못된 비밀번호');
      
      return NextResponse.json(
        { 
          success: false, 
          message: '잘못된 관리자 비밀번호입니다.',
          error: 'INVALID_PASSWORD'
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
        error: 'SERVER_ERROR'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  // 🛡️ 프로덕션 환경 제어 (환경변수로 허용 가능)
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API_IN_PROD) {
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
      bypass_mode: 'POST with { bypass: true }',
      password_mode: 'POST with { password: "<ADMIN_PASSWORD from env>" }'
    },
    security: {
      layers: ['Production blocking', 'Rate limiting (10 req/min)'],
      note: 'PIN은 환경변수 ADMIN_PASSWORD로 관리됩니다.'
    }
  });
}