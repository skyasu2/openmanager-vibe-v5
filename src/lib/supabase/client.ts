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

  if (!global.__supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    global.__supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  return global.__supabaseInstance;
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
 * @deprecated Use getDefaultSupabaseClient() instead for better SSR safety
 * This export is kept for backwards compatibility but may cause SSR issues
 */
export const supabase =
  typeof window !== 'undefined' ? getSupabaseClient() : ({} as SupabaseClient);
