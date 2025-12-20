'use client';

import dynamic from 'next/dynamic';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import debug from '@/utils/debug';
import type { Server } from '../../types/server';
import {
  safeConsoleError,
  safeErrorMessage,
} from '../../utils/utils-functions';
import { DashboardSummary } from './DashboardSummary';
import type { DashboardStats } from './types/dashboard.types';

// framer-motion 제거됨

// 🛡️ 렌더링 로그 스팸 방지 (한 번만 로그)
let hasLoggedRenderOnce = false;
let hasLoggedModeOnce = false;

interface DashboardStatus {
  isRunning?: boolean;
  lastUpdate?: string;
  activeConnections?: number;
  type?: string;
}

interface DashboardActions {
  startSystem?: () => void;
  stopSystem?: () => void;
  restartSystem?: () => void;
  refreshData?: () => void;
}

interface DashboardContentProps {
  showSequentialGeneration: boolean;
  servers: Server[];
  status: DashboardStatus;
  actions: DashboardActions;
  selectedServer: Server | null;
  onServerClick: (server: Server) => void;
  onServerModalClose: () => void;
  onStatsUpdate: (stats: DashboardStats) => void;
  onShowSequentialChange: (show: boolean) => void;
  // mainContentVariants 제거
  isAgentOpen: boolean;
}

// 동적 임포트로 성능 최적화
const ServerDashboardDynamic = dynamic(() => import('./ServerDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
    </div>
  ),
});

