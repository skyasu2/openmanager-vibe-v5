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
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  MoreVertical,
  X,
} from 'lucide-react';
import ServerDetailModal from './ServerDetailModal';
import EnhancedServerCard from './EnhancedServerCard';
import EnhancedServerModal from './EnhancedServerModal';
import NetworkMonitoringCard from './NetworkMonitoringCard';
import { Server } from '../../types/server';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';
import { timerManager } from '../../utils/TimerManager';
import { motion, AnimatePresence } from 'framer-motion';
import CollapsibleCard from '@/components/shared/CollapsibleCard';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';
import { useDebounce } from '@/utils/performance';
import { usePerformanceOptimization } from '@/utils/performance';
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
  const { sections, toggleSection } = useDashboardToggleStore();
  const { renderCount, measureRender } = usePerformanceOptimization('ServerDashboard');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('servers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'warning' | 'offline'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // ✅ 페이지네이션 설정: API 데이터와 일치하도록 30개로 설정
  // 8개씩 나누면 데이터 불일치와 빠른 갱신 문제 발생
  const SERVERS_PER_PAGE = 30; // API에서 제공하는 전체 서버 수와 일치 // API에서 제공하는 전체 서버 수와 일치

  // 🎯 동적 페이지 크기 조정 (서버 수에 따라 자동 조정)
  const dynamicPageSize = useMemo(() => {
    const totalServers = servers.length;
    if (totalServers <= 12) return totalServers; // 12개 이하면 전체 표시
    if (totalServers <= 24) return 12; // 24개 이하면 12개씩
    return 30; // 그 외에는 30개씩
  }, [servers.length]);

  // ✅ 실시간 훅: 30초 주기로 새로고침 (데이터생성기와 동기화, 안정성 향상)
  const {
    servers: realtimeServers,
    loading: realtimeLoading,
    error: realtimeError,
    lastUpdated: realtimeLastUpdated,
    refreshServers,
  } = useRealtimeServers({
    refreshInterval: 30000, // 30초 주기로 통일
    enableAutoRefresh: true,
  });

  // 🎯 검색어 디바운싱 (500ms 지연)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 🎯 대시보드 토글 상태
  const { isCollapsed } = useDashboardToggleStore();

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
      await refreshServers();

      console.log(`✅ 실제 서버 데이터 적용 완료`);
    } catch (error) {
      console.error('❌ 실제 데이터 로드 실패:', error);
      setError(`실제 데이터 로드 실패: ${error}`);

      // 실패해도 기존 데이터 사용
      console.log('⚠️ API 로드 실패, 기존 데이터 사용');
    } finally {
      setIsLoading(false);
    }
  }, [refreshServers]);

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

    // ✅ 중복 폴링 제거: useRealtimeServers 훅이 이미 30초 주기로 폴링하므로 추가 타이머 불필요
    // 기존 120초 타이머 제거로 성능 향상 및 안정성 확보

    return () => {
      mounted = false;
      // 추가 타이머 없으므로 정리할 것 없음
    };
  }, [onStatsUpdate, loadRealData]);

  // ✅ 서버 정렬 로직 메모이제이션
  const sortServersByPriority = useCallback((servers: Server[]): Server[] => {
    const statusPriority = {
      offline: 4,
      critical: 3,
      warning: 2,
      healthy: 1,
    };

    return [...servers].sort((a, b) => {
      // 1순위: 상태별 우선순위
      const statusDiff = (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      if (statusDiff !== 0) return statusDiff;

      // 2순위: 알림 개수
      const alertDiff = (b.alerts || 0) - (a.alerts || 0);
      if (alertDiff !== 0) return alertDiff;

      // 3순위: CPU 사용률 (높은 순)
      const cpuDiff = (b.cpu || 0) - (a.cpu || 0);
      if (cpuDiff !== 0) return cpuDiff;

      // 4순위: 메모리 사용률 (높은 순)
      return (b.memory || 0) - (a.memory || 0);
    });
  }, []);

  // ✅ 필터링된 서버 목록 메모이제이션 (디바운싱된 검색어 사용)
  const filteredServers = useMemo(() => {
    let filtered = servers;

    // 검색 필터링 (디바운싱된 검색어 사용)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (server) =>
          server.name.toLowerCase().includes(searchLower) ||
          server.location.toLowerCase().includes(searchLower) ||
          server.type?.toLowerCase().includes(searchLower) ||
          server.environment?.toLowerCase().includes(searchLower)
      );
    }

    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter((server) => server.status === filterStatus);
    }

    // 정렬 적용
    if (sortBy === 'priority') {
      filtered = sortServersByPriority(filtered);
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'location') {
      filtered = [...filtered].sort((a, b) => a.location.localeCompare(b.location));
    } else if (sortBy === 'cpu') {
      filtered = [...filtered].sort((a, b) => (b.cpu || 0) - (a.cpu || 0));
    } else if (sortBy === 'memory') {
      filtered = [...filtered].sort((a, b) => (b.memory || 0) - (a.memory || 0));
    }

    return filtered;
  }, [servers, debouncedSearchTerm, filterStatus, sortBy, sortServersByPriority]);

  // ✅ 이벤트 핸들러 메모이제이션
  const handleServerSelect = useCallback((server: Server) => {
    setSelectedServer(server);
    setIsEnhancedModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshServers();
    } catch (error) {
      console.error('서버 새로고침 실패:', error);
    }
  }, [refreshServers]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  }, []);

  const handleFilterChange = useCallback((status: string) => {
    setFilterStatus(status);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  }, []);

  // ✅ 페이지네이션 간소화: 모든 서버를 한 번에 표시 (페이지네이션 문제 해결)
  const totalPages = 1; // 항상 1페이지로 고정
  const startIndex = 0;
  const endIndex = filteredServers.length;
  const paginatedServers = Array.isArray(filteredServers)
    ? filteredServers // 전체 서버 표시
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
                  ${isActive
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
                  ${isActive
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

  // ✅ 성능 측정을 위한 디버그 정보 출력
  useEffect(() => {
    console.log(`🚀 ServerDashboard 렌더링 횟수: ${renderCount}`);
    console.log(`📊 필터링된 서버 수: ${filteredServers.length}`);
    console.log(`🔍 검색어: "${debouncedSearchTerm}" (디바운싱됨)`);
  }, [renderCount, filteredServers.length, debouncedSearchTerm]);

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

              {/* 검색 및 필터 */}
              {isClient && currentServers.length > 0 && (
                <div className='mb-6'>
                  <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
                    {/* 검색 및 뷰 모드 컨트롤 */}
                    <div className='flex gap-3 items-center'>
                      <div className='relative'>
                        <input
                          aria-label='입력'
                          type='text'
                          placeholder='서버 이름 또는 위치 검색...'
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className='w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                        <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                      </div>

                      {/* 상태 필터 */}
                      <select
                        value={filterStatus}
                        onChange={e => handleFilterChange(e.target.value)}
                        className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                      >
                        <option value='all'>모든 상태</option>
                        <option value='online'>정상</option>
                        <option value='warning'>경고</option>
                        <option value='offline'>위험</option>
                      </select>

                      {/* 위치 필터 */}
                      <select
                        value={locationFilter}
                        onChange={e => setLocationFilter(e.target.value)}
                        className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                      >
                        <option value='all'>모든 위치</option>
                        {Array.from(new Set(currentServers.map(s => s.location))).map(location => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>

                      {/* 필터 리셋 버튼 */}
                      {(searchTerm || filterStatus !== 'all' || locationFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('all');
                            setLocationFilter('all');
                          }}
                          className='px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50'
                        >
                          필터 리셋
                        </button>
                      )}

                      {/* 뷰 모드 토글 */}
                      <div className='flex items-center gap-2 bg-gray-100 rounded-lg p-1'>
                        <button
                          onClick={() =>
                            setViewMode(prev =>
                              prev === 'grid' ? 'list' : 'grid'
                            )
                          }
                          className='px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300'
                        >
                          {viewMode === 'grid' ? (
                            <LayoutGrid className='h-4 w-4' />
                          ) : (
                            <List className='h-4 w-4' />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ 서버 정보 표시 (페이지네이션 제거) */}
              {filteredServers.length > 0 && (
                <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg'>
                  <div className='text-sm text-gray-600'>
                    전체{' '}
                    <span className='font-semibold text-gray-900'>
                      {filteredServers.length}
                    </span>
                    개 서버 표시 중
                  </div>
                  <div className='flex items-center gap-2 text-xs'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-gray-500'>
                      전체 서버 표시 (페이지네이션 비활성화)
                    </span>
                  </div>
                </div>
              )}

              {/* ✅ 모든 서버 카드 표시 (그리드 형태) */}
              {paginatedServers.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6'>
                  {paginatedServers.map((server, index) => (
                    <EnhancedServerCard
                      key={server.id}
                      server={{
                        ...server,
                        hostname: server.name,
                        type: 'api_server',
                        environment: 'production',
                        provider: 'AWS',
                        status: server.status === 'online' ? 'healthy' : server.status === 'warning' ? 'warning' : 'critical',
                        network: server.network || Math.floor(Math.random() * 40) + 30,
                        networkStatus: server.networkStatus || 'good',
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
              )}

              {/* 서버가 없는 경우 */}
              {filteredServers.length === 0 && !isLoading && (
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
