/**
 * 🎨 프로필 드롭다운 컴포넌트
 */

'use client';

import { useToast } from '@/components/ui/ToastNotification';
import { useDataRetention } from '@/hooks/useDataRetention';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Database, HardDrive, LogOut, Monitor, Settings, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProfileDropdownProps } from '../types/ProfileTypes';

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

    const { info, success, warning } = useToast();
    const { stats, runManualCleanup, isLoading: isCleanupLoading } = useDataRetention();
    const [isCleanupExecuting, setIsCleanupExecuting] = useState(false);

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

    // 🗂️ 데이터 정리 실행 (Phase 3 통합)
    const handleDataCleanup = async (e: React.MouseEvent, dataType?: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (isCleanupExecuting) return;

      try {
        setIsCleanupExecuting(true);
        info(`${dataType ? dataType + ' ' : ''}데이터 정리를 시작합니다...`);

        const results = await runManualCleanup(dataType);
        const totalCleaned = results.reduce((sum, r) => sum + r.itemsRemoved, 0);
        const totalSizeFreed = results.reduce((sum, r) => sum + r.sizeFreed, 0);

        if (totalCleaned > 0) {
          success(
            `✅ ${totalCleaned}개 항목 정리됨 (${Math.round(totalSizeFreed / 1024)}KB 절약)`
          );
        } else {
          info('정리할 항목이 없습니다');
        }
      } catch (error) {
        warning('데이터 정리 중 오류가 발생했습니다');
      } finally {
        setIsCleanupExecuting(false);
      }

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

    // 데이터 정리 상태 표시
    const getDataRetentionStatus = () => {
      if (!stats) return '데이터 정리 상태 확인 중...';

      const lastCleanupTime = stats.lastCleanupTime;
      if (!lastCleanupTime) return '정리 기록 없음';

      const timeSinceLastCleanup = Date.now() - lastCleanupTime;
      const minutesAgo = Math.floor(timeSinceLastCleanup / (1000 * 60));

      if (minutesAgo < 1) return '방금 정리됨';
      if (minutesAgo < 60) return `${minutesAgo}분 전 정리됨`;

      const hoursAgo = Math.floor(minutesAgo / 60);
      return `${hoursAgo}시간 전 정리됨`;
    };

    const getMemoryStatus = () => {
      if (!stats) return '확인 중';
      return `${stats.memoryUsageMB}MB 사용 중`;
    };

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className='fixed bg-white/95 backdrop-blur-md border border-gray-300 rounded-xl shadow-2xl z-[9500] min-w-[300px] max-w-[320px] ring-1 ring-gray-200'
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 🗂️ 데이터 정리 상태 표시 (Phase 3 통합) */}
            <div className='px-3 py-2 border-b border-gray-200 bg-gray-50/50'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <HardDrive className='w-4 h-4 text-blue-600' />
                  <span className='text-sm font-medium text-gray-700'>메모리 관리</span>
                </div>
                <div className='text-xs text-gray-500'>
                  {getMemoryStatus()}
                </div>
              </div>
              <div className='text-xs text-gray-500 mt-1'>
                {getDataRetentionStatus()}
              </div>
            </div>

            {/* 간단한 메뉴 아이템들 */}
            <div className='p-2'>
              <motion.button
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                onClick={handleSettingsClick}
                className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md'
              >
                <Settings className='w-4 h-4 text-purple-600' />
                <span className='text-gray-900'>통합 설정</span>
              </motion.button>

              {/* 🗂️ 데이터 정리 메뉴 (Phase 3 통합) */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                onClick={(e) => handleDataCleanup(e)}
                disabled={isCleanupExecuting}
                className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md disabled:opacity-50'
              >
                <Database className={`w-4 h-4 ${isCleanupExecuting ? 'text-orange-500 animate-pulse' : 'text-green-600'}`} />
                <span className='text-gray-900'>
                  {isCleanupExecuting ? '정리 중...' : '전체 데이터 정리'}
                </span>
              </motion.button>

              {/* 🔄 SSE 전용 정리 (Phase 3 특화) */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                onClick={(e) => handleDataCleanup(e, 'sse')}
                disabled={isCleanupExecuting}
                className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md disabled:opacity-50'
              >
                <Trash2 className={`w-4 h-4 ${isCleanupExecuting ? 'text-orange-500 animate-pulse' : 'text-blue-600'}`} />
                <span className='text-gray-900'>
                  {isCleanupExecuting ? '정리 중...' : 'SSE 캐시 정리'}
                </span>
              </motion.button>

              {/* 관리자 모드일 때만 관리자 대시보드 링크 표시 */}
              {adminMode.isAuthenticated && (
                <Link href='/admin' onClick={onClose}>
                  <motion.div
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 cursor-pointer hover:shadow-md'
                  >
                    <Monitor className='w-4 h-4 text-blue-600' />
                    <span className='text-gray-900'>관리자 대시보드</span>
                  </motion.div>
                </Link>
              )}

              {/* 구분선 - 관리자 모드일 때만 표시 */}
              {adminMode.isAuthenticated && (
                <div className='my-2 border-t border-gray-300'></div>
              )}

              {/* 관리자 상태에 따른 로그아웃 옵션 */}
              {adminMode.isAuthenticated ? (
                // 관리자 로그인 상태일 때
                <>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                    onClick={handleAdminLogout}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md'
                  >
                    <Shield className='w-4 h-4 text-orange-600' />
                    <span className='text-gray-900'>관리자 로그아웃</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                    onClick={handleFullLogout}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md'
                  >
                    <LogOut className='w-4 h-4 text-red-600' />
                    <span className='text-gray-900'>전체 로그아웃</span>
                  </motion.button>
                </>
              ) : (
                // 일반 사용자 상태일 때
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                  onClick={handleFullLogout}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:shadow-md'
                >
                  <LogOut className='w-4 h-4 text-red-600' />
                  <span className='text-gray-900'>로그아웃</span>
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
