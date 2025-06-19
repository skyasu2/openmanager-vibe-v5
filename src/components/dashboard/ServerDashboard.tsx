'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Zap,
  Activity,
  Network,
  Globe,
  Wifi,
  Server as ServerIcon,
  Database,
  BarChart3,
  Loader,
} from 'lucide-react';
import ServerCard from './ServerCard';
import ServerDetailModal from './ServerDetailModal';
import EnhancedServerCard from './EnhancedServerCard';
import EnhancedServerModal from './EnhancedServerModal';
import NetworkMonitoringCard from './NetworkMonitoringCard';
import { Server } from '../../types/server';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';
import { timerManager } from '../../utils/TimerManager';
import { motion, AnimatePresence } from 'framer-motion';
import { useServerDashboard } from '@/hooks/useServerDashboard';
// ❌ 제거: Node.js 전용 모듈을 클라이언트에서 import하면 안됨
// import {
//   RealServerDataGenerator,
//   type ServerInstance,
//   type ServerCluster,
//   type ApplicationMetrics,
// } from '@/services/data-generator/RealServerDataGenerator';
// import { koreanAIEngine } from '@/services/ai/korean-ai-engine';

// ✅ 타입만 정의 (실제 구현은 API 라우트에서 처리)
interface ServerInstance {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  location: string;
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: Array<{
    name: string;
    status: string;
    port: number;
  }>;
}

interface ServerCluster {
  id: string;
  name: string;
  servers: ServerInstance[];
}

interface ApplicationMetrics {
  id: string;
  name: string;
  status: string;
  responseTime: number;
  throughput: number;
}

interface ServerDashboardProps {
  onStatsUpdate?: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
}

// 🎯 탭 타입 정의
type DashboardTab = 'servers' | 'network' | 'clusters' | 'applications';

// 🎯 심각→경고→정상 순으로 정렬된 목업 서버 데이터
const fallbackServers: Server[] = [
  // 🚨 심각 상태 (offline) 서버들
  {
    id: 'api-jp-040',
    name: 'api-jp-040',
    status: 'offline',
    location: 'Asia Pacific',
    cpu: 95,
    memory: 98,
    disk: 85,
    network: 85,
    networkStatus: 'offline',
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 5,
    services: [
      { name: 'nginx', status: 'stopped', port: 80 },
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'uwsgi', status: 'stopped', port: 8080 },
    ],
  },
  {
    id: 'api-sg-044',
    name: 'api-sg-044',
    status: 'offline',
    location: 'Singapore',
    cpu: 88,
    memory: 92,
    disk: 78,
    network: 78,
    networkStatus: 'offline',
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 4,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'stopped', port: 80 },
    ],
  },

  // ⚠️ 경고 상태 (warning) 서버들
  {
    id: 'api-eu-045',
    name: 'api-eu-045',
    status: 'warning',
    location: 'EU West',
    cpu: 78,
    memory: 85,
    disk: 68,
    network: 65,
    networkStatus: 'poor',
    uptime: '8일 12시간',
    lastUpdate: new Date(),
    alerts: 2,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },
  {
    id: 'api-sg-042',
    name: 'api-sg-042',
    status: 'warning',
    location: 'Singapore',
    cpu: 72,
    memory: 79,
    disk: 58,
    network: 55,
    networkStatus: 'poor',
    uptime: '8일 6시간',
    lastUpdate: new Date(),
    alerts: 1,
    services: [
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'python', status: 'stopped', port: 3000 },
      { name: 'uwsgi', status: 'running', port: 8080 },
    ],
  },
  {
    id: 'api-us-039',
    name: 'api-us-039',
    status: 'warning',
    location: 'US East',
    cpu: 68,
    memory: 75,
    disk: 45,
    network: 48,
    networkStatus: 'good',
    uptime: '45일 18시간',
    lastUpdate: new Date(),
    alerts: 1,
    services: [
      { name: 'uwsgi', status: 'stopped', port: 8080 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },

  // ✅ 정상 상태 (online) 서버들
  {
    id: 'api-us-041',
    name: 'api-us-041',
    status: 'online',
    location: 'US East',
    cpu: 59,
    memory: 48,
    disk: 30,
    network: 35,
    networkStatus: 'excellent',
    uptime: '22일 5시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'uwsgi', status: 'running', port: 8080 },
      { name: 'gunicorn', status: 'running', port: 8000 },
      { name: 'python', status: 'running', port: 3000 },
      { name: 'nodejs', status: 'running', port: 3001 },
    ],
  },
  {
    id: 'api-eu-043',
    name: 'api-eu-043',
    status: 'online',
    location: 'EU West',
    cpu: 35,
    memory: 36,
    disk: 25,
    network: 28,
    networkStatus: 'excellent',
    uptime: '15일 3시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'gunicorn', status: 'running', port: 8000 },
      { name: 'python', status: 'running', port: 3000 },
      { name: 'nodejs', status: 'running', port: 3001 },
      { name: 'nginx', status: 'running', port: 80 },
    ],
  },
  {
    id: 'database-1',
    name: 'database-1',
    status: 'online',
    location: 'US West',
    cpu: 42,
    memory: 55,
    disk: 38,
    network: 32,
    networkStatus: 'good',
    uptime: '30일 8시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'postgresql', status: 'running', port: 5432 },
      { name: 'redis', status: 'running', port: 6379 },
    ],
  },
];

