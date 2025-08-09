'use client';

/**
 * 🚀 Enhanced Server Detail Modal v5.0 - Modular Architecture
 *
 * 완전히 모듈화된 현대적 서버 상세 모달:
 * - 모듈화된 아키텍처로 유지보수성 향상
 * - 8개 전문 모듈로 분리 (types, utils, components, 5개 탭)
 * - 직관적인 탭 네비게이션
 * - 상태별 색상 시스템
 * - 부드러운 애니메이션
 * - 반응형 레이아웃
 * - 실시간 데이터 시각화
 */

import { calculateOptimalCollectionInterval } from '@/config/serverConfig';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  FileText,
  Network,
  Pause,
  Play,
  Server as ServerIcon,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { ServerModal3DGauge } from '../shared/UnifiedCircularGauge';

// 모듈화된 컴포넌트 및 타입 임포트
import type {
  EnhancedServerModalProps,
  ServerData,
  RealtimeData,
  TabId,
  TabInfo,
} from './EnhancedServerModal.types';
import { getMetricColorByStatus, getStatusTheme } from './EnhancedServerModal.utils';
import { RealtimeChart } from './EnhancedServerModal.components';
import { OverviewTab } from './EnhancedServerModal.OverviewTab';
import { MetricsTab } from './EnhancedServerModal.MetricsTab';
import { ProcessesTab } from './EnhancedServerModal.ProcessesTab';
import { LogsTab } from './EnhancedServerModal.LogsTab';
import { NetworkTab } from './EnhancedServerModal.NetworkTab';

