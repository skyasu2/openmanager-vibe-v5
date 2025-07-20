'use client';

import {
  getCurrentUser,
  isGitHubAuthenticated,
  isGuestUser,
} from '@/lib/supabase-auth';
import { useSession, signOut } from '@/hooks/useSupabaseSession';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Shield,
  UserCheck,
  LogOut,
  User,
  Settings2,
  Crown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useRef } from 'react';

interface UnifiedProfileHeaderProps {
  className?: string;
}

interface UserInfo {
  name?: string;
  email?: string;
  avatar?: string | null;
}

export default function UnifiedProfileHeader({
  className = '',
}: UnifiedProfileHeaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isGitHubUser, setIsGitHubUser] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // 🔒 보안 관련 상태
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockEndTime, setLockEndTime] = useState<number | null>(null);
  const [remainingLockTime, setRemainingLockTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // 드롭다운 외부 클릭 감지를 위한 ref
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔄 사용자 정보 초기화 및 업데이트
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = await getCurrentUser();
        const isGitHub = await isGitHubAuthenticated();
        const isGuestMode = isGuestUser();

        setUserInfo(user);
        setIsGitHubUser(isGitHub);
        setIsGuest(isGuestMode);

        // 관리자 모드 상태 확인
        const adminMode = localStorage.getItem('admin_mode') === 'true';
        setIsAdminMode(adminMode);

        console.log('👤 사용자 정보 로드:', {
          user,
          isGitHub,
          isGuest: isGuestMode,
          isAdmin: adminMode,
          sessionStatus: status,
        });
      } catch (error) {
        console.error('❌ 사용자 정보 로드 실패:', error);
      }
    };

    if (status !== 'loading') {
      loadUserInfo();
    }
  }, [session, status]);

  // 🔒 보안: 잠금 상태 확인 및 초기화
  useEffect(() => {
    const checkLockStatus = () => {
      const storedFailedAttempts = parseInt(
        localStorage.getItem('admin_failed_attempts') || '0'
      );
      const storedLockEndTime = parseInt(
        localStorage.getItem('admin_lock_end_time') || '0'
      );

      setFailedAttempts(storedFailedAttempts);

      if (storedLockEndTime > Date.now()) {
        setIsLocked(true);
        setLockEndTime(storedLockEndTime);
      } else {
        // 잠금 시간이 지났으면 초기화
        if (storedLockEndTime > 0) {
          localStorage.removeItem('admin_failed_attempts');
          localStorage.removeItem('admin_lock_end_time');
          setFailedAttempts(0);
        }
        setIsLocked(false);
        setLockEndTime(null);
      }
    };

    checkLockStatus();
  }, []);

  // 🔒 보안: 잠금 시간 카운트다운
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLocked && lockEndTime) {
      timer = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.ceil((lockEndTime - Date.now()) / 1000)
        );
        setRemainingLockTime(remaining);

        if (remaining <= 0) {
          setIsLocked(false);
          setLockEndTime(null);
          setFailedAttempts(0);
          localStorage.removeItem('admin_failed_attempts');
          localStorage.removeItem('admin_lock_end_time');
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLocked, lockEndTime]);

  // 🎯 외부 클릭 감지로 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
        setShowAdminInput(false);
        setAdminPassword('');
      }
    };

    // 드롭다운이 열려있을 때만 이벤트 리스너 등록
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showProfileMenu]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProfileMenu) {
        setShowProfileMenu(false);
        setShowAdminInput(false);
        setAdminPassword('');
      }
    };

    if (showProfileMenu) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showProfileMenu]);

  // 🔒 보안 강화된 관리자 모드 인증
  const handleAdminAuth = useCallback(async () => {
    // 잠금 상태 확인
    if (isLocked) {
      alert(
        `🔒 보안상 ${Math.ceil(remainingLockTime / 60)}분 ${remainingLockTime % 60}초 후에 다시 시도해주세요.`
      );
      return;
    }

    // 처리 중 상태 설정 (중복 요청 방지)
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 🎯 의도적 지연 (브루트포스 공격 방어)
      const delay = Math.min(failedAttempts * 1000, 5000); // 최대 5초
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (adminPassword === '4231') {
        // ✅ 인증 성공
        setIsAdminMode(true);
        localStorage.setItem('admin_mode', 'true');
        setShowAdminInput(false);
        setAdminPassword('');
        setShowProfileMenu(false);

        // 실패 기록 초기화
        setFailedAttempts(0);
        localStorage.removeItem('admin_failed_attempts');
        localStorage.removeItem('admin_lock_end_time');

        console.log('🔑 관리자 모드 활성화');
      } else {
        // ❌ 인증 실패
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        localStorage.setItem(
          'admin_failed_attempts',
          newFailedAttempts.toString()
        );

        // 실패 횟수에 따른 처리
        if (newFailedAttempts >= 5) {
          // 5회 실패 시 30분 잠금
          const lockTime = Date.now() + 30 * 60 * 1000;
          setIsLocked(true);
          setLockEndTime(lockTime);
          localStorage.setItem('admin_lock_end_time', lockTime.toString());

          alert('🚨 5회 연속 실패로 30분간 잠금됩니다.');
        } else if (newFailedAttempts >= 3) {
          // 3회 실패 시 5분 잠금
          const lockTime = Date.now() + 5 * 60 * 1000;
          setIsLocked(true);
          setLockEndTime(lockTime);
          localStorage.setItem('admin_lock_end_time', lockTime.toString());

          alert('⚠️ 3회 연속 실패로 5분간 잠금됩니다.');
        } else {
          alert(`❌ 잘못된 관리자 비밀번호입니다. (${newFailedAttempts}/5)`);
        }

        setAdminPassword('');
      }
    } catch (error) {
      console.error('관리자 인증 오류:', error);
      alert('❌ 인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    adminPassword,
    failedAttempts,
    isLocked,
    remainingLockTime,
    isProcessing,
  ]);

  // 관리자 페이지 이동
  const handleAdminPage = useCallback(() => {
    setShowProfileMenu(false);
    router.push('/admin');
  }, [router]);

  // 로그아웃 처리 - 개선된 버전
  const handleLogout = useCallback(async () => {
    try {
      console.log('🚪 로그아웃 시작:', { isGitHubUser, isGuest });
      setShowProfileMenu(false);

      // 관리자 모드 해제
      localStorage.removeItem('admin_mode');
      setIsAdminMode(false);

      // 모든 인증 관련 데이터 정리
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');
      localStorage.removeItem('auth_user');

      // 쿠키 정리
      document.cookie =
        'guest_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      if (isGitHubUser) {
        // GitHub OAuth 로그아웃 - 로그인 페이지로 리다이렉트
        await signOut({ callbackUrl: '/login' });
      } else {
        // 게스트 모드 로그아웃 - 직접 로그인 페이지로 이동
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      // 실패해도 로그인 페이지로 강제 이동
      window.location.href = '/login';
    }
  }, [isGitHubUser, isGuest]);

  // 20분 타이머 자동 정지 기능
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      // 20분 후 자동 로그아웃
      inactivityTimer = setTimeout(
        () => {
          console.log('⏰ 20분 비활성으로 인한 자동 로그아웃');
          handleLogout();
        },
        20 * 60 * 1000
      ); // 20분
    };

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];

    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // 초기 타이머 설정
    resetTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [handleLogout]);

  const getUserName = () => {
    if (userInfo) {
      return (
        userInfo.name ||
        userInfo.email ||
        (isGitHubUser ? 'GitHub 사용자' : '게스트 사용자')
      );
    }
    return status === 'loading' ? '로딩 중...' : '사용자';
  };

  const getUserEmail = () => {
    return userInfo?.email || null;
  };

  const getUserType = () => {
    if (status === 'loading') return '확인 중...';
    if (isAdminMode) return '관리자';
    if (isGitHubUser) return 'GitHub';
    if (isGuest) return '게스트';
    return '알 수 없음';
  };

  const getUserAvatar = (): string | undefined => {
    return userInfo?.avatar || undefined;
  };

  const getUserInitials = () => {
    const name = getUserName();
    if (name === '로딩 중...' || name === '사용자') return '?';

    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 🎯 개선된 프로필 드롭다운 */}
      <motion.button
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className='flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group'
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 프로필 아바타 */}
        <div className='relative'>
          {getUserAvatar() ? (
            <img
              src={getUserAvatar()}
              alt={getUserName()}
              className='w-8 h-8 rounded-full object-cover border-2 border-gray-200'
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                isAdminMode
                  ? 'bg-gradient-to-r from-red-500 to-pink-500'
                  : isGitHubUser
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : isGuest
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'bg-gray-500'
              }`}
            >
              {getUserInitials()}
            </div>
          )}

          {/* 사용자 타입 표시 배지 */}
          <div
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isAdminMode
                ? 'bg-red-500'
                : isGitHubUser
                  ? 'bg-green-500'
                  : isGuest
                    ? 'bg-blue-500'
                    : 'bg-gray-400'
            }`}
            title={`${getUserType()} 사용자`}
          />
        </div>

        {/* 사용자 정보 */}
        <div className='hidden sm:block text-left'>
          <div className='text-sm font-medium text-gray-900 flex items-center gap-1'>
            {getUserName()}
            {isAdminMode && (
              <div title='관리자 모드'>
                <Crown className='w-3 h-3 text-red-600' />
              </div>
            )}
            {isGitHubUser && !isAdminMode && (
              <div title='GitHub 인증'>
                <Shield className='w-3 h-3 text-green-600' />
              </div>
            )}
            {isGuest && !isAdminMode && (
              <div title='게스트 모드'>
                <UserCheck className='w-3 h-3 text-blue-600' />
              </div>
            )}
          </div>
          <div className='text-xs text-gray-500 flex items-center gap-1'>
            {getUserType()} 로그인
            {status === 'loading' && (
              <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' />
            )}
          </div>
        </div>

        {/* 드롭다운 화살표 */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            showProfileMenu ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      {/* 🎯 개선된 프로필 드롭다운 메뉴 */}
      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-200'
          >
            {/* 사용자 정보 헤더 */}
            <div className='px-4 py-3 border-b border-gray-100'>
              <div className='flex items-center gap-3'>
                {getUserAvatar() ? (
                  <img
                    src={getUserAvatar()}
                    alt={getUserName()}
                    className='w-10 h-10 rounded-full object-cover'
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      isAdminMode
                        ? 'bg-gradient-to-r from-red-500 to-pink-500'
                        : isGitHubUser
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : isGuest
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'bg-gray-500'
                    }`}
                  >
                    {getUserInitials()}
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-gray-900 truncate flex items-center gap-2'>
                    {getUserName()}
                    {isAdminMode && <Crown className='w-4 h-4 text-red-600' />}
                    {isGitHubUser && !isAdminMode && (
                      <Shield className='w-4 h-4 text-green-600' />
                    )}
                    {isGuest && !isAdminMode && (
                      <UserCheck className='w-4 h-4 text-blue-600' />
                    )}
                  </div>
                  {getUserEmail() && (
                    <div className='text-sm text-gray-500 truncate'>
                      {getUserEmail()}
                    </div>
                  )}
                  <div
                    className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                      isAdminMode
                        ? 'bg-red-100 text-red-700'
                        : isGitHubUser
                          ? 'bg-green-100 text-green-700'
                          : isGuest
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {getUserType()} 계정
                  </div>
                </div>
              </div>
            </div>

            {/* 메뉴 항목들 */}
            <div className='py-1'>
              {/* 프로필 설정 - GitHub 사용자만 */}
              {isGitHubUser && !isAdminMode && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/profile');
                  }}
                  className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  <User className='w-4 h-4 mr-3 text-gray-400' />
                  프로필 설정
                </button>
              )}

              {/* 관리자 모드 / 관리자 페이지 */}
              {!isAdminMode ? (
                <div>
                  <button
                    onClick={() => setShowAdminInput(!showAdminInput)}
                    disabled={isLocked}
                    className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                      isLocked
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Crown
                      className={`w-4 h-4 mr-3 ${isLocked ? 'text-gray-300' : 'text-gray-400'}`}
                    />
                    관리자 모드 {isLocked && '(잠금됨)'}
                  </button>

                  {/* 🔒 보안 강화된 관리자 비밀번호 입력 */}
                  {showAdminInput && (
                    <div className='px-4 py-2 border-t border-gray-100'>
                      {/* 보안 상태 표시 */}
                      {(failedAttempts > 0 || isLocked) && (
                        <div
                          className={`mb-2 p-2 rounded text-xs ${
                            isLocked
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}
                        >
                          {isLocked ? (
                            <div className='flex items-center gap-1'>
                              🔒 잠금됨: {Math.floor(remainingLockTime / 60)}분{' '}
                              {remainingLockTime % 60}초 남음
                            </div>
                          ) : (
                            <div className='flex items-center gap-1'>
                              ⚠️ 실패 {failedAttempts}/5회 (3회 실패 시 5분
                              잠금)
                            </div>
                          )}
                        </div>
                      )}

                      <input
                        type='password'
                        placeholder={isLocked ? '잠금 상태' : '관리자 비밀번호'}
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        onKeyPress={e =>
                          e.key === 'Enter' &&
                          !isLocked &&
                          !isProcessing &&
                          handleAdminAuth()
                        }
                        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none ${
                          isLocked
                            ? 'border-red-300 bg-red-50 cursor-not-allowed'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                        }`}
                        disabled={isLocked || isProcessing}
                        autoFocus={!isLocked}
                        maxLength={4}
                      />

                      <div className='flex gap-2 mt-2'>
                        <button
                          onClick={handleAdminAuth}
                          disabled={isLocked || isProcessing || !adminPassword}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            isLocked || isProcessing || !adminPassword
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {isProcessing ? '처리중...' : '확인'}
                        </button>
                        <button
                          onClick={() => {
                            setShowAdminInput(false);
                            setAdminPassword('');
                          }}
                          disabled={isProcessing}
                          className='px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50'
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleAdminPage}
                  className='flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors'
                >
                  <Crown className='w-4 h-4 mr-3 text-red-500' />
                  관리자 페이지
                </button>
              )}

              {/* 구분선 */}
              <div className='border-t border-gray-100 my-1' />

              {/* 계정 전환 - 게스트 사용자만 */}
              {isGuest && !isAdminMode && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/login');
                  }}
                  className='flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors'
                >
                  <Shield className='w-4 h-4 mr-3 text-blue-500' />
                  GitHub로 로그인
                </button>
              )}

              {/* 로그아웃 */}
              <button
                onClick={handleLogout}
                className='flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors'
              >
                <LogOut className='w-4 h-4 mr-3 text-red-500' />
                로그아웃
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
