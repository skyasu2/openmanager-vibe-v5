/**
 * 🎨 리팩토링된 통합 프로필 컴포넌트
 * 
 * 개선사항:
 * - Single Responsibility Principle 적용
 * - 커스텀 훅으로 로직 분리
 * - 서비스 레이어로 API 호출 분리
 * - 타입 안정성 강화
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { UnifiedProfileComponentProps } from './types/ProfileTypes';
import { useProfileDropdown } from './hooks/useProfileDropdown';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import ProfileDropdown from './components/ProfileDropdown';

export default function UnifiedProfileRefactored({
  userName = '사용자',
  userAvatar,
}: UnifiedProfileComponentProps) {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const {
    isOpen,
    dropdownPosition,
    dropdownRef,
    profileButtonRef,
    toggleDropdown,
    closeDropdown,
  } = useProfileDropdown();

  const { isSystemStarted, aiAgent, isLocked } = useUnifiedAdminStore();

  // 설정 패널이 열릴 때 드롭다운 자동 닫기
  const handleSettingsClick = () => {
    setShowSettingsPanel(true);
    closeDropdown();
  };

  const getButtonStyles = () => {
    if (isLocked) {
      return 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 focus:ring-red-500';
    }
    
    if (aiAgent.isEnabled) {
      return 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30 focus:ring-purple-500';
    }
    
    return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 focus:ring-cyan-500';
  };

  const getStatusIndicator = () => {
    if (isLocked) return '🔒';
    if (isSystemStarted) return '🟢';
    return '🔴';
  };

  return (
    <>
      <div className='relative'>
        {/* 프로필 버튼 */}
        <motion.button
          ref={profileButtonRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleDropdown}
          className={`flex items-center gap-3 p-2 rounded-xl backdrop-blur-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${getButtonStyles()}`}
          aria-expanded={isOpen}
          aria-haspopup='menu'
          role='button'
        >
          {/* 아바타 */}
          <div className='relative'>
            <div className='w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 p-0.5'>
              <div className='w-full h-full rounded-full bg-gray-900 flex items-center justify-center'>
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt='User Avatar'
                    width={28}
                    height={28}
                    className='w-full h-full rounded-full object-cover'
                    priority
                  />
                ) : (
                  <User className='w-4 h-4 text-white' />
                )}
              </div>
            </div>
            
            {/* 상태 표시 점 */}
            <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-900 rounded-full flex items-center justify-center'>
              <span className='text-xs'>{getStatusIndicator()}</span>
            </div>
          </div>

          {/* 사용자명 (데스크톱에서만 표시) */}
          <div className='hidden sm:block'>
            <div className='text-sm font-medium text-white'>{userName}</div>
            <div className='text-xs opacity-75'>
              {aiAgent.isEnabled ? 'AI 모드' : '기본 모드'}
            </div>
          </div>

          {/* 드롭다운 화살표 */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className='hidden sm:block'
          >
            <ChevronDown className='w-4 h-4' />
          </motion.div>
        </motion.button>
      </div>

      {/* 드롭다운 메뉴 */}
      <ProfileDropdown
        ref={dropdownRef}
        isOpen={isOpen}
        onClose={closeDropdown}
        position={dropdownPosition}
        userName={userName}
        userAvatar={userAvatar}
        onSettingsClick={handleSettingsClick}
      />

      {/* TODO: 설정 패널 컴포넌트 */}
      {showSettingsPanel && (
        <div className='fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4'
          >
            <h2 className='text-xl font-bold text-white mb-4'>설정 패널</h2>
            <p className='text-gray-400 mb-4'>
              설정 패널이 별도 컴포넌트로 분리됩니다.
            </p>
            <button
              onClick={() => setShowSettingsPanel(false)}
              className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
            >
              닫기
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
} 