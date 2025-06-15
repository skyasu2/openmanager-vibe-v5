'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ServerDashboard from './ServerDashboard';
import InfrastructureOverviewPage from '@/components/ai/pages/InfrastructureOverviewPage';
import SystemAlertsPage from '@/components/ai/pages/SystemAlertsPage';

import { Server } from '../../types/server';
import { safeConsoleError, safeErrorMessage } from '../../lib/utils-functions';

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

  // 🚀 에러 상태 추가
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 🛡️ 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    try {
      console.log('✅ DashboardContent 마운트됨');
      setRenderError(null);
    } catch (error) {
      safeConsoleError('❌ DashboardContent 마운트 에러', error);
      setRenderError(safeErrorMessage(error, '알 수 없는 마운트 에러'));
    }
  }, []);

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

    // 일반 대시보드 모드 - 그리드 레이아웃으로 개선
    console.log('📊 일반 대시보드 모드 렌더링');
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='flex-1 p-6 overflow-auto'
      >
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* 🎯 인프라 전체 현황 및 실시간 알림 섹션 */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 🎛️ 인프라 전체 현황 */}
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
                      <InfrastructureOverviewPage className='h-96' />
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

            {/* 🚨 실시간 시스템 알림 */}
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
                      <SystemAlertsPage className='h-96' />
                    </div>
                  );
                } catch (error) {
                  console.error('❌ SystemAlertsPage 렌더링 에러:', error);
                  return (
                    <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                      <div className='text-center text-gray-500'>
                        <p>시스템 알림을 불러올 수 없습니다.</p>
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

          {/* 🖥️ 서버 대시보드 - 메인 섹션 */}
          <div className='w-full'>
            <Suspense
              fallback={
                <div className='flex items-center justify-center p-8'>
                  <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                </div>
              }
            >
              {(() => {
                try {
                  return (
                    <ServerDashboardDynamic onStatsUpdate={onStatsUpdate} />
                  );
                } catch (error) {
                  console.error('❌ ServerDashboard 렌더링 에러:', error);
                  return (
                    <div className='bg-white rounded-xl shadow-lg border border-gray-200 p-6'>
                      <div className='text-center text-gray-500'>
                        <p>서버 대시보드를 불러올 수 없습니다.</p>
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
        </div>
      </motion.div>
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
