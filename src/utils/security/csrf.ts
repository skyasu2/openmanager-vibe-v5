/**
 * 🛡️ CSRF (Cross-Site Request Forgery) 보호
 *
 * Next.js 15 Edge Runtime 호환
 * - 토큰 생성: crypto.randomUUID()
 * - 토큰 검증: 헤더 vs 쿠키 비교
 * - Secure 쿠키 설정
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF 토큰 생성 (32자 랜덤)
 */
export function generateCSRFToken(): string {
  // Edge Runtime에서 사용 가능한 Web Crypto API
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * CSRF 토큰 검증
 *
 * @param request - Next.js Request
 * @returns true if valid, false otherwise
 */
export function verifyCSRFToken(request: NextRequest): boolean {
  // 1. 헤더에서 CSRF 토큰 가져오기
  const headerToken = request.headers.get('X-CSRF-Token');

  // 2. 쿠키에서 CSRF 토큰 가져오기
  const cookieToken = request.cookies.get('csrf_token')?.value;

  // 3. 둘 다 존재하고 일치하는지 확인
  if (!headerToken || !cookieToken) {
    return false;
  }

  return headerToken === cookieToken;
}

/**
 * CSRF 토큰을 응답에 쿠키로 설정
 *
 * @param response - Next.js Response
 * @param token - CSRF token
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set('csrf_token', token, {
    httpOnly: false, // JavaScript에서 읽을 수 있어야 함 (헤더로 전송)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF 방어
    maxAge: 60 * 60 * 24, // 24시간
    path: '/'
  });
}

/**
 * CSRF 토큰 생성 및 쿠키 설정 (통합 함수)
 *
 * @param response - Next.js Response
 * @returns Generated token
 */
export function setupCSRFProtection(response: NextResponse): string {
  const token = generateCSRFToken();
  setCSRFCookie(response, token);
  return token;
}
