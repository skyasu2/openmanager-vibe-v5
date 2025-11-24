/**
 * 🔐 Supabase Client (Singleton)
 *
 * Ensures a single instance of the Supabase client is used on the client-side.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Global declaration for singleton
declare global {
  var __supabaseInstance: SupabaseClient | undefined;
}

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Fallback for server-side rendering (if called accidentally)
    // But ideally, use createServerClient for SSR
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

// Default instance for easy import
export const supabase = getSupabaseClient();
