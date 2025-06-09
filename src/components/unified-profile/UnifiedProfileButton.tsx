/**
 * 🎯 Unified Profile Button
 *
 * 통합 프로필 버튼 컴포넌트
 * 드롭다운 메뉴와 상태 표시 포함
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  User,
  Bot,
  Settings,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';
import { ProfileButtonProps, DropdownPosition } from './types/ProfileTypes';

interface UnifiedProfileButtonProps extends ProfileButtonProps {
  onSettingsClick: () => void;
}

export function UnifiedProfileButton({
  userName,
  userAvatar,
  isOpen,
  onClick,
  buttonRef,
  onSettingsClick,
}: UnifiedProfileButtonProps) {
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    transformOrigin: 'top right',
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isSystemStarted,
    aiAgent,
    isLocked,
    startSystem,
    stopSystem,
    logout,
    adminMode,
  } = useUnifiedAdminStore();

  const { success, info } = useToast();

  // 드롭다운 위치 계산
  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 기본 위치: 버튼 아래, 오른쪽 정렬
    let top = buttonRect.bottom + 8;
    let left = buttonRect.right - 320; // 드롭다운 너비 320px 기준

    // 드롭다운이 화면 아래로 넘어가는 경우 위쪽에 표시
    const dropdownHeight = 400;
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - 8;
    }

    // 드롭다운이 화면 왼쪽으로 넘어가는 경우
    if (left < 16) {
      left = 16;
    }

    // 모바일에서는 중앙 정렬
    if (viewportWidth < 640) {
      left = (viewportWidth - 320) / 2;
      if (left < 16) left = 16;
    }

    setDropdownPosition({ top, left, transformOrigin: 'top right' });
  };

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target)) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // 부모 컴포넌트의 onClick 호출하여 닫기
        onClick({} as React.MouseEvent);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, {
      passive: true,
      capture: false,
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClick, buttonRef]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClick({} as React.MouseEvent);
      }
    };

    document.addEventListener('keydown', handleEscape, { passive: false });
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClick]);

  // 위치 계산 (드롭다운이 열릴 때)
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
    }
  }, [isOpen]);

  // 이벤트 핸들러들
  const handleSystemToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSystemStarted) {
      stopSystem();
    } else {
      startSystem();
    }
    onClick(e); // 드롭다운 닫기
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSettingsClick();
    onClick(e); // 드롭다운 닫기
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    info('로그아웃되었습니다.');
    onClick(e); // 드롭다운 닫기
  };

  const getModeDisplayText = () => {
    return aiAgent.isEnabled ? 'AI 에이전트 모드' : '기본 모니터링 모드';
  };

  const getModeStatusColor = () => {
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  // 드롭다운 메뉴 (Portal로 렌더링)
  const DropdownPortal = () => {
    if (typeof window === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 오버레이 (모바일용) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className='fixed inset-0 bg-black/20 z-[9990] sm:hidden'
              onClick={() => onClick({} as React.MouseEvent)}
            />

            {/* 드롭다운 메뉴 */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                transformOrigin: dropdownPosition.transformOrigin,
              }}
              className='w-80 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-[9999]'
              role='menu'
              aria-orientation='vertical'
            >
              {/* 헤더 */}
              <div className='p-4 border-b border-white/10'>
                <div className='flex items-center gap-3 mb-3'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isLocked
                        ? 'bg-gradient-to-br from-red-500 to-orange-600'
                        : aiAgent.isEnabled
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                          : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}
                  >
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt='Avatar'
                        width={40}
                        height={40}
                        className='w-full h-full rounded-full object-cover'
                      />
                    ) : (
                      <User className='w-5 h-5 text-white' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='text-white font-medium'>{userName}</div>
                    <div className={`text-sm ${getModeStatusColor()}`}>
                      {getModeDisplayText()}
                    </div>
                  </div>
                </div>

                {/* AI 에이전트 상태 */}
                <div className='flex items-center justify-between p-3 rounded-lg bg-white/5'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`p-2 rounded-lg ${
                        aiAgent.isEnabled
                          ? 'bg-purple-500/20'
                          : 'bg-gray-500/20'
                      }`}
                    >
                      <Bot
                        className={`w-4 h-4 ${
                          aiAgent.isEnabled
                            ? 'text-purple-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <div className='text-white text-sm font-medium'>
                        AI 에이전트
                      </div>
                      <div
                        className={`text-xs ${
                          aiAgent.isEnabled
                            ? 'text-purple-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {aiAgent.isEnabled ? '활성화됨' : '비활성화됨'}
                      </div>
                    </div>
                  </div>
                  {aiAgent.isEnabled && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                      className='px-3 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
                    >
                      비활성화
                    </motion.button>
                  )}
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className='p-2'>
                {/* AI 엔진 관리 페이지 버튼 */}
                {aiAgent.isEnabled && adminMode.isAuthenticated && (
                  <Link href='/admin/ai-agent'>
                    <motion.button
                      whileHover={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onClick({} as React.MouseEvent)}
                      className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500'
                      role='menuitem'
                    >
                      <div className='p-2 rounded-lg bg-purple-500/20'>
                        <Shield className='w-4 h-4 text-purple-400' />
                      </div>
                      <div>
                        <div className='text-white font-medium'>
                          🧠 AI 엔진 관리 페이지
                        </div>
                        <div className='text-gray-400 text-xs'>
                          AI 로그, 컨텍스트, A/B 테스트 관리
                        </div>
                      </div>
                    </motion.button>
                  </Link>
                )}

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSettingsClick}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-purple-500/20'>
                    <Settings className='w-4 h-4 text-purple-400' />
                  </div>
                  <div>
                    <div className='text-white font-medium'>통합 설정</div>
                    <div className='text-gray-400 text-xs'>
                      AI 모드, 데이터 생성기, 모니터링 제어
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-red-500/20'>
                    <LogOut className='w-4 h-4 text-red-400' />
                  </div>
                  <div>
                    <div className='text-white font-medium'>로그아웃</div>
                    <div className='text-gray-400 text-xs'>
                      현재 세션을 종료합니다
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <div className='relative'>
      {/* 프로필 버튼 */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`flex items-center gap-3 p-2 rounded-xl backdrop-blur-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
          isLocked
            ? 'bg-red-500/20 border-red-500/50 shadow-red-500/20 shadow-lg focus:ring-red-500'
            : aiAgent.isEnabled
              ? 'bg-purple-500/20 border-purple-500/50 shadow-purple-500/20 shadow-lg focus:ring-purple-500'
              : 'bg-white/10 border-white/20 hover:bg-white/20 focus:ring-white/50'
        }`}
        aria-label='프로필 메뉴 열기'
        aria-expanded={isOpen}
        aria-haspopup='true'
      >
        {/* 아바타 */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isLocked
              ? 'bg-gradient-to-br from-red-500 to-orange-600'
              : aiAgent.isEnabled
                ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600'
          }`}
        >
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt='Avatar'
              width={32}
              height={32}
              className='w-full h-full rounded-full object-cover'
            />
          ) : (
            <User className='w-4 h-4 text-white' />
          )}
        </div>

        {/* 사용자 정보 */}
        <div className='text-left hidden sm:block'>
          <div className='text-white text-sm font-medium'>{userName}</div>
          <div className={`text-xs ${getModeStatusColor()}`}>
            {getModeDisplayText()}
          </div>
        </div>

        {/* 상태 인디케이터 */}
        <div className='flex items-center gap-1'>
          {/* AI 에이전트 상태 */}
          {aiAgent.isEnabled && aiAgent.state === 'processing' && (
            <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
          )}

          {/* 잠금 상태 */}
          {isLocked && <AlertTriangle className='w-3 h-3 text-red-400' />}

          {/* 드롭다운 아이콘 */}
          <ChevronDown
            className={`w-3 h-3 text-white/70 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </motion.button>

      {/* 드롭다운 메뉴 */}
      <DropdownPortal />
    </div>
  );
}
