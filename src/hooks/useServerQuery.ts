import { useQuery } from '@tanstack/react-query';
import type { EnhancedServerMetrics } from '@/types/server';
import { mapServerToEnhanced } from '@/utils/serverUtils';

const fetchServers = async (): Promise<EnhancedServerMetrics[]> => {
  const response = await fetch('/api/servers-unified?limit=50');
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to fetch data');
  }
  return result.data.map(mapServerToEnhanced);
};

export function useServerQuery() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: fetchServers,
    refetchInterval: 5 * 60 * 1000, // 5분 폴링 (서버 데이터 갱신 주기에 맞춤)
    staleTime: 4 * 60 * 1000, // 4분간 fresh 유지 (불필요한 리렌더링 방지)
    gcTime: 10 * 60 * 1000, // 10분 미사용 데이터 보관
  });
}
