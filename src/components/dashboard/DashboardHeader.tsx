'use client';

import { memo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '../ui/ToastNotification';
import dynamic from 'next/dynamic';

// 추가된 임포트
import UnifiedProfileComponent from '../UnifiedProfileComponent';
import { useAISidebarStore } from '@/stores/useAISidebarStore';

// ⚡ Dynamic Import로 Vercel 최적화 AI 사이드바 - 성능 최적화
const VercelOptimizedAISidebar = dynamic(
  () =>
    import('../../modules/ai-sidebar/components/VercelOptimizedAISidebar').then(
      mod => ({ default: mod.VercelOptimizedAISidebar })
    ),
  {
    ssr: false, // AI 컴포넌트는 클라이언트 전용
    loading: () => (
      <div className='fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-sm shadow-lg border-l border-gray-200 z-50 flex items-center justify-center'>
        <div className='flex flex-col items-center space-y-3'>
          <div className='w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin'></div>
          <span className='text-sm text-gray-600 font-medium'>
            AI 시스템 로딩 중...
          </span>
          <div className='text-xs text-gray-400'>최초 로딩 시 3-5초 소요</div>
        </div>
      </div>
    ),
  }
);

/**
 * 서버 통계 인터페이스
 */
interface ServerStats {
  /** 전체 서버 수 */
  total: number;
  /** 온라인 서버 수 */
  online: number;
  /** 경고 상태 서버 수 */
  warning: number;
  /** 오프라인 서버 수 */
  offline: number;
}

/**
 * 대시보드 헤더 컴포넌트 Props
 */
interface DashboardHeaderProps {
  /** 서버 통계 데이터 */
  serverStats: ServerStats;
  /** 홈으로 이동 핸들러 */
  onNavigateHome: () => void;
  /** AI 에이전트 토글 핸들러 - 기존 호환성을 위해 유지하지만 새로운 사이드바에서는 내부적으로 처리 */
  onToggleAgent?: () => void;
  /** AI 에이전트 열림 상태 - 기존 호환성을 위해 유지 */
  isAgentOpen?: boolean;
  /** 시스템 상태 표시 컴포넌트 */
  systemStatusDisplay: React.ReactNode;
}

/**
 * 대시보드 메인 헤더 컴포넌트
 *
 * @description
 * - 브랜드 로고 및 네비게이션
 * - 실시간 서버 통계 표시
 * - AI 에이전트 토글 버튼 (새로운 사이드바 연동)
 * - 시스템 상태 표시
 *
 * @example
 * ```tsx
 * <DashboardHeader
 *   serverStats={{ total: 10, online: 8, warning: 1, offline: 1 }}
 *   onNavigateHome={() => router.push('/')}
 *   systemStatusDisplay={<SystemStatusDisplay />}
 * />
 * ```
 */
const DashboardHeader = memo(function DashboardHeader({
  serverStats,
  onNavigateHome,
  onToggleAgent, // 기존 호환성을 위해 유지
  isAgentOpen = false, // 기존 호환성을 위해 유지
  systemStatusDisplay,
}: DashboardHeaderProps) {
  const { aiAgent, ui } = useUnifiedAdminStore();
  const { warning } = useToast();

  // 새로운 AI 사이드바 상태
  const { isOpen: isSidebarOpen, setOpen: setSidebarOpen } =
    useAISidebarStore();

  // AI 에이전트 토글 핸들러 (새로운 사이드바 연동) - 인증 제한 제거
  const handleAIAgentToggle = () => {
    // 인증 체크 제거 - 누구나 AI 에이전트 사용 가능
    console.log('🤖 AI 에이전트 토글 - 인증 제한 없음');

    // 새로운 사이드바 토글
    setSidebarOpen(!isSidebarOpen);

    // 기존 호환성을 위한 콜백 호출
    onToggleAgent?.();
  };

  return (
    <>
      <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-4'>
            <button
              onClick={onNavigateHome}
              className='flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer'
              aria-label='홈으로 이동'
            >
              <div className='w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <i
                  className='fas fa-server text-white text-sm'
                  aria-hidden='true'
                ></i>
              </div>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>OpenManager</h1>
                <p className='text-xs text-gray-500'>AI 서버 모니터링</p>
              </div>
            </button>
          </div>

          <div className='flex items-center gap-4'>
            {/* 시스템 상태 표시 */}
            {systemStatusDisplay}

            {/* 빠른 통계 - 실시간 데이터 */}
            <div
              className='hidden md:flex items-center gap-6'
              role='status'
              aria-label='서버 통계'
            >
              {/* 서버데이터 생성기 상태 표시 */}
              <div
                className='flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg'
                title='실제 서버데이터 생성기 연동'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-xs text-green-700 font-medium'>LIVE</span>
              </div>

              <div className='text-center'>
                <div className='text-sm font-medium text-gray-900'>
                  {serverStats.total}대
                </div>
                <div className='text-xs text-gray-500'>전체 서버</div>
              </div>
              <div className='text-center'>
                <div className='text-sm font-medium text-green-600'>
                  {serverStats.online}대
                </div>
                <div className='text-xs text-gray-500'>온라인</div>
              </div>
              <div className='text-center'>
                <div className='text-sm font-medium text-orange-600'>
                  {serverStats.warning}대
                </div>
                <div className='text-xs text-gray-500'>경고</div>
              </div>
              <div className='text-center'>
                <div className='text-sm font-medium text-red-600'>
                  {serverStats.offline}대
                </div>
                <div className='text-xs text-gray-500'>오프라인</div>
              </div>

              {/* 실시간 업데이트 표시 */}
              <div className='text-center'>
                <div className='text-xs text-gray-500'>마지막 업데이트</div>
                <div className='text-xs text-gray-400'>
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* AI 에이전트 토글 버튼 - 프로필 바로 왼쪽에 배치 */}
            <div className='relative'>
              <motion.button
                onClick={handleAIAgentToggle}
                className={`
                  relative p-3 rounded-xl transition-all duration-300 transform
                  ${
                    isSidebarOpen || aiAgent.isEnabled
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  }
                `}
                title={isSidebarOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'}
                aria-label={
                  isSidebarOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'
                }
                aria-pressed={isSidebarOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* AI 활성화 시 그라데이션 테두리 애니메이션 */}
                {aiAgent.isEnabled && (
                  <motion.div
                    className='absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 opacity-75'
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{
                      background:
                        'conic-gradient(from 0deg, #a855f7, #ec4899, #06b6d4, #a855f7)',
                      padding: '2px',
                      borderRadius: '0.75rem',
                    }}
                  >
                    <div className='w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl' />
                  </motion.div>
                )}

                <div className='relative flex items-center gap-2'>
                  <motion.div
                    className={`w-5 h-5 ${isSidebarOpen || aiAgent.isEnabled ? 'text-white' : 'text-gray-600'}`}
                    animate={
                      aiAgent.isEnabled
                        ? {
                            rotate: [0, 360],
                            scale: [1, 1.2, 1],
                          }
                        : {}
                    }
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                      scale: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                  >
                    <Bot className='w-5 h-5' />
                  </motion.div>
                  <span className='hidden sm:inline text-sm font-medium'>
                    {aiAgent.isEnabled ? (
                      <motion.span
                        className='bg-gradient-to-r from-purple-100 via-pink-100 to-cyan-100 bg-clip-text text-transparent font-bold'
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        AI 에이전트
                      </motion.span>
                    ) : (
                      'AI 에이전트'
                    )}
                  </span>
                </div>

                {/* 활성화 상태 표시 */}
                {(isSidebarOpen || aiAgent.isEnabled) && (
                  <motion.div
                    className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white'
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    aria-hidden='true'
                  />
                )}
              </motion.button>

              {/* 손가락 아이콘 - AI 비활성화 시에만 표시, 모달이나 사이드바 열릴 때 숨김 */}
              {!aiAgent.isEnabled &&
                !isSidebarOpen &&
                !ui.isSettingsPanelOpen && (
                  <motion.div
                    className='finger-pointer-ai'
                    style={{
                      zIndex: isSidebarOpen || ui.isSettingsPanelOpen ? 10 : 45, // 사이드바나 설정 패널 열릴 때 z-index 낮춤
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    👆
                  </motion.div>
                )}
            </div>

            {/* 프로필 컴포넌트 - 가장 오른쪽에 배치 */}
            <UnifiedProfileComponent userName='사용자' />
          </div>
        </div>
      </header>

      {/* Vercel 최적화 AI 사이드바 */}
      <VercelOptimizedAISidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
