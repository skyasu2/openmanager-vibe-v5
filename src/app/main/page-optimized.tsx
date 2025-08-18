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
      <div className="_animate-pulse h-10 w-10 rounded-full bg-white/10" />
    ),
  }
);

const SystemControls = dynamic(
  () => import('@/components/home/SystemControls'),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-2xl text-center">
        <div className="_animate-pulse mx-auto h-16 w-64 rounded-xl bg-white/10" />
      </div>
    ),
  }
);

const FeatureCardsGrid = dynamic(
  () => import('@/components/home/FeatureCardsGrid'),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="_animate-pulse h-32 rounded-lg bg-white/10" />
        ))}
      </div>
    ),
  }
);

// 헤비한 훅들을 lazy 로딩
const useSystemHooks = () => {
  const [hooks, setHooks] = useState<unknown>(null);

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
    user: unknown;
  }>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    // 동적으로 인증 모듈 로드
    import('@/lib/supabase-auth').then(async (authModule) => {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-white" />
            <p className="text-white/80">인증 확인 중...</p>
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
    const { isGitHubAuthenticated } = (
      hooks as { auth: { isGitHubAuthenticated: () => Promise<unknown> } }
    ).auth;
    isGitHubAuthenticated().then((result) => {
      setSystemState((prev) => ({ ...prev, isGitHubUser: Boolean(result) }));
    });
  }, [hooks]);

  if (!hooks) {
    return <MainPageSkeleton />;
  }

  const handleSystemToggle = async () => {
    // 시스템 토글 로직
    setSystemState((prev) => ({ ...prev, isStarting: true }));
    // ... 구현
  };

  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* 웨이브 효과는 CSS로만 구현하여 성능 개선 */}
      <div className="wave-particles" />

      {/* 헤더 */}
      <header className="relative z-50 flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <i
              className="fas fa-server text-lg text-white"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">OpenManager</h1>
            <p className="text-xs text-white/70">v5.65.3</p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="_animate-pulse h-10 w-10 rounded-full bg-white/10" />
          }
        >
          <UnifiedProfileHeader />
        </Suspense>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="container relative z-10 mx-auto px-6 pt-8">
        {/* 타이틀 섹션 - 정적 콘텐츠 */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI
            </span>{' '}
            <span className="font-semibold text-white">기반</span>{' '}
            <span className="text-white">서버 모니터링</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            <span className="text-sm text-white/60">
              완전 독립 동작 AI 엔진 | 향후 개발: 선택적 LLM API 연동 확장
            </span>
          </p>
        </div>

        {/* 제어 패널 - 동적 로딩 */}
        <div className="mb-12">
          <Suspense
            fallback={
              <div className="mx-auto max-w-2xl text-center">
                <div className="_animate-pulse mx-auto h-16 w-64 rounded-xl bg-white/10" />
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
        <div className="mb-12">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="_animate-pulse h-32 rounded-lg bg-white/10"
                  />
                ))}
              </div>
            }
          >
            <FeatureCardsGrid />
          </Suspense>
        </div>

        {/* 푸터 */}
        <div className="mt-8 border-t border-white/20 pt-6 text-center">
          <p className="text-white/70">
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