// 🌐 네트워크 메트릭 목업 데이터
const networkMetrics = [
  {
    serverName: 'api-us-041',
    metrics: {
      bandwidth: 75,
      latency: 45,
      packetLoss: 0.1,
      uptime: 99.9,
      downloadSpeed: 850,
      uploadSpeed: 420,
      connections: 156,
      status: 'excellent' as const,
    },
  },
  {
    serverName: 'api-eu-043',
    metrics: {
      bandwidth: 68,
      latency: 52,
      packetLoss: 0.2,
      uptime: 99.8,
      downloadSpeed: 720,
      uploadSpeed: 380,
      connections: 134,
      status: 'good' as const,
    },
  },
  {
    serverName: 'database-1',
    metrics: {
      bandwidth: 82,
      latency: 38,
      packetLoss: 0.05,
      uptime: 99.95,
      downloadSpeed: 950,
      uploadSpeed: 480,
      connections: 89,
      status: 'excellent' as const,
    },
  },
  {
    serverName: 'api-eu-045',
    metrics: {
      bandwidth: 45,
      latency: 125,
      packetLoss: 2.1,
      uptime: 97.2,
      downloadSpeed: 320,
      uploadSpeed: 180,
      connections: 67,
      status: 'poor' as const,
    },
  },
  {
    serverName: 'api-sg-042',
    metrics: {
      bandwidth: 38,
      latency: 180,
      packetLoss: 3.5,
      uptime: 95.8,
      downloadSpeed: 280,
      uploadSpeed: 150,
      connections: 45,
      status: 'poor' as const,
    },
  },
  {
    serverName: 'api-jp-040',
    metrics: {
      bandwidth: 0,
      latency: 0,
      packetLoss: 100,
      uptime: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      connections: 0,
      status: 'offline' as const,
    },
  },
];