// framer-motion을 동적 import로 처리
const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.button })),
  { ssr: false }
);
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);
const AnimatePresence = dynamic(
  () =>
    import('framer-motion').then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

export default function EnhancedServerModal({
  server,
  onClose,
}: EnhancedServerModalProps) {
  // 🎯 React Hooks는 항상 최상단에서 호출
  const [selectedTab, setSelectedTab] = useState<TabId>('overview');
  const [isRealtime, setIsRealtime] = useState(true);
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    cpu: [],
    memory: [],
    disk: [],
    network: [],
    latency: [],
    processes: [],
    logs: [],
  });

  // 🛡️ 서버 데이터 안전성 검증 및 기본값 설정
  const safeServer = useMemo((): ServerData | null =>
    server
      ? {
          id: server.id || 'unknown',
          hostname: server.hostname || 'unknown.local',
          name: server.name || 'Unknown Server',
          type: server.type || 'unknown',
          environment: server.environment || 'unknown',
          location: server.location || 'Unknown Location',
          provider: server.provider || 'Unknown Provider',
          status: server.status || 'offline',
          cpu: typeof server.cpu === 'number' ? server.cpu : 0,
          memory: typeof server.memory === 'number' ? server.memory : 0,
          disk: typeof server.disk === 'number' ? server.disk : 0,
          network: typeof server.network === 'number' ? server.network : 0,
          uptime: server.uptime || '0h 0m',
          lastUpdate: server.lastUpdate || new Date(),
          alerts: typeof server.alerts === 'number' ? server.alerts : 0,
          services: Array.isArray(server.services) ? server.services : [],
          specs: server.specs || { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
          os: server.os || 'Unknown OS',
          ip: server.ip || '0.0.0.0',
          networkStatus: server.networkStatus || 'offline',
          health: server.health || { score: 0, trend: [] },
          alertsSummary: server.alertsSummary || {
            total: 0,
            critical: 0,
            warning: 0,
          },
        }
      : null,
    [server]
  );

  // 실시간 데이터 생성
  useEffect(() => {
    if (!safeServer || !isRealtime) return;

    const generateRealtimeData = () => {
      try {
        const now = new Date();
        setRealtimeData((prev) => ({
          cpu: [
            ...prev.cpu.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±10 → ±3
            safeServer.cpu + (Math.random() - 0.5) * 3,
          ].slice(-30),
          memory: [
            ...prev.memory.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±8 → ±2
            safeServer.memory + (Math.random() - 0.5) * 2,
          ].slice(-30),
          disk: [
            ...prev.disk.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±3 → ±1
            safeServer.disk + (Math.random() - 0.5) * 1,
          ].slice(-30),
          network: [
            ...prev.network.slice(-29),
            {
              in: Math.random() * 200 + 400,
              out: Math.random() * 150 + 250,
            },
          ].slice(-30),
          latency: [...prev.latency.slice(-29), Math.random() * 20 + 45].slice(
            -30
          ),
          processes:
            safeServer.services?.map((service, i) => ({
              name: service.name || `service-${i}`,
              cpu: parseFloat((Math.random() * 8).toFixed(2)),
              memory: parseFloat((Math.random() * 6).toFixed(2)),
              pid: 1000 + i,
            })) || [],
          logs: [
            ...prev.logs.slice(-19),
            {
              timestamp: now.toISOString(),
              level: ['info', 'warn', 'error'][
                Math.floor(Math.random() * 3)
              ] as 'info' | 'warn' | 'error',
              message: [
                `${safeServer.name} - HTTP request processed successfully`,
                `${safeServer.name} - Memory usage above threshold`,
                `${safeServer.name} - Database connection established`,
                `${safeServer.name} - Cache invalidated`,
                `${safeServer.name} - Backup completed`,
                `${safeServer.name} - SSL certificate renewed`,
              ][Math.floor(Math.random() * 6)],
              source:
                safeServer.services?.[
                  Math.floor(Math.random() * safeServer.services.length)
                ]?.name || safeServer.name,
            },
          ].slice(-20),
        }));
      } catch (error) {
        console.error(
          '⚠️ [EnhancedServerModal] 실시간 데이터 생성 오류:',
          error
        );
        // 오류 발생 시 기본 데이터로 설정
        setRealtimeData((prev) => ({
          ...prev,
          logs: [
            ...prev.logs.slice(-19),
            {
              timestamp: new Date().toISOString(),
              level: 'warn' as 'info' | 'warn' | 'error',
              message: `${safeServer.name} - 데이터 생성 오류 발생`,
              source: safeServer.name,
            },
          ].slice(-20),
        }));
      }
    };

    generateRealtimeData();
    // 🎯 데이터 수집 간격과 완전 동기화
    // 서버 카드, 실시간 훅과 모두 동기화하여 일관된 업데이트 제공
    // 🚨 무료 티어 절약: 실시간 데이터 생성 간격 5-10분
    const interval = setInterval(
      generateRealtimeData,
      calculateOptimalCollectionInterval()
    );

    return () => clearInterval(interval);
  }, [safeServer, isRealtime]);

  // 탭 설정
  const tabs: TabInfo[] = [
    { id: 'overview', label: '개요', icon: Activity },
    { id: 'metrics', label: '메트릭', icon: BarChart3 },
    { id: 'processes', label: '프로세스', icon: Cpu },
    { id: 'logs', label: '로그', icon: FileText },
    { id: 'network', label: '네트워크', icon: Network },
  ];


  if (!safeServer) {
    console.warn('⚠️ [EnhancedServerModal] 서버 데이터가 없습니다.');
    // 모달을 닫지 않고 오류 상태를 표시
    return (
      <AnimatePresence>
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-xl bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-4xl text-red-500">⚠️</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              서버 데이터 오류
            </h3>
            <p className="mb-4 text-gray-600">
              서버 정보를 불러올 수 없습니다.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              닫기
            </button>
          </MotionDiv>
        </MotionDiv>
      </AnimatePresence>
    );
  }

  // 상태별 색상 테마 가져오기
  const statusTheme = getStatusTheme(safeServer?.status);

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <MotionDiv
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 - 상태별 색상 적용 */}
          <div className={`bg-gradient-to-r ${statusTheme.gradient} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MotionDiv
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl bg-white/25 p-3 backdrop-blur-sm shadow-lg"
                >
                  <ServerIcon className="h-7 w-7 text-white" />
                </MotionDiv>
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold">
                    <span className="drop-shadow-sm">{safeServer.name}</span>
                    <span className="text-3xl">{statusTheme.icon}</span>
                    {safeServer.health?.score !== undefined && (
                      <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="rounded-lg bg-white/30 px-3 py-1 text-sm font-bold backdrop-blur-sm"
                      >
                        점수: {Math.round(safeServer.health.score)}%
                      </MotionDiv>
                    )}
                  </h2>
                  <p className="flex items-center gap-3 text-white/90 mt-1">
                    <span className="font-medium">{safeServer.type}</span>
                    <span>•</span>
                    <span>{safeServer.location}</span>
                    {safeServer.alertsSummary?.total ? (
                      <MotionDiv
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/30 px-3 py-1 text-xs font-bold backdrop-blur-sm"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {safeServer.alertsSummary.total} 알림
                      </MotionDiv>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRealtime(!isRealtime)}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ${
                    isRealtime
                      ? 'bg-white text-green-600 shadow-xl'
                      : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  {isRealtime ? (
                    <>
                      <Play className="h-4 w-4" />
                      <span>실시간 모니터링 중</span>
                      <span className="animate-pulse">●</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>일시정지</span>
                    </>
                  )}
                </MotionButton>

                <MotionButton
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm transition-all duration-300 hover:bg-white/30"
                  title="모달 닫기"
                >
                  <X className="h-5 w-5" />
                </MotionButton>
              </div>
            </div>

            {/* 탭 네비게이션 - 개선된 디자인 */}
            <div className="mt-6 flex gap-2 overflow-x-auto">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;
                return (
                  <MotionButton
                    key={tab.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-gray-800 shadow-xl'
                        : 'bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-gray-700' : 'text-white/90'}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <MotionDiv
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-white"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </MotionButton>
                );
              })}
            </div>
          </div>

          {/* 콘텐츠 영역 - 모듈화된 탭 컴포넌트 시스템 */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
            <AnimatePresence mode="wait">
              <MotionDiv
                key={selectedTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 30 
                }}
                className="p-6"
              >
                {selectedTab === 'overview' && (
                  <OverviewTab 
                    server={safeServer} 
                    statusTheme={statusTheme}
                  />
                )}
                {selectedTab === 'metrics' && (
                  <MetricsTab 
                    server={safeServer} 
                    realtimeData={realtimeData}
                    isRealtime={isRealtime}
                    onToggleRealtime={() => setIsRealtime(prev => !prev)}
                  />
                )}
                {selectedTab === 'processes' && (
                  <ProcessesTab realtimeData={realtimeData} />
                )}
                {selectedTab === 'logs' && (
                  <LogsTab realtimeData={realtimeData} />
                )}
                {selectedTab === 'network' && (
                  <NetworkTab 
                    server={safeServer} 
                    realtimeData={realtimeData}
                  />
                )}
              </MotionDiv>
            </AnimatePresence>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex justify-end gap-3">
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
                닫기
              </MotionButton>
            </div>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
}
