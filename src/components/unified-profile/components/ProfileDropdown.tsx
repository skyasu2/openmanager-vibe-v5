/**
 * 🎨 프로필 드롭다운 컴포넌트
 */

'use client';

import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  User,
  Bot,
  Power,
  Settings,
  LogOut,
  Shield,
  StopCircle,
  Monitor,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ProfileDropdownProps } from '../types/ProfileTypes';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';

const ProfileDropdown = forwardRef<HTMLDivElement, ProfileDropdownProps>(
  (
    { isOpen, onClose, position, userName, userAvatar, onSettingsClick },
    ref
  ) => {
    const {
      isSystemStarted,
      aiAgent,
      adminMode,
      isLocked,
      startSystem,
      stopSystem,
      logoutAdmin,
      logout,
    } = useUnifiedAdminStore();

    const { info } = useToast();

    const handleSystemToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isSystemStarted) {
        stopSystem();
      } else {
        startSystem();
      }
      onClose();
    };

    const handleSettingsClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSettingsClick();
      onClose();
    };

    const handleAdminLogout = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      logoutAdmin();
      info('관리자에서 로그아웃되었습니다.');
      onClose();
    };

    const handleFullLogout = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      logout();
      info('전체 로그아웃되었습니다.');
      onClose();
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className='fixed bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl z-[9500] min-w-[280px] max-w-[320px]'
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 간단한 메뉴 아이템들 */}
            <div className='p-2'>
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onClick={handleSettingsClick}
                className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors'
              >
                <Settings className='w-4 h-4 text-purple-400' />
                <span className='text-white'>통합 설정</span>
              </motion.button>

              {/* 관리자 모드일 때만 관리자 대시보드 링크 표시 */}
              {adminMode.isAuthenticated && (
                <Link href='/admin' onClick={onClose}>
                  <motion.div
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer'
                  >
                    <Monitor className='w-4 h-4 text-blue-400' />
                    <span className='text-white'>관리자 대시보드</span>
                  </motion.div>
                </Link>
              )}

              {/* 구분선 - 관리자 모드일 때만 표시 */}
              {adminMode.isAuthenticated && (
                <div className='my-2 border-t border-gray-700/50'></div>
              )}

              {/* 관리자 상태에 따른 로그아웃 옵션 */}
              {adminMode.isAuthenticated ? (
                // 관리자 로그인 상태일 때
                <>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={handleAdminLogout}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors'
                  >
                    <Shield className='w-4 h-4 text-orange-400' />
                    <span className='text-white'>관리자 로그아웃</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={handleFullLogout}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors'
                  >
                    <LogOut className='w-4 h-4 text-red-400' />
                    <span className='text-white'>전체 로그아웃</span>
                  </motion.button>
                </>
              ) : (
                // 일반 사용자 상태일 때
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={handleFullLogout}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors'
                >
                  <LogOut className='w-4 h-4 text-red-400' />
                  <span className='text-white'>로그아웃</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

ProfileDropdown.displayName = 'ProfileDropdown';

export default ProfileDropdown;
