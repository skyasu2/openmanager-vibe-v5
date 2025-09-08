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
              level: (['info', 'warn', 'error'][
                Math.floor(Math.random() * 3)
              ] ?? 'info') as 'info' | 'warn' | 'error',
              message: [
                `${safeServer.name} - HTTP request processed successfully`,
                `${safeServer.name} - Memory usage above threshold`,
                `${safeServer.name} - Database connection established`,
                `${safeServer.name} - Cache invalidated`,
                `${safeServer.name} - Backup completed`,
                `${safeServer.name} - SSL certificate renewed`,
              ][Math.floor(Math.random() * 6)] ?? `${safeServer.name} - System status normal`,
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
  }, [isRealtime]); // safeServer 객체 의존성 제거하여 Vercel Edge Runtime 호환성 확보

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
      <Fragment>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 - 상태별 색상 적용 */}
          <div
            className={`bg-gradient-to-r ${statusTheme.gradient} p-6 text-white`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-xl bg-white/25 p-3 shadow-lg backdrop-blur-sm"
                >
                  <ServerIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold">
                    <span className="drop-shadow-sm">{safeServer.name}</span>
                    <span className="text-3xl">{statusTheme.icon}</span>
                    {safeServer.health?.score !== undefined && (
                      <div
                        className="rounded-lg bg-white/30 px-3 py-1 text-sm font-bold backdrop-blur-sm"
                      >
                        점수: {Math.round(safeServer.health.score)}%
                      </div>
                    )}
                  </h2>
                  <p className="mt-1 flex items-center gap-3 text-white/90">
                    <span className="font-medium">{safeServer.type}</span>
                    <span>•</span>
                    <span>{safeServer.location}</span>
                    {safeServer.alertsSummary?.total ? (
                      <div
                        className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/30 px-3 py-1 text-xs font-bold backdrop-blur-sm"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {safeServer.alertsSummary.total} 알림
                      </div>
                    ) : null}
                  </p>
                </div>
              </div>

              {/* 우측 액션 버튼들 - AI 교차검증 개선사항 적용 */}
              <div className="flex items-center gap-3">
                {/* 빠른 액션 버튼들 (AI 제안 반영) */}
                <div className="flex items-center gap-2">
                  {/* 알림 상태 토글 */}
                  <button
                    onClick={() => {
                      // 알림 토글 로직 (향후 구현)
                      console.log('알림 설정 토글');
                    }}
                    className="rounded-xl bg-white/20 p-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-110"
                    title={`${safeServer.status === 'critical' ? '긴급' : '일반'} 알림 설정`}
                  >
                    <AlertTriangle className={`h-4 w-4 ${
                      safeServer.status === 'critical' ? 'text-red-300 animate-pulse' : 
                      safeServer.status === 'warning' ? 'text-amber-300' : 'text-white/70'
                    }`} />
                  </button>

                  {/* 서버 재시작 (모의) */}
                  <button
                    onClick={() => {
                      // 서버 재시작 모의 (향후 구현)
                      console.log(`${safeServer.name} 재시작 요청`);
                    }}
                    className="rounded-xl bg-white/20 p-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-110"
                    title="서버 재시작"
                  >
                    <ServerIcon className="h-4 w-4 text-white/70" />
                  </button>
                </div>

                {/* 실시간 모니터링 토글 */}
                <button
                  onClick={() => setIsRealtime(!isRealtime)}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ${
                    isRealtime
                      ? 'bg-white text-green-600 shadow-xl scale-105'
                      : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  {isRealtime ? (
                    <>
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">실시간 모니터링 중</span>
                      <span className="sm:hidden">실시간</span>
                      <span className="animate-pulse">●</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      <span className="hidden sm:inline">일시정지</span>
                      <span className="sm:hidden">정지</span>
                    </>
                  )}
                </button>

                {/* 모달 닫기 */}
                <button
                  onClick={onClose}
                  className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-110 hover:rotate-90"
                  title="모달 닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 탭 네비게이션 - AI 교차검증 개선사항 적용 */}
            <div className="mt-6 flex gap-2 overflow-x-auto">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;
                
                // 탭별 미니 인디케이터 (AI 제안 반영)
                const getTabIndicator = (tabId: TabId) => {
                  switch (tabId) {
                    case 'metrics':
                      const avgCpu = (safeServer.cpu + safeServer.memory) / 2;
                      return (
                        <div className={`h-2 w-2 rounded-full ${
                          avgCpu > 80 ? 'bg-red-400' : avgCpu > 60 ? 'bg-amber-400' : 'bg-green-400'
                        } ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                      );
                    case 'processes':
                      const processCount = safeServer.services?.length || 0;
                      return (
                        <span className={`text-xs font-bold ${
                          isActive ? 'text-gray-600' : 'text-white/70'
                        }`}>
                          {processCount}
                        </span>
                      );
                    case 'network':
                      return (
                        <div className={`h-2 w-2 rounded-full ${
                          safeServer.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                        } ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                      );
                    case 'logs':
                      return (
                        <div className={`h-2 w-2 rounded-full ${
                          realtimeData.logs.some(log => log.level === 'error') ? 'bg-red-400' :
                          realtimeData.logs.some(log => log.level === 'warn') ? 'bg-amber-400' : 'bg-blue-400'
                        } ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                      );
                    default:
                      return null;
                  }
                };
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-gray-800 shadow-xl scale-105'
                        : 'bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20 hover:scale-102'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isActive ? 'text-gray-700' : 'text-white/90'}`}
                    />
                    <span>{tab.label}</span>
                    
                    {/* 탭별 상태 인디케이터 */}
                    <div className="flex items-center gap-1">
                      {getTabIndicator(tab.id)}
                    </div>
                    
                    {/* 활성 탭 하이라이트 */}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 콘텐츠 영역 - 모듈화된 탭 컴포넌트 시스템 */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
            <Fragment>
              <div
                key={selectedTab}
                className="p-6"
              >
                {selectedTab === 'overview' && (
                  <OverviewTab server={safeServer} statusTheme={statusTheme} />
                )}
                {selectedTab === 'metrics' && (
                  <MetricsTab
                    server={safeServer}
                    realtimeData={realtimeData}
                    isRealtime={isRealtime}
                    onToggleRealtime={() => setIsRealtime((prev) => !prev)}
                  />
                )}
                {selectedTab === 'processes' && (
                  <ProcessesTab realtimeData={realtimeData} />
                )}
                {selectedTab === 'logs' && (
                  <LogsTab realtimeData={realtimeData} />
                )}
                {selectedTab === 'network' && (
                  <NetworkTab server={safeServer} realtimeData={realtimeData} />
                )}
              </div>
            </Fragment>
          </div>

          {/* 하단 액션 영역 - AI 교차검증 개선사항 적용 */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* 왼쪽: 서버 상태 요약 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    safeServer.status === 'online' ? 'bg-green-500' :
                    safeServer.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize text-gray-700">
                    {safeServer.status}
                  </span>
                </div>
                <div className="text-gray-500">
                  CPU: {Math.round(safeServer.cpu)}% | 메모리: {Math.round(safeServer.memory)}%
                </div>
                {safeServer.alertsSummary?.total ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">{safeServer.alertsSummary.total}개 알림</span>
                  </div>
                ) : null}
              </div>
              
              {/* 오른쪽: 액션 버튼들 */}
              <div className="flex items-center gap-3">
                {/* 새로고침 */}
                <button
                  onClick={() => {
                    // 데이터 새로고침 로직 (향후 구현)
                    console.log(`${safeServer.name} 데이터 새로고침`);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-700 transition-colors hover:bg-blue-200"
                  title="데이터 새로고침"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">새로고침</span>
                </button>

                {/* 상세 보고서 */}
                <button
                  onClick={() => {
                    // 보고서 생성 로직 (향후 구현)
                    console.log(`${safeServer.name} 상세 보고서 생성`);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 font-medium text-green-700 transition-colors hover:bg-green-200"
                  title="상세 보고서 생성"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">보고서</span>
                </button>

                {/* 닫기 */}
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                  <span>닫기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
