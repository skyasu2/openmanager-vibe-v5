import { useQuery } from '@tanstack/react-query';
import { mapServerToEnhanced } from '@/utils/serverUtils';
import type { EnhancedServerMetrics } from '@/types/server';

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
    refetchInterval: 5000, // Client-side polling for real-time feel
    staleTime: 1000,
    gcTime: 1000 * 60 * 5, // 5 minutes unused data retention
  });
}
