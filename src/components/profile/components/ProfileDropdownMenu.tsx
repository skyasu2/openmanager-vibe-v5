'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { ProfileAvatar, UserTypeIcon } from './ProfileAvatar';
import { ProfileMenuItem } from './ProfileMenuItem';
import { AdminAuthModal } from './AdminAuthModal';
import type { ProfileDropdownMenuProps } from '../types/profile.types';

/**
 * 프로필 드롭다운 메뉴 컴포넌트
 * 사용자 정보와 메뉴 아이템들을 표시
 */
export const ProfileDropdownMenu = React.memo(function ProfileDropdownMenu({
  isOpen,
  menuItems,
  userInfo,
  userType,
  isAdminMode,
  onClose,
  onAdminAuthClick,
  showAdminInput,
  adminAuthProps,
}: ProfileDropdownMenuProps) {
  const getUserName = () => {
    if (userInfo) {
      return (
        userInfo.name ||
        userInfo.email ||
        (userType === 'github' ? 'GitHub 사용자' : '게스트 사용자')
      );
    }
    return '사용자';
  };

  const getUserEmail = () => {
    return userInfo?.email || null;
  };

  const getUserTypeLabel = () => {
    if (isAdminMode) return '관리자';
    if (userType === 'github') return 'GitHub';
    if (userType === 'guest') return '게스트';
    return '알 수 없음';
  };

  const getUserTypeClass = () => {
    if (isAdminMode) return 'bg-red-100 text-red-700';
    if (userType === 'github') return 'bg-green-100 text-green-700';
    if (userType === 'guest') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg py-2 border border-gray-200 z-[9999]'
          role='menu'
          aria-orientation='vertical'
          aria-labelledby='profile-menu-button'
        >
          {/* 사용자 정보 헤더 */}
          <div className='px-4 py-3 border-b border-gray-100'>
            <div className='flex items-center gap-3'>
              <ProfileAvatar
                userInfo={userInfo}
                userType={userType}
                isAdminMode={isAdminMode}
                size='large'
                showBadge={false}
              />

              <div className='flex-1 min-w-0'>
                <div className='font-medium text-gray-900 truncate flex items-center gap-2'>
                  {getUserName()}
                  <UserTypeIcon
                    userType={userType}
                    isAdminMode={isAdminMode}
                    className='w-4 h-4 flex-shrink-0'
                  />
                </div>

                {getUserEmail() && (
                  <div className='text-sm text-gray-500 truncate'>
                    {getUserEmail()}
                  </div>
                )}

                <div
                  className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getUserTypeClass()}`}
                >
                  {getUserTypeLabel()} 계정
                </div>
              </div>
            </div>
          </div>

          {/* 메뉴 아이템들 */}
          <div className='py-1'>
            {/* 관리자 모드 섹션 */}
            {!isAdminMode && (
              <>
                <ProfileMenuItem
                  id='admin-toggle'
                  label='관리자 모드'
                  icon={Crown}
                  action={onAdminAuthClick}
                  visible={true}
                  disabled={adminAuthProps.isLocked}
                  description={adminAuthProps.isLocked ? '(잠금됨)' : undefined}
                />

                {showAdminInput && <AdminAuthModal {...adminAuthProps} />}
              </>
            )}

            {/* 메뉴 아이템 렌더링 */}
            {menuItems.map((item, index) => (
              <ProfileMenuItem
                key={item.id}
                {...item}
                index={index}
                onClick={() => {
                  if (!item.disabled) {
                    onClose();
                  }
                }}
              />
            ))}
          </div>

          {/* 하단 정보 */}
          <div className='px-4 py-2 border-t border-gray-100'>
            <p className='text-xs text-gray-400 text-center'>
              {isAdminMode ? '🔒 관리자 권한으로 실행 중' : '🛡️ 보안 연결됨'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
