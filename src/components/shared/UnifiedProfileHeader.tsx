'use client';

import React, { useCallback, useMemo } from 'react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useSystemStatusStore } from '@/stores/useSystemStatusStore';
// framer-motion 제거 - CSS 애니메이션 사용
import {
  BarChart3,
  ChevronDown,
  Crown,
  LogOut,
  Power,
  Shield,
} from 'lucide-react';

// 프로필 컴포넌트 임포트
import {
  ProfileAvatar,
  UserTypeIcon,
} from '@/components/profile/components/ProfileAvatar';
import { ProfileDropdownMenu } from '@/components/profile/components/ProfileDropdownMenu';
import { EnhancedProfileStatusDisplay } from '@/components/unified-profile/EnhancedProfileStatusDisplay';

// 프로필 훅 임포트
import { useProfileAuth } from '@/components/profile/hooks/useProfileAuth';
import { useProfileMenu } from '@/components/profile/hooks/useProfileMenu';
import { useProfileSecurity } from '@/components/profile/hooks/useProfileSecurity';

// 타입 임포트
import type {
  MenuItem,
  UnifiedProfileHeaderProps,
} from '@/components/profile/types/profile.types';

/**
 * 통합 프로필 헤더 컴포넌트 (리팩토링 버전)
 * 모든 페이지에서 일관된 프로필 UI 제공
 */
