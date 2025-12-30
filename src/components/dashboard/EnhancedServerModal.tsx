'use client';

/**
 * 🚀 Enhanced Server Detail Modal v5.1 - Dark Glass UI
 *
 * 완전히 모듈화된 현대적 서버 상세 모달 (Dark Theme 적용):
 * - Glassmorphism UI (투명 유리 효과)
 * - Neon Glow Effects (네온 글로우)
 * - Deep Dark Background (몰입감 향상)
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
import {
  DARK_CARD_STYLES,
  getDarkServerStatusTheme,
} from '@/styles/design-constants';

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
  const { currentMetrics, historyData } = useFixed24hMetrics(
    server?.id || '',
    3000 // 3초 주기 업데이트
  );

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
            hostname: server.hostname || 'unknown.local',
            name: server.name || 'Unknown Server',
            type: server.type || 'unknown',
            environment: server.environment || 'production',
            location: server.location || 'Unknown Location',
            provider: server.provider || 'Unknown Provider',
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
            networkStatus:
              server.status === 'online'
                ? 'excellent'
                : server.status === 'warning'
                  ? 'good'
                  : 'offline',
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

  // RealtimeData 변환 (Hook 데이터 -> UI 포맷)
  const realtimeData: RealtimeData = useMemo(() => {
    if (!safeServer)
      return {
        cpu: [],
        memory: [],
        disk: [],
        network: [],
        latency: [],
        processes: [],
        logs: [],
      };

    return {
      cpu: historyData.map((h) => h.cpu),
      memory: historyData.map((h) => h.memory),
      disk: historyData.map((h) => h.disk),
      network: historyData.map((h) => ({
        in: h.network * 0.6,
        out: h.network * 0.4,
      })),
      latency: historyData.map(() => Math.random() * 10 + 20),
      processes:
        safeServer?.services?.map((service, i) => ({
          name: service.name || `service-${i}`,
          cpu: parseFloat(
            (
              (currentMetrics?.cpu || 10) / (safeServer.services?.length || 1)
            ).toFixed(2)
          ),
          memory: parseFloat(
            (
              (currentMetrics?.memory || 20) /
              (safeServer.services?.length || 1)
            ).toFixed(2)
          ),
          pid: 1000 + i,
        })) || [],
      logs: (() => {
        const logMessages: string[] = [];
        const cpu = currentMetrics?.cpu || 0;
        const memory = currentMetrics?.memory || 0;
        if (cpu > 80)
          logMessages.push(`[WARN] High CPU load: ${cpu.toFixed(1)}%`);
        if (memory > 85)
          logMessages.push(
            `[WARN] Available memory low: ${(100 - memory).toFixed(1)}% free`
          );
        if (logMessages.length === 0) {
          logMessages.push('[INFO] System operating normally');
        }
        return logMessages.map((msg) => ({
          timestamp: new Date().toISOString(),
          level: msg.includes('[WARN]') ? ('warn' as const) : ('info' as const),
          message: msg,
          source: 'System',
        }));
      })(),
    };
  }, [historyData, safeServer, currentMetrics]);

  // 📊 탭 구성 최적화
  const tabs: TabInfo[] = [
    { id: 'overview', label: '종합 상황', icon: Activity },
    { id: 'metrics', label: '성능 분석', icon: BarChart3 },
    { id: 'logs', label: '로그 & 네트워크', icon: FileText },
  ];

  if (!safeServer) {
    console.warn('⚠️ [EnhancedServerModal] 서버 데이터가 없습니다.');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={onClose}
          aria-label="Close modal"
        />
        <div
          className="relative w-full max-w-md rounded-xl bg-[#0F1115] p-6 text-center border border-white/10"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="mb-4 text-4xl text-red-500">⚠️</div>
          <h3 className="mb-2 text-lg font-semibold text-white">
            서버 데이터 오류
          </h3>
          <p className="mb-4 text-white/70">서버 정보를 불러올 수 없습니다.</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 hover:bg-blue-500/30 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  // 상태별 색상 테마 가져오기 (Dark Mode)
  // const statusTheme = getStatusTheme(safeServer?.status); // Legacy
  const darkStatusTheme = getDarkServerStatusTheme(safeServer?.status);

  return (
    <div
      className="gpu-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
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
        className="gpu-modal-content relative flex h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-[#0F1115] shadow-2xl ring-1 ring-white/10 sm:h-[90vh] sm:rounded-3xl"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* 헤더 - Dark Glass Style */}
        <div
          className={`bg-linear-to-r ${darkStatusTheme.background.replace('backdrop-blur-md', '')} border-b border-white/5 p-4 text-white sm:p-6`}
        >
          <div className="flex items-center justify-between">
            {/* 💡 핵심 정보 통합 */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div
                className={`rounded-xl p-2 shadow-lg backdrop-blur-sm sm:p-3 bg-white/5 ${darkStatusTheme.text}`}
              >
                <ServerIcon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0 flex-1">
                {/* 1️⃣ 서버명 (헬스점수 배지 제거 - FIX-002) */}
                <h2
                  id="modal-title"
                  className="text-lg font-bold sm:text-2xl text-white"
                >
                  <span className="truncate drop-shadow-md">
                    {safeServer.name}
                  </span>
                </h2>

                {/* 2️⃣ 서버 정보 */}
                <div className="mt-1 flex items-center gap-2 text-sm text-white/60 sm:gap-3 sm:text-base">
                  <span className="font-medium">{safeServer.type}</span>
                  <span className="hidden sm:inline text-white/20">•</span>
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
                onClick={() => setIsRealtime(!isRealtime)}
                className={`flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-medium transition-all duration-300 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-base ${
                  isRealtime
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
              >
                {isRealtime ? (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Live</span>
                    <span className="animate-pulse text-emerald-400">●</span>
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
                className="rounded-xl bg-white/5 p-2 backdrop-blur-sm transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-white/10 border border-white/10 sm:p-2.5 text-white/70 hover:text-white"
                title="모달 닫기"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mt-4 flex gap-1 overflow-x-auto pb-1 sm:mt-6 sm:gap-2 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`relative flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg border border-white/20'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-white/40'}`}
                  />
                  <span>{tab.label}</span>

                  {/* 활성 탭 하이라이트 (Bottom Bar) */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 h-0.5 w-1/2 -translate-x-1/2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto bg-linear-to-br from-[#0F1115] to-[#1a1c20]">
          <div key={selectedTab} className="p-4 sm:p-6 animate-fade-in-up">
            {/* 📊 통합 탭 시스템 */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <OverviewTab
                  server={safeServer}
                  statusTheme={getStatusTheme(safeServer.status)}
                />

                {/* 📈 핵심 메트릭 요약 - Dark Glass Card */}
                <div className={`rounded-xl p-5 ${DARK_CARD_STYLES.glass}`}>
                  <h3
                    className={`mb-4 flex items-center gap-2 text-lg font-semibold ${DARK_CARD_STYLES.textPrimary}`}
                  >
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    핵심 성능 지표
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5">
                      <div
                        className={`text-2xl font-bold ${
                          safeServer.cpu > 80
                            ? 'text-red-400 shadow-red-500/20 drop-shadow-sm'
                            : safeServer.cpu > 60
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {Math.round(safeServer.cpu)}%
                      </div>
                      <div className="text-xs text-white/40 uppercase mt-1 tracking-wider">
                        CPU
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5">
                      <div
                        className={`text-2xl font-bold ${
                          safeServer.memory > 80
                            ? 'text-red-400'
                            : safeServer.memory > 60
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {Math.round(safeServer.memory)}%
                      </div>
                      <div className="text-xs text-white/40 uppercase mt-1 tracking-wider">
                        Memory
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5">
                      <div
                        className={`text-2xl font-bold ${
                          safeServer.disk > 80
                            ? 'text-red-400'
                            : safeServer.disk > 60
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {Math.round(safeServer.disk)}%
                      </div>
                      <div className="text-xs text-white/40 uppercase mt-1 tracking-wider">
                        Disk
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-2xl font-bold text-blue-400">
                        {safeServer.services?.length || 0}
                      </div>
                      <div className="text-xs text-white/40 uppercase mt-1 tracking-wider">
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
                  onToggleRealtime={() => setIsRealtime((prev) => !prev)}
                />

                <div className={`rounded-xl p-5 ${DARK_CARD_STYLES.glass}`}>
                  <h3
                    className={`mb-4 flex items-center gap-2 text-lg font-semibold ${DARK_CARD_STYLES.textPrimary}`}
                  >
                    <Cpu className="h-5 w-5 text-emerald-400" />
                    실행 중인 프로세스
                  </h3>
                  <ProcessesTab realtimeData={realtimeData} />
                </div>
              </div>
            )}

            {selectedTab === 'logs' && (
              <div className="space-y-6">
                <div className={`rounded-xl p-5 ${DARK_CARD_STYLES.glass}`}>
                  <h3
                    className={`mb-4 flex items-center gap-2 text-lg font-semibold ${DARK_CARD_STYLES.textPrimary}`}
                  >
                    <FileText className="h-5 w-5 text-blue-400" />
                    시스템 로그
                  </h3>
                  <LogsTab realtimeData={realtimeData} />
                </div>

                <div className={`rounded-xl p-5 ${DARK_CARD_STYLES.glass}`}>
                  <h3
                    className={`mb-4 flex items-center gap-2 text-lg font-semibold ${DARK_CARD_STYLES.textPrimary}`}
                  >
                    <Network className="h-5 w-5 text-purple-400" />
                    네트워크 상태
                  </h3>
                  <NetworkTab server={safeServer} realtimeData={realtimeData} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 상태 요약 */}
        <div className="border-t border-white/10 bg-[#0F1115]/50 backdrop-blur-xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${
                    safeServer.status === 'online'
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : safeServer.status === 'warning'
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  }`}
                />
                <span className="font-medium capitalize text-white/70">
                  {safeServer.status}
                </span>
              </div>
              <div className="text-white/40 hidden sm:block">|</div>
              <div className="text-white/60">
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

            <div className="text-xs text-white/30 font-mono">
              LAST UPDATE:{' '}
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
