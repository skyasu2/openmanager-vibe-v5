/**
 * Supabase 클라이언트 - 실제 Supabase 사용
 * 
 * 실제 Supabase와 MCP 서버를 사용하여 데이터베이스 통신
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

  // 환경 변수 직접 읽기 (Vercel 빌드 호환성)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

  // 환경변수 체크
  const isValidUrl = supabaseUrl && supabaseUrl !== 'https://dummy.supabase.co';
  const isValidKey = supabaseKey && supabaseKey !== 'dummy-key';
  
  // 개발/테스트 환경이거나 환경변수가 없는 경우 Mock 사용
  if (!isValidUrl || !isValidKey) {
    console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다. Mock 모드로 작동합니다.');
    console.warn('⚠️ GitHub 로그인 등 일부 기능이 제한됩니다.');
    
    // Mock 클라이언트 반환 (개발/테스트용)
    return createClient('https://dummy.supabase.co', 'dummy-key', {
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
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

/**
 * Proxy를 사용한 Lazy Loading Supabase 클라이언트
 * 
 * 🎯 장점:
 * - 모듈 최상위에서 환경변수를 읽지 않아 빌드 시점 에러 방지
 * - 실제 사용 시점까지 초기화 지연 (GitHub Actions 빌드 성공)
 * - 일반 Supabase 클라이언트처럼 사용 가능
 * 
 * 🔧 작동 원리:
 * - Proxy가 속성 접근을 가로채서 실제 클라이언트로 전달
 * - 첫 사용 시 getSupabaseClient() 호출로 초기화
 * - 메서드는 this 바인딩 유지를 위해 bind() 처리
 */
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
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
  const isValidUrl = supabaseUrl && supabaseUrl !== 'https://dummy.supabase.co';
  
  console.log('🔍 Supabase 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Supabase URL: ${isValidUrl ? '설정됨' : '미설정 (Mock)'}`);
  console.log(`  - 모드: ${isValidUrl ? '실제 Supabase' : 'Mock 모드'}`);
}