/**
 * 🔐 인증 캐시 유틸리티
 *
 * 미들웨어에서 getUser() 호출을 최적화하기 위한 캐싱 레이어
 * Vercel Edge Runtime과 호환되도록 설계됨
 */

import type { User } from '@supabase/supabase-js';

// 메모리 기반 캐시 (Edge Runtime 호환)
const userCache = new Map<string, { user: User | null; timestamp: number }>();

// 캐시 유효 시간 (밀리초)
const CACHE_TTL = 30 * 1000; // 30초

// 캐시 최대 크기
const MAX_CACHE_SIZE = 100;

/**
 * 사용자 정보를 캐시에 저장
 */
export function setCachedUser(sessionId: string, user: User | null): void {
  // 캐시 크기 제한
  if (userCache.size >= MAX_CACHE_SIZE) {
    // 가장 오래된 항목 제거
    const oldestKey = Array.from(userCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    )[0]?.[0];
    if (oldestKey) {
      userCache.delete(oldestKey);
    }
  }

  userCache.set(sessionId, {
    user,
    timestamp: Date.now(),
  });
}

/**
 * 캐시에서 사용자 정보 조회
 */
export function getCachedUser(sessionId: string): User | null | undefined {
  const cached = userCache.get(sessionId);

  if (!cached) {
    return undefined; // 캐시 미스
  }

  // TTL 확인
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    userCache.delete(sessionId);
    return undefined; // 캐시 만료
  }

  return cached.user;
}

/**
 * 특정 세션의 캐시 삭제
 */
export function clearCachedUser(sessionId: string): void {
  userCache.delete(sessionId);
}

/**
 * 전체 캐시 초기화
 */
export function clearAllCache(): void {
  userCache.clear();
}

/**
 * 캐시 상태 조회 (디버깅용)
 */
export function getCacheStats() {
  return {
    size: userCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL,
  };
}
