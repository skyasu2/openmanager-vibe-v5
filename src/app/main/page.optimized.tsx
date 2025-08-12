/**
 * 🚀 번들 크기 최적화된 메인 페이지
 * 1.1MB → 250KB 목표를 위한 전면 개편
 */

'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { OptimizedLazy, MinimalFallback } from '@/components/performance/OptimizedLazyLoader';
import { BundleAnalyzer } from '@/lib/bundle-optimization';
import { Loader2, BarChart3, Bot, Settings } from '@/lib/bundle-optimization';

// 핵심 컴포넌트만 직접 import
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';

// 지연 로딩 컴포넌트들
const LazyFeatureCards = lazy(() => 
  import('@/components/home/FeatureCardsOptimized').catch(() => ({
    default: () => <div className="text-center p-8">기능 카드를 로드할 수 없습니다.</div>
  }))
);

const LazySystemStatus = lazy(() => 
  import('@/components/system/SystemStatusMinimal').catch(() => ({
    default: () => (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 font-medium">시스템 정상</span>
        </div>
      </div>
    )
  }))
);

// CSS 애니메이션으로 Framer Motion 대체
const AnimatedCard = ({ children, delay = 0 }: { 
  children: React.ReactNode; 
  delay?: number;
}) => (
  <div 
    className="opacity-0 animate-fadeIn"
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
    <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
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
    
    checkAuth();
    return cleanup;
  }, []);

  if (!isClientMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 relative">
      <WaveBackground />
      
      {/* 헤더 */}
      <div className="relative z-10">
        <UnifiedProfileHeader />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* 히어로 섹션 */}
        <AnimatedCard delay={100}>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              OpenManager
              <span className="text-blue-600"> VIBE</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">실시간 모니터링</h3>
              </div>
              <p className="text-gray-600 text-sm">15초 간격 서버 상태 추적</p>
              <div className="mt-4">
                <div className="text-2xl font-bold text-green-600">99.95%</div>
                <div className="text-sm text-gray-500">가동률</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI 분석</h3>
              </div>
              <p className="text-gray-600 text-sm">이상 징후 자동 감지</p>
              <div className="mt-4">
                <div className="text-2xl font-bold text-purple-600">152ms</div>
                <div className="text-sm text-gray-500">평균 응답시간</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">무료 티어</h3>
              </div>
              <p className="text-gray-600 text-sm">완전 무료 엔터프라이즈급</p>
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
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              지금 시작하세요
            </h2>
            <p className="text-gray-600 mb-8">
              설정 없이 즉시 사용 가능한 서버 모니터링
            </p>
            {!authState.isAuthenticated ? (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
                GitHub으로 시작하기
              </button>
            ) : (
              <div className="text-green-600 font-medium">
                환영합니다, {authState.user?.name}님!
              </div>
            )}
          </div>
        </AnimatedCard>
      </main>

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}