export default function ServerDashboard({
  onStatsUpdate,
}: ServerDashboardProps) {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('servers');

  const SERVERS_PER_PAGE = 4;

  // ✅ 실시간 훅: 10초(10,000ms) 주기로 새로고침
  const {
    servers = [],
    isLoading: isGenerating,
    refreshAll,
  } = useRealtimeServers({ refreshInterval: 10000 });

  // 🚀 디버깅 로그 추가
  console.log('📊 ServerDashboard 렌더링:', {
    serversCount: servers?.length,
    isClient,
    isLoading,
    error,
    searchTerm,
    currentPage,
    timestamp: new Date().toISOString(),
  });

  // 클라이언트 사이드 확인
  useEffect(() => {
    console.log('✅ ServerDashboard 클라이언트 설정');
    setIsClient(true);
  }, []);

  // 페이지네이션 상태 추가
  const [criticalPage, setCriticalPage] = useState(1);
  const [warningPage, setWarningPage] = useState(1);
  const [healthyPage, setHealthyPage] = useState(1);

  // 서버 데이터를 Server 타입으로 변환 및 정렬 (클라이언트에서만)
  const currentServers: Server[] = useMemo(() => {
    if (!isClient) {
      return [];
    }

    // 🔍 디버깅 정보 추가
    console.log('🔄 ServerDashboard 데이터 매핑:', {
      serversFromStore: servers.length,
      isClient,
      serversArray: servers,
      timestamp: new Date().toISOString(),
    });

    // ⚡ 개선: API 데이터 우선 사용, 더 안전한 타입 변환
    let baseServers: Server[];
    if (servers.length === 0) {
      console.warn('⚠️ API 서버 데이터가 없음 - fallback 데이터 사용');
      baseServers = [...fallbackServers];
    } else {
      baseServers = servers.map(server => {
        // 기존 매핑 로직 사용
        const serverData = server as any;
        const mapStatus = (
          status: string
        ): 'online' | 'offline' | 'warning' => {
          if (!status || typeof status !== 'string') return 'offline';
          const normalizedStatus = status.toLowerCase();
          if (
            normalizedStatus.includes('healthy') ||
            normalizedStatus.includes('online') ||
            normalizedStatus.includes('running')
          )
            return 'online';
          if (
            normalizedStatus.includes('warning') ||
            normalizedStatus.includes('degraded')
          )
            return 'warning';
          return 'offline';
        };

        return {
          id:
            serverData.id ||
            serverData.hostname ||
            `server-${Date.now()}-${Math.random()}`,
          name: serverData.name || serverData.hostname || 'Unknown Server',
          status: mapStatus(serverData.status || 'healthy'),
          location:
            serverData.location || serverData.environment || 'Seoul DC1',
          cpu: Math.round(
            serverData.cpu_usage ||
              serverData.cpu ||
              serverData.metrics?.cpu ||
              Math.random() * 50 + 20
          ),
          memory: Math.round(
            serverData.memory_usage ||
              serverData.memory ||
              serverData.metrics?.memory ||
              Math.random() * 60 + 30
          ),
          disk: Math.round(
            serverData.disk_usage ||
              serverData.disk ||
              serverData.metrics?.disk ||
              Math.random() * 40 + 10
          ),
          uptime:
            typeof serverData.uptime === 'string'
              ? serverData.uptime
              : `${Math.floor(Math.random() * 30 + 1)}일 ${Math.floor(Math.random() * 24)}시간`,
          lastUpdate: serverData.last_updated
            ? new Date(serverData.last_updated)
            : new Date(),
          alerts:
            serverData.alerts?.length ||
            (serverData.status === 'critical'
              ? 3
              : serverData.status === 'warning'
                ? 1
                : 0),
          services: serverData.services || [
            {
              name: 'nginx',
              status: serverData.status === 'critical' ? 'stopped' : 'running',
              port: 80,
            },
            { name: 'nodejs', status: 'running', port: 3000 },
            {
              name: 'gunicorn',
              status: serverData.status === 'critical' ? 'stopped' : 'running',
              port: 8000,
            },
          ],
        } as Server;
      });
    }

    // 🎯 심각 → 경고 → 정상 순으로 정렬
    const sortedServers = baseServers.sort((a, b) => {
      const statusPriority = { offline: 0, warning: 1, online: 2 };
      const priorityA = statusPriority[a.status] || 2;
      const priorityB = statusPriority[b.status] || 2;

      if (priorityA !== priorityB) {
        return priorityA - priorityB; // 심각(offline=0) → 경고(warning=1) → 정상(online=2)
      }

      // 같은 상태면 CPU 사용률 높은 순으로
      return b.cpu - a.cpu;
    });

    console.log(`✅ 서버 매핑 및 정렬 완료: ${sortedServers.length}개 서버`);
    return sortedServers;
  }, [servers, isClient]);

  // 서버 통계 계산 (useMemo로 최적화)
  const serverStats = useMemo(() => {
    // 🚀 안전한 배열 처리: currentServers가 배열인지 확인
    if (!Array.isArray(currentServers)) {
      console.warn(
        '⚠️ currentServers가 배열이 아닙니다:',
        typeof currentServers
      );
      return { total: 0, online: 0, warning: 0, offline: 0 };
    }

    return {
      total: currentServers.length,
      online: currentServers.filter((s: Server) => s?.status === 'online')
        .length,
      warning: currentServers.filter((s: Server) => s?.status === 'warning')
        .length,
      offline: currentServers.filter((s: Server) => s?.status === 'offline')
        .length,
    };
  }, [currentServers]);

  // 🔄 실제 데이터 로드 및 정렬 함수
  const loadRealData = useCallback(async () => {
    try {
      console.log('🚀 실제 서버 데이터 로드 시작');
      setIsLoading(true);
      setError(null);

      // API에서 실제 데이터 가져오기
      const response = await fetch('/api/servers?limit=20');
      if (!response.ok) {
        throw new Error(`서버 데이터 로드 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 서버 데이터 로드 완료:', data);

      // 🔄 기존 서버 데이터 스토어 새로고침
      await refreshAll();

      console.log(`✅ 실제 서버 데이터 적용 완료`);
    } catch (error) {
      console.error('❌ 실제 데이터 로드 실패:', error);
      setError(`실제 데이터 로드 실패: ${error}`);

      // 실패해도 기존 데이터 사용
      console.log('⚠️ API 로드 실패, 기존 데이터 사용');
    } finally {
      setIsLoading(false);
    }
  }, [refreshAll]);

  // 🔄 데이터 로드 실행 (실제 데이터 우선)
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (!mounted) return;

      console.log('🚀 ServerDashboard 데이터 초기화 시작');

      try {
        // 실제 데이터 로드 시도
        await loadRealData();
      } catch (error) {
        console.error('❌ 데이터 초기화 실패:', error);
      }
    };

    initializeData();

    // 🔄 실시간 업데이트 (30초마다)
    const interval = setInterval(() => {
      if (mounted) {
        console.log('🔄 서버 데이터 자동 업데이트');
        loadRealData();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [onStatsUpdate, loadRealData]);

  // ⭐ 서버 정렬 헬퍼 함수 (심각 → 경고 → 정상 순)
  const sortServersByPriority = (servers: Server[]): Server[] => {
    return servers.sort((a, b) => {
      const statusPriority = { offline: 0, warning: 1, online: 2 };
      const priorityA = statusPriority[a.status] || 2;
      const priorityB = statusPriority[b.status] || 2;

      if (priorityA !== priorityB) {
        return priorityA - priorityB; // 심각(offline=0) → 경고(warning=1) → 정상(online=2)
      }

      // 같은 상태면 CPU 사용률 높은 순으로
      return b.cpu - a.cpu;
    });
  };

  // 🔄 검색 및 정렬된 서버 목록
  const filteredAndSortedServers = useMemo(() => {
    let filtered = currentServers;

    // 검색 필터 적용
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        server =>
          server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          server.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          server.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 🎯 심각 → 경고 → 정상 순으로 정렬
    return sortServersByPriority(filtered);
  }, [currentServers, searchTerm]);

  // 서버 선택 핸들러
  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(
    (filteredAndSortedServers?.length || 0) / SERVERS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * SERVERS_PER_PAGE;
  const endIndex = startIndex + SERVERS_PER_PAGE;
  const paginatedServers = Array.isArray(filteredAndSortedServers)
    ? filteredAndSortedServers.slice(startIndex, endIndex)
    : [];

  // 페이지 변경 시 맨 위로 스크롤
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 🔧 서버 데이터 변경 시 현재 페이지가 유효하지 않으면 첫 페이지로 이동
  useEffect(() => {
    const totalPages = Math.ceil(
      (filteredAndSortedServers?.length || 0) / SERVERS_PER_PAGE
    );
    if (currentPage > totalPages && totalPages > 0) {
      console.log('📄 페이지 범위 초과, 첫 페이지로 이동:', {
        currentPage,
        totalPages,
      });
      setCurrentPage(1);
    }
  }, [filteredAndSortedServers, currentPage]);

  // 🔧 서버 데이터가 새로 로드될 때 첫 페이지로 리셋
  useEffect(() => {
    if (servers.length > 0 && currentPage > 1) {
      const newTotalPages = Math.ceil(servers.length / SERVERS_PER_PAGE);
      if (currentPage > newTotalPages) {
        console.log('📄 서버 데이터 새로고침으로 인한 페이지 리셋');
        setCurrentPage(1);
      }
    }
  }, [servers.length]);

  // 서버 상태별 그룹핑 (페이지네이션 적용)
  const groupedServers = useMemo(() => {
    // 🚀 안전한 배열 처리: paginatedServers가 배열인지 확인
    if (!Array.isArray(paginatedServers)) {
      return { critical: [], warning: [], healthy: [] };
    }

    const groups = {
      critical: paginatedServers.filter(s => s?.status === 'offline'),
      warning: paginatedServers.filter(s => s?.status === 'warning'),
      healthy: paginatedServers.filter(s => s?.status === 'online'),
    };
    return groups;
  }, [paginatedServers]);

  // 🎯 탭 렌더링 함수들
  const renderTabNavigation = () => (
    <div className='mb-6'>
      <div className='border-b border-gray-200'>
        <nav className='-mb-px flex space-x-8'>
          {[
            {
              id: 'servers',
              label: '서버',
              icon: ServerIcon,
              count: currentServers.length,
            },
            {
              id: 'network',
              label: '네트워크',
              icon: Network,
              count: networkMetrics.length,
            },
            { id: 'clusters', label: '클러스터', icon: Database, count: 3 },
            {
              id: 'applications',
              label: '애플리케이션',
              icon: BarChart3,
              count: 5,
            },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {tab.label}
                <span
                  className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs
                  ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }
                `}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  const renderNetworkTab = () => (
    <div className='space-y-6'>
      {/* 네트워크 개요 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Globe className='h-8 w-8 text-blue-500' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  평균 대역폭
                </dt>
                <dd className='text-lg font-medium text-gray-900'>
                  {Math.round(
                    networkMetrics.reduce(
                      (sum, n) => sum + n.metrics.bandwidth,
                      0
                    ) / networkMetrics.length
                  )}
                  %
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Activity className='h-8 w-8 text-green-500' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  평균 지연시간
                </dt>
                <dd className='text-lg font-medium text-gray-900'>
                  {Math.round(
                    networkMetrics.reduce(
                      (sum, n) => sum + n.metrics.latency,
                      0
                    ) / networkMetrics.length
                  )}
                  ms
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Wifi className='h-8 w-8 text-purple-500' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  활성 연결
                </dt>
                <dd className='text-lg font-medium text-gray-900'>
                  {networkMetrics.reduce(
                    (sum, n) => sum + n.metrics.connections,
                    0
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <CheckCircle className='h-8 w-8 text-emerald-500' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>
                  평균 가동률
                </dt>
                <dd className='text-lg font-medium text-gray-900'>
                  {(
                    networkMetrics.reduce(
                      (sum, n) => sum + n.metrics.uptime,
                      0
                    ) / networkMetrics.length
                  ).toFixed(1)}
                  %
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* 네트워크 모니터링 카드들 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {networkMetrics.map((network, index) => (
          <NetworkMonitoringCard
            key={network.serverName}
            serverName={network.serverName}
            metrics={network.metrics}
            className='h-full'
          />
        ))}
      </div>
    </div>
  );

  const renderClustersTab = () => (
    <div className='space-y-6'>
      <div className='text-center py-12'>
        <Database className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>
          클러스터 관리
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          서버 클러스터 모니터링 기능이 곧 추가됩니다.
        </p>
      </div>
    </div>
  );

  const renderApplicationsTab = () => (
    <div className='space-y-6'>
      <div className='text-center py-12'>
        <BarChart3 className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>
          애플리케이션 모니터링
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          애플리케이션 성능 모니터링 기능이 곧 추가됩니다.
        </p>
      </div>
    </div>
  );

  // 서버가 없는 경우만 로딩 표시 (초기 데이터는 항상 있음)
  if (currentServers.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            서버 연결 중
          </h3>
          <p className='text-gray-600'>
            모니터링 시스템을 초기화하고 있습니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 탭 네비게이션 */}
      {renderTabNavigation()}

      {/* 탭 콘텐츠 */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'servers' && (
            <div>
              {/* 서버 사이드 렌더링 시 기본 UI 반환 */}
              {!isClient && (
                <div className='flex items-center justify-center h-64'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      서버 연결 중
                    </h3>
                    <p className='text-gray-600'>
                      모니터링 시스템을 초기화하고 있습니다...
                    </p>
                  </div>
                </div>
              )}

              {/* 서버가 없는 경우만 로딩 표시 (초기 데이터는 항상 있음) */}
              {isClient && currentServers.length === 0 && (
                <div className='flex items-center justify-center h-64'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      서버 연결 중
                    </h3>
                    <p className='text-gray-600'>
                      모니터링 시스템을 초기화하고 있습니다...
                    </p>
                  </div>
                </div>
              )}

              {/* 서버 카드 그리드 - 심각→경고→정상 순으로 4x4 배치 */}
              {isClient && currentServers.length > 0 && (
                <div className='space-y-6'>
                  {/* 위험 상태 서버들 */}
                  {currentServers.filter(s => s.status === 'offline').length >
                    0 && (
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-red-600 flex items-center gap-2'>
                          <span className='w-3 h-3 bg-red-500 rounded-full'></span>
                          위험 상태 (
                          {
                            currentServers.filter(s => s.status === 'offline')
                              .length
                          }
                          )
                        </h3>
                      </div>

                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                        {currentServers
                          .filter(s => s.status === 'offline')
                          .map((server, index) => (
                            <EnhancedServerCard
                              key={server.id}
                              server={{
                                ...server,
                                hostname: server.name,
                                type: 'api_server',
                                environment: 'production',
                                provider: 'AWS',
                                status: 'critical' as any,
                                network:
                                  server.network ||
                                  Math.floor(Math.random() * 40) + 60,
                                networkStatus:
                                  server.networkStatus || 'offline',
                                specs: {
                                  cpu_cores: 8,
                                  memory_gb: 16,
                                  disk_gb: 500,
                                  network_speed: '1Gbps',
                                },
                                ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
                                os: 'Ubuntu 22.04 LTS',
                              }}
                              index={index}
                              onClick={() => handleServerSelect(server)}
                              showMiniCharts={true}
                              variant='compact'
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 경고 상태 서버들 */}
                  {currentServers.filter(s => s.status === 'warning').length >
                    0 && (
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-yellow-600 flex items-center gap-2'>
                          <span className='w-3 h-3 bg-yellow-500 rounded-full'></span>
                          주의 상태 (
                          {
                            currentServers.filter(s => s.status === 'warning')
                              .length
                          }
                          )
                        </h3>
                      </div>

                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                        {currentServers
                          .filter(s => s.status === 'warning')
                          .map((server, index) => (
                            <EnhancedServerCard
                              key={server.id}
                              server={{
                                ...server,
                                hostname: server.name,
                                type: 'web_server',
                                environment: 'production',
                                provider: 'AWS',
                                status: 'warning' as any,
                                network:
                                  server.network ||
                                  Math.floor(Math.random() * 30) + 40,
                                networkStatus: server.networkStatus || 'poor',
                                specs: {
                                  cpu_cores: 6,
                                  memory_gb: 12,
                                  disk_gb: 250,
                                  network_speed: '500Mbps',
                                },
                                ip: `10.0.1.${Math.floor(Math.random() * 254) + 1}`,
                                os: 'CentOS 8',
                              }}
                              index={index}
                              onClick={() => handleServerSelect(server)}
                              showMiniCharts={true}
                              variant='compact'
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 정상 상태 서버들 */}
                  {currentServers.filter(s => s.status === 'online').length >
                    0 && (
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-green-600 flex items-center gap-2'>
                          <span className='w-3 h-3 bg-green-500 rounded-full'></span>
                          정상 상태 (
                          {
                            currentServers.filter(s => s.status === 'online')
                              .length
                          }
                          )
                        </h3>
                      </div>

                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                        {currentServers
                          .filter(s => s.status === 'online')
                          .map((server, index) => (
                            <EnhancedServerCard
                              key={server.id}
                              server={{
                                ...server,
                                hostname: server.name,
                                type: 'database_server',
                                environment: 'production',
                                provider: 'AWS',
                                status: 'healthy' as any,
                                network:
                                  server.network ||
                                  Math.floor(Math.random() * 20) + 20,
                                networkStatus:
                                  server.networkStatus || 'excellent',
                                specs: {
                                  cpu_cores: 4,
                                  memory_gb: 8,
                                  disk_gb: 100,
                                  network_speed: '100Mbps',
                                },
                                ip: `172.16.0.${Math.floor(Math.random() * 254) + 1}`,
                                os: 'RHEL 9',
                              }}
                              index={index}
                              onClick={() => handleServerSelect(server)}
                              showMiniCharts={true}
                              variant='compact'
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 서버가 없는 경우 */}
              {filteredAndSortedServers.length === 0 && !isLoading && (
                <div className='text-center py-12'>
                  <div className='mx-auto h-12 w-12 text-gray-400'>
                    <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>
                    서버가 없습니다
                  </h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    {searchTerm
                      ? '검색 조건에 맞는 서버가 없습니다.'
                      : '등록된 서버가 없습니다.'}
                  </p>
                </div>
              )}

              {/* 현재 페이지에 서버가 없는 경우 (전체 서버는 있지만 현재 페이지가 비어있음) */}
              {filteredAndSortedServers.length > 0 &&
                paginatedServers.length === 0 &&
                !isLoading && (
                  <div className='text-center py-12'>
                    <div className='mx-auto h-12 w-12 text-gray-400'>
                      <svg
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                    </div>
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>
                      이 페이지에는 서버가 없습니다
                    </h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      다른 페이지를 확인하거나 첫 페이지로 이동해보세요.
                    </p>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className='mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                    >
                      첫 페이지로 이동
                    </button>
                  </div>
                )}
            </div>
          )}

          {activeTab === 'network' && renderNetworkTab()}
          {activeTab === 'clusters' && renderClustersTab()}
          {activeTab === 'applications' && renderApplicationsTab()}
        </motion.div>
      </AnimatePresence>

      {/* 서버 상세 모달 */}
      {selectedServer && (
        <EnhancedServerModal
          server={{
            ...selectedServer,
            hostname: selectedServer.name,
            type: 'api_server',
            environment: 'production',
            provider: 'AWS',
            status:
              selectedServer.status === 'online'
                ? 'healthy'
                : selectedServer.status === 'warning'
                  ? 'warning'
                  : 'critical',
            network:
              selectedServer.network || Math.floor(Math.random() * 40) + 30,
            networkStatus: selectedServer.networkStatus || 'good',
            specs: {
              cpu_cores: 8,
              memory_gb: 16,
              disk_gb: 500,
              network_speed: '1Gbps',
            },
            ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
            os: 'Ubuntu 22.04 LTS',
          }}
          onClose={() => setSelectedServer(null)}
        />
      )}
    </div>
  );
}
