'use client';

import { AutoLogoutWarning } from '@/components/auth/AutoLogoutWarning';
import { OptimizedDashboard } from '@/components/dashboard/OptimizedDashboard';
import { NotificationToast } from '@/components/system/NotificationToast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { AISidebar } from '@/presentation/ai-sidebar';
import { systemInactivityService } from '@/services/system/SystemInactivityService';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Error Boundary for Dashboard
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Dashboard Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-red-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
            <div className='text-center'>
              <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Dashboard Failed to Load
              </h2>
              <p className='text-gray-600 mb-4'>
                {this.state.error?.message || 'Unknown error'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardPageContent() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);

  // 🔒 자동 로그아웃 시스템 - 베르셀 사용량 최적화
  const { remainingTime, isWarning, resetTimer, forceLogout } = useAutoLogout({
    timeoutMinutes: 10, // 10분 비활성 시 로그아웃
    warningMinutes: 1,  // 1분 전 경고
    onWarning: () => {
      setShowLogoutWarning(true);
      console.log('⚠️ 자동 로그아웃 경고 표시 - 베르셀 사용량 최적화');
    },
    onLogout: () => {
      console.log('🔒 자동 로그아웃 실행 - 베르셀 사용량 최적화');
      systemInactivityService.pauseSystem();
    }
  });

  // 🌐 Redis + GCP 연동 확인 및 초기화
  useEffect(() => {
    console.log('🌐 Redis + GCP 최적화 대시보드 초기화');

    const initializeOptimizedDashboard = async () => {
      try {
        // Redis 연결 상태 확인
        const redisStatus = await fetch('/api/redis/status');
        if (redisStatus.ok) {
          console.log('✅ Redis 연결 확인됨');
        } else {
          console.warn('⚠️ Redis 연결 실패 - 폴백 모드');
        }

        // GCP 서버 데이터 확인
        const gcpStatus = await fetch('/api/gcp/server-data?limit=1');
        if (gcpStatus.ok) {
          console.log('✅ GCP 서버 데이터 연결 확인됨');
        } else {
          console.warn('⚠️ GCP 서버 데이터 연결 실패');
        }
      } catch (error) {
        console.warn('⚠️ 최적화 대시보드 초기화 실패:', error);
      }
    };

    // 🚀 비동기로 초기화 (블로킹하지 않음)
    initializeOptimizedDashboard();
  }, []);

  const toggleAgent = useCallback(() => {
    setIsAgentOpen(prev => !prev);
  }, []);

  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
  }, []);

  // 🔄 세션 연장 처리
  const handleExtendSession = useCallback(() => {
    resetTimer();
    setShowLogoutWarning(false);
    systemInactivityService.resumeSystem();
    console.log('🔄 사용자가 세션을 연장했습니다 - 베르셀 사용량 최적화');
  }, [resetTimer]);

  // 🔒 즉시 로그아웃 처리
  const handleLogoutNow = useCallback(() => {
    forceLogout();
    setShowLogoutWarning(false);
    console.log('🔒 사용자가 즉시 로그아웃을 선택했습니다');
  }, [forceLogout]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* 메인 대시보드 영역 */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${isAgentOpen ? 'mr-96' : 'mr-0'
          }`}
      >
        <div className="p-6">
          {/* 대시보드 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🌐 최적화 대시보드
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Google Cloud → Redis → Vercel 아키텍처 • SWR 캐싱 활성화
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* 자동 로그아웃 타이머 */}
                {isWarning && (
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    ⏰ {Math.ceil(remainingTime / 60)}분 후 자동 로그아웃
                  </div>
                )}

                {/* AI 어시스턴트 토글 버튼 */}
                <button
                  onClick={toggleAgent}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {isAgentOpen ? '🤖 AI 닫기' : '🤖 AI 열기'}
                </button>
              </div>
            </div>
          </div>

          {/* 🌐 Redis + SWR 최적화 대시보드 */}
          <DashboardErrorBoundary>
            <OptimizedDashboard />
          </DashboardErrorBoundary>
        </div>
      </main>

      {/* AI 어시스턴트 사이드바 */}
      <AnimatePresence>
        {isAgentOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-40 border-l border-gray-200 dark:border-gray-700"
          >
            <AISidebar
              isOpen={isAgentOpen}
              onClose={closeAgent}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 자동 로그아웃 경고 모달 */}
      <AnimatePresence>
        {showLogoutWarning && (
          <AutoLogoutWarning
            remainingTime={remainingTime}
            isWarning={showLogoutWarning}
            onExtendSession={handleExtendSession}
            onLogoutNow={handleLogoutNow}
          />
        )}
      </AnimatePresence>

      {/* 시스템 알림 토스트 */}
      <NotificationToast />
    </div>
  );
}

/**
 * 🌐 최적화 대시보드 메인 페이지
 * 
 * 핵심 기능:
 * - Redis 직접 읽기 + Batch API
 * - SWR 캐싱 (30초 브라우저 캐시, 1분 자동 업데이트)
 * - Google Cloud 실시간 데이터 연동
 * - 월 사용량 90% 절약
 */
export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardPageContent />
    </DashboardErrorBoundary>
  );
}
