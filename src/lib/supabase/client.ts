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
 * 🛡️ PKCE code_verifier 검증 및 손상된 데이터 정리
 * OAuth 콜백 시 "Invalid value" fetch 에러 방지
 */
function validateAndCleanPkceData(): void {
  if (typeof window === 'undefined' || globalThis.__supabasePkceValidated) {
    return;
  }

  try {
    const pkceKeys = Object.keys(localStorage).filter(
      (key) =>
        key.includes('code-verifier') ||
        key.includes('code_verifier') ||
        (key.startsWith('sb-') && key.includes('auth-token'))
    );

    for (const key of pkceKeys) {
      const value = localStorage.getItem(key);
      if (!value) continue;

      // code_verifier는 RFC 7636 PKCE 표준에 따른 unreserved URI 문자만 포함
      // 유효한 문자: A-Z, a-z, 0-9, -, _, ., ~ (RFC 3986 unreserved characters)
      if (key.includes('verifier')) {
        const isValidCodeVerifier = /^[A-Za-z0-9\-_.~]+$/.test(value);
        if (!isValidCodeVerifier) {
          console.warn(`🧹 손상된 PKCE code_verifier 정리: ${key}`);
          localStorage.removeItem(key);
        }
      }

      // auth-token JSON 검증
      if (key.includes('auth-token') && !key.includes('verifier')) {
        try {
          JSON.parse(value);
        } catch {
          console.warn(`🧹 손상된 auth-token 정리: ${key}`);
          localStorage.removeItem(key);
        }
      }
    }

    globalThis.__supabasePkceValidated = true;
  } catch (error) {
    console.error('❌ PKCE 데이터 검증 실패:', error);
  }
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
