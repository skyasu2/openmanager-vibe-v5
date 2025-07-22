/**
 * 🔐 Middleware 전용 Supabase 클라이언트
 *
 * Next.js middleware에서 사용하기 위한 특별한 싱글톤 구현
 * cookies를 통한 세션 관리를 지원합니다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from './env';

// 서버 사이드 전용 싱글톤 인스턴스
let middlewareClientInstance: SupabaseClient | null = null;

/**
 * Supabase URL 가져오기
 */
function getSupabaseUrl(): string {
  const directUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    directUrl &&
    directUrl !== '' &&
    directUrl !== 'https://temp.supabase.co'
  ) {
    return directUrl;
  }

  const config = getSupabaseConfig();
  if (
    config.isConfigured &&
    config.url &&
    config.url !== 'https://temp.supabase.co'
  ) {
    return config.url;
  }

  // Middleware는 빌드 타임에도 실행될 수 있으므로 임시 URL 허용
  if (process.env.npm_lifecycle_event === 'build') {
    return 'https://temp.supabase.co';
  }

  throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
}

/**
 * Supabase Anon Key 가져오기
 */
function getSupabaseAnonKey(): string {
  const directKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (directKey && directKey !== '' && directKey !== 'temp-anon-key') {
    return directKey;
  }

  const config = getSupabaseConfig();
  if (
    config.isConfigured &&
    config.anonKey &&
    config.anonKey !== 'temp-anon-key'
  ) {
    return config.anonKey;
  }

  // Middleware는 빌드 타임에도 실행될 수 있으므로 임시 키 허용
  if (process.env.npm_lifecycle_event === 'build') {
    return 'temp-anon-key';
  }

  throw new Error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

/**
 * Middleware용 Supabase 클라이언트 생성
 *
 * @param request - Next.js Request 객체
 * @param response - Next.js Response 객체
 * @returns Supabase 클라이언트 인스턴스
 */
export function createMiddlewareSupabaseClient(
  request: NextRequest,
  _response: NextResponse
): SupabaseClient {
  // 싱글톤 인스턴스가 이미 있으면 재사용
  if (middlewareClientInstance) {
    return middlewareClientInstance;
  }

  try {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    // 쿠키에서 세션 토큰 추출
    const supabaseCookie = request.cookies.get('sb-auth-token');

    // Middleware 전용 옵션
    const options = {
      auth: {
        persistSession: false, // Middleware에서는 세션 유지 불필요
        autoRefreshToken: false, // 자동 갱신 비활성화
        detectSessionInUrl: false, // URL 검출 비활성화
        // 쿠키에서 초기 세션 설정
        ...(supabaseCookie
          ? {
              initialSession: {
                access_token: supabaseCookie.value,
                refresh_token: '',
              },
            }
          : {}),
      },
      global: {
        headers: {
          'x-openmanager-version': 'v5.0-middleware',
        },
      },
    };

    middlewareClientInstance = createClient(url, key, options);

    console.log('✅ Middleware용 Supabase 싱글톤 클라이언트 초기화');

    return middlewareClientInstance;
  } catch (error) {
    console.error('❌ Middleware Supabase 클라이언트 생성 실패:', error);
    throw error;
  }
}

/**
 * 세션 확인 헬퍼 함수
 */
export async function getMiddlewareSession(
  client: SupabaseClient,
  request: NextRequest
) {
  try {
    // 쿠키에서 직접 세션 정보 확인
    const authCookie = request.cookies.get('sb-auth-token');
    if (!authCookie) {
      return { session: null, error: null };
    }

    // getSession을 사용하여 세션 검증
    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    return { session, error };
  } catch (error) {
    console.error('Middleware 세션 확인 오류:', error);
    return { session: null, error };
  }
}

/**
 * Middleware 클라이언트 리셋 (테스트용)
 */
export function resetMiddlewareClient(): void {
  if (process.env.NODE_ENV === 'test') {
    middlewareClientInstance = null;
  }
}
