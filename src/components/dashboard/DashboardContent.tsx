'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import ServerDashboard from './ServerDashboard';

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

  useEffect(() => {
    try {
      console.log('✅ DashboardContent 마운트됨');
      setRenderError(null);
    } catch (error) {
      safeConsoleError('❌ DashboardContent 마운트 에러', error);
      setRenderError(safeErrorMessage(error, '알 수 없는 마운트 에러'));
    }
  }, []);

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

    // 일반 대시보드 모드 - 단일 컬럼 레이아웃으로 변경
    console.log('📊 일반 대시보드 모드 렌더링');
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='flex-1 p-6 overflow-auto'
      >
        {/* 서버 대시보드 - 전체 너비 사용 */}
        <div className='w-full'>
          <Suspense
            fallback={
              <div className='flex items-center justify-center p-8'>
                <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            }
          >
            <ServerDashboard onStatsUpdate={onStatsUpdate} />
          </Suspense>
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
