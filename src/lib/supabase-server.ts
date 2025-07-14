/**
 * Server-only Supabase client with service role key
 * This file should NEVER be imported in client-side code
 */
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey } from './env-server';

// Ensure this file is only used on the server
if (typeof window !== 'undefined') {
  throw new Error(
    'supabase-server.ts should only be imported in server-side code. Use supabase.ts for client-side code.'
  );
}

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (
    !url &&
    (process.env.NODE_ENV === undefined ||
      process.env.npm_lifecycle_event === 'build')
  ) {
    return 'https://temp.supabase.co';
  }

  if (!url) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
  }

  return url;
}

// Server-only Supabase admin client
export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getSupabaseServiceRoleKey()
);

if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase Admin 클라이언트 초기화됨 (서버 전용)');
}