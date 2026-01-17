'use client';

/**
 * 🚀 Enhanced Server Detail Modal v5.2 - Light Mode UI
 *
 * 완전히 모듈화된 현대적 서버 상세 모달 (Light Theme 적용):
 * - Clean White Background (깔끔한 화이트 배경)
 * - Subtle Shadows (부드러운 그림자 효과)
 * - Professional Light Mode (가독성 향상)
 */

import {
  Activity,
  BarChart3,
  Cpu,
  FileText,
  Network,
  Pause,
  Play,
  Server as ServerIcon,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFixed24hMetrics } from '@/hooks/useFixed24hMetrics';
import { logger } from '@/lib/logging';

import { LogsTab } from './EnhancedServerModal.LogsTab';
import { MetricsTab } from './EnhancedServerModal.MetricsTab';
import { NetworkTab } from './EnhancedServerModal.NetworkTab';
import { OverviewTab } from './EnhancedServerModal.OverviewTab';
import { ProcessesTab } from './EnhancedServerModal.ProcessesTab';
// 모듈화된 컴포넌트 및 타입 임포트
import type {
  EnhancedServerModalProps,
  RealtimeData,
  ServerData,
  TabId,
  TabInfo,
} from './EnhancedServerModal.types';
import { getStatusTheme } from './EnhancedServerModal.utils';

