/**
 * 🔐 Session Security Utilities
 *
 * 세션 ID 생성, 서명, 검증 유틸리티
 * - HMAC SHA-256 서명으로 위변조 방지
 * - 서버 전용 (Node.js crypto 사용)
 *
 * @warning 이 파일은 서버 사이드에서만 사용해야 합니다.
 */

import type { BinaryLike } from 'crypto';

/**
 * 환경변수에서 세션 시크릿 가져오기
 * - 없으면 기본값 사용 (개발 환경용)
 * - 프로덕션에서는 반드시 설정 필요
 */
function getSessionSecret(): string {
  const secret =
    process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SESSION_SECRET;

  if (!secret) {
    console.warn(
      '⚠️ SESSION_SECRET not set, using default (insecure for production)'
    );
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
  // 동적 import로 서버 전용 모듈 로드
  const crypto = require('crypto');

  // UUID v4 생성
  const id = crypto.randomBytes(16).toString('hex');
  const formattedId = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;

  // HMAC SHA-256 서명 생성
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac('sha256', secret)
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
    const crypto = require('crypto');
    const secret = getSessionSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(id)
      .digest('hex');

    // Timing attack 방지: constant-time 비교
    if (providedSignature.length !== expectedSignature.length) {
      return null;
    }

    let mismatch = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      mismatch |=
        providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    if (mismatch !== 0) {
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
