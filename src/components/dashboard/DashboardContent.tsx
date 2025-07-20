'use client';

// AI 컴포넌트는 GCP Functions로 이관됨
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { safeConsoleError, safeErrorMessage } from '../../lib/utils-functions';
import { Server } from '../../types/server';

// framer-motion을 동적 import로 처리
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false }
);

interface DashboardContentProps {
  showSequentialGeneration: boolean;
  servers: any[];
  status: any;
  actions: any;
  selectedServer: Server | null;
  onServerClick: (server: any) => void;
  onServerModalClose: () => void;
  onStatsUpdate: (stats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => void;
  onShowSequentialChange: (show: boolean) => void;
  mainContentVariants: any;
  isAgentOpen: boolean;
}

// 동적 임포트로 성능 최적화
const ServerDashboardDynamic = dynamic(() => import('./ServerDashboard'), {
  loading: () => (
    <div className='flex items-center justify-center p-8'>
      <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
    </div>
  ),
});

export default function DashboardContent({
  showSequentialGeneration,
  servers,
  status,
  actions,
  selectedServer,
  onServerClick,
  onServerModalClose,
  onStatsUpdate,
  onShowSequentialChange,
  mainContentVariants,
  isAgentOpen,
}: DashboardContentProps) {
  // 🚀 디버깅을 위한 콘솔 로그 추가
  console.log('🔍 DashboardContent 렌더링:', {
    showSequentialGeneration,
    serversCount: servers?.length,
    selectedServer: selectedServer?.name,
    isAgentOpen,
    status: status?.type,
    timestamp: new Date().toISOString(),
  });

  // 🎯 실제 서버 데이터 기반 통계 계산
  const serverStats = useMemo(() => {
    if (!servers || servers.length === 0) {
      return { total: 0, online: 0, warning: 0, offline: 0 };
    }

    const stats = servers.reduce(
      (acc, server) => {
        acc.total += 1;
        
        // 서버 상태 정규화 및 매핑
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
            // 알 수 없는 상태는 경고로 분류
            console.warn(`⚠️ 알 수 없는 서버 상태: ${server.status} (서버: ${server.name || server.id})`);
            acc.warning += 1;
        }
        return acc;
      },
      { total: 0, online: 0, warning: 0, offline: 0 }
    );

    console.log('📊 실제 서버 통계:', {
      ...stats,
      서버_목록: servers.map(s => ({ 
        이름: s.name || s.id, 
        상태: s.status,
        정규화된_상태: s.status?.toLowerCase() 
      }))
    });
    return stats;
  }, [servers]);

  // 🚀 에러 상태 추가
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [screenSize, setScreenSize] = useState<string>('알 수 없음');

