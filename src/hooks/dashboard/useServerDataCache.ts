import { useMemo, useRef } from 'react';
import type { EnhancedServerData } from '@/types/dashboard/server-dashboard.types';

/**
 * 🛡️ useServerDataCache Hook
 *
 * Race Condition 방어 및 데이터 캐싱
 * - AI 사이드바 오픈 시 빈 배열이 되는 문제 방지
 * - 이전 유효한 데이터를 유지하여 안정성 확보
 */
export function useServerDataCache(rawServers: EnhancedServerData[]) {
  const previousServersRef = useRef<EnhancedServerData[]>([]);

  const cachedServers = useMemo(() => {
    // 빈 배열이거나 유효하지 않은 데이터인 경우 이전 캐시 반환
    if (!rawServers || !Array.isArray(rawServers) || rawServers.length === 0) {
      return previousServersRef.current;
    }

    // 유효한 데이터인 경우 캐시 업데이트
    previousServersRef.current = rawServers;
    return rawServers;
  }, [rawServers]);

  return { cachedServers };
}
