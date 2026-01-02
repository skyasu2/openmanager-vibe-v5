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
    refetchInterval: 10 * 60 * 1000, // 10분 폴링 (JSON 데이터 10분 간격에 맞춤)
    staleTime: 9 * 60 * 1000, // 9분간 fresh 유지 (다음 갱신 직전까지)
    gcTime: 15 * 60 * 1000, // 15분 미사용 데이터 보관
  });
}
