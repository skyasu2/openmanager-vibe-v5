/**
 * Supabase 클라이언트 - 실제 Supabase 사용
 * 
 * 실제 Supabase와 MCP 서버를 사용하여 데이터베이스 통신
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv, shouldUseMockMode } from '@/lib/env-safe';

// Lazy initialization을 위한 변수
let _supabaseClient: SupabaseClient | null = null;

/**
 * Supabase 클라이언트 가져오기 (Lazy Initialization)
 * 
 * @returns SupabaseClient 인스턴스 (실제 Supabase)
 */
export function getSupabaseClient(): SupabaseClient {
  // 이미 초기화된 경우 기존 클라이언트 반환
  if (_supabaseClient) {
    return _supabaseClient;
  }

  // 안전한 환경 변수 가져오기
  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabaseEnv();

  // Mock 모드 체크
  if (shouldUseMockMode()) {
    console.warn('🎭 Mock 모드: 더미 Supabase 클라이언트 사용');
    return createClient('https://dummy.supabase.co', 'dummy-key', {
      auth: { persistSession: false }
    });
  }

  console.log('🌐 실제 Supabase 사용 중');
  _supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // 시간 차이 허용을 위한 storage 설정
      storageKey: 'sb-auth-token',
      storage: {
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key);
          }
          return null;
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
        },
      },
    },
    global: {
      headers: {
        'x-application-name': 'openmanager-vibe-v5',
      },
    },
  });

  // 초기화된 클라이언트 저장 및 반환
  return _supabaseClient;
}

// Proxy를 사용한 Lazy Loading Supabase 클라이언트
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    
    // 메서드인 경우 this 바인딩 유지
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
});

// 브라우저 전용 클라이언트
export const browserSupabase = typeof window !== 'undefined' ? supabase : undefined;

// Helper functions
export async function getSupabaseUser() {
  if (typeof window === 'undefined') return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.warn('Failed to get Supabase user:', error);
    return null;
  }
}

export async function signInWithGitHub() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('GitHub 로그인 실패:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  const { url, anonKey } = getSupabaseEnv();
  const useMock = shouldUseMockMode();
  
  console.log('🔍 Supabase 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Supabase URL: ${url === 'https://dummy.supabase.co' ? '미설정 (Mock)' : '설정됨'}`);
  console.log(`  - Mock 모드: ${useMock ? '활성화' : '비활성화'}`);
  console.log(`  - 실제 Supabase 사용 중 (MCP 서버 활용)`);
}