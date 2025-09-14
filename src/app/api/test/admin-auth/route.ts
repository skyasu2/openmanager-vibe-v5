import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD } from '@/config/system-constants';

/**
 * 🔒 보안 강화된 테스트 전용 관리자 인증 API
 * 
 * 🎯 목적: Playwright 테스트를 위한 안전한 관리자 모드 활성화
 * 🛡️ 보안: 5계층 보안 체계로 해킹 방지
 * 🚀 효과: 4단계 UI 흐름 → 1회 API 호출로 단축
 */

// 🔒 보안 계층 1: 허용된 테스트 토큰 패턴 (동적 검증)
const ALLOWED_TOKEN_PATTERN = /^test_\d+(_[a-z0-9]+)?$/;

// 🔒 보안 계층 2: 허용된 User-Agent 패턴
const ALLOWED_USER_AGENTS = [
  /Playwright/i,
  /HeadlessChrome/i,
  /Chrome.*test/i
];

// 🔒 보안 계층 3: 요청 빈도 제한 (간단한 rate limiting)
const requestLog = new Map<string, number[]>();

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
  // 🛡️ 보안 계층 1: 프로덕션 환경 완전 차단
  if (process.env.NODE_ENV === 'production') {
    console.warn('🚨 [Security] 테스트 API가 프로덕션에서 호출됨 - 차단');
    return NextResponse.json(
      { 
        success: false, 
        message: '프로덕션 환경에서는 사용할 수 없습니다.',
        error: 'PRODUCTION_BLOCKED'
      }, 
      { status: 403 }
    );
  }

  // 🛡️ 보안 계층 2: User-Agent 검증 (테스트 도구만 허용)
  const userAgent = request.headers.get('user-agent') || '';
  const isAllowedUserAgent = ALLOWED_USER_AGENTS.some(pattern => pattern.test(userAgent));
  
  if (!isAllowedUserAgent && process.env.NODE_ENV !== 'development') {
    console.warn('🚨 [Security] 허용되지 않은 User-Agent:', userAgent);
    return NextResponse.json(
      { 
        success: false, 
        message: '허용되지 않은 클라이언트입니다.',
        error: 'UNAUTHORIZED_CLIENT'
      }, 
      { status: 403 }
    );
  }

  // 🛡️ 보안 계층 3: Rate Limiting
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
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
    const { password, bypass = false, token } = body;

    // 🛡️ 보안 계층 4: 테스트 토큰 패턴 검증
    if (!token || !ALLOWED_TOKEN_PATTERN.test(token)) {
      console.warn('🚨 [Security] 유효하지 않은 테스트 토큰 패턴:', token);
      return NextResponse.json(
        { 
          success: false, 
          message: '유효하지 않은 테스트 토큰입니다.',
          error: 'INVALID_TOKEN'
        }, 
        { status: 401 }
      );
    }

    // 🛡️ 보안 계층 5: 토큰 시간 검증 (24시간 제한)
    const tokenMatch = token.match(/^test_(\d+)/);
    if (tokenMatch) {
      const tokenTimestamp = parseInt(tokenMatch[1]);
      const currentTime = Date.now();
      const tokenAge = currentTime - tokenTimestamp;
      
      // 토큰이 24시간 이상 오래된 경우 거부
      if (tokenAge > 24 * 60 * 60 * 1000) {
        console.warn('🚨 [Security] 만료된 테스트 토큰');
        return NextResponse.json(
          { 
            success: false, 
            message: '만료된 테스트 토큰입니다.',
            error: 'TOKEN_EXPIRED'
          }, 
          { status: 401 }
        );
      }
    }

    // 🔧 테스트 전용 우회 모드 (개발 환경 + 유효 토큰)
    if (bypass && process.env.NODE_ENV === 'development') {
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
  // 🛡️ 프로덕션 환경에서는 완전히 비활성화
  if (process.env.NODE_ENV === 'production') {
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
    description: 'Playwright 테스트용 관리자 인증 API',
    usage: {
      bypass_mode: 'POST with { bypass: true }',
      password_mode: `POST with { password: "${ADMIN_PASSWORD}" }`
    }
  });
}