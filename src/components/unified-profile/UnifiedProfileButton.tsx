/**
 * 🎯 Unified Profile Button (Optimized)
 *
 * 통합 프로필 버튼 컴포넌트 - 드롭다운 최적화 버전
 * 드롭다운 메뉴와 상태 표시 포함
 *
 * @created 2025-06-09
 * @updated 2025-07-02 - 드롭다운 최적화
 * @author AI Assistant
 */

'use client';

import { useToast } from '@/components/ui/ToastNotification';
import { useSystemState } from '@/hooks/useSystemState';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  Lock,
  LogOut,
  Play,
  RefreshCw,
  Settings,
  Square,
  Unlock,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CountdownTimer } from '../system/CountdownTimer';
import { DropdownPosition, ProfileButtonProps } from './types/ProfileTypes';

interface UnifiedProfileButtonProps extends ProfileButtonProps {
  onSettingsClick: () => void;
}

const UnifiedProfileButtonComponent = function UnifiedProfileButton({
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
  const [isPositionCalculated, setIsPositionCalculated] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 상태는 선택적으로 구독하여 불필요한 리렌더링 방지
  const store = useUnifiedAdminStore();
  const isSystemStarted = store.isSystemStarted;
  const aiAgent = store.aiAgent;
  const isLocked = store.isLocked;
  const adminMode = store.adminMode;

  // 시스템 상태 (안정적인 상태만 구독)
  const {
    systemState,
    userId,
    startSystem: startSystemState,
    stopSystem: stopSystemState,
  } = useSystemState();

  // 액션들 (안정적이므로 한 번만 가져오기)
  const { startSystem, stopSystem, logout, authenticateAdmin, logoutAdmin } =
    store;

  const { success, info, error } = useToast();

  // 🎯 개선된 드롭다운 위치 계산 (단순화)
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 384; // w-96
    const dropdownHeight = 500; // 예상 높이
    const gap = 8; // 간격

    // 기본 위치: 버튼 아래, 오른쪽 정렬
    let top = buttonRect.bottom + gap;
    let left = buttonRect.right - dropdownWidth;
    let transformOrigin = 'top right';

    // 화면 아래 넘침 체크
    if (top + dropdownHeight > window.innerHeight - 20) {
      top = buttonRect.top - dropdownHeight - gap;
      transformOrigin = 'bottom right';
    }

    // 화면 왼쪽 넘침 체크
    if (left < 20) {
      left = buttonRect.left;
      transformOrigin = transformOrigin.replace('right', 'left');
    }

    // 화면 오른쪽 넘침 체크
    if (left + dropdownWidth > window.innerWidth - 20) {
      left = window.innerWidth - dropdownWidth - 20;
      transformOrigin = transformOrigin
        .replace('left', 'center')
        .replace('right', 'center');
    }

    setDropdownPosition({ top, left, transformOrigin });
    setIsPositionCalculated(true);
  }, [buttonRef]);

  // 위치 계산 (드롭다운 열릴 때만)
  useEffect(() => {
    if (isOpen) {
      setIsPositionCalculated(false);
      // requestAnimationFrame으로 레이아웃 완료 후 계산
      requestAnimationFrame(() => {
        calculateDropdownPosition();
      });
    } else {
      setIsPositionCalculated(false);
    }
  }, [isOpen, calculateDropdownPosition]);

  // 🎯 간소화된 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 버튼이나 드롭다운 내부 클릭은 무시
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      onClick({} as React.MouseEvent);
    };

    // 지연 없이 즉시 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClick, buttonRef]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClick({} as React.MouseEvent);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClick]);

  // 리사이즈 시 위치 재계산
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      calculateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, calculateDropdownPosition]);

  // 🎯 이벤트 핸들러들 (기존 로직 유지)
  const handleSystemToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isSystemStarted) {
        await stopSystem();
        success('시스템이 정지되었습니다');
      } else {
        await startSystem();
        success('시스템이 시작되었습니다');
      }
      onClick({} as React.MouseEvent); // 드롭다운 닫기
    } catch (error) {
      console.error('시스템 토글 실패:', error);
    }
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSettingsClick();
    onClick({} as React.MouseEvent); // 드롭다운 닫기
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    onClick({} as React.MouseEvent); // 드롭다운 닫기
  };

  const handleAdminModeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (adminMode.isAuthenticated) {
      logoutAdmin();
      success('관리자 모드가 해제되었습니다');
    } else {
      setShowPasswordInput(true);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const isAuthenticated = await authenticateAdmin(password);
      if (isAuthenticated) {
        setShowPasswordInput(false);
        setPassword('');
        setPasswordError('');
        success('관리자 모드가 활성화되었습니다');
      } else {
        setPasswordError('비밀번호가 올바르지 않습니다');
      }
    } catch (error) {
      setPasswordError('인증 중 오류가 발생했습니다');
    }
  };

  const handlePasswordCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPasswordInput(false);
    setPassword('');
    setPasswordError('');
  };

  // 🎯 유틸리티 함수들 (기존 로직 유지)
  const getModeDisplayText = () => {
    if (isLocked) return '잠금 상태';
    if (adminMode.isAuthenticated) return '관리자 모드';
    if (aiAgent.isEnabled) return 'AI 활성화';
    return '일반 모드';
  };

  const getModeStatusColor = () => {
    if (isLocked) return 'text-red-400';
    if (adminMode.isAuthenticated) return 'text-orange-400';
    if (aiAgent.isEnabled) return 'text-purple-400';
    return 'text-cyan-400';
  };

  const getSystemStatusText = () => {
    if (!systemState) return '확인 중...';
    if (systemState.isRunning) return '실행 중';
    return '정지됨';
  };

  const getSystemStatusColor = () => {
    if (!systemState) return 'text-gray-500';
    return systemState.isRunning ? 'text-green-600' : 'text-red-600';
  };

  const handleTimerExpired = async () => {
    try {
      await stopSystemState();
      info('시스템 실행 시간이 만료되어 자동으로 정지되었습니다');
    } catch (error) {
      console.error('시스템 자동 정지 실패:', error);
    }
  };

  const handleSystemControl = async (action: 'start' | 'stop') => {
    try {
      if (action === 'start') {
        await startSystemState();
        success('시스템이 시작되었습니다');
      } else {
        await stopSystemState();
        success('시스템이 정지되었습니다');
      }
    } catch (error) {
      console.error('시스템 제어 실패:', error);
    }
  };

  // 🎯 단순화된 드롭다운 렌더링 (Portal 사용하지만 의존성 최소화)
  const renderDropdown = () => {
    if (typeof window === 'undefined' || !isOpen || !isPositionCalculated) {
      return null;
    }

    return createPortal(
      <AnimatePresence mode='wait'>
        {isOpen && (
          <>
            {/* 모바일 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/20 z-[999] sm:hidden'
              onClick={() => onClick({} as React.MouseEvent)}
            />

            {/* 드롭다운 메뉴 */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                transformOrigin: dropdownPosition.transformOrigin,
                zIndex: 1000,
              }}
              className='w-96 bg-white/95 backdrop-blur-xl border border-gray-300 rounded-xl shadow-2xl ring-1 ring-black/5'
              role='menu'
            >
              {/* 헤더 */}
              <div className='px-4 py-3 border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  {/* 아바타 */}
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

                  {/* 사용자 정보 */}
                  <div className='flex-1'>
                    <h3 className='font-medium text-gray-900'>{userName}</h3>
                    <p className={`text-sm ${getModeStatusColor()}`}>
                      {getModeDisplayText()}
                    </p>
                  </div>

                  {/* 상태 인디케이터 */}
                  <div className='flex items-center gap-1'>
                    {isSystemStarted && (
                      <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
                    )}
                    {adminMode.isAuthenticated && (
                      <div className='w-2 h-2 bg-orange-400 rounded-full animate-pulse' />
                    )}
                    {aiAgent.isEnabled && aiAgent.state === 'processing' && (
                      <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse' />
                    )}
                    {isLocked && (
                      <AlertTriangle className='w-3 h-3 text-red-400' />
                    )}
                    <ChevronDown
                      className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 시스템 상태 */}
              <div className='p-3 bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Activity className='w-4 h-4 text-blue-600' />
                    <span className='text-sm font-medium text-gray-700'>
                      시스템 상태
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${getSystemStatusColor()}`}
                  >
                    {getSystemStatusText()}
                  </span>
                </div>

                {/* 환경 정보 */}
                <div className='mt-1 flex items-center justify-between text-xs text-gray-500'>
                  <span>환경: {systemState?.environment || 'Unknown'}</span>
                  <span>v{systemState?.version || '1.0.0'}</span>
                </div>

                {/* 카운트다운 타이머 */}
                {systemState?.isRunning && systemState.endTime && (
                  <div className='mt-2 flex justify-center'>
                    <CountdownTimer
                      endTime={systemState.endTime}
                      onExpired={handleTimerExpired}
                      size='sm'
                      className='bg-blue-50/80 border-blue-200'
                    />
                  </div>
                )}

                {/* 사용자 ID */}
                <div className='mt-1 text-xs text-gray-400 text-center'>
                  사용자 ID: {userId.slice(0, 8)}...
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
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        adminMode.isAuthenticated
                          ? 'bg-orange-500/20'
                          : 'bg-gray-500/20'
                      }`}
                    >
                      {adminMode.isAuthenticated ? (
                        <Unlock className='w-4 h-4 text-orange-600' />
                      ) : (
                        <Lock className='w-4 h-4 text-gray-600' />
                      )}
                    </div>
                    <div>
                      <div className='text-gray-900 font-medium'>
                        {adminMode.isAuthenticated
                          ? '관리자 모드 해제'
                          : '관리자 모드'}
                      </div>
                      <div className='text-gray-600 text-xs'>
                        {adminMode.isAuthenticated
                          ? '관리자 권한을 해제합니다'
                          : '관리자 권한을 획득합니다'}
                      </div>
                    </div>
                  </motion.button>
                ) : (
                  // 패스워드 입력 폼
                  <div className='p-3 mb-2'>
                    <form onSubmit={handlePasswordSubmit}>
                      <div className='space-y-2'>
                        <input
                          type='password'
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder='관리자 비밀번호'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                          autoFocus
                        />
                        {passwordError && (
                          <p className='text-red-500 text-xs'>
                            {passwordError}
                          </p>
                        )}
                        <div className='flex gap-2'>
                          <button
                            type='submit'
                            className='flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors'
                          >
                            확인
                          </button>
                          <button
                            type='button'
                            onClick={handlePasswordCancel}
                            className='flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* 시스템 제어 */}
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSystemToggle}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 mb-2'
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSystemStarted ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}
                  >
                    {isSystemStarted ? (
                      <Square className='w-4 h-4 text-red-600' />
                    ) : (
                      <Play className='w-4 h-4 text-green-600' />
                    )}
                  </div>
                  <div>
                    <div className='text-gray-900 font-medium'>
                      {isSystemStarted ? '시스템 정지' : '시스템 시작'}
                    </div>
                    <div className='text-gray-600 text-xs'>
                      {isSystemStarted
                        ? '실행 중인 시스템을 정지합니다'
                        : '시스템을 시작합니다'}
                    </div>
                  </div>
                </motion.button>

                {/* 시스템 재시작 */}
                {isSystemStarted && (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async e => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        await handleSystemControl('stop');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await handleSystemControl('start');
                        success('시스템이 재시작되었습니다');
                        onClick({} as React.MouseEvent);
                      } catch (error) {
                        console.error('시스템 재시작 실패:', error);
                      }
                    }}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
                  >
                    <div className='p-2 rounded-lg bg-blue-500/20'>
                      <RefreshCw className='w-4 h-4 text-blue-600' />
                    </div>
                    <div>
                      <div className='text-gray-900 font-medium'>
                        시스템 재시작
                      </div>
                      <div className='text-gray-600 text-xs'>
                        시스템을 재시작합니다
                      </div>
                    </div>
                  </motion.button>
                )}

                {/* 대시보드 이동 */}
                {systemState?.isRunning && (
                  <Link href='/dashboard'>
                    <motion.button
                      whileHover={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onClick({} as React.MouseEvent)}
                      className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
                    >
                      <div className='p-2 rounded-lg bg-blue-500/20'>
                        <Activity className='w-4 h-4 text-blue-600' />
                      </div>
                      <div>
                        <div className='text-gray-900 font-medium'>
                          대시보드 이동
                        </div>
                        <div className='text-gray-600 text-xs'>
                          실시간 모니터링 대시보드로 이동
                        </div>
                      </div>
                    </motion.button>
                  </Link>
                )}

                {/* 설정 버튼 */}
                {!adminMode.isAuthenticated && (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(128, 90, 213, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSettingsClick}
                    className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2'
                  >
                    <div className='p-2 rounded-lg bg-purple-500/20'>
                      <Settings className='w-4 h-4 text-purple-600' />
                    </div>
                    <div>
                      <div className='text-gray-900 font-medium'>설정</div>
                      <div className='text-gray-600 text-xs'>
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
                >
                  <div className='p-2 rounded-lg bg-red-500/20'>
                    <LogOut className='w-4 h-4 text-red-600' />
                  </div>
                  <div>
                    <div className='text-gray-900 font-medium'>로그아웃</div>
                    <div className='text-gray-600 text-xs'>
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
          {isSystemStarted && (
            <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
          )}
          {adminMode.isAuthenticated && (
            <div className='w-2 h-2 bg-orange-400 rounded-full animate-pulse' />
          )}
          {aiAgent.isEnabled && aiAgent.state === 'processing' && (
            <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse' />
          )}
          {isLocked && <AlertTriangle className='w-3 h-3 text-red-400' />}
          <ChevronDown
            className={`w-3 h-3 text-white/70 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </motion.button>

      {/* 드롭다운 메뉴 */}
      {renderDropdown()}
    </div>
  );
};

// React.memo로 감싸서 불필요한 리렌더링 방지
export const UnifiedProfileButton = memo(UnifiedProfileButtonComponent);
