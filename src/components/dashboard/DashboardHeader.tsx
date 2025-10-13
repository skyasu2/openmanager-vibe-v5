'use client';

import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { isGuestFullAccessEnabled } from '@/config/guestMode';
import { Bot } from 'lucide-react';
// 사용자 정보 관련 import는 UnifiedProfileHeader에서 처리됨
import dynamic from 'next/dynamic';
import React, { useEffect, useState, memo } from 'react';
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import { RealTimeDisplay } from './RealTimeDisplay';
import { SystemStatusBadge } from './SystemStatusBadge';
import { AIAssistantButton } from './AIAssistantButton';
import debug from '@/utils/debug';

// framer-motion 제거 - CSS 애니메이션 사용

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
  isAgentOpen: _isAgentOpen = false, // 기존 호환성을 위해 유지
  onMenuClick: _onMenuClick,
  title: _title = 'OpenManager Dashboard',
  systemRemainingTime,
  isSystemActive = true,
  onSystemStop,
  remainingTimeFormatted,
}: DashboardHeaderProps) {
  // 🔒 Hydration 불일치 방지를 위한 클라이언트 전용 상태
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { aiAgent, ui } = useUnifiedAdminStore();
  // 🔐 사용자 권한 확인
  const permissions = useUserPermissions();
  // 새로운 AI 사이드바 상태
  const { isOpen: isSidebarOpen, setOpen: setSidebarOpen } =
    useAISidebarStore();

  // AI 에이전트 토글 핸들러 (새로운 사이드바 연동)
  const handleAIAgentToggle = () => {
    debug.log('🤖 AI 어시스턴트 토글');

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
          <SystemStatusBadge
            isActive={isSystemActive}
            remainingTimeFormatted={remainingTimeFormatted}
            remainingTime={systemRemainingTime}
          />
        </div>

        {/* 오른쪽: AI 어시스턴트 & 프로필 */}
        <div className="flex items-center gap-4">
          {/* 🔐 권한이 있는 사용자 또는 게스트 전체 접근 모드에서 AI 어시스턴트 토글 버튼 표시 */}
          {(permissions.canToggleAI || isGuestFullAccessEnabled()) && (
            <AIAssistantButton
              isOpen={isSidebarOpen}
              isEnabled={aiAgent.isEnabled}
              onClick={handleAIAgentToggle}
            />
          )}

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
        <div className="flex items-center justify-center">
          <SystemStatusBadge
            isActive={isSystemActive}
            remainingTimeFormatted={remainingTimeFormatted}
            remainingTime={systemRemainingTime}
          />
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
