/**
 * 실시간 서버 데이터 관리 훅
 * 서버 상태, 메트릭, 실시간 업데이트를 처리
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import type { Server } from '@/types/server';

// 타입 정의
interface UseRealtimeServersOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableToast?: boolean;
}

interface UseRealtimeServersReturn {
  servers: Server[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshServers: () => Promise<void>;
  clearError: () => void;
}

// 서버 목록 목업 데이터
const mockServers: Server[] = [
  {
    id: '1',
    name: 'Production Server',
    status: 'online',
    hostname: 'prod.example.com',
    cpu: 45,
    memory: 67,
    disk: 34,
    network: 23,
    uptime: '99.99%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 45,
        cores: 8,
        temperature: 62,
      },
      memory: {
        used: 5400,
        total: 8192,
        usage: 67,
      },
      disk: {
        used: 340,
        total: 1000,
        usage: 34,
      },
      network: {
        bytesIn: 1024000,
        bytesOut: 512000,
        packetsIn: 10000,
        packetsOut: 5000,
      },
      timestamp: new Date().toISOString(),
      uptime: 864000,
    },
    lastUpdate: new Date(),
  },
  {
    id: '2',
    name: 'Staging Server',
    status: 'warning',
    hostname: 'staging.example.com',
    cpu: 78,
    memory: 89,
    disk: 56,
    network: 45,
    uptime: '98.5%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 78,
        cores: 4,
        temperature: 72,
      },
      memory: {
        used: 7300,
        total: 8192,
        usage: 89,
      },
      disk: {
        used: 560,
        total: 1000,
        usage: 56,
      },
      network: {
        bytesIn: 2048000,
        bytesOut: 1024000,
        packetsIn: 20000,
        packetsOut: 10000,
      },
      timestamp: new Date().toISOString(),
      uptime: 432000,
    },
    lastUpdate: new Date(),
  },
  {
    id: '3',
    name: 'Development Server',
    status: 'offline',
    hostname: 'dev.example.com',
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: '0%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 0,
        cores: 2,
        temperature: 25,
      },
      memory: {
        used: 0,
        total: 4096,
        usage: 0,
      },
      disk: {
        used: 0,
        total: 500,
        usage: 0,
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
      },
      timestamp: new Date().toISOString(),
      uptime: 0,
    },
    lastUpdate: new Date(),
  },
  {
    id: '4',
    name: 'Database Server',
    status: 'online',
    hostname: 'db.example.com',
    cpu: 32,
    memory: 54,
    disk: 78,
    network: 12,
    uptime: '99.95%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 32,
        cores: 16,
        temperature: 55,
      },
      memory: {
        used: 8800,
        total: 16384,
        usage: 54,
      },
      disk: {
        used: 1560,
        total: 2000,
        usage: 78,
      },
      network: {
        bytesIn: 512000,
        bytesOut: 256000,
        packetsIn: 5000,
        packetsOut: 2500,
      },
      timestamp: new Date().toISOString(),
      uptime: 2592000,
    },
    lastUpdate: new Date(),
  },
  {
    id: '5',
    name: 'API Server',
    status: 'online',
    hostname: 'api.example.com',
    cpu: 56,
    memory: 43,
    disk: 29,
    network: 67,
    uptime: '99.8%',
    location: 'Seoul, KR',
    lastUpdate: new Date(),
  },
  {
    id: '6',
    name: 'Cache Server',
    status: 'warning',
    hostname: 'cache.example.com',
    cpu: 23,
    memory: 89,
    disk: 12,
    network: 34,
    uptime: '97.2%',
    location: 'Seoul, KR',
    lastUpdate: new Date(),
  },
  {
    id: '7',
    name: 'Load Balancer',
    status: 'online',
    hostname: 'lb.example.com',
    cpu: 34,
    memory: 45,
    disk: 23,
    network: 78,
    uptime: '99.9%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 34,
        cores: 4,
        temperature: 55,
      },
      memory: {
        used: 3686,
        total: 8192,
        usage: 45,
      },
      disk: {
        used: 230,
        total: 1000,
        usage: 23,
      },
      network: {
        bytesIn: 3072000,
        bytesOut: 1536000,
        packetsIn: 30000,
        packetsOut: 15000,
      },
      timestamp: new Date().toISOString(),
      uptime: 518400,
    },
    lastUpdate: new Date(),
  },
  {
    id: '8',
    name: 'Monitoring Server',
    status: 'online',
    hostname: 'monitor.example.com',
    cpu: 29,
    memory: 56,
    disk: 67,
    network: 23,
    uptime: '99.5%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 29,
        cores: 2,
        temperature: 48,
      },
      memory: {
        used: 4587,
        total: 8192,
        usage: 56,
      },
      disk: {
        used: 670,
        total: 1000,
        usage: 67,
      },
      network: {
        bytesIn: 512000,
        bytesOut: 256000,
        packetsIn: 5000,
        packetsOut: 2500,
      },
      timestamp: new Date().toISOString(),
      uptime: 691200,
    },
    lastUpdate: new Date(),
  },
  {
    id: '9',
    name: 'Backup Server',
    status: 'offline',
    hostname: 'backup.example.com',
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: '0%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 0,
        cores: 4,
        temperature: 0,
      },
      memory: {
        used: 0,
        total: 8192,
        usage: 0,
      },
      disk: {
        used: 0,
        total: 1000,
        usage: 0,
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
      },
      timestamp: new Date().toISOString(),
      uptime: 0,
    },
    lastUpdate: new Date(),
  },
  {
    id: '10',
    name: 'CDN Server',
    status: 'online',
    hostname: 'cdn.example.com',
    cpu: 45,
    memory: 34,
    disk: 56,
    network: 89,
    uptime: '99.99%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 45,
        cores: 8,
        temperature: 58,
      },
      memory: {
        used: 2785,
        total: 8192,
        usage: 34,
      },
      disk: {
        used: 560,
        total: 1000,
        usage: 56,
      },
      network: {
        bytesIn: 8192000,
        bytesOut: 4096000,
        packetsIn: 80000,
        packetsOut: 40000,
      },
      timestamp: new Date().toISOString(),
      uptime: 1036800,
    },
    lastUpdate: new Date(),
  },
  {
    id: '11',
    name: 'Analytics Server',
    status: 'warning',
    hostname: 'analytics.example.com',
    cpu: 67,
    memory: 78,
    disk: 45,
    network: 23,
    uptime: '98.7%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 67,
        cores: 4,
        temperature: 68,
      },
      memory: {
        used: 6390,
        total: 8192,
        usage: 78,
      },
      disk: {
        used: 450,
        total: 1000,
        usage: 45,
      },
      network: {
        bytesIn: 1024000,
        bytesOut: 512000,
        packetsIn: 10000,
        packetsOut: 5000,
      },
      timestamp: new Date().toISOString(),
      uptime: 604800,
    },
    lastUpdate: new Date(),
  },
  {
    id: '12',
    name: 'Security Server',
    status: 'online',
    hostname: 'security.example.com',
    cpu: 23,
    memory: 34,
    disk: 45,
    network: 56,
    uptime: '100%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 23,
        cores: 2,
        temperature: 45,
      },
      memory: {
        used: 2785,
        total: 8192,
        usage: 34,
      },
      disk: {
        used: 450,
        total: 1000,
        usage: 45,
      },
      network: {
        bytesIn: 2048000,
        bytesOut: 1024000,
        packetsIn: 20000,
        packetsOut: 10000,
      },
      timestamp: new Date().toISOString(),
      uptime: 1209600,
    },
    lastUpdate: new Date(),
  },
  {
    id: '13',
    name: 'File Server',
    status: 'online',
    hostname: 'files.example.com',
    cpu: 34,
    memory: 45,
    disk: 89,
    network: 12,
    uptime: '99.8%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 34,
        cores: 4,
        temperature: 52,
      },
      memory: {
        used: 3686,
        total: 8192,
        usage: 45,
      },
      disk: {
        used: 890,
        total: 1000,
        usage: 89,
      },
      network: {
        bytesIn: 256000,
        bytesOut: 128000,
        packetsIn: 2500,
        packetsOut: 1250,
      },
      timestamp: new Date().toISOString(),
      uptime: 777600,
    },
    lastUpdate: new Date(),
  },
  {
    id: '14',
    name: 'Mail Server',
    status: 'offline',
    hostname: 'mail.example.com',
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: '0%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 0,
        cores: 2,
        temperature: 0,
      },
      memory: {
        used: 0,
        total: 4096,
        usage: 0,
      },
      disk: {
        used: 0,
        total: 500,
        usage: 0,
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
      },
      timestamp: new Date().toISOString(),
      uptime: 0,
    },
    lastUpdate: new Date(),
  },
  {
    id: '15',
    name: 'Test Server',
    status: 'warning',
    hostname: 'test.example.com',
    cpu: 78,
    memory: 56,
    disk: 34,
    network: 45,
    uptime: '95.0%',
    location: 'Seoul, KR',
    metrics: {
      cpu: {
        usage: 78,
        cores: 2,
        temperature: 70,
      },
      memory: {
        used: 2293,
        total: 4096,
        usage: 56,
      },
      disk: {
        used: 170,
        total: 500,
        usage: 34,
      },
      network: {
        bytesIn: 1536000,
        bytesOut: 768000,
        packetsIn: 15000,
        packetsOut: 7500,
      },
      timestamp: new Date().toISOString(),
      uptime: 259200,
    },
    lastUpdate: new Date(),
  },
];

// 타입 안전 상태 매핑 함수
const mapStatus = (rawStatus: string | undefined): 'online' | 'warning' | 'offline' => {
  if (!rawStatus) return 'offline';
  
  const s = rawStatus.toLowerCase();
  if (s === 'online' || s === 'running' || s === 'healthy') return 'online';
  if (s === 'warning' || s === 'degraded' || s === 'unhealthy') return 'warning';
  return 'offline';
};

export function useRealtimeServers(
  options: UseRealtimeServersOptions = {}
): UseRealtimeServersReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    enableToast = true,
  } = options;

  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // 서버 데이터 패치 함수
  const fetchServers = useCallback(async (): Promise<Server[]> => {
    try {
      // 실제 API 호출 (현재는 목업 사용)
      const response = await fetch('/api/servers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 데이터 구조 검증 및 변환
      if (data?.servers && Array.isArray(data.servers)) {
        const transformedServers = data.servers.map((s: { status?: string; [key: string]: unknown }) => {
          if (typeof s === 'object' && s !== null) {
            return {
              ...s,
              status: mapStatus(s.status),
            };
          }
          return s;
        });
        return transformedServers as Server[];
      }
      
      // 실제 API가 없으면 목업 데이터 반환
      return mockServers;
      
    } catch (fetchError) {
      console.warn('API 호출 실패, 목업 데이터 사용:', fetchError);
      
      // 목업 데이터에 랜덤 업데이트 적용
      return mockServers.map(server => {
        if (!server.metrics) {
          return server;
        }
        
        const updatedCpuUsage = Math.max(0, Math.min(100, server.metrics.cpu.usage + (Math.random() - 0.5) * 10));
        const updatedMemoryUsage = Math.max(0, Math.min(100, server.metrics.memory.usage + (Math.random() - 0.5) * 10));
        const updatedDiskUsage = Math.max(0, Math.min(100, server.metrics.disk.usage + (Math.random() - 0.5) * 5));
        const updatedNetworkIn = Math.max(0, server.metrics.network.bytesIn + Math.random() * 100000);
        const updatedNetworkOut = Math.max(0, server.metrics.network.bytesOut + Math.random() * 50000);
        
        return {
          ...server,
          cpu: updatedCpuUsage,
          memory: updatedMemoryUsage,
          disk: updatedDiskUsage,
          metrics: {
            ...server.metrics,
            cpu: {
              ...server.metrics.cpu,
              usage: updatedCpuUsage,
            },
            memory: {
              ...server.metrics.memory,
              usage: updatedMemoryUsage,
            },
            disk: {
              ...server.metrics.disk,
              usage: updatedDiskUsage,
            },
            network: {
              ...server.metrics.network,
              bytesIn: updatedNetworkIn,
              bytesOut: updatedNetworkOut,
            },
            timestamp: new Date().toISOString(),
          },
          lastUpdate: new Date(),
        };
      });
    }
  }, []);

  // 서버 목록 새로고침
  const refreshServers = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const serverData = await fetchServers();
      
      if (mountedRef.current) {
        setServers(serverData);
        setLastUpdate(new Date());
        
        if (enableToast) {
          const onlineCount = serverData.filter(s => s.status === 'online').length;
          const totalCount = serverData.length;
          toast.success(`서버 목록 업데이트 완료 (${onlineCount}/${totalCount} 온라인)`);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        
        if (enableToast) {
          toast.error(`서버 데이터 로딩 실패: ${errorMessage}`);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchServers, enableToast]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 자동 새로고침 설정
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshServers();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshServers]);

  // 초기 데이터 로드
  useEffect(() => {
    refreshServers();
  }, [refreshServers]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    servers,
    isLoading,
    error,
    lastUpdate,
    refreshServers,
    clearError,
  };
}