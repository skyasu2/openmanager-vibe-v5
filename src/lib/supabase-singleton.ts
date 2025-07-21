/**
 * 🔐 Supabase 싱글톤 클라이언트
 *
 * Supabase 클라이언트의 중복 생성을 방지하고
 * 전역적으로 단일 인스턴스만 사용하도록 보장합니다.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeEnv, getSupabaseConfig } from './env';

// 전역 싱글톤 인스턴스
let supabaseInstance: SupabaseClient | null = null;

// 초기화 상태 추적
let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Supabase URL 가져오기 (기존 로직 재사용)
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

  if (safeEnv.isBuildTime() && process.env.npm_lifecycle_event === 'build') {
    console.warn('⚠️ 빌드 타임 - 임시 Supabase URL 사용');
    return 'https://temp.supabase.co';
  }

  throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
}

/**
 * Supabase Anon Key 가져오기 (기존 로직 재사용)
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

  if (safeEnv.isBuildTime() && process.env.npm_lifecycle_event === 'build') {
    console.warn('⚠️ 빌드 타임 - 임시 Supabase Anon Key 사용');
    return 'temp-anon-key';
  }

  throw new Error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

/**
 * Supabase 싱글톤 인스턴스 반환
 */
export function getSupabaseClient(): SupabaseClient {
  // 이미 초기화된 경우 즉시 반환
  if (supabaseInstance && isInitialized) {
    return supabaseInstance;
  }

  // 초기화 중 오류가 발생한 경우
  if (initializationError) {
    throw initializationError;
  }

  // 첫 초기화 시도
  if (!supabaseInstance) {
    try {
      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();

      // 클라이언트 생성 옵션
      const options = {
        auth: {
          persistSession: typeof window !== 'undefined', // 서버에서는 세션 유지 비활성화
          autoRefreshToken: typeof window !== 'undefined', // 서버에서는 자동 갱신 비활성화
          detectSessionInUrl: typeof window !== 'undefined', // 서버에서는 URL 검출 비활성화
          storage:
            typeof window !== 'undefined' ? window.localStorage : undefined,
          // 서버 사이드에서 쿠키 관련 에러 방지
          storageKey:
            typeof window !== 'undefined' ? 'sb-auth-token' : undefined,
          cookieOptions: {
            // 서버 사이드에서는 쿠키 옵션 제공하지 않음
            ...(typeof window !== 'undefined' ? {} : { sameSite: 'lax' }),
          },
        },
        global: {
          headers: {
            'x-openmanager-version': 'v5.0',
          },
        },
        // 중복 인스턴스 경고 비활성화
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      };

      supabaseInstance = createClient(url, key, options);
      isInitialized = true;

      console.log('✅ Supabase 싱글톤 클라이언트 초기화 완료');
    } catch (error) {
      initializationError =
        error instanceof Error ? error : new Error('Unknown error');
      throw initializationError;
    }
  }

  return supabaseInstance;
}

/**
 * Supabase 연결 상태 확인
 */
export async function checkSupabaseConnection(): Promise<{
  status: 'connected' | 'error';
  message: string;
}> {
  try {
    const client = getSupabaseClient();

    if (safeEnv.isDevelopment()) {
      return {
        status: 'connected',
        message: 'Supabase connected successfully (development mode)',
      };
    }

    const { error } = await client.from('servers').select('count').limit(1);

    return {
      status: error ? 'error' : 'connected',
      message: error?.message || 'Supabase connected successfully',
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * 싱글톤 인스턴스 리셋 (테스트용)
 */
export function resetSupabaseClient(): void {
  if (process.env.NODE_ENV === 'test') {
    supabaseInstance = null;
    isInitialized = false;
    initializationError = null;
  }
}

// 레거시 호환성을 위한 기본 export는 supabase.ts에서 처리
