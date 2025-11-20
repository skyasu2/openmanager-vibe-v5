/**
 * Server-only Supabase client with service role key
 * This file should NEVER be imported in client-side code
 */
import { createClient } from '@supabase/supabase-js';
import { env, isDevelopment } from '@/env';

// Ensure this file is only used on the server
if (typeof window !== 'undefined') {
  throw new Error(
    'supabase-server.ts should only be imported in server-side code. Use supabase.ts for client-side code.'
  );
}

// The Zod schema in src/env.ts ensures these variables are defined.
// If they are missing, the application will not start in production.
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

// Server-only Supabase admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

if (isDevelopment) {
  console.log('✅ Supabase Admin 클라이언트 초기화됨 (서버 전용)');
}