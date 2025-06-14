'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import dynamic from 'next/dynamic';
import ServerDashboard from './ServerDashboard';
import GoogleAIStatusCard from './GoogleAIStatusCard';
import AIInsightsCard from './AIInsightsCard';
import InfrastructureOverview from './monitoring/InfrastructureOverview';
import LiveSystemAlerts from './monitoring/LiveSystemAlerts';
import { AISidebarV2 } from '@/domains/ai-sidebar/components/AISidebarV2';

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
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0,
  });
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true);

  useEffect(() => {
    try {
      console.log('✅ DashboardContent 마운트됨');
      setRenderError(null);
    } catch (error) {
      safeConsoleError('❌ DashboardContent 마운트 에러', error);
      setRenderError(safeErrorMessage(error, '알 수 없는 마운트 에러'));
    }
  }, []);

  const handleStatsUpdate = (newStats: {
    total: number;
    online: number;
    warning: number;
    offline: number;
  }) => {
    setStats(newStats);
    onStatsUpdate(newStats);
  };

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

    // 일반 대시보드 모드 - 30% AI 사이드바 구조
    console.log('📊 일반 대시보드 모드 렌더링');
    return (
      <div className='min-h-screen bg-gray-50 flex relative'>
        {/* 메인 대시보드 영역 */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isAISidebarOpen ? 'mr-[30%]' : 'mr-0'
          }`}
        >
          {/* 상단 모니터링 도구 영역 (40%) */}
          <div className='h-[40vh] p-6 bg-white border-b border-gray-200'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 h-full'>
              {/* 좌측: Infrastructure Overview */}
              <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100'>
                <InfrastructureOverview stats={stats} />
              </div>

              {/* 우측: Live System Alerts */}
              <div className='bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100'>
                <LiveSystemAlerts />
              </div>
            </div>
          </div>

          {/* 중간: 서버 분류 필터 영역 */}
          <div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  서버 현황
                </h3>
                <div className='flex items-center space-x-2'>
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                    <span className='text-sm text-gray-600'>
                      심각 ({stats.offline})
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                    <span className='text-sm text-gray-600'>
                      경고 ({stats.warning})
                    </span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <span className='text-sm text-gray-600'>
                      정상 ({stats.online})
                    </span>
                  </div>
                </div>
              </div>
              <div className='text-sm text-gray-500'>
                총 {stats.total}개 서버 • 심각→경고→정상 순 정렬
              </div>
            </div>
          </div>

          {/* 서버 대시보드 영역 (60%) */}
          <div className='h-[60vh] overflow-auto'>
            <ServerDashboard onStatsUpdate={handleStatsUpdate} />
          </div>
        </div>

        {/* AI 사이드바 토글 버튼 */}
        <motion.button
          onClick={() => setIsAISidebarOpen(!isAISidebarOpen)}
          className={`fixed top-1/2 -translate-y-1/2 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-l-lg shadow-lg transition-all duration-300 ${
            isAISidebarOpen ? 'right-[30%]' : 'right-0'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAISidebarOpen ? (
            <ChevronRight className='w-5 h-5' />
          ) : (
            <div className='flex flex-col items-center'>
              <ChevronLeft className='w-5 h-5 mb-1' />
              <Bot className='w-5 h-5' />
            </div>
          )}
        </motion.button>

        {/* AI 사이드바 - AISidebarV2 컴포넌트 사용 */}
        <AnimatePresence>
          {isAISidebarOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className='fixed right-0 top-0 w-[30%] h-full bg-white shadow-2xl border-l border-gray-200 z-40'
            >
              <AISidebarV2
                isOpen={isAISidebarOpen}
                onClose={() => setIsAISidebarOpen(false)}
                className='w-full h-full'
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  } catch (error) {
    safeConsoleError('❌ DashboardContent 렌더링 에러', error);
    return (
      <div className='min-h-screen bg-red-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
          <div className='text-center'>
            <div className='text-red-500 text-4xl mb-4'>💥</div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              렌더링 실패
            </h2>
            <p className='text-gray-600 mb-4'>
              {safeErrorMessage(error, '알 수 없는 렌더링 오류')}
            </p>
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
}
