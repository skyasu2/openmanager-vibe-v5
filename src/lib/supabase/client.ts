/**
 * 🔐 Supabase Client (Singleton with Implicit Flow)
 *
 * Implicit 플로우 사용 - PKCE code_verifier 저장 문제 회피
 * OAuth 리다이렉트 후 URL hash에서 토큰을 직접 받아 세션 생성
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

    // 🔐 Implicit 플로우 사용
    // PKCE code_verifier 저장 문제를 회피하기 위해 implicit 플로우 사용
    // 토큰이 URL hash로 직접 전달됨
    globalThis.__supabaseInstance = createClient(url, key, {
      auth: {
        // Implicit 플로우 - 토큰이 URL hash로 반환
        flowType: 'implicit',
        // 자동 세션 감지 비활성화 - 수동으로 처리
        detectSessionInUrl: false,
        // 자동 세션 새로고침
        autoRefreshToken: true,
        // 세션 유지
        persistSession: true,
      },
    });

    console.log('🔐 Supabase Browser Client 초기화 (Implicit Flow)');
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
