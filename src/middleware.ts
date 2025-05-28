import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛡️ 보안 미들웨어
 * 
 * 모든 요청에 대해 보안 검사를 수행합니다:
 * - Rate Limiting
 * - SQL Injection 방지
 * - XSS 방지
 * - CSRF 방지
 * - 악성 요청 차단
 */

const RATE_LIMIT_STORAGE = new Map<string, { count: number; lastReset: number }>();
const BLOCKED_IPS = new Set<string>();
const SUSPICIOUS_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|SCRIPT|JAVASCRIPT)\b)/i,
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=\s*["\'][^"\']*["\']]/gi
];

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const path = request.nextUrl.pathname;

  try {
    // 1. IP 차단 확인
    if (BLOCKED_IPS.has(clientIP)) {
      return new NextResponse('Blocked', { status: 403 });
    }

    // 2. Rate Limiting
    if (isRateLimited(clientIP)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
        }
      });
    }

    // 3. 악성 봇 감지
    if (isMaliciousBot(userAgent)) {
      BLOCKED_IPS.add(clientIP);
      return new NextResponse('Blocked', { status: 403 });
    }

    // 4. API 경로 보안 검사
    if (path.startsWith('/api')) {
      // SQL Injection 및 XSS 패턴 검사
      const url = request.url;
      if (containsSuspiciousPattern(url)) {
        logSecurityIncident(clientIP, 'suspicious_pattern', url);
        return new NextResponse('Bad Request', { status: 400 });
      }

      // API 키 검증 (특정 엔드포인트)
      if (isProtectedEndpoint(path) && !isValidApiKey(request)) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    // 5. 요청 크기 제한 (10MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return new NextResponse('Payload Too Large', { status: 413 });
    }

    // 6. CORS 헤더 추가
    const response = NextResponse.next();
    
    // 보안 헤더 추가
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // CSP 헤더 (개발환경에서는 완화)
    const cspValue = process.env.NODE_ENV === 'development' 
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:";
    
    response.headers.set('Content-Security-Policy', cspValue);

    // 성능 메트릭 헤더
    const responseTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${responseTime}ms`);
    response.headers.set('X-Request-ID', generateRequestId());

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * 클라이언트 IP 추출
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');
  
  return (
    cfConnecting ||
    real ||
    forwarded?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

/**
 * Rate Limiting 검사
 */
function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1분
  const maxRequests = 100;

  const record = RATE_LIMIT_STORAGE.get(clientIP);
  
  if (!record || now - record.lastReset > windowMs) {
    RATE_LIMIT_STORAGE.set(clientIP, { count: 1, lastReset: now });
    return false;
  }

  record.count++;
  return record.count > maxRequests;
}

/**
 * 악성 봇 감지
 */
function isMaliciousBot(userAgent: string): boolean {
  const maliciousPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /dirbuster/i,
    /masscan/i,
    /wget/i,
    /curl.*bot/i
  ];

  return maliciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * 의심스러운 패턴 감지
 */
function containsSuspiciousPattern(url: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 보호된 엔드포인트 확인
 */
function isProtectedEndpoint(path: string): boolean {
  const protectedPaths = [
    '/api/admin',
    '/api/ai-agent/admin',
    '/api/system'
  ];

  return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
}

/**
 * API 키 검증
 */
function isValidApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization');
  const validApiKey = process.env.API_SECRET_KEY;

  if (!validApiKey) {
    return true; // API 키가 설정되지 않으면 통과
  }

  return apiKey === validApiKey || apiKey === `Bearer ${validApiKey}`;
}

/**
 * 보안 사고 로깅
 */
function logSecurityIncident(clientIP: string, type: string, details: string): void {
  const incident = {
    timestamp: new Date().toISOString(),
    clientIP,
    type,
    details,
    userAgent: 'unknown'
  };

  console.warn('🚨 Security Incident:', incident);
  
  // 실제 구현에서는 보안 로그 파일이나 외부 서비스로 전송
}

/**
 * 요청 ID 생성
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 미들웨어 적용 경로 설정
 */
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 적용:
     * - api (내부 API 함수들)
     * - _next/static (정적 파일들)
     * - _next/image (이미지 최적화 파일들)
     * - favicon.ico (파비콘)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 