export default function EnhancedServerModal({
  server,
  onClose,
}: EnhancedServerModalProps) {
  // 🎯 React Hooks는 항상 최상단에서 호출
  const [selectedTab, setSelectedTab] = useState<TabId>('overview');
  const [isRealtime, setIsRealtime] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 🕒 Fixed 24h Metrics Hook (Client & AI Synchronization)
  // 정시 동기화 모드: 모달 열릴 때 즉시 로드 + 10분 정시(10,20,30,40,50,00분)에만 갱신
  // hourly-data JSON이 10분 단위이므로 낭비 없는 최적화
  const { currentMetrics, historyData } = useFixed24hMetrics(
    server?.id || '',
    'sync' // 정시 동기화 모드 (was: 30000ms)
  );

  // 📅 마지막 업데이트 시간 (메트릭 변경시에만 갱신 - flickering 방지)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour12: false })
  );
  useEffect(() => {
    if (currentMetrics) {
      setLastUpdateTime(
        new Date().toLocaleTimeString('en-US', { hour12: false })
      );
    }
  }, [currentMetrics]);

  // 🔧 P2: 핸들러 최적화 - useCallback으로 불필요한 리렌더 방지
  const handleToggleRealtime = useCallback(() => {
    setIsRealtime((prev) => !prev);
  }, []);

  const handleTabSelect = useCallback((tabId: TabId) => {
    setSelectedTab(tabId);
  }, []);

  // ♿ 접근성: 포커스 트랩 (모달 내부에서만 Tab 키 이동)
  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current) return [];
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC 키로 모달 닫기
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Tab 키 트랩
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) return;

        if (event.shiftKey) {
          // Shift+Tab: 첫 요소에서 마지막으로 이동
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: 마지막 요소에서 첫 요소로 이동
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // 모달 열릴 때 첫 번째 포커스 가능 요소에 포커스
    const focusableElements = getFocusableElements();
    const firstFocusable = focusableElements[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, getFocusableElements]);

  // 🛡️ 서버 데이터 안전성 검증 및 기본값 설정
  const safeServer = useMemo(
    (): ServerData | null =>
      server
        ? {
            id: server.id || 'unknown',
            // hostname: 서버 이름에서 추출하거나 기본값
            hostname:
              server.hostname ||
              server.name?.toLowerCase().replace(/\s+/g, '-') ||
              '미확인 호스트',
            name: server.name || '서버',
            type: server.type || 'unknown',
            environment: server.environment || 'production',
            location: server.location || '위치 미지정',
            // provider: 환경에 따라 추정
            provider:
              server.provider ||
              (server.environment === 'production'
                ? 'Cloud Provider'
                : 'Local'),
            // Status는 Fixed Metrics에 따라 실시간 업데이트
            status: currentMetrics
              ? currentMetrics.cpu > 80
                ? 'critical'
                : currentMetrics.cpu > 60
                  ? 'warning'
                  : 'online'
              : server.status || 'unknown',
            // 현재 메트릭 우선 사용, 없으면 초기값
            cpu:
              currentMetrics?.cpu ??
              (typeof server.cpu === 'number' ? server.cpu : 0),
            memory:
              currentMetrics?.memory ??
              (typeof server.memory === 'number' ? server.memory : 0),
            disk:
              currentMetrics?.disk ??
              (typeof server.disk === 'number' ? server.disk : 0),
            network:
              currentMetrics?.network ??
              (typeof server.network === 'number' ? server.network : 0),
            uptime:
              typeof server.uptime === 'number'
                ? `${Math.floor(server.uptime / 3600)}h ${Math.floor((server.uptime % 3600) / 60)}m`
                : server.uptime || '0h 0m',
            lastUpdate: server.lastUpdate || new Date(),
            alerts:
              typeof server.alerts === 'number'
                ? server.alerts
                : Array.isArray(server.alerts)
                  ? server.alerts.length
                  : 0,
            services: Array.isArray(server.services)
              ? server.services.map((s) => ({
                  name: s?.name || 'unknown',
                  status: s?.status || 'unknown',
                  port: s?.port || 80,
                }))
              : [],
            specs: server.specs || { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
            os: server.os || 'Unknown OS',
            ip: server.ip || '0.0.0.0',
            // NetworkStatus: ServerStatus + 리소스 부하 기반 추정
            networkStatus: (() => {
              if (server.status === 'offline') return 'offline';
              if (server.status === 'critical') return 'poor';
              // 리소스 부하 기반 품질 추정
              const avgLoad =
                ((currentMetrics?.cpu ?? server.cpu ?? 0) +
                  (currentMetrics?.memory ?? server.memory ?? 0)) /
                2;
              if (server.status === 'online' && avgLoad < 70)
                return 'excellent';
              return 'good';
            })(),
            health: server.health || { score: 0, trend: [] },
            alertsSummary: server.alertsSummary || {
              total: 0,
              critical: 0,
              warning: 0,
            },
          }
        : null,
    [server, currentMetrics]
  );

  // 📅 로그 타임스탬프 메모이제이션 (flickering 방지)
  // currentMetrics 변경시에만 새 타임스탬프 생성
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - update timestamp only when metrics change
  const logTimestamp = useMemo(
    () => new Date().toISOString(),
    [currentMetrics?.cpu, currentMetrics?.memory, currentMetrics?.disk]
  );

  // RealtimeData 변환 (Hook 데이터 -> UI 포맷)
  const realtimeData: RealtimeData = useMemo(() => {
    if (!safeServer)
      return {
        cpu: [],
        memory: [],
        disk: [],
        network: [],
        logs: [],
      };

    return {
      cpu: historyData.map((h) => h.cpu),
      memory: historyData.map((h) => h.memory),
      disk: historyData.map((h) => h.disk),
      // 📊 네트워크: In/Out 분리 데이터 없음 → NetworkTab에서 단일 사용률로 표시
      network: historyData.map((h) => ({
        in: h.network * 0.6,
        out: h.network * 0.4,
      })),
      // 📋 시스템 알림: 메트릭 임계값 기반 자동 생성 (실제 서버 로그 아님)
      // 타임스탬프는 메모이제이션된 값 사용 (flickering 방지)
      logs: (() => {
        const alerts: Array<{
          timestamp: string;
          level: 'info' | 'warn' | 'error';
          message: string;
          source: string;
        }> = [];
        const cpu = currentMetrics?.cpu || 0;
        const memory = currentMetrics?.memory || 0;
        const disk = currentMetrics?.disk || 0;
        const network = currentMetrics?.network || 0;

        // CPU 경고
        if (cpu > 90) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'error',
            message: `CPU 사용률 위험: ${cpu.toFixed(1)}% (임계값: 90%)`,
            source: '시스템 모니터',
          });
        } else if (cpu > 80) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'warn',
            message: `CPU 사용률 경고: ${cpu.toFixed(1)}% (임계값: 80%)`,
            source: '시스템 모니터',
          });
        }

        // 메모리 경고
        if (memory > 90) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'error',
            message: `메모리 사용률 위험: ${memory.toFixed(1)}% (여유: ${(100 - memory).toFixed(1)}%)`,
            source: '시스템 모니터',
          });
        } else if (memory > 85) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'warn',
            message: `메모리 사용률 경고: ${memory.toFixed(1)}%`,
            source: '시스템 모니터',
          });
        }

        // 디스크 경고
        if (disk > 90) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'error',
            message: `디스크 사용률 위험: ${disk.toFixed(1)}%`,
            source: '시스템 모니터',
          });
        } else if (disk > 80) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'warn',
            message: `디스크 사용률 주의: ${disk.toFixed(1)}%`,
            source: '시스템 모니터',
          });
        }

        // 네트워크 경고
        if (network > 90) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'warn',
            message: `네트워크 사용률 높음: ${network.toFixed(1)}%`,
            source: '시스템 모니터',
          });
        }

        // 정상 상태
        if (alerts.length === 0) {
          alerts.push({
            timestamp: logTimestamp,
            level: 'info',
            message: '모든 시스템 지표가 정상 범위 내에 있습니다.',
            source: '시스템 모니터',
          });
        }

        return alerts;
      })(),
    };
  }, [historyData, safeServer, currentMetrics, logTimestamp]);

  // 📊 탭 구성 최적화
  const tabs: TabInfo[] = [
    { id: 'overview', label: '종합 상황', icon: Activity },
    { id: 'metrics', label: '성능 분석', icon: BarChart3 },
    { id: 'logs', label: '로그 & 네트워크', icon: FileText },
  ];

  if (!safeServer) {
    logger.warn('⚠️ [EnhancedServerModal] 서버 데이터가 없습니다.');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={onClose}
          aria-label="Close modal"
        />
        <div
          className="relative w-full max-w-md rounded-xl bg-white p-6 text-center border border-gray-200 shadow-xl"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="mb-4 text-4xl text-red-500">⚠️</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            서버 데이터 오류
          </h3>
          <p className="mb-4 text-gray-600">서버 정보를 불러올 수 없습니다.</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="gpu-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <button
        type="button"
        aria-label="모달 닫기"
        className="absolute inset-0 h-full w-full cursor-pointer"
        onClick={onClose}
      />
      <dialog
        ref={dialogRef}
        open
        className="gpu-modal-content relative flex h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 sm:h-[90vh] sm:rounded-3xl"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* 헤더 - Light Mode Style */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            {/* 💡 핵심 정보 통합 */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div
                className={`rounded-xl p-2 shadow-md sm:p-3 bg-white ${
                  safeServer.status === 'online'
                    ? 'text-emerald-600'
                    : safeServer.status === 'warning'
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                <ServerIcon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0 flex-1">
                {/* 1️⃣ 서버명 (헬스점수 배지 제거 - FIX-002) */}
                <h2
                  id="modal-title"
                  className="text-lg font-bold sm:text-2xl text-gray-900"
                >
                  <span className="truncate">{safeServer.name}</span>
                </h2>

                {/* 2️⃣ 서버 정보 */}
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 sm:gap-3 sm:text-base">
                  <span className="font-medium">{safeServer.type}</span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="hidden sm:inline">
                    {safeServer.location}
                  </span>
                </div>
              </div>
            </div>

            {/* 💡 핵심 액션 */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* 3️⃣ 실시간 모니터링 토글 */}
              <button
                onClick={handleToggleRealtime}
                className={`flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-medium transition-all duration-300 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-base ${
                  isRealtime
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm'
                    : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {isRealtime ? (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Live</span>
                    <span className="animate-pulse text-emerald-500">●</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">Paused</span>
                  </>
                )}
              </button>

              {/* 4️⃣ 모달 닫기 */}
              <button
                onClick={onClose}
                className="rounded-xl bg-gray-100 p-2 transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-gray-200 border border-gray-200 sm:p-2.5 text-gray-500 hover:text-gray-700"
                title="모달 닫기"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 - WAI-ARIA 탭 패턴 */}
          <div
            role="tablist"
            aria-label="서버 상세 정보 탭"
            className="mt-4 flex gap-1 overflow-x-auto pb-1 sm:mt-6 sm:gap-2 no-scrollbar"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`relative flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-md border border-gray-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                    aria-hidden="true"
                  />
                  <span>{tab.label}</span>

                  {/* 활성 탭 하이라이트 (Bottom Bar) */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-1/2 h-0.5 w-1/2 -translate-x-1/2 bg-blue-600"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
          <div
            key={selectedTab}
            id={`panel-${selectedTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${selectedTab}`}
            className="p-4 sm:p-6 animate-fade-in-up"
          >
            {/* 📊 통합 탭 시스템 */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <OverviewTab
                  server={safeServer}
                  statusTheme={getStatusTheme(safeServer.status)}
                />

                {/* 📈 핵심 메트릭 요약 - Light Mode Card */}
                <div className="rounded-xl p-5 bg-white shadow-sm border border-gray-200">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    핵심 성능 지표
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div
                        className={`text-2xl font-bold ${
                          safeServer.cpu > 80
                            ? 'text-red-600'
                            : safeServer.cpu > 60
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {Math.round(safeServer.cpu)}%
                      </div>
                      <div className="text-xs text-gray-500 uppercase mt-1 tracking-wider">
                        CPU
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div
                        className={`text-2xl font-bold ${
                          safeServer.memory > 80
                            ? 'text-red-600'
                            : safeServer.memory > 60
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {Math.round(safeServer.memory)}%
                      </div>
                      <div className="text-xs text-gray-500 uppercase mt-1 tracking-wider">
                        Memory
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div
                        className={`text-2xl font-bold ${
                          safeServer.disk > 80
                            ? 'text-red-600'
                            : safeServer.disk > 60
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {Math.round(safeServer.disk)}%
                      </div>
                      <div className="text-xs text-gray-500 uppercase mt-1 tracking-wider">
                        Disk
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="text-2xl font-bold text-blue-600">
                        {safeServer.services?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500 uppercase mt-1 tracking-wider">
                        Services
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'metrics' && (
              <div className="space-y-6">
                <MetricsTab
                  server={safeServer}
                  realtimeData={realtimeData}
                  isRealtime={isRealtime}
                  onToggleRealtime={handleToggleRealtime}
                />

                <div className="rounded-xl p-5 bg-white shadow-sm border border-gray-200">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Cpu className="h-5 w-5 text-emerald-600" />
                    서비스 목록
                  </h3>
                  <ProcessesTab services={safeServer.services} />
                </div>
              </div>
            )}

            {selectedTab === 'logs' && (
              <div className="space-y-6">
                <div className="rounded-xl p-5 bg-white shadow-sm border border-gray-200">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <FileText className="h-5 w-5 text-blue-600" />
                    시스템 로그
                  </h3>
                  <LogsTab
                    serverId={safeServer.id}
                    serverMetrics={{
                      cpu: currentMetrics?.cpu ?? safeServer.cpu,
                      memory: currentMetrics?.memory ?? safeServer.memory,
                      disk: currentMetrics?.disk ?? safeServer.disk,
                      network:
                        currentMetrics?.network ?? safeServer.network ?? 0,
                    }}
                    realtimeData={realtimeData}
                  />
                </div>

                <div className="rounded-xl p-5 bg-white shadow-sm border border-gray-200">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Network className="h-5 w-5 text-purple-600" />
                    네트워크 상태
                  </h3>
                  <NetworkTab server={safeServer} realtimeData={realtimeData} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 상태 요약 */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${
                    safeServer.status === 'online'
                      ? 'bg-emerald-500'
                      : safeServer.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                />
                <span className="font-medium capitalize text-gray-700">
                  {safeServer.status}
                </span>
              </div>
              <div className="text-gray-300 hidden sm:block">|</div>
              <div className="text-gray-600">
                <span className="hidden sm:inline">
                  CPU: {Math.round(safeServer.cpu)}% · Mem:{' '}
                  {Math.round(safeServer.memory)}%
                </span>
                <span className="sm:hidden">
                  {Math.round(safeServer.cpu)}% /{' '}
                  {Math.round(safeServer.memory)}%
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-400 font-mono">
              LAST UPDATE: {lastUpdateTime}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
