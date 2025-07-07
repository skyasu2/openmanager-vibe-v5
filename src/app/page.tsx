/**
 * 🏠 OpenManager 메인 페이지
 *
 * GitHub OAuth + 게스트 로그인 지원
 * 로그인된 사용자에게 시스템 시작 버튼과 기능 카드들 표시
 */

'use client';

import { motion } from 'framer-motion';
import {
  Database,
  LogOut,
  Monitor,
  Play,
  Shield,
  User,
  Zap,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSystemStarted, setIsSystemStarted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [guestUser, setGuestUser] = useState<{
    name: string;
    email?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 게스트 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;

    const checkGuestLogin = () => {
      try {
        const authType = localStorage.getItem('auth_type');
        const authUser = localStorage.getItem('auth_user');
        const sessionId = localStorage.getItem('auth_session_id');

        if (authType === 'guest' && authUser && sessionId) {
          setGuestUser(JSON.parse(authUser));
          setIsLoading(false);
          return true;
        }
        return false;
      } catch (error) {
        console.error('게스트 로그인 확인 실패:', error);
        return false;
      }
    };

    const hasGuestLogin = checkGuestLogin();

    // GitHub OAuth도 없고 게스트 로그인도 없으면 로그인 페이지로
    if (!session && !hasGuestLogin) {
      router.push('/login');
      return;
    }

    setIsLoading(false);
  }, [session, status, router]);

  // 카운트다운 타이머
  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCountingDown && countdown === 0) {
      // 카운트다운 완료 후 대시보드로 이동
      router.push('/dashboard');
    }
    return;
  }, [countdown, isCountingDown, router]);

  // 시스템 시작 버튼 클릭
  const handleSystemStart = () => {
    console.log('🚀 시스템 시작 버튼 클릭');
    setIsCountingDown(true);
    setCountdown(3); // 3초 카운트다운
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    if (session) {
      // GitHub OAuth 로그아웃
      await signOut({ callbackUrl: '/login' });
    } else {
      // 게스트 로그아웃
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');
      localStorage.removeItem('auth_user');
      router.push('/login');
    }
  };

  // 사용자 정보 가져오기
  const getUserInfo = () => {
    if (session?.user) {
      return {
        name: session.user.name || 'GitHub 사용자',
        type: 'GitHub',
        avatar: session.user.image,
      };
    } else if (guestUser) {
      return {
        name: guestUser.name || '게스트',
        type: '게스트',
        avatar: null,
      };
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <span className='text-gray-600'>페이지를 준비하고 있습니다...</span>
        </div>
      </div>
    );
  }

  const userInfo = getUserInfo();

  // 카운트다운 화면
  if (isCountingDown) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className='text-center'
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className='w-32 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6'
          >
            <motion.span
              key={countdown}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className='text-6xl font-bold text-white'
            >
              {countdown}
            </motion.span>
          </motion.div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>
            시스템 시작 중...
          </h2>
          <p className='text-gray-600'>잠시만 기다려주세요</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
      {/* 상단 네비게이션 */}
      <nav className='bg-white shadow-sm border-b border-gray-200 px-6 py-4'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center'>
              <span className='text-white text-lg font-bold'>OM</span>
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>OpenManager</h1>
              <p className='text-xs text-gray-500'>AI 서버 모니터링</p>
            </div>
          </div>

          {/* 사용자 정보 및 로그아웃 */}
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                {userInfo?.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className='w-8 h-8 rounded-full'
                  />
                ) : (
                  <User className='w-4 h-4 text-white' />
                )}
              </div>
              <div className='text-sm'>
                <div className='font-medium text-gray-900'>
                  {userInfo?.name}
                </div>
                <div className='text-gray-500'>{userInfo?.type}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <LogOut className='w-4 h-4' />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className='relative overflow-hidden'>
        {/* 배경 요소들 */}
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-100/50 to-transparent rounded-full'></div>
          <div className='absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-100/50 to-transparent rounded-full'></div>
        </div>

        <div className='relative z-10 text-center px-6 py-16'>
          {/* 메인 타이틀 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className='text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6'
          >
            OpenManager
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className='text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed'
          >
            AI 기반 서버 모니터링 및 관리 시스템
            <br />
            지능형 분석과 실시간 모니터링으로 서버를 효율적으로 관리하세요
          </motion.h2>

          {/* 기능 카드들 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto'
          >
            {[
              {
                icon: Monitor,
                title: '실시간 모니터링',
                desc: '서버 상태 실시간 추적',
              },
              {
                icon: Database,
                title: '데이터 분석',
                desc: '성능 데이터 심층 분석',
              },
              { icon: Shield, title: '보안 관리', desc: '강화된 보안 시스템' },
              { icon: Zap, title: 'AI 최적화', desc: '지능형 성능 최적화' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group'
              >
                <feature.icon className='w-8 h-8 text-blue-600 mb-3 mx-auto group-hover:scale-110 transition-transform duration-200' />
                <h3 className='font-semibold text-gray-800 mb-2'>
                  {feature.title}
                </h3>
                <p className='text-sm text-gray-600'>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* 시스템 시작 버튼 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <button
              onClick={handleSystemStart}
              className='group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95'
            >
              <div className='flex items-center space-x-3'>
                <Play className='w-7 h-7 group-hover:scale-110 transition-transform duration-200' />
                <span>시스템 시작</span>
              </div>

              {/* 버튼 글로우 효과 */}
              <div className='absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300'></div>
            </button>
          </motion.div>

          {/* 하단 정보 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className='mt-12 text-center'
          >
            <p className='text-gray-500 text-sm mb-2'>
              시스템 시작을 클릭하여 모니터링을 시작하세요
            </p>
            <p className='text-gray-400 text-xs'>
              OpenManager Vibe v5.44.3 • {userInfo?.type} 로그인
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
