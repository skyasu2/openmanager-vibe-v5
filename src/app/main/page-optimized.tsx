/**
 * 🏠 OpenManager 메인 페이지 - 성능 최적화 버전
 *
 * 주요 개선사항:
 * - 동적 로딩 확대로 초기 번들 사이즈 감소
 * - 컴포넌트 분리로 코드 복잡도 감소
 * - Suspense 경계로 점진적 렌더링
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MainPageSkeleton from '@/components/home/MainPageSkeleton';

// 동적 로딩 컴포넌트들 - 초기 로드에서 제외
const UnifiedProfileHeader = dynamic(
  () => import('@/components/shared/UnifiedProfileHeader'),
  {
    ssr: false,
    loading: () => (
      <div className='w-10 h-10 rounded-full bg-white/10 animate-pulse' />
    ),
  }
);

const SystemControls = dynamic(
  () => import('@/components/home/SystemControls'),
  {
    ssr: false,
    loading: () => (
      <div className='max-w-2xl mx-auto text-center'>
        <div className='w-64 h-16 bg-white/10 rounded-xl animate-pulse mx-auto' />
      </div>
    ),
  }
);

const FeatureCardsGrid = dynamic(
  () => import('@/components/home/FeatureCardsGrid'),
  {
    ssr: false,
    loading: () => (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-32 bg-white/10 rounded-lg animate-pulse' />
        ))}
      </div>
    ),
  }
);

// 헤비한 훅들을 lazy 로딩
const useSystemHooks = () => {
  const [hooks, setHooks] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import('@/hooks/useSystemStatus'),
      import('@/stores/useUnifiedAdminStore'),
      import('@/lib/supabase-auth'),
    ]).then(([systemStatus, adminStore, auth]) => {
      setHooks({
        useSystemStatus: systemStatus.useSystemStatus,
        useUnifiedAdminStore: adminStore.useUnifiedAdminStore,
        auth,
      });
    });
  }, []);

  return hooks;
};

// 인증 체크 컴포넌트
function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    isAuthenticated: boolean;
    user: any;
  }>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    // 동적으로 인증 모듈 로드
    import('@/lib/supabase-auth').then(async authModule => {
      try {
        const [isAuthenticated, user] = await Promise.all([
          authModule.isAuthenticated(),
          authModule.getCurrentUser(),
        ]);

        setAuthState({
          isLoading: false,
          isAuthenticated,
          user,
        });

        if (!isAuthenticated || !user) {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.replace('/login');
      }
    });
  }, [router]);

  if (authState.isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-8 h-8 animate-spin text-white mx-auto mb-4' />
            <p className='text-white/80'>인증 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// 메인 콘텐츠 컴포넌트
function MainContent() {
  const hooks = useSystemHooks();
  const router = useRouter();
  const [systemState, setSystemState] = useState({
    isStarting: false,
    countdown: 0,
    isGitHubUser: false,
  });

  useEffect(() => {
    if (!hooks) return;

    // 훅이 로드되면 상태 초기화
    const { isGitHubAuthenticated } = hooks.auth;
    isGitHubAuthenticated().then(setSystemState);
  }, [hooks]);

  if (!hooks) {
    return <MainPageSkeleton />;
  }

  const handleSystemToggle = async () => {
    // 시스템 토글 로직
    setSystemState(prev => ({ ...prev, isStarting: true }));
    // ... 구현
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
      {/* 웨이브 효과는 CSS로만 구현하여 성능 개선 */}
      <div className='wave-particles' />

      {/* 헤더 */}
      <header className='relative z-50 flex justify-between items-center p-6'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg'>
            <i
              className='fas fa-server text-white text-lg'
              aria-hidden='true'
            />
          </div>
          <div>
            <h1 className='text-xl font-bold text-white'>OpenManager</h1>
            <p className='text-xs text-white/70'>v5.65.3</p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className='w-10 h-10 rounded-full bg-white/10 animate-pulse' />
          }
        >
          <UnifiedProfileHeader />
        </Suspense>
      </header>

      {/* 메인 콘텐츠 */}
      <div className='relative z-10 container mx-auto px-6 pt-8'>
        {/* 타이틀 섹션 - 정적 콘텐츠 */}
        <div className='text-center mb-12'>
          <h1 className='text-3xl md:text-5xl font-bold mb-4'>
            <span className='bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent'>
              AI
            </span>{' '}
            <span className='font-semibold text-white'>기반</span>{' '}
            <span className='text-white'>서버 모니터링</span>
          </h1>
          <p className='text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-white/80'>
            <span className='text-sm text-white/60'>
              완전 독립 동작 AI 엔진 | 향후 개발: 선택적 LLM API 연동 확장
            </span>
          </p>
        </div>

        {/* 제어 패널 - 동적 로딩 */}
        <div className='mb-12'>
          <Suspense
            fallback={
              <div className='max-w-2xl mx-auto text-center'>
                <div className='w-64 h-16 bg-white/10 rounded-xl animate-pulse mx-auto' />
              </div>
            }
          >
            <SystemControls
              isGitHubUser={systemState.isGitHubUser}
              systemStartCountdown={systemState.countdown}
              isSystemStarting={systemState.isStarting}
              isLoading={false}
              onSystemToggle={handleSystemToggle}
              onDashboardClick={handleDashboardClick}
            />
          </Suspense>
        </div>

        {/* 기능 카드 그리드 - 동적 로딩 */}
        <div className='mb-12'>
          <Suspense
            fallback={
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className='h-32 bg-white/10 rounded-lg animate-pulse'
                  />
                ))}
              </div>
            }
          >
            <FeatureCardsGrid />
          </Suspense>
        </div>

        {/* 푸터 */}
        <div className='mt-8 pt-6 border-t text-center border-white/20'>
          <p className='text-white/70'>
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function OptimizedMainPage() {
  return (
    <Suspense fallback={<MainPageSkeleton />}>
      <AuthCheck>
        <MainContent />
      </AuthCheck>
    </Suspense>
  );
}