export default function DashboardContent({
  showSequentialGeneration,
  servers,
  status,
  actions: _actions,
  selectedServer,
  onServerClick: _onServerClick,
  onServerModalClose: _onServerModalClose,
  onStatsUpdate,
  onShowSequentialChange,
  // mainContentVariants 제거
  isAgentOpen,
}: DashboardContentProps) {
  // 🚀 디버깅 로그 (한 번만 출력 - 리렌더링 스팸 방지)
  if (!hasLoggedRenderOnce) {
    hasLoggedRenderOnce = true;
    debug.log('🔍 DashboardContent 초기 렌더링:', {
      showSequentialGeneration,
      serversCount: servers?.length,
      selectedServer: selectedServer?.name,
      isAgentOpen,
      status: status?.type,
      timestamp: new Date().toISOString(),
    });
  }

  // 🎯 서버 데이터에서 직접 통계 계산 (중복 API 호출 제거)
  const [statsLoading, _setStatsLoading] = useState(false);

  // 폴백 통계 계산 (v5.81.0: 상호 배타적 카운팅으로 수정)
  const calculateFallbackStats = useCallback((): DashboardStats => {
    if (!servers || servers.length === 0) {
      return { total: 0, online: 0, offline: 0, warning: 0, unknown: 0 };
    }

    const stats = servers.reduce(
      (acc, server) => {
        acc.total += 1;
        const normalizedStatus = server.status?.toLowerCase() || 'unknown';

        // 🎯 상호 배타적 카운팅: 각 서버는 정확히 하나의 상태에만 속함
        // total = online + warning + offline + unknown
        switch (normalizedStatus) {
          // 오프라인/비가용
          case 'offline':
          case 'down':
          case 'disconnected':
            acc.offline += 1;
            break;

          // 경고 상태 (warning + critical 통합)
          case 'warning':
          case 'degraded':
          case 'unstable':
          case 'critical':
          case 'error':
          case 'failed':
            acc.warning += 1;
            break;

          // Unknown/Maintenance
          case 'unknown':
          case 'maintenance':
            acc.unknown += 1;
            break;

          // 정상 온라인
          case 'online':
          case 'healthy':
          case 'running':
          case 'active':
            acc.online += 1;
            break;

          // 정의되지 않은 상태
          default:
            acc.unknown += 1;
            break;
        }

        return acc;
      },
      { total: 0, online: 0, offline: 0, warning: 0, unknown: 0 }
    );

    return stats;
  }, [servers]);

  // 최종 서버 통계 (서버 데이터에서 직접 계산)
  const serverStats = useMemo(() => {
    if (statsLoading) {
      return { total: 0, online: 0, offline: 0, warning: 0, unknown: 0 }; // 🔧 수정: unknown 추가
    }

    // 서버 데이터에서 직접 통계 계산
    const stats = calculateFallbackStats();
    debug.log('📊 서버 통계 계산:', stats);
    return stats;
  }, [statsLoading, calculateFallbackStats]);

  // 🚀 에러 상태 추가
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  // 🚨 _currentTime 제거됨: 사용하지 않으면서 1초마다 리렌더링 유발 (서버 카드 그래프 깜빡임 원인)
  const [_screenSize, setScreenSize] = useState<string>('알 수 없음');

  // 🛡️ 클라이언트 사이드 확인 및 실시간 업데이트
  useEffect(() => {
    setIsClient(true);

    // 서버 사이드에서는 실행하지 않음
    if (typeof window === 'undefined') {
      return;
    }

    // 화면 크기 감지 함수
    const updateScreenSize = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      if (width >= 1536) {
        setScreenSize('2K 최적화');
      } else if (width >= 1280) {
        setScreenSize('XL 최적화');
      } else if (width >= 1024) {
        setScreenSize('LG 최적화');
      } else if (width >= 768) {
        setScreenSize('태블릿 최적화');
      } else {
        setScreenSize('모바일 최적화');
      }
    };

    // 초기 화면 크기 설정
    updateScreenSize();

    // 🚨 1초 interval 제거됨 - 사용하지 않는 상태 업데이트로 인한 불필요한 리렌더링 방지
    // 실시간 시계는 RealTimeDisplay 컴포넌트에서 독립적으로 관리됨

    // 화면 크기 변경 감지
    const resizeHandler = () => {
      updateScreenSize();
    };

    // 안전하게 이벤트 리스너 추가
    if (window?.addEventListener) {
      window.addEventListener('resize', resizeHandler);
    }

    return () => {
      if (window?.removeEventListener) {
        window.removeEventListener('resize', resizeHandler);
      }
    };
  }, []);

  useEffect(() => {
    try {
      debug.log('✅ DashboardContent 마운트됨');
      setRenderError(null);
      // 🎯 상위 컴포넌트에 통계 업데이트 전달
      if (onStatsUpdate && serverStats.total > 0) {
        onStatsUpdate(serverStats);
      }
    } catch (error) {
      safeConsoleError('❌ DashboardContent 마운트 에러', error);
      setRenderError(safeErrorMessage(error, '알 수 없는 마운트 에러'));
    }
  }, [serverStats, onStatsUpdate]); // onStatsUpdate 함수 의존성 복구

  // 🛡️ 서버 사이드 렌더링 방지
  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // 🚀 렌더링 에러 처리
  if (renderError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <div className="mb-4 text-4xl text-red-500">⚠️</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              렌더링 오류
            </h2>
            <p className="mb-4 text-gray-600">{renderError}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  try {
    // 시퀀셜 생성 모드
    if (showSequentialGeneration) {
      debug.log('🔄 시퀀셜 생성 모드 렌더링');
      return (
        <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                🔄 서버 생성 중...
              </h2>
              <p className="text-gray-600">
                시퀀셜 서버 생성 모드가 활성화되었습니다.
              </p>
              <button
                onClick={() => onShowSequentialChange(false)}
                className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                일반 모드로 전환
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 일반 대시보드 모드 - 반응형 그리드 레이아웃 (로그 한 번만)
    if (!hasLoggedModeOnce) {
      hasLoggedModeOnce = true;
      debug.log('📊 일반 대시보드 모드 렌더링');
    }
    return (
      <div className="animate-fade-in h-full w-full">
        <div className="mx-auto h-full max-w-none space-y-6 overflow-y-auto px-4 sm:px-6 lg:px-8 2xl:max-w-[1800px]">
          {/* 🎯 목업 데이터 모드 표시 */}
          {servers && servers.length > 0 && (
            <div className="mb-2 overflow-hidden rounded-lg border border-purple-500/20 bg-purple-500/10 backdrop-blur-md p-2 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-purple-400"></div>
                  <span className="font-medium text-xs sm:text-sm text-purple-300">
                    🎭 DEMO MODE
                  </span>
                  <span className="hidden sm:inline-block shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 border border-purple-500/30">
                    목업 데이터
                  </span>
                  <span className="hidden sm:inline-block shrink-0 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 border border-blue-500/30">
                    24시간 시나리오
                  </span>
                </div>

                {/* 우측 통계 요약 (간소화) */}
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-[10px] sm:gap-3">
                  <span className="text-purple-300/80">
                    업데이트: {new Date().toLocaleTimeString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 메인 컨텐츠 영역 */}
          {servers && servers.length > 0 ? (
            <>
              {/* 인프라 전체 현황 (Simple Grid) */}
              <DashboardSummary servers={servers} stats={serverStats} />

              {/* 서버 카드 목록 */}
              <Suspense
                fallback={
                  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">
                    <div className="animate-pulse">
                      <div className="mb-4 h-4 rounded bg-white/10"></div>
                      <div className="mb-4 h-4 rounded bg-white/10"></div>
                      <div className="h-4 w-5/6 rounded bg-white/10"></div>
                    </div>
                  </div>
                }
              >
                <ServerDashboardDynamic
                  servers={servers}
                  onServerClick={(server) => {
                    try {
                      debug.log('🖱️ 서버 클릭:', server);
                      // 서버 클릭 처리는 부모에서 관리됨
                    } catch (error) {
                      safeConsoleError('서버 클릭 처리 오류:', error);
                    }
                  }}
                  showModal={!!selectedServer}
                  onClose={() => {
                    debug.log('🔲 서버 모달 닫기');
                  }}
                  onStatsUpdate={onStatsUpdate}
                  selectedServerId={selectedServer?.id}
                />
              </Suspense>
            </>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="text-center text-gray-500">
                <p className="mb-2 text-lg">등록된 서버가 없습니다</p>
                <p className="text-sm">서버를 추가하여 모니터링을 시작하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (renderError) {
    debug.error('📱 DashboardContent 렌더링 오류:', renderError);
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="text-center text-gray-500">
          <p>대시보드를 불러올 수 없습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded bg-blue-500 px-3 py-1 text-sm text-white"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }
}
