/**
 * 🚀 Vercel Edge Middleware - 동적 최적화 및 성능 향상
 *
 * Edge Runtime에서 실행되는 미들웨어:
 * - IP 기반 국가/지역 정보 추가
 * - Rate Limiting 헤더
 * - 동적 캐싱 최적화
 * - 무료 티어 보호 로직
 * - Web Vitals 메타데이터 추가
 *
 * 무료 티어 친화적: Edge Runtime으로 실행 시간 최소화
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 📊 무료 티어 보호를 위한 Rate Limiting (간단한 버전)
const RATE_LIMITS = {
  'tier-hobby': {
    requests: 1000, // per hour
    bandwidth: 30 * 1024 * 1024 * 1024, // 30GB per month
  }
} as const;

// 🌍 지역별 최적화 설정
const REGION_OPTIMIZATIONS = {
  'KR': { cdn: 'asia', cache: 'aggressive' },
  'US': { cdn: 'america', cache: 'standard' },
  'EU': { cdn: 'europe', cache: 'standard' },
  'default': { cdn: 'global', cache: 'standard' }
} as const;

/**
 * 🔧 미들웨어 메인 함수
 */
export async function middleware(request: NextRequest) {
  try {
    const startTime = Date.now();

    // 🔐 루트 경로 인증 체크 (하이브리드 접근)
    const pathname = request.nextUrl.pathname;
    if (pathname === '/') {
      // 🔐 Supabase 환경변수 검증
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('🚨 미들웨어: Supabase 환경변수 누락!');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // 🔐 Supabase 세션 직접 검증 (Edge Runtime 호환)
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            get: (name: string) => {
              const cookie = request.cookies.get(name) as { name: string; value: string } | undefined;
              return cookie?.value;
            },
            set: () => {}, // Edge Runtime에서는 쿠키 설정 불필요
            remove: () => {},
          },
        }
      );

      // 🔐 Supabase 세션 검증 (에러 처리 포함)
      let session = null;
      try {
        const result = await (supabase as any).auth.getSession();
        session = result.data.session;
      } catch (sessionError) {
        console.error('🚨 Supabase 세션 검증 실패:', sessionError);
        // 세션 검증 실패 시 null로 처리하여 Guest 쿠키 폴백으로 진행
      }

      if (!session) {
        // Supabase 세션 없음 → Guest 쿠키 확인 (fallback)
        const guestCookie = request.cookies.get('guest_session_id') as { name: string; value: string } | undefined;
        const authType = (request.cookies.get('auth_type') as { name: string; value: string } | undefined)?.value;

        if (!guestCookie || authType !== 'guest') {
          // Guest 쿠키도 없음 → 로그인 페이지로
          console.log('🔐 미들웨어: 미인증 (세션+쿠키 없음) → /login');
          return NextResponse.redirect(new URL('/login', request.url));
        }

        // Guest 쿠키 존재 → /main (게스트 모드)
        console.log('🔐 미들웨어: Guest 쿠키 확인 → /main (게스트 모드)');
        return NextResponse.redirect(new URL('/main', request.url));
      }

      // Supabase 세션 존재 → /main (인증된 사용자)
      console.log('🔐 미들웨어: Supabase 세션 확인 → /main (인증 사용자)');
      return NextResponse.redirect(new URL('/main', request.url));
    }

    // 🌐 지리적 정보 추출 (Vercel Edge Runtime에서만 사용 가능)
    const geo = (request as any).geo;
    const country = geo?.country || 'unknown';
    const region = geo?.region || 'unknown';
    const city = geo?.city || 'unknown';

    // 📱 디바이스 정보 추출
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const isBot = /bot|crawler|spider|scraper/i.test(userAgent);

    // ⚡ 요청 경로별 최적화
    // pathname은 위에서 이미 선언됨
    const isAPI = pathname.startsWith('/api');
    const isStatic = pathname.includes('/_next/static') || pathname.includes('/static');

    // 🎯 지역별 최적화 적용
    const regionConfig = REGION_OPTIMIZATIONS[country as keyof typeof REGION_OPTIMIZATIONS]
      || REGION_OPTIMIZATIONS.default;

    // 📈 동적 헤더 생성
    const headers = new Headers();

    // 기본 정보 헤더
    headers.set('X-Vercel-IP-Country', country);
    headers.set('X-Vercel-IP-Region', region);
    headers.set('X-Vercel-IP-City', city);
    headers.set('X-Device-Type', isMobile ? 'mobile' : 'desktop');
    headers.set('X-Is-Bot', isBot.toString());

    // 🚀 성능 최적화 헤더
    headers.set('X-CDN-Region', regionConfig.cdn);
    headers.set('X-Cache-Strategy', regionConfig.cache);
    headers.set('X-Request-ID', crypto.randomUUID().slice(0, 8));

    // 🛡️ 무료 티어 보호 헤더
    headers.set('X-Rate-Limit-Tier', 'hobby');
    headers.set('X-Rate-Limit-Requests', RATE_LIMITS['tier-hobby'].requests.toString());

    // ⚡ API 요청별 특별 처리
    if (isAPI) {
      // Edge Runtime API 우선 라우팅
      if (pathname.includes('/web-vitals') || pathname.includes('/vercel-usage') ||
          pathname.includes('/ping') || pathname.includes('/time') ||
          pathname.includes('/version') || pathname.includes('/simulate/data')) {
        headers.set('X-Runtime-Priority', 'edge');
        headers.set('X-Optimization-Level', 'maximum');
      } else {
        headers.set('X-Runtime-Priority', 'standard');
        headers.set('X-Optimization-Level', 'standard');
      }

      // API별 캐싱 힌트
      if (pathname.includes('/health') || pathname.includes('/ping')) {
        headers.set('X-Cache-Hint', 'short-ttl'); // 짧은 캐시
      } else if (pathname.includes('/version') || pathname.includes('/enterprise')) {
        headers.set('X-Cache-Hint', 'long-ttl'); // 긴 캐시
      }
    }

    // 📊 정적 리소스 최적화
    if (isStatic) {
      headers.set('X-Static-Optimization', 'enabled');
      headers.set('X-Compression-Hint', 'aggressive');
    }

    // 🚨 봇 트래픽 최적화 (무료 티어 보호)
    if (isBot) {
      headers.set('X-Bot-Handling', 'optimized');
      headers.set('Cache-Control', 'public, max-age=3600'); // 봇에게는 1시간 캐시
    }

    // 📱 모바일 최적화
    if (isMobile) {
      headers.set('X-Mobile-Optimization', 'enabled');
      headers.set('X-Image-Quality', '85'); // 모바일은 이미지 품질 85%
    } else {
      headers.set('X-Image-Quality', '90'); // 데스크톱은 90%
    }

    // ⏱️ 처리 시간 추가
    const processingTime = Date.now() - startTime;
    headers.set('X-Middleware-Time', processingTime.toString());

    // 🔄 응답 생성 (요청을 계속 진행)
    const response = NextResponse.next();

    // 헤더 추가
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    // 🚨 에러 발생 시 안전한 폴백
    console.error('🚨 미들웨어 에러:', error);

    const pathname = request.nextUrl.pathname;

    // 루트 경로 에러 시 /login으로 안전 리다이렉트 (무한 루프 방지)
    if (pathname === '/') {
      console.error('🚨 루트 경로 인증 체크 실패 → /login 리다이렉트');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 그 외 경로는 요청 계속 진행
    const response = NextResponse.next();
    response.headers.set('X-Middleware-Error', 'handled');
    response.headers.set('X-Middleware-Fallback', 'true');

    return response;
  }
}

