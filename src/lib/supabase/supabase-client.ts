/**
 * Supabase 클라이언트 - 실제 Supabase 사용
 * 
 * 실제 Supabase와 MCP 서버를 사용하여 데이터베이스 통신
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase 클라이언트 가져오기
 * 
 * @returns SupabaseClient 인스턴스 (실제 Supabase)
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  }

  console.log('🌐 실제 Supabase 사용 중');
  return createClient(supabaseUrl, supabaseKey, {
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
}


// 기본 클라이언트 export
export const supabase = getSupabaseClient();

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
  console.log('🔍 Supabase 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Supabase URL: ${supabaseUrl ? '설정됨' : '미설정'}`);
  console.log(`  - 실제 Supabase 사용 중 (MCP 서버 활용)`);
}