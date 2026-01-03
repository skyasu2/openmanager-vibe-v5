/**
 * 🔐 Supabase Browser Client (PKCE + Cookie 기반)
 *
 * @supabase/ssr의 createBrowserClient 사용
 * - PKCE code_verifier가 쿠키에 저장되어 리다이렉트 후에도 유지
 * - 서버 사이드 콜백 핸들러와 호환
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

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

    // 🔐 createBrowserClient 사용 (쿠키 기반)
    // PKCE code_verifier가 쿠키에 저장되어 OAuth 리다이렉트 후에도 유지됨
    globalThis.__supabaseInstance = createBrowserClient(url, key);

    console.log('🔐 Supabase Browser Client 초기화 (PKCE + Cookie)');
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
