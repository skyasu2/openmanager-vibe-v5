'use client';

import InfrastructureOverviewPage from '@/components/ai/pages/InfrastructureOverviewPage';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { safeConsoleError, safeErrorMessage } from '../../lib/utils-functions';
import type { Server } from '../../types/server';
// framer-motion 제거 - CSS 애니메이션 사용
import debug from '@/utils/debug';

// framer-motion 제거됨

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

interface DashboardStats {
  total: number;
  online: number;
  warning: number;
  offline: number;
  servers: unknown[];
}

interface DashboardContentProps {
  showSequentialGeneration: boolean;
  servers: Server[];
  status: DashboardStatus;
  actions: DashboardActions;
  selectedServer: Server | null;
  onServerClick: (server: Server) => void;
  onServerModalClose: () => void;
  onStatsUpdate: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
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
  // 🚀 디버깅 로그
  debug.log('🔍 DashboardContent 렌더링:', {
    showSequentialGeneration,
    serversCount: servers?.length,
    selectedServer: selectedServer?.name,
    isAgentOpen,
    status: status?.type,
    timestamp: new Date().toISOString(),
  });

  // 🎯 서버 데이터에서 직접 통계 계산 (중복 API 호출 제거)
  const [statsLoading, setStatsLoading] = useState(false);

  // 폴백 통계 계산 (기존 로직)
  const calculateFallbackStats = () => {
    if (!servers || servers.length === 0) {
      return { total: 0, online: 0, warning: 0, offline: 0, servers: [] };
    }

    const stats = servers.reduce(
      (acc, server) => {
        acc.total += 1;
        const normalizedStatus = server.status?.toLowerCase() || 'unknown';

        switch (normalizedStatus) {
          case 'online':
          case 'healthy':
          case 'running':
          case 'active':
            acc.online += 1;
            break;
          case 'warning':
          case 'degraded':
          case 'unstable':
            acc.warning += 1;
            break;
          case 'offline':
          case 'critical':
          case 'error':
          case 'failed':
          case 'down':
            acc.offline += 1;
            break;
          default:
            acc.warning += 1;
        }
        return acc;
      },
      { total: 0, online: 0, warning: 0, offline: 0 }
    );

    return { ...stats, servers };
  };

  // 최종 서버 통계 (서버 데이터에서 직접 계산)
  const serverStats = useMemo(() => {
    if (statsLoading) {
      return { total: 0, online: 0, warning: 0, offline: 0 };
    }

    // 서버 데이터에서 직접 통계 계산
    const stats = calculateFallbackStats();
    debug.log('📊 서버 통계 계산:', stats);
    return stats;
  }, [statsLoading, servers]);

  // 🚀 에러 상태 추가
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [_currentTime, setCurrentTime] = useState(new Date());
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

    // 실시간 시간 업데이트 (1초마다)
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 화면 크기 변경 감지
    const resizeHandler = () => {
      updateScreenSize();
    };

    // 안전하게 이벤트 리스너 추가
    if (window && window.addEventListener) {
      window.addEventListener('resize', resizeHandler);
    }

    return () => {
      clearInterval(timeInterval);
      if (window && window.removeEventListener) {
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
  }, [serverStats, onStatsUpdate]);

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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
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

    // 일반 대시보드 모드 - 반응형 그리드 레이아웃
    debug.log('📊 일반 대시보드 모드 렌더링');
    return (
      <div className="h-full w-full animate-fade-in">
        <div className="mx-auto h-full max-w-none space-y-6 overflow-y-auto px-4 sm:px-6 lg:px-8 2xl:max-w-[1800px]">
          {/* 🎯 목업 데이터 모드 표시 */}
          {servers && servers.length > 0 && (
            <div className="mb-4 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-purple-500"></div>
                  <span className="font-medium text-purple-800">
                    🎭 DEMO MODE - 온프레미스 서버 시뮬레이션
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-600">
                    목업 데이터
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">
                    24시간 시나리오
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    <span className="text-gray-700">
                      총 {serverStats.total}대
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-green-600">
                      정상 {serverStats.online}대
                    </span>
                  </div>
                  {serverStats.warning > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500"></div>
                      <span className="text-yellow-600">
                        경고 {serverStats.warning}대
                      </span>
                    </div>
                  )}
                  {serverStats.offline > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                      <span className="text-red-600">
                        오프라인 {serverStats.offline}대
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 📊 상세 통계 정보 */}
              <div className="mt-2 border-t border-green-200/50 pt-2">
                <div className="flex items-center justify-between text-xs text-green-700">
                  <span>
                    마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                  </span>
                  <span>
                    정상 비율:{' '}
                    {serverStats.total > 0
                      ? Math.round(
                          (serverStats.online / serverStats.total) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 메인 컨텐츠 영역 */}
          {servers && servers.length > 0 ? (
            <>
              {/* 인프라 전체 현황 */}
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
                  {/* 🎛️ 인프라 전체 현황 - 큰 화면에서 2칸, 작은 화면에서 전체 */}
                  <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                    <Suspense
                      fallback={
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
                          <div className="animate-pulse">
                            <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
                            <div className="space-y-3">
                              <div className="h-4 rounded bg-gray-200"></div>
                              <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        <InfrastructureOverviewPage className="h-80 lg:h-96" />
                      </div>
                    </Suspense>
                  </div>
                </div>
              </div>

              {/* 서버 카드 목록 */}
              <Suspense
                fallback={
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
                    <div className="animate-pulse">
                      <div className="mb-4 h-4 rounded bg-gray-200"></div>
                      <div className="mb-4 h-4 rounded bg-gray-200"></div>
                      <div className="h-4 w-5/6 rounded bg-gray-200"></div>
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
