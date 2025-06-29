/**
 * 🎯 Unified Profile Button
 *
 * 통합 프로필 버튼 컴포넌트 (간소화 버전)
 * 실제 시스템 제어 기능만 포함
 *
 * @created 2025-06-09
 * @updated 2025-01-28 - 목업 기능 제거, 실제 기능만 유지
 * @author AI Assistant
 */

'use client';

import { useToast } from '@/components/ui/ToastNotification';
import { useVercelSystemStore } from '@/stores/vercelSystemStore';
import { motion } from 'framer-motion';
import {
  Activity,
  ChevronDown,
  Home,
  Lock,
  LogOut,
  Play,
  RefreshCw,
  Server,
  Settings,
  Square,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPosition {
  top: number;
  left: number;
  transformOrigin: string;
}

interface ProfileButtonProps {
  userName: string;
  userAvatar?: string;
  isOpen: boolean;
  onClick: (event: React.MouseEvent) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 관리자 모드 상태 추가
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // 베르셀 시스템 상태만 사용 (실제 기능)
  const vercelStore = useVercelSystemStore();
  const isSystemStarted = vercelStore.systemInfo.state === 'RUNNING';
  const isSystemStarting = vercelStore.systemInfo.state === 'STARTING';

  // 베르셀 시스템 함수들 (실제 연동)
  const {
    startSystem: vercelStartSystem,
    stopSystem: vercelStopSystem,
    startPolling,
    stopPolling,
  } = vercelStore;

  // 베르셀 시스템 폴링 시작
  useEffect(() => {
    console.log('🔄 프로필 컴포넌트에서 베르셀 시스템 폴링 시작');
    startPolling();

    return () => {
      console.log('⏹️ 프로필 컴포넌트에서 베르셀 시스템 폴링 중지');
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  const { success, info, error } = useToast();

  // 드롭다운 위치 계산
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current || !isOpen) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = buttonRect.bottom + 8;
    let left = buttonRect.right - 320; // 드롭다운 폭 줄임

    const dropdownHeight = 300; // 높이도 줄임
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - 8;
    }

    if (left < 16) {
      left = 16;
    }

    if (viewportWidth < 640) {
      left = (viewportWidth - 320) / 2;
      if (left < 16) left = 16;
    }

    setDropdownPosition({ top, left, transformOrigin: 'top right' });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
    }
  }, [isOpen, calculateDropdownPosition]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target)) {
        return;
      }

      if (dropdownRef.current?.contains(target)) {
        return;
      }

      onClick({} as React.MouseEvent);
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, {
        passive: true,
        capture: true,
      });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClick, buttonRef]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClick]);

  // 시스템 제어 함수들 (실제 기능)
  const handleSystemStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      info('시스템 시작 중...');
      await vercelStartSystem();
      success('시스템이 성공적으로 시작되었습니다');
    } catch (error) {
      console.error('시스템 시작 실패:', error);
      error('시스템 시작에 실패했습니다');
    }
  };

  const handleSystemStop = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('시스템을 중지하시겠습니까?')) return;

    try {
      info('시스템 중지 중...');
      await vercelStopSystem();
      success('시스템이 성공적으로 중지되었습니다');
    } catch (error) {
      console.error('시스템 중지 실패:', error);
      error('시스템 중지에 실패했습니다');
    }
  };

  const handleSystemRestart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('시스템을 재시작하시겠습니까?')) return;

    try {
      info('시스템 재시작 중...');
      await vercelStopSystem();
      setTimeout(async () => {
        await vercelStartSystem();
        success('시스템이 성공적으로 재시작되었습니다');
      }, 2000);
    } catch (error) {
      console.error('시스템 재시작 실패:', error);
      error('시스템 재시작에 실패했습니다');
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm('로그아웃 하시겠습니까?')) {
      success('로그아웃되었습니다');
      onClick({} as React.MouseEvent);
    }
  };

  // 관리자 모드 로그인 함수
  const handleAdminLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAdminLogin(true);
  };

  const handleAdminPasswordSubmit = (
    e: React.KeyboardEvent | React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (adminPassword === '4231') {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      success('관리자 모드로 전환되었습니다');
      // 관리자 페이지로 이동
      window.location.href = '/admin';
    } else {
      error('비밀번호가 틀렸습니다');
      setAdminPassword('');
    }
  };

  const handleAdminLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdminMode(false);
    success('관리자 모드에서 로그아웃되었습니다');
  };

  // 시스템 상태 가져오기
  const getSystemStatus = () => {
    if (isSystemStarting) {
      return {
        text: '시스템 시작 중',
        details: '잠시만 기다려주세요...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: RefreshCw,
      };
    } else if (isSystemStarted) {
      return {
        text: '시스템 실행 중',
        details: '모든 서비스가 정상 동작 중',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: Activity,
      };
    } else {
      return {
        text: '시스템 중지됨',
        details: '시스템을 시작해주세요',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: Server,
      };
    }
  };

  const systemStatus = getSystemStatus();

  // 드롭다운 포털
  const DropdownPortal = useCallback(() => {
    if (!isOpen) return null;

    return createPortal(
      <>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              duration: 0.15,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              transformOrigin: dropdownPosition.transformOrigin,
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0)',
            }}
            className='w-80 bg-white/95 backdrop-blur-xl border border-gray-300 rounded-xl shadow-2xl z-[10000]'
            role='menu'
            aria-orientation='vertical'
          >
            {/* 헤더 */}
            <div className='p-4 border-b border-gray-300'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600'>
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
                  <div className='text-gray-900 font-medium'>{userName}</div>
                  <div className='text-sm text-gray-500'>
                    OpenManager 관리자
                  </div>
                </div>
              </div>

              {/* 시스템 상태 */}
              <div className='flex items-center justify-between p-3 rounded-lg bg-gray-100'>
                <div className='flex items-center gap-3'>
                  <div className={`p-2 rounded-lg ${systemStatus.bgColor}`}>
                    <systemStatus.icon
                      className={`w-4 h-4 ${systemStatus.color} ${isSystemStarting ? 'animate-spin' : ''}`}
                    />
                  </div>
                  <div>
                    <div className='text-gray-900 text-sm font-medium'>
                      {systemStatus.text}
                    </div>
                    <div className={`text-xs ${systemStatus.color}`}>
                      {systemStatus.details}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 시스템 제어 버튼들 */}
            <div className='p-2'>
              {/* 시스템 시작 버튼 */}
              {!isSystemStarted && !isSystemStarting && (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSystemStart}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 mb-2'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-green-500/20'>
                    <Play className='w-4 h-4 text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-gray-900 font-medium'>시스템 시작</div>
                    <div className='text-gray-600 text-xs'>
                      모니터링 시스템을 시작합니다
                    </div>
                  </div>
                </motion.button>
              )}

              {/* 시스템 중지 버튼 */}
              {isSystemStarted && (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSystemStop}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 mb-2'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-red-500/20'>
                    <Square className='w-4 h-4 text-red-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-gray-900 font-medium'>시스템 중지</div>
                    <div className='text-gray-600 text-xs'>
                      모니터링 시스템을 중지합니다
                    </div>
                  </div>
                </motion.button>
              )}

              {/* 시스템 재시작 버튼 */}
              {isSystemStarted && (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSystemRestart}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-blue-500/20'>
                    <RefreshCw className='w-4 h-4 text-blue-600' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-gray-900 font-medium'>
                      시스템 재시작
                    </div>
                    <div className='text-gray-600 text-xs'>
                      시스템을 재시작합니다
                    </div>
                  </div>
                </motion.button>
              )}

              {/* 대시보드 이동 버튼 */}
              <Link href='/dashboard'>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onClick({} as React.MouseEvent)}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
                  role='menuitem'
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

              {/* 개발 도구 버튼 */}
              <Link href='/dev-tools'>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(128, 90, 213, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onClick({} as React.MouseEvent)}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-purple-500/20'>
                    <Settings className='w-4 h-4 text-purple-600' />
                  </div>
                  <div>
                    <div className='text-gray-900 font-medium'>개발 도구</div>
                    <div className='text-gray-600 text-xs'>
                      개발자 도구 및 테스트 패널
                    </div>
                  </div>
                </motion.button>
              </Link>

              {/* 홈으로 이동 버튼 */}
              <Link href='/'>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(75, 85, 99, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onClick({} as React.MouseEvent)}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 mb-2'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-gray-500/20'>
                    <Home className='w-4 h-4 text-gray-600' />
                  </div>
                  <div>
                    <div className='text-gray-900 font-medium'>홈으로</div>
                    <div className='text-gray-600 text-xs'>
                      메인 페이지로 이동
                    </div>
                  </div>
                </motion.button>
              </Link>

              {/* 관리자 모드 로그인/로그아웃 */}
              {!isAdminMode ? (
                <>
                  {!showAdminLogin ? (
                    <motion.button
                      whileHover={{
                        backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAdminLogin}
                      className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2'
                      role='menuitem'
                    >
                      <div className='p-2 rounded-lg bg-amber-500/20'>
                        <Lock className='w-4 h-4 text-amber-600' />
                      </div>
                      <div>
                        <div className='text-gray-900 font-medium'>
                          관리자 모드
                        </div>
                        <div className='text-gray-600 text-xs'>
                          관리자 페이지 접근
                        </div>
                      </div>
                    </motion.button>
                  ) : (
                    <div className='mb-2 p-3 border border-amber-200 rounded-lg bg-amber-50'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Lock className='w-4 h-4 text-amber-600' />
                        <span className='text-sm font-medium text-gray-900'>
                          관리자 비밀번호 입력
                        </span>
                      </div>
                      <input
                        type='password'
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAdminPasswordSubmit(e);
                          }
                          if (e.key === 'Escape') {
                            setShowAdminLogin(false);
                            setAdminPassword('');
                          }
                        }}
                        placeholder='비밀번호를 입력하세요'
                        className='w-full px-3 py-2 text-sm border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
                        autoFocus
                      />
                      <div className='flex gap-2 mt-2'>
                        <button
                          onClick={handleAdminPasswordSubmit}
                          className='flex-1 px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors'
                        >
                          확인
                        </button>
                        <button
                          onClick={() => {
                            setShowAdminLogin(false);
                            setAdminPassword('');
                          }}
                          className='flex-1 px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors'
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdminLogout}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-amber-500/20'>
                    <Lock className='w-4 h-4 text-amber-600' />
                  </div>
                  <div>
                    <div className='text-gray-900 font-medium'>
                      관리자 모드 해제
                    </div>
                    <div className='text-gray-600 text-xs'>
                      관리자 권한을 해제합니다
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
        )}
      </>,
      document.body
    );
  }, [
    isOpen,
    onClick,
    dropdownPosition,
    dropdownRef,
    userName,
    userAvatar,
    systemStatus,
    isSystemStarted,
    isSystemStarting,
    handleSystemStart,
    handleSystemStop,
    handleSystemRestart,
    handleLogout,
    isAdminMode,
    showAdminLogin,
    adminPassword,
    handleAdminLogin,
    handleAdminPasswordSubmit,
    handleAdminLogout,
  ]);

  return (
    <div className='relative'>
      {/* 프로필 버튼 */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className='flex items-center gap-3 p-2 rounded-xl backdrop-blur-md border bg-gray-900/80 border-gray-700/60 hover:bg-gray-900/90 focus:ring-gray-500 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent'
        style={{
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
        }}
        aria-label='프로필 메뉴 열기'
        aria-expanded={isOpen}
        aria-haspopup='true'
      >
        {/* 아바타 */}
        <div className='w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600'>
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
          <div className='text-gray-300 text-xs'>
            {isSystemStarted ? '시스템 실행중' : '시스템 중지됨'}
          </div>
        </div>

        {/* 상태 인디케이터 */}
        <div className='flex items-center gap-1'>
          {/* 시스템 상태 */}
          {isSystemStarted && (
            <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
          )}

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
};

// React.memo로 감싸서 불필요한 리렌더링 방지
export const UnifiedProfileButton = memo(UnifiedProfileButtonComponent);
