/**
 * Supabase 클라이언트 선택자
 * 
 * 환경에 따라 실제 Supabase 또는 Mock Supabase를 자동으로 선택
 * - 개발 환경: Mock 사용
 * - 테스트 환경: Mock 사용  
 * - 프로덕션: 실제 Supabase 사용
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient, getDevMockSupabase } from './dev-mock-supabase';
import { scenarioManager } from '@/lib/mock-scenarios';

// 환경 감지
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const forceMock = process.env.FORCE_MOCK_SUPABASE === 'true';

// Mock 사용 여부 결정
export const shouldUseMockSupabase = isDevelopment || isTest || forceMock;

// 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase 클라이언트 가져오기
 * 
 * @returns SupabaseClient 인스턴스 (실제 또는 Mock)
 */
export function getSupabaseClient(): SupabaseClient {
  if (shouldUseMockSupabase) {
    console.log('🎭 Mock Supabase 사용 중 (API 사용량 0)');
    const mockClient = createMockSupabaseClient();
    
    // 시나리오 매니저에 등록
    scenarioManager.registerMockInstance('supabase', getDevMockSupabase());
    
    return mockClient;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase 환경 변수가 없습니다. Mock으로 폴백합니다.');
    const mockClient = createMockSupabaseClient();
    scenarioManager.registerMockInstance('supabase', getDevMockSupabase());
    return mockClient;
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

/**
 * Mock 통계 조회 (개발용)
 * 
 * @returns Mock 사용 통계 또는 null
 */
export function getSupabaseMockStats(): Record<string, any> | null {
  if (shouldUseMockSupabase) {
    return getDevMockSupabase().getStats();
  }
  return null;
}

/**
 * Mock 데이터 추가 (개발용)
 * 
 * @param table 테이블 이름
 * @param data 추가할 데이터
 */
export function addSupabaseMockData(
  table: string,
  data: Record<string, any> | Record<string, any>[]
): void {
  if (shouldUseMockSupabase) {
    getDevMockSupabase().addMockData(table, data);
  } else {
    console.warn('⚠️ Mock이 활성화되지 않은 상태에서 Mock 데이터 추가 시도');
  }
}

/**
 * Mock 초기화 (개발용)
 */
export function resetSupabaseMock(): void {
  if (shouldUseMockSupabase) {
    getDevMockSupabase().reset();
  }
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
  console.log(`  - FORCE_MOCK_SUPABASE: ${forceMock}`);
  console.log(`  - Mock 사용: ${shouldUseMockSupabase}`);
  console.log(`  - Supabase URL: ${supabaseUrl ? '설정됨' : '미설정'}`);
}