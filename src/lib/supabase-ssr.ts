/**
 * 🔐 Supabase SSR 헬퍼 함수
 *
 * Next.js middleware와 서버 컴포넌트에서 사용하기 위한 헬퍼
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * Middleware에서 Supabase 클라이언트 생성
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  // 환경변수에서 Supabase URL과 키 가져오기
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 빌드 시에는 임시 값 사용
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.npm_lifecycle_event === 'build') {
      console.log('🏗️ 빌드 중 - 임시 Supabase 값 사용');
      return createServerClient('https://temp.supabase.co', 'temp-anon-key', {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      });
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경변수가 설정되지 않음');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // 🔐 Vercel 환경에 최적화된 쿠키 옵션
        const isVercel =
          process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
        const isSecure = request.url.startsWith('https://');

        const enhancedOptions = {
          ...options,
          // Vercel 환경에서는 secure 필수
          secure: isVercel || isSecure || options.secure,
          // SameSite 정책 최적화 (OAuth 콜백 호환)
          sameSite: options.sameSite || ('lax' as const),
          // httpOnly는 기본값 유지 (보안)
          httpOnly: options.httpOnly !== false,
          // 경로는 루트로 설정
          path: options.path || '/',
          // Vercel에서는 더 긴 maxAge 설정
          maxAge:
            isVercel && options.maxAge ? options.maxAge * 1.2 : options.maxAge,
        };

        // ✅ response 객체에만 쿠키를 설정합니다 (request는 읽기 전용)
        response.cookies.set({
          name,
          value,
          ...enhancedOptions,
        });

        console.log(`🍪 쿠키 설정: ${name}`, {
          secure: enhancedOptions.secure,
          sameSite: enhancedOptions.sameSite,
          httpOnly: enhancedOptions.httpOnly,
          path: enhancedOptions.path,
          isVercel,
        });
      },
      remove(name: string, options: CookieOptions) {
        // ✅ response 객체에서만 쿠키를 삭제합니다 (request는 읽기 전용)
        response.cookies.set({
          name,
          value: '',
          ...options,
          maxAge: 0,
        });
      },
    },
  });
}
