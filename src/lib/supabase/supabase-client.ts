/**
 * Supabase 클라이언트 - 실제 Supabase 사용
 * 
 * 실제 Supabase와 MCP 서버를 사용하여 데이터베이스 통신
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  // 환경 변수 체크
  if (!supabaseUrl || !supabaseKey) {
    // 빌드 시점에 환경 변수 검증을 건너뛰는 옵션
    if (process.env.SKIP_ENV_VALIDATION === 'true') {
      console.warn('⚠️ SKIP_ENV_VALIDATION이 설정됨. 더미 Supabase 클라이언트를 사용합니다.');
      // 빌드용 더미 클라이언트 반환
      return createClient('https://dummy.supabase.co', 'dummy-key', {
        auth: { persistSession: false }
      });
    }
    
    // 빌드 시점에는 경고만 출력
    if (typeof window === 'undefined') {
      console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. 빌드 시점에는 더미 클라이언트를 사용합니다.');
      // 빌드용 더미 클라이언트 반환
      return createClient('https://dummy.supabase.co', 'dummy-key', {
        auth: { persistSession: false }
      });
    }
    
    // 브라우저 환경에서는 에러 throw
    throw new Error('⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인하세요.');
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
  console.log('🔍 Supabase 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Supabase URL: ${supabaseUrl ? '설정됨' : '미설정'}`);
  console.log(`  - 실제 Supabase 사용 중 (MCP 서버 활용)`);
}