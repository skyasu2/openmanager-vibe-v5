/**
 * 🔐 Supabase Client (Singleton with localStorage PKCE support)
 *
 * PKCE 플로우를 위해 localStorage 기반 저장소 사용.
 * createBrowserClient(@supabase/ssr)는 쿠키 기반이라 PKCE code_verifier가 손실됨.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Global declaration for singleton
declare global {
  var __supabaseInstance: SupabaseClient | undefined;
}

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // ⚠️ SSR 환경에서는 createServerClient를 사용해야 합니다
    console.error(
      '❌ getSupabaseClient() should not be called in SSR. Use createServerClient() instead.'
    );
    throw new Error(
      'Invalid Supabase client usage: Use createServerClient() for SSR'
    );
  }

  if (!globalThis.__supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    // 🔐 @supabase/supabase-js의 createClient 사용
    // localStorage 기반 저장소로 PKCE code_verifier 보존
    globalThis.__supabaseInstance = createClient(url, key, {
      auth: {
        // PKCE 플로우 사용 (기본값)
        flowType: 'pkce',
        // localStorage 기반 저장소 (기본값이지만 명시적으로 설정)
        storage:
          typeof window !== 'undefined' ? window.localStorage : undefined,
        // 자동 세션 감지 활성화
        detectSessionInUrl: true,
        // 자동 세션 새로고침
        autoRefreshToken: true,
        // 세션 유지
        persistSession: true,
      },
    });

    console.log('🔐 Supabase Browser Client 초기화 (localStorage PKCE)');
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