  // 🛡️ 클라이언트 사이드 확인 및 실시간 업데이트
  useEffect(() => {
    setIsClient(true);

    // 화면 크기 감지 함수
    const updateScreenSize = () => {
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

    window.addEventListener('resize', resizeHandler);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  useEffect(() => {
    try {
      console.log('✅ DashboardContent 마운트됨');
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
      <div className='flex items-center justify-center p-8'>
        <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  // 🚀 렌더링 에러 처리
  if (renderError) {
    return (
      <div className='min-h-screen bg-red-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
          <div className='text-center'>
            <div className='text-red-500 text-4xl mb-4'>⚠️</div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              렌더링 오류
            </h2>
            <p className='text-gray-600 mb-4'>{renderError}</p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
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
      console.log('🔄 시퀀셜 생성 모드 렌더링');
      return (
        <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6'>
          <div className='max-w-7xl mx-auto'>
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                🔄 서버 생성 중...
              </h2>
              <p className='text-gray-600'>
                시퀀셜 서버 생성 모드가 활성화되었습니다.
              </p>
              <button
                onClick={() => onShowSequentialChange(false)}
                className='mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
              >
                일반 모드로 전환
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 일반 대시보드 모드 - 반응형 그리드 레이아웃
    console.log('📊 일반 대시보드 모드 렌더링');
    return (
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='h-full w-full'
      >
        <div className='h-full max-w-none 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 overflow-y-auto'>
          {/* 🎯 목업 데이터 모드 표시 */}
          {servers && servers.length > 0 && (
            <div className='bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4 mb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-3 h-3 bg-purple-500 rounded-full animate-pulse'></div>
                  <span className='text-purple-800 font-medium'>
                    🎭 DEMO MODE - 온프레미스 서버 시뮬레이션
                  </span>
                  <span className='text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full'>
                    목업 데이터
                  </span>
                  <span className='text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                    24시간 시나리오
                  </span>
                </div>
                <div className='flex items-center gap-4 text-sm'>
                  <div className='flex items-center gap-1'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                    <span className='text-gray-700'>
                      총 {serverStats.total}대
                    </span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-green-600'>
                      정상 {serverStats.online}대
                    </span>
                  </div>
                  {serverStats.warning > 0 && (
                    <div className='flex items-center gap-1'>
                      <div className='w-2 h-2 bg-yellow-500 rounded-full animate-pulse'></div>
                      <span className='text-yellow-600'>
                        경고 {serverStats.warning}대
                      </span>
                    </div>
                  )}
                  {serverStats.offline > 0 && (
                    <div className='flex items-center gap-1'>
                      <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                      <span className='text-red-600'>
                        오프라인 {serverStats.offline}대
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 📊 상세 통계 정보 */}
              <div className='mt-2 pt-2 border-t border-green-200/50'>
                <div className='flex items-center justify-between text-xs text-green-700'>
                  <span>
                    마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                  </span>
                  <span>
                    정상 비율: {serverStats.total > 0 ? Math.round((serverStats.online / serverStats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 상단 섹션: 인프라 현황 + 시스템 모니터링 */}
          <div className='grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-6'>
            {/* 🎛️ 인프라 전체 현황 - 큰 화면에서 2칸, 작은 화면에서 전체 */}
            <div className='lg:col-span-2 xl:col-span-2 2xl:col-span-2'>
              <Suspense
                fallback={
                  <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                    <div className='animate-pulse'>
                      <div className='h-6 bg-gray-200 rounded w-1/3 mb-4'></div>
                      <div className='space-y-3'>
                        <div className='h-4 bg-gray-200 rounded'></div>
                        <div className='h-4 bg-gray-200 rounded w-5/6'></div>
                      </div>
                    </div>
                  </div>
                }
              >
                {(() => {
                  try {
                    return (
                      <div className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'>
                        <div className="h-80 lg:h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                        <p className="text-gray-600">🚀 AI 기능이 GCP Functions로 이관되었습니다</p>
                      </div>
                      </div>
                    );
                  } catch (error) {
                    console.error(
                      '❌ InfrastructureOverviewPage 렌더링 에러:',
                      error
                    );
                    return (
                      <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                        <div className='text-center text-gray-500'>
                          <p>인프라 현황을 불러올 수 없습니다.</p>
                          <button
                            onClick={() => window.location.reload()}
                            className='mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm'
                          >
                            새로고침
                          </button>
                        </div>
                      </div>
                    );
                  }
                })()}
              </Suspense>
            </div>

            {/* 🎯 시스템 모니터링 패널 - 반응형 개선 */}
            <div className='lg:col-span-1 xl:col-span-1 2xl:col-span-1'>
              <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 h-80 lg:h-96'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-base lg:text-lg font-semibold text-gray-800'>
                    📊 시스템 모니터링
                  </h3>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                </div>
                <div className='space-y-3 lg:space-y-4'>
                  <div className='bg-white/70 rounded-lg p-3 lg:p-4'>
                    <div className='text-xs lg:text-sm text-gray-600 mb-1'>
                      실시간 업데이트
                    </div>
                    <div className='text-lg lg:text-2xl font-bold text-green-600'>
                      오후 {currentTime.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </div>
                  </div>
                  <div className='bg-white/70 rounded-lg p-3 lg:p-4'>
                    <div className='text-xs lg:text-sm text-gray-600 mb-1'>연결 상태</div>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                      <span className='text-xs lg:text-sm font-medium text-gray-800'>
                        정상 연결
                      </span>
                    </div>
                  </div>
                  <div className='bg-white/70 rounded-lg p-3 lg:p-4'>
                    <div className='text-xs lg:text-sm text-gray-600 mb-1'>
                      화면 해상도
                    </div>
                    <div className='text-sm lg:text-lg font-semibold text-gray-800'>
                      {screenSize}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🖥️ 서버 대시보드 - 메인 섹션 */}
          <div className='w-full pb-6'>
            <Suspense
              fallback={
                <div className='flex items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-gray-200'>
                  <div className='flex flex-col items-center gap-3'>
                    <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                    <p className='text-gray-600 text-sm'>
                      서버 대시보드 로딩 중...
                    </p>
                  </div>
                </div>
              }
            >
              {(() => {
                try {
                  return (
                    <div className='bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'>
                      <div className='p-4 border-b border-gray-200'>
                        <div className='flex items-center justify-between'>
                          <h2 className='text-xl font-bold text-gray-900'>
                            🖥️ 서버 현황
                          </h2>
                          <div className='flex items-center gap-2 text-sm text-gray-500'>
                            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                            <span>실시간 모니터링</span>
                          </div>
                        </div>
                      </div>
                      <div className='p-4'>
                        <ServerDashboardDynamic onStatsUpdate={onStatsUpdate} />
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error('❌ ServerDashboard 렌더링 에러:', error);
                  return (
                    <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                      <div className='text-center text-gray-500'>
                        <div className='text-red-500 text-4xl mb-4'>⚠️</div>
                        <p className='text-lg font-semibold mb-2'>
                          서버 대시보드 오류
                        </p>
                        <p className='text-sm mb-4'>
                          서버 대시보드를 불러올 수 없습니다.
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                        >
                          새로고침
                        </button>
                      </div>
                    </div>
                  );
                }
              })()}
            </Suspense>
          </div>
        </div>
      </MotionDiv>
    );
  } catch (error) {
    safeConsoleError('❌ DashboardContent 렌더링 에러', error);
    return (
      <div className='min-h-screen bg-red-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
          <div className='text-center'>
            <div className='text-red-500 text-4xl mb-4'>💥</div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              컴포넌트 오류
            </h2>
            <p className='text-gray-600 mb-4'>
              대시보드를 렌더링하는 중 오류가 발생했습니다.
            </p>
            <p className='text-gray-500 text-sm mb-4'>
              {safeErrorMessage(error, '상세 정보 없음')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }
}