/**
 * 🎯 미들웨어 적용 경로 설정
 *
 * 무료 티어 보호를 위해 선택적 적용:
 * - API 경로: 성능 최적화 필요
 * - 정적 리소스: 캐싱 최적화 필요
 * - 메인 페이지: 사용자 경험 최적화
 */
export const config = {
  matcher: [
    /*
     * 인증 체크 및 성능 최적화 경로:
     * - 루트 경로 (/) - 인증 체크
     * - 모든 페이지 - 성능 헤더 추가
     * 
     * 🚨 제외 경로 (무한 루프 방지):
     * - /auth/* (OAuth 콜백, 인증 처리) ⚠️ 필수!
     * - /login (로그인 페이지) ⚠️ 필수! (무한 루프 방지)
     * - /api/* (API 라우트)
     * - /_next/static (정적 파일)
     * - /_next/image (이미지 최적화)
     * - /favicon.ico (파비콘)
     */
    '/((?!auth|login|api|_next/static|_next/image|favicon.ico).*)',
  ],
};

/**
 * 📊 미들웨어 성능 모니터링용 유틸리티
 *
 * Edge Runtime에서 실행되므로 매우 가벼움
 */
export function getMiddlewareStats() {
  return {
    name: 'Vercel Edge Middleware',
    version: '1.0.0',
    runtime: 'edge',
    features: [
      'IP 기반 지역 감지',
      '디바이스 타입 분석',
      '봇 트래픽 최적화',
      '무료 티어 보호',
      'Edge Runtime 라우팅',
      '동적 캐싱 힌트'
    ],
    optimization: 'maximum',
    freeTierFriendly: true
  };
}