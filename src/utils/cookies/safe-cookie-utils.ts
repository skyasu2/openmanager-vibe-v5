/**
 * 🍪 타입 안전 Cookie 유틸리티
 *
 * Next.js 15 cookies.get() API의 타입 안전 래퍼
 *
 * @module safe-cookie-utils
 * @since v5.71.1
 *
 * ## 배경
 *
 * Next.js 15에서 `request.cookies.get(name)`은 다음 타입을 반환:
 * ```typescript
 * { name: string; value: string } | undefined
 * ```
 *
 * 이를 string과 직접 비교하면 항상 false가 되어 버그 발생:
 * ```typescript
 * // ❌ 잘못된 사용
 * if (request.cookies.get('test_mode') === 'enabled') // 항상 false
 *
 * // ✅ 올바른 사용
 * if (getCookieValue(request, 'test_mode') === 'enabled') // 정상 작동
 * ```
 *
 * ## 근본적 개선
 *
 * cookies.get() 버그를 근본적으로 해결:
 * - 타입 단언(as) 제거 → 타입 가드 사용
 * - 코드 중복 제거 → 중앙화된 유틸리티
 * - 런타임 검증 추가 → 안전성 향상
 */

import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logging';

/**
 * Next.js 15 쿠키 객체 타입
 *
 * cookies.get()이 반환하는 실제 타입
 */
export type NextCookie = {
  name: string;
  value: string;
};

/**
 * 쿠키 값을 타입 안전하게 추출
 *
 * Next.js 15 cookies.get() API를 타입 가드로 안전하게 처리합니다.
 *
 * @param request - Next.js request 객체
 * @param name - 쿠키 이름
 * @returns 쿠키 값 (string) 또는 undefined
 *
 * @example
 * ```typescript
 * // middleware.ts
 * function isTestMode(request: NextRequest): boolean {
 *   // ❌ 이전 방식 (타입 단언)
 *   const cookie = request.cookies.get('test_mode') as { name: string; value: string } | undefined;
 *   return cookie?.value === 'enabled';
 *
 *   // ✅ 새로운 방식 (타입 가드)
 *   return getCookieValue(request, 'test_mode') === 'enabled';
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Supabase cookie adapter
 * get(name: string) {
 *   // ❌ 이전 방식
 *   const cookie = request.cookies.get(name) as { name: string; value: string } | undefined;
 *   return cookie?.value;
 *
 *   // ✅ 새로운 방식
 *   return getCookieValue(request, name);
 * }
 * ```
 */
export function getCookieValue(
  request: NextRequest,
  name: string
): string | undefined {
  // Next.js 15 API: returns { name, value } | undefined
  const cookie = request.cookies.get(name) as NextCookie | undefined;

  // undefined 체크
  if (!cookie) {
    return undefined;
  }

  // 런타임 검증 (방어적 프로그래밍)
  if (typeof cookie.value !== 'string') {
    logger.warn(
      `[safe-cookie-utils] Unexpected cookie format for "${name}":`,
      cookie
    );
    return undefined;
  }

  return cookie.value;
}

/**
 * 쿠키 존재 여부 확인
 *
 * @param request - Next.js request 객체
 * @param name - 쿠키 이름
 * @returns 쿠키가 존재하면 true
 *
 * @example
 * ```typescript
 * if (hasCookie(request, 'vercel_test_token')) {
 *   return true; // 테스트 모드
 * }
 * ```
 */
export function hasCookie(request: NextRequest, name: string): boolean {
  const value = getCookieValue(request, name);
  return value !== undefined;
}

/**
 * 쿠키 값을 가져오되, 없으면 기본값 반환
 *
 * @param request - Next.js request 객체
 * @param name - 쿠키 이름
 * @param defaultValue - 기본값
 * @returns 쿠키 값 또는 기본값
 *
 * @example
 * ```typescript
 * const theme = getCookieOrDefault(request, 'theme', 'light');
 * const locale = getCookieOrDefault(request, 'locale', 'ko');
 * ```
 */
export function getCookieOrDefault(
  request: NextRequest,
  name: string,
  defaultValue: string
): string {
  const value = getCookieValue(request, name);
  return value ?? defaultValue;
}

/**
 * 여러 쿠키를 한 번에 추출
 *
 * @param request - Next.js request 객체
 * @param names - 쿠키 이름 배열
 * @returns 쿠키 이름-값 매핑 객체
 *
 * @example
 * ```typescript
 * const { test_mode, vercel_test_token } = getMultipleCookies(request, [
 *   'test_mode',
 *   'vercel_test_token'
 * ]);
 * ```
 */
export function getMultipleCookies(
  request: NextRequest,
  names: string[]
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const name of names) {
    result[name] = getCookieValue(request, name);
  }

  return result;
}
