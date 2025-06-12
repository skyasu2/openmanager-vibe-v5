'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, LayoutGrid, List, ChevronDown } from 'lucide-react';
import ServerCard from './ServerCard';
import ServerDetailModal from './ServerDetailModal';
import EnhancedServerCard from './EnhancedServerCard';
import EnhancedServerModal from './EnhancedServerModal';
import { Server } from '../../types/server';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';
import { timerManager } from '../../utils/TimerManager';
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
    id: 'api-eu-045',
    name: 'api-eu-045',
    status: 'warning',
    location: 'EU West',
    cpu: 48,
    memory: 29.2,
    disk: 15.6,
    uptime: '8일 12시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'running', port: 80 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },
  {
    id: 'api-jp-040',
    name: 'api-jp-040',
    status: 'offline',
    location: 'Asia Pacific',
    cpu: 19,
    memory: 53.2,
    disk: 29.6,
    uptime: '3일 4시간',
    lastUpdate: new Date(),
    alerts: 3,
    services: [
      { name: 'nginx', status: 'stopped', port: 80 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'gunicorn', status: 'running', port: 8000 },
      { name: 'uwsgi', status: 'stopped', port: 8080 },
    ],
  },
  {
    id: 'api-sg-042',
    name: 'api-sg-042',
    status: 'warning',
    location: 'Singapore',
    cpu: 37,
    memory: 41.2,
    disk: 19.6,
    uptime: '8일 6시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'gunicorn', status: 'stopped', port: 8000 },
      { name: 'python', status: 'stopped', port: 3000 },
      { name: 'uwsgi', status: 'running', port: 8080 },
    ],
  },
  {
    id: 'api-sg-044',
    name: 'api-sg-044',
    status: 'offline',
    location: 'Singapore',
    cpu: 35,
    memory: 30.2,
    disk: 26.6,
    uptime: '0분',
    lastUpdate: new Date(),
    alerts: 3,
    services: [
      { name: 'nodejs', status: 'stopped', port: 3000 },
      { name: 'nginx', status: 'running', port: 80 },
    ],
  },
  {
    id: 'api-us-039',
    name: 'api-us-039',
    status: 'warning',
    location: 'US East',
    cpu: 30,
    memory: 35.2,
    disk: 5.6,
    uptime: '45일 18시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'uwsgi', status: 'stopped', port: 8080 },
      { name: 'gunicorn', status: 'running', port: 8000 },
    ],
  },
  {
    id: 'api-us-041',
    name: 'api-us-041',
    status: 'online',
    location: 'US East',
    cpu: 59,
    memory: 48.2,
    disk: 30.6,
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
    id: 'app-eu-025',
    name: 'app-eu-025',
    status: 'warning',
    location: 'EU West',
    cpu: 14.4,
    memory: 44.5,
    disk: 27.8,
    uptime: '18일 12시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'tomcat', status: 'stopped', port: 8080 },
      { name: 'nodejs', status: 'running', port: 3000 },
    ],
  },
  {
    id: 'app-jp-020',
    name: 'app-jp-020',
    status: 'warning',
    location: 'Asia Pacific',
    cpu: 55.4,
    memory: 22.5,
    disk: 28.8,
    uptime: '9일 6시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'supervisor', status: 'running', port: 9001 },
      { name: 'tomcat', status: 'running', port: 8080 },
      { name: 'nodejs', status: 'running', port: 3000 },
      { name: 'pm2', status: 'stopped', port: 0 },
    ],
  },
  {
    id: 'app-jp-022',
    name: 'app-jp-022',
    status: 'online',
    location: 'Asia Pacific',
    cpu: 17.4,
    memory: 58.5,
    disk: 25.8,
    uptime: '31일 2시간',
    lastUpdate: new Date(),
    alerts: 0,
    services: [
      { name: 'docker', status: 'running', port: 2375 },
      { name: 'pm2', status: 'running', port: 0 },
      { name: 'supervisor', status: 'running', port: 9001 },
      { name: 'nodejs', status: 'running', port: 3000 },
    ],
  },
];

