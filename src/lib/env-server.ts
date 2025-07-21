/**
 * Server-only environment variables
 * This file should NEVER be imported in client-side code
 */

// Ensure this file is only used on the server
if (typeof window !== 'undefined') {
  throw new Error('env-server.ts should only be imported in server-side code.');
}

// Server-only environment variables
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  // Add other server-only env vars here
};

// Helper to get service role key with validation
export function getSupabaseServiceRoleKey(): string {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  // Only check at runtime, not during build
  if (
    !key &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build'
  ) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production');
  }

  return key || 'temp-service-key-for-development';
}
