'use client';

import { useSystemStatus } from '@/hooks/useSystemStatus';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ChevronDown,
  Crown,
  LogOut,
  Power,
  Shield,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

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
  onSystemStop: _onSystemStop,
  parentSystemActive: _parentSystemActive,
}: UnifiedProfileHeaderProps) {
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

  // 시스템 종료 핸들러
  const handleSystemStop = useCallback(async () => {
    const confirmed = confirm(
      '⚠️ 시스템을 종료하시겠습니까?\n\n종료 후 메인 페이지에서 다시 시작할 수 있습니다.'
    );

    if (!confirmed) return;

    try {
      closeMenu();
      console.log('🛑 시스템 종료 요청 (프로필에서)');

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
    } catch (error) {
      console.error('❌ 시스템 종료 오류:', error);
      alert('❌ 시스템 종료 중 오류가 발생했습니다.');
    }
  }, [closeMenu]);

  // 관리자 인증 핸들러
  const handleAdminAuth = useCallback(async () => {
    const success = await authenticateAdmin(menuState.adminPassword);
    if (success) {
      cancelAdminInput();
      closeMenu();
    }
  }, [menuState.adminPassword, authenticateAdmin, cancelAdminInput, closeMenu]);

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
  }, [isAdminMode, disableAdminMode, handleLogout, closeMenu]);

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
          setTimeout(navigateToAdmin, 100);
        },
        visible: true,
        danger: false,
      });
    }

    // GitHub 사용자 시스템 관리 메뉴
    if (userType === 'github') {
      // 시스템 상태 표시는 별도로 처리됨

      if (systemStatus?.isRunning) {
        items.push({
          id: 'dashboard',
          label: '대시보드 열기',
          icon: BarChart3,
          action: () => {
            closeMenu();
            setTimeout(navigateToDashboard, 100);
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
          setTimeout(navigateToLogin, 100);
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

  const getUserTypeLabel = () => {
    if (status === 'loading') return '확인 중...';
    if (isAdminMode) return '관리자';
    if (userType === 'github') return 'GitHub';
    if (userType === 'guest') return '게스트';
    return '알 수 없음';
  };

  return (
    <div ref={dropdownRef} className={`relative z-50 ${className}`}>
      {/* 프로필 버튼 */}
      <motion.button
        onClick={() => {
          console.log('👤 프로필 버튼 클릭됨');
          toggleMenu();
        }}
        className='flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-all duration-200 group cursor-pointer relative z-50 pointer-events-auto'
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label='프로필 메뉴'
        aria-expanded={menuState.showProfileMenu}
        aria-haspopup='true'
        id='profile-menu-button'
      >
        {/* 프로필 아바타 */}
        <ProfileAvatar
          userInfo={userInfo}
          userType={userType}
          isAdminMode={isAdminMode}
          size='medium'
        />

        {/* 사용자 정보 */}
        <div className='hidden sm:block text-left'>
          <div className='text-sm font-medium text-gray-900 flex items-center gap-1'>
            {getUserName()}
            <UserTypeIcon
              userType={userType}
              isAdminMode={isAdminMode}
              className='w-3 h-3'
            />
          </div>
          <div className='text-xs text-gray-500 flex items-center gap-1'>
            {getUserTypeLabel()} 로그인
            {status === 'loading' && (
              <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' />
            )}
          </div>
        </div>

        {/* 드롭다운 화살표 */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            menuState.showProfileMenu ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

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
        <div className='absolute right-0 mt-[280px] w-64 z-[9998]'>
          <div className='bg-white rounded-lg shadow-lg border border-gray-200 p-3'>
            <EnhancedProfileStatusDisplay compact={false} />
          </div>
        </div>
      )}
    </div>
  );
}
