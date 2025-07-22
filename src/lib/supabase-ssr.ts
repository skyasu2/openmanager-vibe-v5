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
        // 미들웨어에서는 response 객체에 쿠키 설정
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        // 미들웨어에서 쿠키 제거
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });
}
