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

import React from 'react';
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
import { useEffect, useMemo, useState, Fragment } from 'react';
import { ServerModal3DGauge } from '../shared/UnifiedCircularGauge';

// 모듈화된 컴포넌트 및 타입 임포트
import type {
  EnhancedServerModalProps,
  ServerData,
  RealtimeData,
  TabId,
  TabInfo,
} from './EnhancedServerModal.types';
import {
  getMetricColorByStatus,
  getStatusTheme,
} from './EnhancedServerModal.utils';
import {
  getSafeServicesLength,
  getSafeValidServices,
  isValidServer,
  vercelSafeLog,
} from '@/lib/vercel-safe-utils';
import { RealtimeChart } from './EnhancedServerModal.components';
import { OverviewTab } from './EnhancedServerModal.OverviewTab';
import { MetricsTab } from './EnhancedServerModal.MetricsTab';
import { ProcessesTab } from './EnhancedServerModal.ProcessesTab';
import { LogsTab } from './EnhancedServerModal.LogsTab';
import { NetworkTab } from './EnhancedServerModal.NetworkTab';

// framer-motion을 동적 import로 처리
// framer-motion 제거됨
// framer-motion 제거됨

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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 🛡️ 서버 데이터 안전성 검증 및 기본값 설정
  const safeServer = useMemo(
    (): ServerData | null =>
      server
        ? {
            id: server.id || 'unknown',
            hostname: server.hostname || 'unknown.local',
            name: server.name || 'Unknown Server',
            type: server.type || 'unknown',
            environment: server.environment || 'unknown',
            location: server.location || 'Unknown Location',
            provider: server.provider || 'Unknown Provider',
            status: server.status || 'unknown', // 🔧 수정: 'offline' → 'unknown' (기본값 변경)
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
              level: (['info', 'warn', 'error'][
                Math.floor(Math.random() * 3)
              ] ?? 'info') as 'info' | 'warn' | 'error',
              message:
                [
                  `${safeServer.name} - HTTP request processed successfully`,
                  `${safeServer.name} - Memory usage above threshold`,
                  `${safeServer.name} - Database connection established`,
                  `${safeServer.name} - Cache invalidated`,
                  `${safeServer.name} - Backup completed`,
                  `${safeServer.name} - SSL certificate renewed`,
                ][Math.floor(Math.random() * 6)] ??
                `${safeServer.name} - System status normal`,
              source:
                (safeServer?.services &&
                Array.isArray(safeServer.services) &&
                getSafeServicesLength(safeServer) > 0
                  ? safeServer.services[
                      Math.floor(
                        Math.random() * getSafeServicesLength(safeServer)
                      )
                    ]?.name
                  : safeServer?.name) || safeServer?.name,
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
  }, [isRealtime]); // safeServer 객체 의존성 제거하여 Vercel Edge Runtime 호환성 확보

  // 📊 탭 구성 최적화 (5개→3개로 통합, Progressive Disclosure)
  const tabs: TabInfo[] = [
    { id: 'overview', label: '종합 상황', icon: Activity }, // 개요 + 핵심 메트릭 통합
    { id: 'metrics', label: '성능 분석', icon: BarChart3 }, // 메트릭 + 프로세스 통합
    { id: 'logs', label: '로그 & 네트워크', icon: FileText }, // 로그 + 네트워크 통합
  ];

  if (!safeServer) {
    console.warn('⚠️ [EnhancedServerModal] 서버 데이터가 없습니다.');
    // 모달을 닫지 않고 오류 상태를 표시
    return (
      <Fragment>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onClose();
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onClose();
              }
            }}
            role="presentation"
            tabIndex={-1}
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
          </div>
        </div>
      </Fragment>
    );
  }

  // 상태별 색상 테마 가져오기
  const statusTheme = getStatusTheme(safeServer?.status);

  return (
    <Fragment>
      <div
        className="fixed relative inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        role="presentation"
      >
        <button
          type="button"
          aria-label="모달 닫기"
          className="absolute inset-0 h-full w-full cursor-pointer"
          onClick={onClose}
        />
        <div
          className="relative flex h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 sm:h-[90vh] sm:rounded-3xl"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          {/* 헤더 - Miller's Rule 적용 (8개→5개 요소 축소) */}
          <div
            className={`bg-gradient-to-r ${statusTheme.gradient} p-4 text-white sm:p-6`}
          >
            <div className="flex items-center justify-between">
              {/* 💡 핵심 정보 통합 (3개 요소) */}
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="rounded-xl bg-white/25 p-2 shadow-lg backdrop-blur-sm sm:p-3">
                  <ServerIcon className="h-5 w-5 text-white sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  {/* 1️⃣ 서버명 + 상태 + 헬스점수 통합 (모바일 최적화) */}
                  <h2 className="flex items-center gap-2 text-lg font-bold sm:gap-3 sm:text-2xl">
                    <span className="truncate drop-shadow-sm">
                      {safeServer.name}
                    </span>
                    <span className="flex-shrink-0 text-xl sm:text-2xl">
                      {statusTheme.icon}
                    </span>
                    {safeServer.health?.score !== undefined && (
                      <div className="flex-shrink-0 rounded-lg bg-white/30 px-1.5 py-1 text-xs font-bold backdrop-blur-sm sm:px-2 sm:text-sm">
                        {Math.round(safeServer.health.score)}%
                      </div>
                    )}
                  </h2>

                  {/* 2️⃣ 서버 정보 + 중요 알림만 표시 (모바일 간소화) */}
                  <div className="mt-1 flex items-center gap-2 text-sm text-white/90 sm:gap-3 sm:text-base">
                    <span className="font-medium">{safeServer.type}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">
                      {safeServer.location}
                    </span>

                    {/* 🚨 중요 알림만 표시 (Critical/Warning만) */}
                    {safeServer.alertsSummary?.critical &&
                      safeServer.alertsSummary.critical > 0 && (
                        <div className="ml-1 inline-flex animate-pulse items-center gap-1 rounded-full bg-red-500/40 px-1.5 py-0.5 text-xs font-bold backdrop-blur-sm sm:ml-2 sm:px-2 sm:py-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {safeServer.alertsSummary.critical}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* 💡 핵심 액션만 (2개 요소) */}
              <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                {/* 3️⃣ 실시간 모니터링 토글 (모바일 최적화) */}
                <button
                  onClick={() => setIsRealtime(!isRealtime)}
                  className={`flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-medium transition-all duration-300 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-base ${
                    isRealtime
                      ? 'scale-105 bg-white text-green-600 shadow-xl'
                      : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  {isRealtime ? (
                    <>
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">실시간</span>
                      <span className="animate-pulse">●</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      <span className="hidden sm:inline">일시정지</span>
                    </>
                  )}
                </button>

                {/* 4️⃣ 모달 닫기 (모바일 최적화) */}
                <button
                  onClick={onClose}
                  className="rounded-xl bg-white/20 p-2 backdrop-blur-sm transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-white/30 sm:p-2.5"
                  title="모달 닫기"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* 탭 네비게이션 - 모바일 최적화 */}
            <div className="mt-4 flex gap-1 overflow-x-auto pb-1 sm:mt-6 sm:gap-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;

                // 📊 통합 탭 인디케이터 (3개 탭 전용)
                const getTabIndicator = (tabId: TabId) => {
                  switch (tabId) {
                    case 'overview':
                      // 🎯 전체 헬스 점수 표시
                      const healthScore = safeServer.health?.score || 0;
                      return (
                        <div
                          className={`h-2 w-2 rounded-full ${
                            healthScore > 80
                              ? 'bg-green-400'
                              : healthScore > 60
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                          } ${isActive ? 'opacity-100' : 'opacity-70'}`}
                        />
                      );
                    case 'metrics':
                      // 🎯 성능 상태 + 프로세스 수 통합
                      const avgCpu = (safeServer.cpu + safeServer.memory) / 2;
                      const processCount = getSafeServicesLength(safeServer);
                      return (
                        <div className="flex items-center gap-1">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              avgCpu > 80
                                ? 'bg-red-400'
                                : avgCpu > 60
                                  ? 'bg-amber-400'
                                  : 'bg-green-400'
                            } ${isActive ? 'opacity-100' : 'opacity-70'}`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              isActive ? 'text-gray-600' : 'text-white/70'
                            }`}
                          >
                            {processCount}
                          </span>
                        </div>
                      );
                    case 'logs':
                      // 🎯 로그 상태 + 네트워크 상태 통합
                      const hasError = realtimeData.logs.some(
                        (log) => log.level === 'error'
                      );
                      const hasWarn = realtimeData.logs.some(
                        (log) => log.level === 'warn'
                      );
                      const isNetworkOnline = safeServer.status === 'online';
                      return (
                        <div className="flex items-center gap-1">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              hasError
                                ? 'bg-red-400'
                                : hasWarn
                                  ? 'bg-amber-400'
                                  : 'bg-blue-400'
                            } ${isActive ? 'opacity-100' : 'opacity-70'}`}
                          />
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              isNetworkOnline
                                ? 'animate-pulse bg-green-400'
                                : 'bg-gray-400'
                            } ${isActive ? 'opacity-100' : 'opacity-70'}`}
                          />
                        </div>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`relative flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base ${
                      isActive
                        ? 'scale-105 bg-white text-gray-800 shadow-xl'
                        : 'hover:scale-102 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-gray-700' : 'text-white/90'}`}
                    />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>

                    {/* 탭별 상태 인디케이터 */}
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {getTabIndicator(tab.id)}
                    </div>

                    {/* 활성 탭 하이라이트 */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 h-1 w-6 -translate-x-1/2 rounded-t-full bg-blue-500 sm:w-8" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 콘텐츠 영역 - 모듈화된 탭 컴포넌트 시스템 */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
            <Fragment>
              <div key={selectedTab} className="p-4 sm:p-6">
                {/* 📊 통합 탭 시스템 (5개→3개로 통합) */}
                {selectedTab === 'overview' && (
                  <div className="space-y-6">
                    {/* 🎯 기존 개요 + 핵심 메트릭 통합 */}
                    <OverviewTab
                      server={safeServer}
                      statusTheme={statusTheme}
                    />

                    {/* 📈 핵심 메트릭 요약 */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        핵심 성능 지표
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              safeServer.cpu > 80
                                ? 'text-red-600'
                                : safeServer.cpu > 60
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {Math.round(safeServer.cpu)}%
                          </div>
                          <div className="text-sm text-gray-500">CPU</div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              safeServer.memory > 80
                                ? 'text-red-600'
                                : safeServer.memory > 60
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {Math.round(safeServer.memory)}%
                          </div>
                          <div className="text-sm text-gray-500">메모리</div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              safeServer.disk > 80
                                ? 'text-red-600'
                                : safeServer.disk > 60
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {Math.round(safeServer.disk)}%
                          </div>
                          <div className="text-sm text-gray-500">디스크</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {getSafeServicesLength(safeServer)}
                          </div>
                          <div className="text-sm text-gray-500">서비스</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'metrics' && (
                  <div className="space-y-6">
                    {/* 🎯 기존 메트릭 탭 */}
                    <MetricsTab
                      server={safeServer}
                      realtimeData={realtimeData}
                      isRealtime={isRealtime}
                      onToggleRealtime={() => setIsRealtime((prev) => !prev)}
                    />

                    {/* 📊 프로세스 정보 통합 */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Cpu className="h-5 w-5 text-green-600" />
                        실행 중인 프로세스
                      </h3>
                      <ProcessesTab realtimeData={realtimeData} />
                    </div>
                  </div>
                )}

                {selectedTab === 'logs' && (
                  <div className="space-y-6">
                    {/* 🎯 기존 로그 탭 */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <FileText className="h-5 w-5 text-blue-600" />
                        시스템 로그
                      </h3>
                      <LogsTab realtimeData={realtimeData} />
                    </div>

                    {/* 🌐 네트워크 정보 통합 */}
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Network className="h-5 w-5 text-purple-600" />
                        네트워크 상태
                      </h3>
                      <NetworkTab
                        server={safeServer}
                        realtimeData={realtimeData}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Fragment>
          </div>

          {/* 하단 상태 요약 - 모바일 최적화 */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 sm:px-6 sm:py-3">
            <div className="flex items-center justify-between">
              {/* 핵심 상태 정보만 표시 (모바일 최적화) */}
              <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div
                    className={`h-2 w-2 rounded-full sm:h-3 sm:w-3 ${
                      safeServer.status === 'online'
                        ? 'bg-green-500'
                        : safeServer.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium capitalize text-gray-700">
                    {safeServer.status}
                  </span>
                </div>
                <div className="text-gray-600">
                  <span className="hidden sm:inline">
                    CPU: {Math.round(safeServer.cpu)}% | 메모리:{' '}
                    {Math.round(safeServer.memory)}%
                  </span>
                  <span className="sm:hidden">
                    {Math.round(safeServer.cpu)}%/
                    {Math.round(safeServer.memory)}%
                  </span>
                </div>

                {/* 중요 알림만 표시 (모바일 간소화) */}
                {safeServer.alertsSummary?.critical &&
                  safeServer.alertsSummary.critical > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-medium">
                        <span className="hidden sm:inline">
                          {safeServer.alertsSummary.critical}개 긴급
                        </span>
                        <span className="sm:hidden">
                          {safeServer.alertsSummary.critical}
                        </span>
                      </span>
                    </div>
                  )}
              </div>

              {/* 마지막 업데이트 시간 (모바일 간소화) */}
              <div className="text-xs text-gray-500">
                <span className="hidden sm:inline">
                  최종 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                </span>
                <span className="sm:hidden">
                  {new Date().toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
