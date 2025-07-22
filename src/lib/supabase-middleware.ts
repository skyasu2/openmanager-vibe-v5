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

// 서버 사이드 전용 싱글톤 인스턴스 (제거됨 - SSR 방식 사용)

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
  response: NextResponse
): SupabaseClient {
  try {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    // 모든 쿠키를 가져와서 Supabase에 전달
    const cookieStore = request.cookies;

    // Middleware 전용 옵션
    const options = {
      auth: {
        persistSession: false, // Middleware에서는 세션 유지 불필요
        autoRefreshToken: false, // 자동 갱신 비활성화
        detectSessionInUrl: false, // URL 검출 비활성화
      },
      global: {
        headers: {
          'x-openmanager-version': 'v5.0-middleware',
        },
      },
      // 쿠키 어댑터 설정
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
        set: (name: string, value: string, options: any) => {
          // 미들웨어에서는 response에 쿠키 설정
          response.cookies.set(name, value, options);
        },
        remove: (name: string, _options: any) => {
          response.cookies.delete(name);
        },
      },
    };

    const client = createClient(url, key, options);

    console.log('✅ Middleware용 Supabase 클라이언트 생성 (쿠키 지원)');

    return client;
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
    // Supabase 쿠키 패턴: sb-[project-ref]-auth-token
    // 모든 sb- 로 시작하는 쿠키를 확인
    const cookies = request.cookies.getAll();
    const authCookie = cookies.find(
      cookie =>
        cookie.name.startsWith('sb-') &&
        cookie.name.includes('-auth-token') &&
        !cookie.name.includes('code-verifier')
    );

    if (!authCookie) {
      console.log('🔍 Auth 쿠키를 찾을 수 없음');
      return { session: null, error: null };
    }

    console.log('🍪 Auth 쿠키 발견:', authCookie.name);

    // getSession을 사용하여 세션 검증
    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (session) {
      console.log('✅ 미들웨어 세션 확인됨:', session.user?.email);
    }

    return { session, error };
  } catch (error) {
    console.error('Middleware 세션 확인 오류:', error);
    return { session: null, error };
  }
}

/**
 * Middleware 클라이언트 리셋 (테스트용)
 * @deprecated SSR 방식으로 변경되어 더 이상 싱글톤 인스턴스를 사용하지 않음
 */
export function resetMiddlewareClient(): void {
  // SSR 방식에서는 리셋이 필요없음
}
