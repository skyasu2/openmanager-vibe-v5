'use client';

/**
 * 🚀 OptimizedDashboard v2.5
 * Phase 2-5 시점 복원: 통합된 대시보드 컴포넌트
 *
 * 통합 기능:
 * - DashboardHeader + DashboardContent 통합
 * - framer-motion 직접 import (SSR 호환)
 * - 실시간 서버 모니터링
 * - AI 사이드바 통합
 */

import { useToast } from '@/hooks/use-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useServerDashboard } from '@/hooks/useServerDashboard';
// useSystemIntegration은 GCP Functions로 이관됨
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { Server } from '@/types/server';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Clock, LogOut, User } from 'lucide-react';
import { useSession, signOut } from '@/hooks/useSupabaseSession';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 컴포넌트 import
import { AutoLogoutWarning } from '@/components/auth/AutoLogoutWarning';
import EnhancedServerModal from './EnhancedServerModal';
import ServerDashboard from './ServerDashboard';

// AI 사이드바는 GCP Functions로 이관됨
// import { AISidebar } from '@/presentation/ai-sidebar';

interface OptimizedDashboardProps {
  servers?: Server[];
  isLoading?: boolean;
  error?: string | null;
}

export default function OptimizedDashboard({
  servers: propServers,
  isLoading: propIsLoading,
  error: propError,
}: OptimizedDashboardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // AI 사이드바 스토어
  const { isOpen: isAgentOpen, setOpen } = useAISidebarStore();
  const toggleAgent = () => setOpen(!isAgentOpen);
  const closeAgent = () => setOpen(false);

  // 서버 모달 상태
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 시스템 통합 상태 (GCP Functions로 이관됨)
  const systemStatus = { isHealthy: true };
  const isConnected = systemStatus.isHealthy;
  const healthStatus = systemStatus.isHealthy ? 'healthy' : 'critical';

  // 서버 데이터 (prop 우선, 없으면 hook 사용)
  const {
    paginatedServers: hookServers,
    isLoading: hookIsLoading,
    error: hookError,
  } = useServerDashboard({});

  const servers = propServers || hookServers;
  const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;
  const error = propError !== undefined ? propError : hookError;

  // 자동 로그아웃 훅
  const {
    remainingTime,
    isWarning: showLogoutWarning,
    updateActivity,
    logout: handleLogoutNow,
  } = useAutoLogout({
    timeoutMinutes: 10,
    warningMinutes: 1,
    onWarning: () => {
      toast({
        title: '⏰ 자동 로그아웃 경고',
        description: '1분 후 자동 로그아웃됩니다. 세션을 연장하시겠습니까?',
        variant: 'destructive',
      });
    },
    onLogout: () => {
      toast({
        title: '🔒 자동 로그아웃',
        description: '비활성으로 인한 자동 로그아웃되었습니다.',
      });
      router.push('/login');
    },
  });

  const handleExtendSession = () => {
    updateActivity();
  };

  // 실시간 시계
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 로그인 상태 확인
  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/login');
    }
  }, [session, status, router]);

  // 서버 선택 핸들러
  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    setIsServerModalOpen(true);
  };

  // 서버 모달 닫기
  const handleServerModalClose = () => {
    setIsServerModalOpen(false);
    setSelectedServer(null);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  // 로딩 상태
  if (status === 'loading' || !session) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-violet-900 flex items-center justify-center'>
        <div className='text-center text-white'>
          <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-lg'>시스템 초기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 relative'>
      {/* 자동 로그아웃 경고 */}
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

      {/* 메인 레이아웃 */}
      <div
        className={`flex transition-all duration-300 ${isAgentOpen ? 'mr-80' : ''}`}
      >
        {/* 메인 콘텐츠 */}
        <div className='flex-1 flex flex-col min-h-screen'>
          {/* 통합 헤더 */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4'
          >
            <div className='flex items-center justify-between'>
              {/* 브랜드 로고 */}
              <div className='flex items-center space-x-4'>
                <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-xl'>O</span>
                </div>
                <div>
                  <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    OpenManager AI
                  </h1>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    서버 모니터링 시스템
                  </p>
                </div>
              </div>

              {/* 중앙 정보 */}
              <div className='flex items-center space-x-6'>
                {/* 실시간 시계 */}
                <div className='flex items-center space-x-2 text-gray-600 dark:text-gray-300'>
                  <Clock className='w-5 h-5' />
                  <span className='font-mono text-sm'>
                    {currentTime.toLocaleTimeString('ko-KR')}
                  </span>
                </div>

                {/* AI 어시스턴트 토글 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleAgent}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isAgentOpen
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
                  }`}
                >
                  <Bot className='w-4 h-4' />
                  <span className='text-sm font-medium'>
                    {isAgentOpen ? 'AI 닫기' : 'AI 열기'}
                  </span>
                </motion.button>
              </div>

              {/* 사용자 메뉴 */}
              <div className='flex items-center space-x-4'>
                {/* 시스템 상태 */}
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={isConnected ? '시스템 연결됨' : '시스템 연결 안됨'}
                />

                {/* 사용자 정보 */}
                <div className='flex items-center space-x-3'>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>
                      {session.user?.name || '사용자'}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {session.user?.email}
                    </p>
                  </div>
                  <div className='w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center'>
                    <User className='w-4 h-4 text-gray-600 dark:text-gray-300' />
                  </div>
                </div>

                {/* 로그아웃 버튼 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className='p-2 text-gray-500 hover:text-red-600 transition-colors'
                  title='로그아웃'
                >
                  <LogOut className='w-5 h-5' />
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* 대시보드 콘텐츠 */}
          <main className='flex-1 p-6'>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ServerDashboard onStatsUpdate={() => {}} />
            </motion.div>
          </main>
        </div>

        {/* AI 사이드바 */}
        <AnimatePresence mode='wait'>
          {isAgentOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className='w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-30'
            >
              <div className="p-4">
                <button onClick={closeAgent} className="absolute top-4 right-4">✕</button>
                <p className="text-center text-gray-600 mt-8">🚀 AI 기능이 GCP Functions로 이관되었습니다</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 플로팅 시스템 컨트롤 제거됨 - Vercel 플랫폼 자체 모니터링 사용 */}

      {/* AI 에이전트 토글 버튼 (오른쪽 하단) */}
      <div className='fixed bottom-6 right-6 z-20'>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleAgent}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            isAgentOpen
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
          }`}
          aria-label={isAgentOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'}
        >
          {isAgentOpen ? (
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          ) : (
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z'
              />
            </svg>
          )}
        </motion.button>
      </div>

      {/* 서버 상세 모달 */}
      <AnimatePresence>
        {isServerModalOpen && selectedServer && selectedServer.hostname && (
          <EnhancedServerModal
            server={{
              ...selectedServer,
              hostname:
                selectedServer.hostname || selectedServer.name || 'Unknown',
              type: selectedServer.type || 'unknown',
              environment: selectedServer.environment || 'unknown',
              location: selectedServer.location || 'unknown',
              provider: selectedServer.provider || 'unknown',
              status:
                selectedServer.status === 'online'
                  ? 'healthy'
                  : selectedServer.status,
              uptime:
                typeof selectedServer.uptime === 'number'
                  ? selectedServer.uptime.toString()
                  : selectedServer.uptime,
              alerts:
                typeof selectedServer.alerts === 'number'
                  ? selectedServer.alerts
                  : Array.isArray(selectedServer.alerts)
                    ? selectedServer.alerts.length
                    : 0,
              networkStatus:
                selectedServer.networkStatus === 'healthy'
                  ? 'good'
                  : selectedServer.networkStatus === 'critical'
                    ? 'poor'
                    : selectedServer.networkStatus === 'warning'
                      ? 'poor'
                      : selectedServer.networkStatus === 'maintenance'
                        ? 'offline'
                        : selectedServer.networkStatus,
            }}
            onClose={handleServerModalClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
