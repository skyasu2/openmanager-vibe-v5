/**
 * @file Server-only session security utilities
 *
 * DANGER: This file contains server-only code (Node.js 'crypto' module)
 * and MUST NOT be imported into client-side components.
 *
 * 세션 ID 생성, 서명, 검증 유틸리티
 * - HMAC SHA-256 서명으로 위변조 방지
 * - 서버 전용 (Node.js crypto 사용)
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * 환경변수에서 세션 시크릿 가져오기
 * - 프로덕션에서는 반드시 SESSION_SECRET 설정 필요
 * - 개발 환경에서는 기본값 사용 (보안 경고 출력)
 *
 * @security NEXT_PUBLIC_* 환경변수는 클라이언트에 노출되므로 사용하지 않음
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    // 프로덕션 환경에서는 경고 레벨 상향
    const isProduction = process.env.NODE_ENV === 'production';
    const message = '⚠️ SESSION_SECRET not set, using default (insecure for production)';

    if (isProduction) {
      console.error(message);
    } else {
      console.warn(message);
    }
    return 'default-insecure-secret-change-me-in-production';
  }

  return secret;
}

/**
 * 서명된 세션 ID 생성
 *
 * @returns 서명된 세션 ID (형식: {id}.{signature})
 *
 * @example
 * const sessionId = generateSignedSessionId();
 * // "550e8400-e29b-41d4-a716-446655440000.a1b2c3d4..."
 */
export function generateSignedSessionId(): string {
  // UUID v4 생성
  const id = randomBytes(16).toString('hex');
  const formattedId = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;

  // HMAC SHA-256 서명 생성
  const secret = getSessionSecret();
  const signature = createHmac('sha256', secret)
    .update(formattedId)
    .digest('hex');

  return `${formattedId}.${signature}`;
}

/**
 * 서명된 세션 ID 검증
 *
 * @param signedId - 서명된 세션 ID
 * @returns 검증 성공 시 원본 ID, 실패 시 null
 *
 * @example
 * const originalId = verifySignedSessionId(signedId);
 * if (originalId) {
 *   console.log('Valid session:', originalId);
 * } else {
 *   console.error('Invalid or tampered session');
 * }
 */
export function verifySignedSessionId(signedId: string): string | null {
  try {
    // 형식 검증: {id}.{signature}
    const parts = signedId.split('.');
    if (parts.length !== 2) {
      console.warn('🔐 Invalid session format: missing signature');
      return null;
    }

    const id = parts[0];
    const providedSignature = parts[1];

    // Null check
    if (!id || !providedSignature) {
      console.warn('🔐 Invalid session format: empty id or signature');
      return null;
    }

    // UUID 형식 검증 (간단한 정규식)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.warn('🔐 Invalid session format: malformed UUID');
      return null;
    }

    // 서명 재생성 및 비교
    const secret = getSessionSecret();
    const expectedSignature = createHmac('sha256', secret)
      .update(id)
      .digest('hex');

    // Timing attack 방지: crypto.timingSafeEqual 사용 (네이티브 C++ 구현)
    // Buffer 길이가 다르면 timingSafeEqual이 에러를 발생시키므로 먼저 체크
    if (providedSignature.length !== expectedSignature.length) {
      console.warn('🔐 Session signature length mismatch');
      return null;
    }

    const providedBuffer = Buffer.from(providedSignature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      console.warn('🔐 Session signature mismatch: possible tampering');
      return null;
    }

    return id;
  } catch (error) {
    console.error('🔐 Session verification error:', error);
    return null;
  }
}

/**
 * 세션 ID 만료 시간 생성
 *
 * @param minutes - 만료 시간 (분)
 * @returns Unix timestamp (밀리초)
 */
export function generateSessionExpiry(minutes: number = 30): number {
  return Date.now() + minutes * 60 * 1000;
}

/**
 * 세션 만료 여부 확인
 *
 * @param expiry - 만료 시간 (Unix timestamp)
 * @returns 만료 여부
 */
export function isSessionExpired(expiry: number): boolean {
  return Date.now() > expiry;
}
