/**
 * 🔐 Supabase 싱글톤 클라이언트
 *
 * Supabase 클라이언트의 중복 생성을 방지하고
 * 전역적으로 단일 인스턴스만 사용하도록 보장합니다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { safeEnv, getSupabaseConfig } from '../env';

// 전역 싱글톤 인스턴스 - 더 강력한 싱글톤 보장
declare global {
  var __supabaseInstance: SupabaseClient | undefined;

  var __supabaseInitialized: boolean | undefined;

  var __supabaseInitError: Error | undefined;
}

// 전역 변수를 통한 싱글톤 보장 (빌드 시에도 작동)
let supabaseInstance = global.__supabaseInstance;
let isInitialized = global.__supabaseInitialized || false;
let _initializationError = global.__supabaseInitError || null;

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
  if (_initializationError) {
    throw _initializationError;
  }

  // 첫 초기화 시도
  if (!supabaseInstance) {
    try {
      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();

      // 빌드 시간 감지
      const isBuildTime =
        process.env.npm_lifecycle_event === 'build' ||
        process.env.NEXT_PHASE === 'phase-production-build';

      // 클라이언트 생성 옵션
      const options = {
        auth: {
          persistSession: typeof window !== 'undefined' && !isBuildTime,
          autoRefreshToken: typeof window !== 'undefined' && !isBuildTime,
          detectSessionInUrl: typeof window !== 'undefined' && !isBuildTime,
          storage:
            typeof window !== 'undefined' && !isBuildTime
              ? window.localStorage
              : undefined,
          storageKey:
            typeof window !== 'undefined' && !isBuildTime
              ? 'sb-vnswjnltnhpsueosfhmw-auth-token'
              : undefined,
          cookieOptions: {
            ...(typeof window !== 'undefined' ? {} : { sameSite: 'lax' }),
          },
          // PKCE 플로우 강제 사용 (상태 토큰 일관성 보장)
          flowType: 'pkce' as const,
        },
        global: {
          headers: {
            'x-openmanager-version': 'v5.0',
          },
        },
        // 빌드 시 realtime 비활성화
        realtime: isBuildTime
          ? undefined
          : {
              params: {
                eventsPerSecond: 10,
              },
            },
        // 빌드 시 디버그 로그 억제
        log: isBuildTime ? { level: 'error' } : undefined,
      };

      supabaseInstance = createClient(url, key, options);
      isInitialized = true;

      // 전역 변수에 저장하여 빌드 시에도 싱글톤 보장
      global.__supabaseInstance = supabaseInstance;
      global.__supabaseInitialized = true;

      console.log('✅ Supabase 싱글톤 클라이언트 초기화 완료');
    } catch (error) {
      _initializationError =
        error instanceof Error ? error : new Error('Unknown error');
      global.__supabaseInitError = _initializationError;
      throw _initializationError;
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

    const { error } = await client.from('command_vectors').select('id').limit(1);

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
    supabaseInstance = undefined;
    isInitialized = false;
    _initializationError = null;
    global.__supabaseInstance = undefined;
    global.__supabaseInitialized = undefined;
    global.__supabaseInitError = undefined;
  }
}

// 레거시 호환성을 위한 기본 export는 supabase.ts에서 처리