export default function UnifiedProfileHeader({
  className = '',
}: Omit<UnifiedProfileHeaderProps, 'onSystemStop' | 'parentSystemActive'>) {
  // 훅 사용
  const {
    userInfo,
    userType,
    status,
    handleLogout,
    navigateToLogin,
    navigateToAdmin,
    navigateToDashboard,
  } = useProfileAuth();

  const { securityState, isAdminMode, authenticateAdmin, disableAdminMode } =
    useProfileSecurity();

  const {
    menuState,
    dropdownRef,
    toggleMenu,
    closeMenu,
    toggleAdminInput,
    setAdminPassword,
    cancelAdminInput,
  } = useProfileMenu();

  const { status: systemStatus } = useSystemStatus();
  const { isSystemStarted } = useUnifiedAdminStore(); // 🎯 로컬 상태 직접 접근으로 즉시 동기화

  // 🔄 Zustand 스토어에서 시스템 상태 직접 읽기 (Props Drilling 제거)
  const { stop: systemStopHandler } = useSystemStatusStore();

  // 시스템 종료 핸들러 - 스토어의 stop 함수 사용
  const handleSystemStop = useCallback(async () => {
    const confirmed = confirm(
      '⚠️ 시스템을 종료하시겠습니까?\n\n종료 후 메인 페이지에서 다시 시작할 수 있습니다.'
    );

    if (!confirmed) return;

    try {
      closeMenu();
      console.log('🛑 시스템 종료 요청 (프로필에서)');

      // 스토어에 등록된 DashboardClient의 stopSystem 호출
      if (systemStopHandler) {
        systemStopHandler();
        console.log('✅ 시스템 종료 성공 (스토어 통합)');
      } else {
        // Fallback: 직접 API 호출
        const response = await fetch('/api/system/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop' }),
        });

        if (response.ok) {
          console.log('✅ 시스템 종료 성공');
          localStorage.removeItem('system_auto_shutdown');
          alert('✅ 시스템이 성공적으로 종료되었습니다.');
        } else {
          alert('❌ 시스템 종료에 실패했습니다. 다시 시도해주세요.');
        }
      }
    } catch (error) {
      console.error('❌ 시스템 종료 오류:', error);
      alert('❌ 시스템 종료 중 오류가 발생했습니다.');
    }
  }, [closeMenu, systemStopHandler]);

  // 관리자 인증 핸들러
  const handleAdminAuth = useCallback(async () => {
    console.log('🔐 handleAdminAuth 함수 호출됨:', menuState.adminPassword); // 디버그 로그
    const success = await authenticateAdmin(menuState.adminPassword);
    console.log('🔐 인증 결과:', success); // 디버그 로그
    if (success) {
      cancelAdminInput();
      // 🔥 closeMenu() 제거 - 사용자가 관리자 모드 활성화를 즉시 확인할 수 있도록
    }
  }, [menuState.adminPassword, authenticateAdmin, cancelAdminInput]);

  // 강화된 로그아웃 핸들러
  const handleEnhancedLogout = useCallback(async () => {
    // 관리자 모드 해제
    if (isAdminMode) {
      disableAdminMode();
    }

    const success = await handleLogout();
    if (success) {
      closeMenu();
    }
  }, [closeMenu, disableAdminMode, handleLogout, isAdminMode]);

  // 메뉴 아이템 구성
  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    // 관리자 모드일 때
    if (isAdminMode) {
      items.push({
        id: 'admin-page',
        label: '관리자 페이지',
        icon: Crown,
        action: () => {
          closeMenu();
          setTimeout(() => navigateToAdmin(), 100);
        },
        visible: true,
        danger: false,
      });
    }

    // GitHub 사용자 시스템 관리 메뉴
    if (userType === 'github') {
      // 시스템 상태 표시는 별도로 처리됨

      // 🎯 로컬 상태 우선 + 서버 상태 보조로 즉시 반영 (논리합 사용)
      if (isSystemStarted || systemStatus?.isRunning) {
        items.push({
          id: 'dashboard',
          label: '대시보드 열기',
          icon: BarChart3,
          action: () => {
            closeMenu();
            setTimeout(() => navigateToDashboard(), 100);
          },
          visible: true,
          badge: '모니터링',
        });

        items.push({
          id: 'system-stop',
          label: `시스템 종료 (${systemStatus?.userCount || 1}명 접속 중)`,
          icon: Power,
          action: handleSystemStop,
          visible: true,
          danger: true,
          badge: '확인 후 종료',
        });
      }
    }

    // 게스트 사용자 메뉴
    if (userType === 'guest' && !isAdminMode) {
      items.push({
        id: 'github-login',
        label: 'GitHub로 로그인',
        icon: Shield,
        action: () => {
          closeMenu();
          setTimeout(() => navigateToLogin(), 100);
        },
        visible: true,
        badge: '계정 연동',
        dividerBefore: true,
      });
    }

    // 로그아웃 메뉴
    items.push({
      id: 'logout',
      label: userType === 'github' ? 'GitHub 로그아웃' : '게스트 세션 종료',
      icon: LogOut,
      action: handleEnhancedLogout,
      visible: true,
      danger: true,
      badge: '확인 후 종료',
      dividerBefore: true,
    });

    return items;
  }, [
    isAdminMode,
    userType,
    systemStatus,
    isSystemStarted, // 🎯 로컬 시스템 상태 의존성 추가
    closeMenu,
    navigateToAdmin,
    navigateToDashboard,
    navigateToLogin,
    handleSystemStop,
    handleEnhancedLogout,
  ]);

  // 사용자 정보 가져오기
  const getUserName = () => {
    if (userInfo) {
      return (
        userInfo.name ||
        userInfo.email ||
        (userType === 'github' ? 'GitHub 사용자' : '게스트 사용자')
      );
    }
    return status === 'loading' ? '로딩 중...' : '사용자';
  };

  return (
    <div ref={dropdownRef} className={`relative z-50 ${className}`}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => {
          console.log('👤 프로필 버튼 클릭됨');
          toggleMenu();
        }}
        className="group pointer-events-auto relative z-50 flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-all duration-200 hover:bg-gray-100"
        aria-label="프로필 메뉴"
        aria-expanded={menuState.showProfileMenu}
        aria-haspopup="true"
        id="profile-menu-button"
        data-testid="profile-dropdown-trigger"
      >
        {/* 프로필 아바타 */}
        <ProfileAvatar
          userInfo={userInfo}
          userType={userType}
          isAdminMode={isAdminMode}
          size="medium"
        />

        {/* 사용자 정보 */}
        <div className="hidden text-left sm:block">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
            {getUserName()}
            <UserTypeIcon
              userType={userType}
              isAdminMode={isAdminMode}
              className="h-3 w-3"
            />
            {isAdminMode && (
              <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                관리자 모드
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isAdminMode
              ? '관리자 모드 활성화됨'
              : userType === 'github'
                ? 'GitHub 로그인'
                : userType === 'guest'
                  ? '게스트 로그인'
                  : status === 'loading'
                    ? '확인 중...'
                    : '알 수 없음'}
            {status === 'loading' && (
              <div className="_animate-pulse h-2 w-2 rounded-full bg-gray-400" />
            )}
          </div>
        </div>

        {/* 드롭다운 화살표 */}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            menuState.showProfileMenu ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 프로필 드롭다운 메뉴 */}
      <ProfileDropdownMenu
        isOpen={menuState.showProfileMenu}
        menuItems={menuItems}
        userInfo={userInfo}
        userType={userType}
        isAdminMode={isAdminMode}
        onClose={closeMenu}
        onAdminAuthClick={toggleAdminInput}
        showAdminInput={menuState.showAdminInput}
        adminAuthProps={{
          isLocked: securityState.isLocked,
          failedAttempts: securityState.failedAttempts,
          remainingLockTime: securityState.remainingLockTime,
          isProcessing: securityState.isProcessing,
          adminPassword: menuState.adminPassword,
          onPasswordChange: setAdminPassword,
          onSubmit: handleAdminAuth,
          onCancel: cancelAdminInput,
        }}
      />

      {/* GitHub 사용자용 시스템 상태 표시 (드롭다운 내부에 위치) */}
      {userType === 'github' && menuState.showProfileMenu && (
        <div className="absolute right-0 z-[9998] mt-[280px] w-64">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <EnhancedProfileStatusDisplay compact={false} />
          </div>
        </div>
      )}
    </div>
  );
}
