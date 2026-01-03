/**
 * 🔐 Supabase Client (Singleton)
 *
 * Ensures a single instance of the Supabase client is used on the client-side.
 */

'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Global declaration for singleton
declare global {
  var __supabaseInstance: SupabaseClient | undefined;
  var __supabasePkceValidated: boolean | undefined;
}

/**
 * 🛡️ PKCE code_verifier 검증 (2026-01-03: 비활성화)
 *
 * ⚠️ 이 함수는 현재 비활성화되어 있습니다.
 * Google OAuth에서 code_verifier가 JSON 형식으로 저장되어
 * 기존 검증 로직이 유효한 값을 삭제하는 문제가 발생했습니다.
 * Supabase가 자체적으로 PKCE를 처리하도록 위임합니다.
 */
function validateAndCleanPkceData(): void {
  // 2026-01-03: PKCE 검증 완전 비활성화
  // Supabase gotrue-js가 자체적으로 code_verifier를 관리함
  // 외부에서 검증/삭제하면 OAuth 흐름이 깨짐
  return;
}

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // ⚠️ SSR 환경에서는 createServerClient를 사용해야 합니다
    // 이 경로는 실수로 호출된 경우의 폴백이며, 프로덕션에서는 경고를 발생시킵니다
    console.error(
      '❌ getSupabaseClient() should not be called in SSR. Use createServerClient() instead.'
    );
    throw new Error(
      'Invalid Supabase client usage: Use createServerClient() for SSR'
    );
  }

  if (!globalThis.__supabaseInstance) {
    // 🛡️ Supabase 클라이언트 생성 전에 PKCE 데이터 검증
    validateAndCleanPkceData();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    globalThis.__supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  return globalThis.__supabaseInstance;
}

// Lazy initialization to prevent SSR errors during module evaluation
let _supabase: SupabaseClient | null = null;

/**
 * Default Supabase client instance with lazy initialization
 * @returns Singleton Supabase client instance
 */
export function getDefaultSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = getSupabaseClient();
  }
  return _supabase;
}

/**
 * Lazy-initialized Supabase client getter
 * This is the RECOMMENDED way to access the Supabase client
 *
 * @example
 * // In component or hook:
 * const client = getSupabase();
 * await client.auth.signInWithOAuth({ provider: 'github' });
 */
export function getSupabase(): SupabaseClient {
  return getSupabaseClient();
}

/**
 * @deprecated Use getSupabase() or getDefaultSupabaseClient() instead
 * This export may cause PKCE flow failures due to SSR/CSR mismatch
 * Kept for backwards compatibility - will be removed in next major version
 */
export const supabase =
  typeof window !== 'undefined' ? getSupabaseClient() : ({} as SupabaseClient);
