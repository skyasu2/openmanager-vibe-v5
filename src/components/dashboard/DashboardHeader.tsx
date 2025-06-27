'use client';

import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { Bot, Clock } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

// 추가된 임포트
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import UnifiedProfileComponent from '../UnifiedProfileComponent';

/**
 * 대시보드 헤더 컴포넌트 Props
 */
interface DashboardHeaderProps {
  /** 홈으로 이동 핸들러 */
  onNavigateHome: () => void;
  /** AI 에이전트 토글 핸들러 - 기존 호환성을 위해 유지 */
  onToggleAgent?: () => void;
  /** AI 에이전트 열림 상태 - 기존 호환성을 위해 유지 */
  isAgentOpen?: boolean;
}

/**
 * 실시간 시간 표시 컴포넌트
 */
const RealTimeDisplay = memo(function RealTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className='flex items-center gap-2 text-sm text-gray-600'>
      <Clock className='w-4 h-4 text-blue-500' />
      <span>
        {currentTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className='text-gray-400'>|</span>
      <span>
        {currentTime.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        })}
      </span>
    </div>
  );
});

/**
 * 대시보드 메인 헤더 컴포넌트
 *
 * @description
 * - 브랜드 로고 및 네비게이션
 * - AI 어시스턴트 토글 버튼
 * - 실시간 시간 표시
 * - 프로필 컴포넌트
 *
 * @example
 * ```tsx
 * <DashboardHeader
 *   onNavigateHome={() => router.push('/')}
 * />
 * ```
 */
const DashboardHeader = memo(function DashboardHeader({
  onNavigateHome,
  onToggleAgent, // 기존 호환성을 위해 유지
  isAgentOpen = false, // 기존 호환성을 위해 유지
}: DashboardHeaderProps) {
  const { aiAgent, ui } = useUnifiedAdminStore();

  // 새로운 AI 사이드바 상태
  const { isOpen: isSidebarOpen, setOpen: setSidebarOpen } =
    useAISidebarStore();

  // AI 에이전트 토글 핸들러 (새로운 사이드바 연동)
  const handleAIAgentToggle = () => {
    console.log('🤖 AI 어시스턴트 토글');

    // 새로운 사이드바 토글
    setSidebarOpen(!isSidebarOpen);

    // 기존 호환성을 위한 콜백 호출
    onToggleAgent?.();
  };

  return (
    <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40'>
      <div className='flex items-center justify-between px-6 py-4'>
        {/* 왼쪽: 브랜드 로고 */}
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

        {/* 중앙: 실시간 정보 */}
        <div className='hidden md:flex items-center gap-6'>
          <RealTimeDisplay />
        </div>

        {/* 오른쪽: AI 어시스턴트 & 프로필 */}
        <div className='flex items-center gap-4'>
          {/* AI 어시스턴트 토글 버튼 */}
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
              title={
                isSidebarOpen ? 'AI 어시스턴트 닫기' : 'AI 어시스턴트 열기'
              }
              aria-label={
                isSidebarOpen ? 'AI 어시스턴트 닫기' : 'AI 어시스턴트 열기'
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
                      AI 어시스턴트
                    </motion.span>
                  ) : (
                    'AI 어시스턴트'
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

            {/* 손가락 아이콘 - AI 비활성화 시에만 표시 */}
            {!aiAgent.isEnabled &&
              !isSidebarOpen &&
              !ui.isSettingsPanelOpen && (
                <motion.div
                  className='finger-pointer-ai'
                  style={{
                    zIndex: isSidebarOpen || ui.isSettingsPanelOpen ? 10 : 45,
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

          {/* 프로필 컴포넌트 */}
          <UnifiedProfileComponent userName='사용자' />
        </div>
      </div>

      {/* 모바일용 실시간 정보 */}
      <div className='md:hidden px-6 py-2 bg-gray-50 border-t border-gray-200'>
        <div className='flex items-center justify-center gap-6'>
          <RealTimeDisplay />
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
