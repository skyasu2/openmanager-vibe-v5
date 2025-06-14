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

import { useState, useRef, useEffect, useCallback } from 'react';
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
  Play,
  Square,
  Lock,
  Unlock,
  Activity,
  Server,
  Zap,
  Eye,
  EyeOff,
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
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isSystemStarted,
    aiAgent,
    isLocked,
    startSystem,
    stopSystem,
    logout,
    adminMode,
    authenticateAdmin,
    logoutAdmin,
  } = useUnifiedAdminStore();

  const { success, info, error } = useToast();

  // 드롭다운 위치 계산 (useCallback으로 최적화)
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current || !isOpen) return;

    // requestAnimationFrame으로 DOM 업데이트 후 실행
    requestAnimationFrame(() => {
      const buttonRect = buttonRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 기본 위치: 버튼 아래, 오른쪽 정렬
      let top = buttonRect.bottom + 8;
      let left = buttonRect.right - 380; // 드롭다운 너비 380px로 확장

      // 드롭다운이 화면 아래로 넘어가는 경우 위쪽에 표시
      const dropdownHeight = 500; // 높이 증가
      if (top + dropdownHeight > viewportHeight) {
        top = buttonRect.top - dropdownHeight - 8;
      }

      // 드롭다운이 화면 왼쪽으로 넘어가는 경우
      if (left < 16) {
        left = 16;
      }

      // 모바일에서는 중앙 정렬
      if (viewportWidth < 640) {
        left = (viewportWidth - 380) / 2;
        if (left < 16) left = 16;
      }

      setDropdownPosition({ top, left, transformOrigin: 'top right' });
    });
  }, [buttonRef, isOpen]);

  // 외부 클릭 감지 (최적화된 버전)
  useEffect(() => {
    if (!isOpen || isAnimating) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;

      // 버튼 클릭은 무시 (onClick 핸들러에서 처리)
      if (buttonRef.current?.contains(target)) {
        return;
      }

      // 드롭다운 내부 클릭은 무시
      if (dropdownRef.current?.contains(target)) {
        return;
      }

      // 외부 클릭 시 드롭다운 닫기
      onClick({} as React.MouseEvent);
    };

    // 약간의 지연을 두어 버튼 클릭과 충돌 방지
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, {
        passive: true,
        capture: true, // capture 단계에서 처리
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClick, buttonRef, isAnimating]);

  // ESC 키로 드롭다운 닫기 (최적화된 버전)
  useEffect(() => {
    if (!isOpen || isAnimating) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClick({} as React.MouseEvent);
      }
    };

    document.addEventListener('keydown', handleEscape, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen, onClick, isAnimating]);

  // 위치 계산 (드롭다운이 열릴 때)
  useEffect(() => {
    if (isOpen && !isAnimating) {
      calculateDropdownPosition();
    }
  }, [isOpen, calculateDropdownPosition, isAnimating]);

  // 애니메이션 상태 관리
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 200); // 애니메이션 duration과 동일
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // 이벤트 핸들러들
  const handleSystemToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSystemStarted) {
      stopSystem();
      success('시스템이 중단되었습니다.');
    } else {
      startSystem();
      success('시스템이 시작되었습니다.');
    }
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

  const handleAdminModeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (adminMode.isAuthenticated) {
      // 관리자 모드 해제
      logoutAdmin();
      success('관리자 모드가 해제되었습니다.');
    } else {
      // 비밀번호 입력 모드 활성화
      setShowPasswordInput(true);
      setPassword('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const result = await authenticateAdmin(password);

      if (result.success) {
        setShowPasswordInput(false);
        setPassword('');
        setPasswordError('');
        success(result.message);
      } else {
        setPasswordError(result.message);
        setPassword('');
        if (result.remainingTime) {
          error(`인증 실패: ${result.message}`);
        }
      }
    } catch (err) {
      setPasswordError('인증 처리 중 오류가 발생했습니다.');
      setPassword('');
      error('인증 처리 중 오류가 발생했습니다.');
    }
  };

  const handlePasswordCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPasswordInput(false);
    setPassword('');
    setPasswordError('');
  };

  const getModeDisplayText = () => {
    if (adminMode.isAuthenticated) {
      return 'AI 관리자 모드';
    }
    return aiAgent.isEnabled ? 'AI 에이전트 모드' : '기본 모니터링 모드';
  };

  const getModeStatusColor = () => {
    if (adminMode.isAuthenticated) {
      return 'text-orange-400';
    }
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  const getSystemStatus = () => {
    if (isSystemStarted) {
      return {
        text: '시스템 동작 중',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        icon: Activity,
        details: '모든 서비스가 정상 동작 중입니다.',
      };
    } else {
      return {
        text: '시스템 대기 중',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        icon: Server,
        details: '시스템이 대기 상태입니다.',
      };
    }
  };

  // 드롭다운 메뉴 (Portal로 렌더링)
  const DropdownPortal = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const systemStatus = getSystemStatus();

    return createPortal(
      <AnimatePresence mode='wait'>
        {isOpen && (
          <>
            {/* 오버레이 (모바일용) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className='fixed inset-0 bg-black/20 z-[9990] sm:hidden'
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onClick({} as React.MouseEvent);
              }}
            />

            {/* 드롭다운 메뉴 */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.15, // 단축된 애니메이션
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                transformOrigin: dropdownPosition.transformOrigin,
                willChange: 'transform, opacity', // 성능 최적화
                transform: 'translate3d(0, 0, 0)', // GPU 가속
              }}
              className='w-96 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-[9999]'
              role='menu'
              aria-orientation='vertical'
              onAnimationStart={() => setIsAnimating(true)}
              onAnimationComplete={() => setIsAnimating(false)}
            >
              {/* 헤더 */}
              <div className='p-4 border-b border-white/10'>
                <div className='flex items-center gap-3 mb-3'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isLocked
                        ? 'bg-gradient-to-br from-red-500 to-orange-600'
                        : adminMode.isAuthenticated
                          ? 'bg-gradient-to-br from-orange-500 to-red-600'
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

                {/* 시스템 상태 */}
                <div className='flex items-center justify-between p-3 rounded-lg bg-white/5 mb-3'>
                  <div className='flex items-center gap-3'>
                    <div className={`p-2 rounded-lg ${systemStatus.bgColor}`}>
                      <systemStatus.icon
                        className={`w-4 h-4 ${systemStatus.color}`}
                      />
                    </div>
                    <div>
                      <div className='text-white text-sm font-medium'>
                        {systemStatus.text}
                      </div>
                      <div className={`text-xs ${systemStatus.color}`}>
                        {systemStatus.details}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className='p-2'>
                {/* 관리자 모드 토글 */}
                {!showPasswordInput ? (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,165,0,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdminModeToggle}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2'
                    role='menuitem'
                  >
                    <div
                      className={`p-2 rounded-lg ${adminMode.isAuthenticated ? 'bg-orange-500/20' : 'bg-gray-500/20'}`}
                    >
                      {adminMode.isAuthenticated ? (
                        <Unlock className='w-4 h-4 text-orange-400' />
                      ) : (
                        <Lock className='w-4 h-4 text-gray-400' />
                      )}
                    </div>
                    <div className='flex-1'>
                      <div className='text-white font-medium'>
                        {adminMode.isAuthenticated
                          ? '관리자 모드 해제'
                          : '관리자 모드 활성화'}
                      </div>
                      <div className='text-gray-400 text-xs'>
                        {adminMode.isAuthenticated
                          ? 'AI 관리 권한을 해제합니다'
                          : 'AI 관리 권한을 활성화합니다'}
                      </div>
                    </div>
                    {adminMode.isAuthenticated && (
                      <div className='w-2 h-2 bg-orange-400 rounded-full animate-pulse' />
                    )}
                  </motion.button>
                ) : (
                  /* 비밀번호 입력 폼 */
                  <div className='p-3 rounded-lg bg-white/5 mb-2'>
                    <div className='text-white text-sm font-medium mb-2'>
                      관리자 비밀번호 입력
                    </div>
                    <form onSubmit={handlePasswordSubmit} className='space-y-2'>
                      <input
                        type='password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder='4자리 비밀번호'
                        maxLength={4}
                        className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500'
                        autoFocus
                      />
                      {passwordError && (
                        <div className='text-red-400 text-xs text-center'>
                          {passwordError}
                        </div>
                      )}
                      <div className='flex gap-2'>
                        <button
                          type='submit'
                          className='flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors'
                        >
                          확인
                        </button>
                        <button
                          type='button'
                          onClick={handlePasswordCancel}
                          className='flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors'
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 시스템 시작/중단 버튼 */}
                <motion.button
                  whileHover={{
                    backgroundColor: isSystemStarted
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(34, 197, 94, 0.1)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSystemToggle}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 mb-2'
                  role='menuitem'
                >
                  <div
                    className={`p-2 rounded-lg ${isSystemStarted ? 'bg-red-500/20' : 'bg-green-500/20'}`}
                  >
                    {isSystemStarted ? (
                      <Square className='w-4 h-4 text-red-400' />
                    ) : (
                      <Play className='w-4 h-4 text-green-400' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='text-white font-medium'>
                      {isSystemStarted ? '시스템 중단' : '시스템 시작'}
                    </div>
                    <div className='text-gray-400 text-xs'>
                      {isSystemStarted
                        ? '모니터링을 중단합니다'
                        : '모니터링을 시작합니다'}
                    </div>
                  </div>
                  {isSystemStarted && (
                    <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
                  )}
                </motion.button>

                {/* 대시보드 이동 버튼 (시스템 동작 중일 때만) */}
                {isSystemStarted && (
                  <Link href='/dashboard'>
                    <motion.button
                      whileHover={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onClick({} as React.MouseEvent)}
                      className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
                      role='menuitem'
                    >
                      <div className='p-2 rounded-lg bg-blue-500/20'>
                        <Activity className='w-4 h-4 text-blue-400' />
                      </div>
                      <div>
                        <div className='text-white font-medium'>
                          대시보드 이동
                        </div>
                        <div className='text-gray-400 text-xs'>
                          실시간 모니터링 대시보드로 이동
                        </div>
                      </div>
                    </motion.button>
                  </Link>
                )}

                {/* AI 엔진 관리 페이지 버튼 (관리자 모드일 때만) */}
                {adminMode.isAuthenticated && (
                  <Link href='/admin/ai-agent'>
                    <motion.button
                      whileHover={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onClick({} as React.MouseEvent)}
                      className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2'
                      role='menuitem'
                    >
                      <div className='p-2 rounded-lg bg-purple-500/20'>
                        <Shield className='w-4 h-4 text-purple-400' />
                      </div>
                      <div>
                        <div className='text-white font-medium'>
                          🧠 AI 엔진 관리
                        </div>
                        <div className='text-gray-400 text-xs'>
                          AI 로그, 컨텍스트, A/B 테스트 관리
                        </div>
                      </div>
                    </motion.button>
                  </Link>
                )}

                {/* 고급 설정 버튼 (관리자 모드일 때만) */}
                {adminMode.isAuthenticated && (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSettingsClick}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 mb-2'
                    role='menuitem'
                  >
                    <div className='p-2 rounded-lg bg-violet-500/20'>
                      <Zap className='w-4 h-4 text-violet-400' />
                    </div>
                    <div>
                      <div className='text-white font-medium'>고급 설정</div>
                      <div className='text-gray-400 text-xs'>
                        시스템 고급 설정 및 관리자 도구
                      </div>
                    </div>
                  </motion.button>
                )}

                {/* 일반 설정 버튼 */}
                {!adminMode.isAuthenticated && (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSettingsClick}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2'
                    role='menuitem'
                  >
                    <div className='p-2 rounded-lg bg-purple-500/20'>
                      <Settings className='w-4 h-4 text-purple-400' />
                    </div>
                    <div>
                      <div className='text-white font-medium'>설정</div>
                      <div className='text-gray-400 text-xs'>
                        AI 모드, 데이터 생성기, 모니터링 제어
                      </div>
                    </div>
                  </motion.button>
                )}

                {/* 로그아웃 버튼 */}
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
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
  }, [
    isOpen,
    onClick,
    dropdownPosition,
    dropdownRef,
    isAnimating,
    userName,
    userAvatar,
    isLocked,
    adminMode,
    aiAgent,
    success,
    info,
    error,
    showPasswordInput,
    password,
    passwordError,
    handleAdminModeToggle,
    handleSystemToggle,
    handleSettingsClick,
    handleLogout,
  ]);

  return (
    <div className='relative'>
      {/* 프로필 버튼 */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();

          // 애니메이션 중이면 클릭 무시
          if (isAnimating) return;

          onClick(e);
        }}
        className={`flex items-center gap-3 p-2 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
          isLocked
            ? 'bg-red-500/30 border-red-500/60 shadow-red-500/30 shadow-lg focus:ring-red-500'
            : adminMode.isAuthenticated
              ? 'bg-orange-500/30 border-orange-500/60 shadow-orange-500/30 shadow-lg focus:ring-orange-500'
              : aiAgent.isEnabled
                ? 'bg-purple-500/30 border-purple-500/60 shadow-purple-500/30 shadow-lg focus:ring-purple-500'
                : 'bg-gray-900/80 border-gray-700/60 hover:bg-gray-900/90 focus:ring-gray-500 shadow-lg'
        }`}
        style={{
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
        }}
        aria-label='프로필 메뉴 열기'
        aria-expanded={isOpen}
        aria-haspopup='true'
        disabled={isAnimating} // 애니메이션 중 비활성화
      >
        {/* 아바타 */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isLocked
              ? 'bg-gradient-to-br from-red-500 to-orange-600'
              : adminMode.isAuthenticated
                ? 'bg-gradient-to-br from-orange-500 to-red-600'
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
          {/* 시스템 상태 */}
          {isSystemStarted && (
            <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
          )}

          {/* 관리자 모드 상태 */}
          {adminMode.isAuthenticated && (
            <div className='w-2 h-2 bg-orange-400 rounded-full animate-pulse' />
          )}

          {/* AI 에이전트 상태 */}
          {aiAgent.isEnabled && aiAgent.state === 'processing' && (
            <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse' />
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
