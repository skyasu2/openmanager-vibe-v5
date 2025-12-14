/**
 * Supabase Client for Cloud Run
 * Standalone Supabase 클라이언트 (Next.js 의존성 없음)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// 1. Environment Variables
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// ============================================================================
// 2. Client Singleton
// ============================================================================

let supabaseClient: SupabaseClient | null = null;

/**
 * Supabase 클라이언트 인스턴스 반환
 * Service Role Key 사용 (서버 사이드 전용)
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!SUPABASE_URL) {
    console.warn('⚠️ SUPABASE_URL is not configured, using mock mode');
    // Mock client for development without Supabase
    return createMockClient();
  }

  // Service Role Key 우선 사용 (Cloud Run 환경)
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!key) {
    console.warn(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY/ANON_KEY not configured, using mock mode'
    );
    return createMockClient();
  }

  supabaseClient = createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Supabase client initialized (Cloud Run mode)');
  return supabaseClient;
}

// ============================================================================
// 3. Mock Client (Development/Fallback)
// ============================================================================

/**
 * Supabase 연결 없이 개발/테스트용 Mock 클라이언트
 */
function createMockClient(): SupabaseClient {
  console.log('🔧 Using mock Supabase client');

  // Minimal mock implementation
  const mockClient = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        textSearch: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  } as unknown as SupabaseClient;

  return mockClient;
}

// ============================================================================
// 4. Database Types (Optional - for type safety)
// ============================================================================

export interface ServerRecord {
  id: string;
  name: string;
  status: 'normal' | 'warning' | 'critical';
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseRecord {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CheckpointRecord {
  thread_id: string;
  checkpoint_ns: string;
  checkpoint_id: string;
  type: string;
  checkpoint: string;
  metadata: string;
}
