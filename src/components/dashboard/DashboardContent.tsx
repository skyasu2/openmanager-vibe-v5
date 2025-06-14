'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import ServerDashboard from './ServerDashboard';
import GoogleAIStatusCard from './GoogleAIStatusCard';
import AIInsightsCard from './AIInsightsCard';
import InfrastructureOverview from './monitoring/InfrastructureOverview';
import LiveSystemAlerts from './monitoring/LiveSystemAlerts';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';

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
  const { expandAll, collapseAll } = useDashboardToggleStore();
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
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'critical',
    'warning',
    'normal',
  ]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0,
  });

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

    // 일반 대시보드 모드 - 메인 사이드바와 통합
    console.log('📊 일반 대시보드 모드 렌더링');
    return (
      <div className='min-h-screen bg-gray-50 flex relative'>
        {/* 메인 대시보드 영역 - AI 사이드바는 dashboard/page.tsx에서 관리 */}
        <div className='flex-1'>
          {/* 상단 모니터링 도구 영역 제거 (요청에 따라 숨김) */}
          <div className='hidden'>
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
              <div className='flex items-center space-x-4'>
                <div className='text-sm text-gray-500'>
                  총 {stats.total}개 서버 • 심각→경고→정상 순 정렬
                </div>
                {/* 전체 접기/펼치기 컨트롤 */}
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={expandAll}
                    className='flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors'
                    title='모든 섹션 펼치기'
                  >
                    <Maximize2 className='w-3 h-3' />
                    <span>전체 펼치기</span>
                  </button>
                  <button
                    onClick={collapseAll}
                    className='flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors'
                    title='모든 섹션 접기'
                  >
                    <Minimize2 className='w-3 h-3' />
                    <span>전체 접기</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 서버 대시보드 영역 (60%) */}
          <div className='h-[60vh] overflow-auto'>
            <ServerDashboard onStatsUpdate={handleStatsUpdate} />
          </div>
        </div>
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
