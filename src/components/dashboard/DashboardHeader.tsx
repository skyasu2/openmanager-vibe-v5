'use client';

import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { Bot, Clock } from 'lucide-react';
// 사용자 정보 관련 import는 UnifiedProfileHeader에서 처리됨
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';

// framer-motion을 동적 import로 처리
const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.button })),
  { ssr: false }
);
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);

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
  onMenuClick?: () => void;
  title?: string;
  /** 시스템 남은 시간 (밀리초) */
  systemRemainingTime?: number;
  /** 시스템 활성 상태 */
  isSystemActive?: boolean;
  /** 시스템 중지 핸들러 */
  onSystemStop?: () => void;
  /** 포맷된 남은 시간 문자열 */
  remainingTimeFormatted?: string;
}

/**
 * 실시간 시간 표시 컴포넌트
 */
const RealTimeDisplay = React.memo(function RealTimeDisplay() {
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
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Clock className="h-4 w-4 text-blue-500" />
      <span>
        {currentTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="text-gray-400">|</span>
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
const DashboardHeader = React.memo(function DashboardHeader({
  onNavigateHome,
  onToggleAgent, // 기존 호환성을 위해 유지
  isAgentOpen: _isAgentOpen = false, // 기존 호환성을 위해 유지
  onMenuClick: _onMenuClick,
  title: _title = 'OpenManager Dashboard',
  systemRemainingTime,
  isSystemActive = true,
  onSystemStop,
  remainingTimeFormatted,
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

  // 사용자 정보는 UnifiedProfileHeader에서 처리됨

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* 왼쪽: 브랜드 로고 */}
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-80"
            aria-label="홈으로 이동"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
              <i
                className="fas fa-server text-sm text-white"
                aria-hidden="true"
              ></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OpenManager</h1>
              <p className="text-xs text-gray-500">AI 서버 모니터링</p>
            </div>
          </button>
        </div>

        {/* 중앙: 실시간 정보 & 시스템 상태 */}
        <div className="hidden items-center gap-6 md:flex">
          <RealTimeDisplay />

          {/* 🕐 시스템 자동 종료 타이머 표시 */}
          {isSystemActive && remainingTimeFormatted && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1">
              <div className="flex items-center gap-2">
                <div className="_animate-pulse h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-sm font-medium text-yellow-800">
                  시스템 자동 종료: {remainingTimeFormatted}
                </span>
              </div>
              {systemRemainingTime && systemRemainingTime < 5 * 60 * 1000 && (
                <span className="_animate-pulse text-xs font-semibold text-red-600">
                  ⚠️ 곧 종료됨
                </span>
              )}
            </div>
          )}

          {/* 시스템 종료됨 표시 */}
          {!isSystemActive && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                시스템 종료됨
              </span>
            </div>
          )}
        </div>

        {/* 오른쪽: AI 어시스턴트 & 프로필 */}
        <div className="flex items-center gap-4">
          {/* AI 어시스턴트 토글 버튼 */}
          <div className="relative">
            <MotionButton
              onClick={handleAIAgentToggle}
              className={`relative transform rounded-xl p-3 transition-all duration-300 ${
                isSidebarOpen || aiAgent.isEnabled
                  ? 'scale-105 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              } `}
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
                <MotionDiv
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 opacity-75"
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
                  <div className="h-full w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500" />
                </MotionDiv>
              )}

              <div className="relative flex items-center gap-2">
                <MotionDiv
                  className={`h-5 w-5 ${isSidebarOpen || aiAgent.isEnabled ? 'text-white' : 'text-gray-600'}`}
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
                  <Bot className="h-5 w-5" />
                </MotionDiv>
                <span className="hidden text-sm font-medium sm:inline">
                  {aiAgent.isEnabled ? (
                    <MotionDiv
                      className="bg-gradient-to-r from-purple-100 via-pink-100 to-cyan-100 bg-clip-text font-bold text-transparent"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      AI 어시스턴트
                    </MotionDiv>
                  ) : (
                    'AI 어시스턴트'
                  )}
                </span>
              </div>

              {/* 활성화 상태 표시 */}
              {(isSidebarOpen || aiAgent.isEnabled) && (
                <MotionDiv
                  className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
              )}
            </MotionButton>

            {/* 손가락 아이콘 - AI 비활성화 시에만 표시 */}
            {!aiAgent.isEnabled &&
              !isSidebarOpen &&
              !ui.isSettingsPanelOpen && (
                <MotionDiv
                  className="finger-pointer-ai"
                  style={{
                    zIndex: isSidebarOpen || ui.isSettingsPanelOpen ? 10 : 30,
                  }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  ��
                </MotionDiv>
              )}
          </div>

          {/* 🎯 UnifiedProfileHeader 사용 - 통합된 프로필 헤더 */}
          <UnifiedProfileHeader
            onSystemStop={onSystemStop}
            parentSystemActive={isSystemActive}
          />
        </div>
      </div>

      {/* 모바일용 실시간 정보 */}
      <div className="space-y-2 border-t border-gray-200 bg-gray-50 px-6 py-2 md:hidden">
        <div className="flex items-center justify-center">
          <RealTimeDisplay />
        </div>

        {/* 🕐 모바일 시스템 상태 표시 */}
        {isSystemActive && remainingTimeFormatted && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs">
              <div className="_animate-pulse h-2 w-2 rounded-full bg-yellow-400" />
              <span className="font-medium text-yellow-800">
                자동 종료: {remainingTimeFormatted}
              </span>
              {systemRemainingTime && systemRemainingTime < 5 * 60 * 1000 && (
                <span className="_animate-pulse font-semibold text-red-600">
                  ⚠️
                </span>
              )}
            </div>
          </div>
        )}

        {!isSystemActive && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1 text-xs">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              <span className="font-medium text-gray-600">시스템 종료됨</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
