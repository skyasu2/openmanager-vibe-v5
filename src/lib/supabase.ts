/**
 * Enhanced Supabase client with resilient fallback mechanisms
 * 실시간 서버 모니터링을 위한 강화된 Supabase 클라이언트
 */

import { getErrorMessage } from '@/types/type-utils';
import { supabase, browserSupabase, getSupabaseUser, signInWithGitHub, signOut } from '@/lib/supabase/supabase-client';

// Re-export from supabase-client
export { supabase, browserSupabase, getSupabaseUser, signInWithGitHub, signOut };

// 타입 정의
interface FallbackStorage {
  get<T>(key: string): T | null;
  set(key: string, value: unknown): void;
  clear(): void;
}

// 메모리 기반 fallback 스토리지
const memoryStorage: Map<string, unknown> = new Map();

// localStorage wrapper with error handling
const localStorageWrapper: FallbackStorage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn('localStorage read error:', getErrorMessage(e));
      return null;
    }
  },
  set(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write error:', getErrorMessage(e));
      memoryStorage.set(key, value);
    }
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('localStorage clear error:', getErrorMessage(e));
    }
    memoryStorage.clear();
  },
};

// ResilientSupabaseClient - 완전한 fallback 메커니즘
export class ResilientSupabaseClient {
  private fallbackStorage: FallbackStorage = localStorageWrapper;

  // SELECT 작업 with fallback
  async from<T = Record<string, unknown>>(table: string) {
    const cacheKey = `supabase_cache_${table}`;

    try {
      const result = await supabase.from(table).select('*');

      // 에러가 있으면 fallback 데이터 사용
      if (result.error) {
        console.warn('Supabase error, using fallback:', result.error);
        const fallbackData = this.fallbackStorage.get<T[]>(cacheKey);
        return {
          data: fallbackData ?? [],
          error: result.error,
        };
      }

      // 성공시 fallback에 저장
      if (result.data) {
        this.fallbackStorage.set(cacheKey, result.data);
      }

      return result;
    } catch (error) {
      console.warn('Supabase connection error:', error);
      const fallbackData = this.fallbackStorage.get<T[]>(cacheKey);
      return {
        data: fallbackData ?? [],
        error,
      };
    }
  }

  // INSERT 작업
  async insert<T = Record<string, unknown>>(table: string, data: T) {
    try {
      const result = await supabase.from(table).insert(data);
      return result;
    } catch (error) {
      console.warn('Supabase INSERT error:', error);
      return {
        data: [data],
        error,
      };
    }
  }

  // UPDATE 작업
  async update<T = Record<string, unknown>>(
    table: string,
    data: Partial<T>,
    match: Partial<T>
  ) {
    try {
      return await supabase.from(table).update(data).match(match);
    } catch (error) {
      console.warn('Supabase UPDATE error:', error);
      return {
        data: [] as T[],
        error,
      };
    }
  }

  // DELETE 작업
  async delete<T = Record<string, unknown>>(table: string, match: Partial<T>) {
    try {
      return await supabase.from(table).delete().match(match);
    } catch (error) {
      console.warn('Supabase DELETE error:', error);
      return {
        data: [] as T[],
        error,
      };
    }
  }

  // 실시간 구독 with reconnection
  subscribe<T = Record<string, unknown>>(
    table: string,
    callback: (payload: { new: T; old: T }) => void
  ) {
    const cacheKey = `supabase_realtime_${table}`;

    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        payload => {
          // 실시간 데이터도 캐시에 저장
          const result = payload as unknown as { new: T; old: T };

          // 성공시 캐시에 저장
          if (result.new) {
            this.fallbackStorage.set(cacheKey, result.new);
          }

          callback(result);
        }
      )
      .subscribe();

    // 재연결 로직
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const handleDisconnect = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(
          `Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`
        );
        setTimeout(() => {
          channel.subscribe();
        }, 1000 * reconnectAttempts);
      }
    };

    // 연결 상태 모니터링
    channel.on('system', {}, payload => {
      if (payload.status === 'closed') {
        handleDisconnect();
      }
    });

    return channel;
  }

  // 캐시 초기화
  clearCache() {
    this.fallbackStorage.clear();
  }
}

// 싱글톤 인스턴스
export const resilientSupabase = new ResilientSupabaseClient();

// Default export
export default supabase;