export default function ServerDashboard({
  onStatsUpdate,
}: ServerDashboardProps) {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [realServerData, setRealServerData] = useState<{
    servers: ServerInstance[];
    clusters: ServerCluster[];
    applications: ApplicationMetrics[];
  }>({ servers: [], clusters: [], applications: [] });
  const [aiQuery, setAiQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ API 기반 서버 데이터 스토어 사용
  const {
    servers = [],
    isLoading: isGenerating,
    refreshAll,
  } = useRealtimeServers();

  // 🚀 동적 페이지네이션: 오토스케일링에 맞춰 조정
  const SERVERS_PER_PAGE = useMemo(() => {
    const serverCount = servers?.length || 0;

    // 서버 수에 따른 동적 페이지 크기 결정
    if (serverCount <= 12) return serverCount; // 12개 이하면 모두 표시
    if (serverCount <= 20) return 10; // 20개 이하면 10개씩
    if (serverCount <= 30) return 15; // 30개 이하면 15개씩
    return 20; // 30개 초과시 20개씩
  }, [servers?.length]);

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

  // 서버 사이드 렌더링 시 기본 UI 반환
  if (!isClient) {
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
      {/* AI 쿼리 인터페이스 */}
      {realServerData.servers.length > 0 && (
        <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
          <h3 className='text-sm font-medium text-blue-900 mb-2'>
            🤖 AI 시스템 분석
          </h3>
          <div className='flex gap-2'>
            <input
              aria-label='입력'
              type='text'
              placeholder='예: CPU 사용률이 높은 서버를 찾아주세요'
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              className='flex-1 px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              onKeyPress={async e => {
                if (e.key === 'Enter' && aiQuery.trim()) {
                  try {
                    // ✅ API 호출로 변경
                    const response = await fetch('/api/ai/korean', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        query: aiQuery,
                        context: realServerData,
                      }),
                    });
                    const result = await response.json();
                    console.log('AI 분석 결과:', result);
                    alert(`AI 분석: ${result.message || '분석 완료'}`);
                  } catch (error) {
                    console.error('AI 쿼리 처리 오류:', error);
                    alert('AI 분석 중 오류가 발생했습니다.');
                  }
                }
              }}
            />
            <button
              onClick={async () => {
                if (aiQuery.trim()) {
                  try {
                    // ✅ API 호출로 변경
                    const response = await fetch('/api/ai/korean', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        query: aiQuery,
                        context: realServerData,
                      }),
                    });
                    const result = await response.json();
                    console.log('AI 분석 결과:', result);
                    alert(`AI 분석: ${result.message || '분석 완료'}`);
                  } catch (error) {
                    console.error('AI 쿼리 처리 오류:', error);
                    alert('AI 분석 중 오류가 발생했습니다.');
                  }
                }
              }}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              분석
            </button>
          </div>
          <div className='mt-2 text-xs text-blue-700'>
            실제 서버 데이터: {realServerData.servers.length}대 서버,{' '}
            {realServerData.clusters.length}개 클러스터
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
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
                onChange={e => setSearchTerm(e.target.value)}
                className='w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
              <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
            </div>

            {/* 뷰 모드 토글 */}
            <div className='flex items-center gap-2 bg-gray-100 rounded-lg p-1'>
              <button
                onClick={() =>
                  setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'))
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

      {/* 페이지네이션 정보 및 컨트롤 */}
      {filteredAndSortedServers.length > 0 && (
        <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg'>
          <div className='text-sm text-gray-600'>
            전체{' '}
            <span className='font-semibold text-gray-900'>
              {filteredAndSortedServers.length}
            </span>
            개 서버 중
            <span className='font-semibold text-blue-600 mx-1'>
              {startIndex + 1}-
              {Math.min(endIndex, filteredAndSortedServers.length)}
            </span>
            개 표시
          </div>
          <div className='flex items-center gap-2 text-xs'>
            <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
            <span className='text-gray-500'>
              동적 페이지네이션: {SERVERS_PER_PAGE}개씩 표시
              {filteredAndSortedServers.length <= 12 ? '(전체 표시)' : ''}
            </span>
          </div>
        </div>
      )}

      {/* 서버 상태별 섹션 */}
      {groupedServers.critical.length > 0 && (
        <div className='space-y-3'>
          <h3 className='text-lg font-semibold text-red-600 flex items-center gap-2'>
            <span className='w-3 h-3 bg-red-500 rounded-full'></span>
            위험 상태 ({groupedServers.critical.length})
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {groupedServers.critical.map((server, index) => (
              <EnhancedServerCard
                key={server.id}
                server={{
                  ...server,
                  hostname: server.name,
                  type: 'api_server',
                  environment: 'production',
                  provider: 'AWS',
                  status: 'critical' as any,
                  network: Math.floor(Math.random() * 40) + 60, // 네트워크 사용률 60-100%
                  networkStatus: Math.random() > 0.7 ? 'poor' : 'offline',
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
              />
            ))}
          </div>
        </div>
      )}

      {groupedServers.warning.length > 0 && (
        <div className='space-y-3'>
          <h3 className='text-lg font-semibold text-yellow-600 flex items-center gap-2'>
            <span className='w-3 h-3 bg-yellow-500 rounded-full'></span>
            주의 상태 ({groupedServers.warning.length})
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {groupedServers.warning.map((server, index) => (
              <EnhancedServerCard
                key={server.id}
                server={{
                  ...server,
                  hostname: server.name,
                  type: 'web_server',
                  environment: 'production',
                  provider: 'AWS',
                  status: 'warning' as any,
                  network: Math.floor(Math.random() * 30) + 40, // 네트워크 사용률 40-70%
                  networkStatus: Math.random() > 0.5 ? 'good' : 'poor',
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
              />
            ))}
          </div>
        </div>
      )}

      {groupedServers.healthy.length > 0 && (
        <div className='space-y-3'>
          <h3 className='text-lg font-semibold text-green-600 flex items-center gap-2'>
            <span className='w-3 h-3 bg-green-500 rounded-full'></span>
            정상 상태 ({groupedServers.healthy.length})
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {groupedServers.healthy.map((server, index) => (
              <EnhancedServerCard
                key={server.id}
                server={{
                  ...server,
                  hostname: server.name,
                  type: 'database_server',
                  environment: 'production',
                  provider: 'AWS',
                  status: 'healthy' as any,
                  network: Math.floor(Math.random() * 25) + 15, // 네트워크 사용률 15-40%
                  networkStatus: Math.random() > 0.3 ? 'excellent' : 'good',
                  specs: {
                    cpu_cores: 4,
                    memory_gb: 8,
                    disk_gb: 100,
                    network_speed: '10Gbps',
                  },
                  ip: `172.16.0.${Math.floor(Math.random() * 254) + 1}`,
                  os: 'RHEL 9',
                }}
                index={index}
                onClick={() => handleServerSelect(server)}
                showMiniCharts={true}
              />
            ))}
          </div>
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
              <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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

      {/* 서버 상세 모달 */}
      <EnhancedServerModal
        server={
          selectedServer
            ? {
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
                network: Math.floor(Math.random() * 50) + 25,
                networkStatus:
                  selectedServer.status === 'online'
                    ? ('excellent' as const)
                    : selectedServer.status === 'warning'
                      ? ('good' as const)
                      : ('poor' as const),
                specs: {
                  cpu_cores: 8,
                  memory_gb: 16,
                  disk_gb: 500,
                  network_speed: '1Gbps',
                },
                ip: `192.168.100.${Math.floor(Math.random() * 254) + 1}`,
                os: 'Ubuntu 22.04 LTS',
              }
            : null
        }
        onClose={() => setSelectedServer(null)}
      />
    </div>
  );
}
