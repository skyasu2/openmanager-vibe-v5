/**
 * 🚀 번들 크기 최적화된 메인 페이지
 * 1.1MB → 250KB 목표를 위한 전면 개편
 */

'use client';

import { lazy, useEffect, useState, type ReactNode } from 'react';
import {
  OptimizedLazy,
} from '@/components/performance/OptimizedLazyLoader';
import { BundleAnalyzer } from '@/lib/bundle-optimization';
import { Loader2, BarChart3, Bot, Settings } from '@/lib/bundle-optimization';

// 핵심 컴포넌트만 직접 import
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';

// 지연 로딩 컴포넌트들
const LazyFeatureCards = lazy(() =>
  import('@/components/home/FeatureCardsOptimized').catch(() => ({
    default: () => (
      <div className="p-8 text-center">기능 카드를 로드할 수 없습니다.</div>
    ),
  }))
);
const LazySystemStatus = lazy(() =>
  import('@/components/system/SystemStatusMinimal').catch(() => ({
    default: () => (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="font-medium text-green-800">시스템 정상</span>
        </div>
      </div>
    ),
  }))
);
// CSS 애니메이션으로 Framer Motion 대체
const AnimatedCard = ({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) => (
  <div
    className="animate-fadeIn opacity-0"
    style={{
      animationDelay: `${delay}ms`,
      animationFillMode: 'forwards',
    }}
  >
    {children}
  </div>
);
// 경량 웨이브 배경 (CSS만 사용)
const WaveBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -left-40 -top-40 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl"></div>
    <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl"></div>
  </div>
);
export default function OptimizedMainPage() {
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    user: { name: string; email?: string } | null;
  }>({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    const cleanup = BundleAnalyzer.measureComponentRender('MainPage');
    setIsClientMounted(true);

    // 간단한 인증 상태 확인
    const checkAuth = () => {
      const authData = localStorage.getItem('auth-user');
      if (authData) {
        try {
          const user = JSON.parse(authData);
          setAuthState({ isAuthenticated: true, user });
        } catch {
          setAuthState({ isAuthenticated: false, user: null });
        }
      }
    };

    void checkAuth();
    return cleanup;
  }, []);

  if (!isClientMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <WaveBackground />

      {/* 헤더 */}
      <div className="relative z-10">
        <UnifiedProfileHeader />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="container relative z-10 mx-auto px-4 py-12">
        {/* 히어로 섹션 */}
        <AnimatedCard delay={100}>
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              OpenManager
              <span className="text-blue-600"> VIBE</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
              AI 기반 실시간 서버 모니터링 플랫폼
            </p>

            {/* 상태 표시 */}
            <OptimizedLazy priority="high">
              <LazySystemStatus />
            </OptimizedLazy>
          </div>
        </AnimatedCard>

        {/* 통계 카드들 */}
        <AnimatedCard delay={300}>
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">실시간 모니터링</h3>
              </div>
              <p className="text-sm text-gray-600">15초 간격 서버 상태 추적</p>
              <div className="mt-4">
                <div className="text-2xl font-bold text-green-600">99.95%</div>
                <div className="text-sm text-gray-500">가동률</div>
              </div>
            </div>

            <div className="rounded-lg bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-3">
                <Bot className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI 분석</h3>
              </div>
              <p className="text-sm text-gray-600">이상 징후 자동 감지</p>
              <div className="mt-4">
                <div className="text-2xl font-bold text-purple-600">152ms</div>
                <div className="text-sm text-gray-500">평균 응답시간</div>
              </div>
            </div>

            <div className="rounded-lg bg-white/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-3">
                <Settings className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">무료 티어</h3>
              </div>
              <p className="text-sm text-gray-600">완전 무료 엔터프라이즈급</p>
              <div className="mt-4">
                <div className="text-2xl font-bold text-orange-600">100%</div>
                <div className="text-sm text-gray-500">무료 기능</div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* 기능 카드들 */}
        <AnimatedCard delay={500}>
          <OptimizedLazy priority="medium">
            <LazyFeatureCards />
          </OptimizedLazy>
        </AnimatedCard>

        {/* CTA 섹션 */}
        <AnimatedCard delay={700}>
          <div className="py-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              지금 시작하세요
            </h2>
            <p className="mb-8 text-gray-600">
              설정 없이 즉시 사용 가능한 서버 모니터링
            </p>
            {!authState.isAuthenticated ? (
              <button className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700">
                GitHub으로 시작하기
              </button>
            ) : (
              <div className="font-medium text-green-600">
                환영합니다, {authState.user?.name}님!
              </div>
            )}
          </div>
        </AnimatedCard>
      </main>

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
