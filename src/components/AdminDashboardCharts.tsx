'use client';

import { Activity, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import React, { Component, lazy, ReactNode, Suspense, useMemo } from 'react';

// 🔄 지연 로딩 차트 컴포넌트들
const PerformanceChart = lazy(() => import('./charts/PerformanceChart'));
const AvailabilityChart = lazy(() => import('./charts/AvailabilityChart'));
const AlertsChart = lazy(() => import('./charts/AlertsChart'));

// 🪝 분리된 커스텀 훅
import { useSystemHealth } from '../hooks/useSystemHealth';

// 🔄 데이터 변환 유틸리티
import {
  transformAlertsChartData,
  transformAvailabilityChartData,
  transformPerformanceChartData,
} from '../utils/chartDataTransforms';

// 📱 모바일 감지 커스텀 훅
const useIsMobile = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // md breakpoint
  }, []);
};

// 🛡️ 차트별 에러 바운더리 컴포넌트
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartName: string;
  fallback?: ReactNode;
}

class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`📊 ${this.props.chartName} 차트 에러:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='bg-white rounded-lg shadow p-6 border-l-4 border-red-500'>
          <div className='flex items-center gap-3 mb-4'>
            <AlertTriangle
              className='w-6 h-6 text-red-500'
              aria-hidden='true'
            />
            <h3 className='text-lg font-semibold text-gray-900'>
              {this.props.chartName} 로딩 오류
            </h3>
          </div>
          <div className='space-y-3'>
            <p className='text-gray-600'>
              차트를 불러오는 중 오류가 발생했습니다.
            </p>
            <div className='bg-gray-50 p-3 rounded text-sm text-gray-700'>
              <strong>오류 메시지:</strong> {this.state.errorInfo}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              aria-label={`${this.props.chartName} 차트 다시 로드`}
            >
              <RefreshCw className='w-4 h-4' aria-hidden='true' />
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🔄 향상된 로딩 스켈레톤 컴포넌트들
const ChartLoadingSkeleton = ({
  title,
  type,
}: {
  title: string;
  type: 'bar' | 'donut' | 'line';
}) => (
  <div
    className='bg-white rounded-lg shadow p-6 animate-pulse'
    role='status'
    aria-label={`${title} 로딩 중`}
  >
    <div className='flex items-center gap-2 mb-4'>
      <div className='w-5 h-5 bg-gray-300 rounded'></div>
      <div className='h-6 bg-gray-300 rounded w-32'></div>
    </div>
    <div className='h-64 bg-gray-100 rounded flex items-center justify-center'>
      {type === 'bar' && (
        <div className='flex items-end gap-2 h-32'>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className='bg-gray-300 rounded-t'
              style={{
                height: `${Math.random() * 100 + 20}%`,
                width: '20px',
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      )}
      {type === 'donut' && (
        <div className='relative'>
          <div className='w-32 h-32 border-8 border-gray-300 rounded-full'></div>
          <div className='absolute inset-0 w-32 h-32 border-8 border-transparent border-t-blue-300 rounded-full animate-spin'></div>
        </div>
      )}
      {type === 'line' && (
        <div className='w-full h-32 relative'>
          <svg width='100%' height='100%' className='text-gray-300'>
            <polyline
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              points='0,100 50,80 100,90 150,60 200,70 250,40 300,50'
              className='animate-pulse'
            />
          </svg>
        </div>
      )}
    </div>
    <div className='mt-4 space-y-2'>
      <div className='h-4 bg-gray-200 rounded w-3/4'></div>
      <div className='h-4 bg-gray-200 rounded w-1/2'></div>
    </div>
  </div>
);

// 📊 OpenManager Vibe v5 - 관리자 대시보드 차트 (모듈화된 버전)
// 작성일: 2025-06-25 22:45:32 (KST)
// Phase 4-5: 대용량 파일 분리 작업 완료

export default function AdminDashboardCharts() {
  // 📱 모바일 감지
  const isMobile = useIsMobile();

  const {
    data,
    loading,
    error,
    lastUpdate,
    autoRefresh,
    setAutoRefresh,
    refresh,
  } = useSystemHealth();

  // 🎨 헤더 영역
  const renderHeader = () => (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0'>
      <div className='flex items-center space-x-2'>
        <Activity
          className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-blue-500`}
        />
        <h1
          className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}
        >
          {isMobile ? '시스템 모니터링' : '시스템 상태 모니터링'}
        </h1>
        {!isMobile && (
          <span className='text-sm text-gray-500'>
            {lastUpdate &&
              `마지막 업데이트: ${lastUpdate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`}
          </span>
        )}
      </div>

      <div className='flex items-center space-x-3'>
        {/* 자동 새로고침 토글 */}
        <label className='flex items-center space-x-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
            className='w-4 h-4 text-blue-600 rounded'
          />
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
            {isMobile ? '자동새로침' : '자동 새로고침 (30초)'}
          </span>
        </label>

        {/* 수동 새로고침 버튼 */}
        <button
          onClick={refresh}
          disabled={loading}
          className={`flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}
        >
          <RefreshCw
            className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${loading ? 'animate-spin' : ''}`}
          />
          {!isMobile && <span>새로고침</span>}
        </button>
      </div>
    </div>
  );

  // 📊 요약 정보 카드
  const renderSummaryCards = () => {
    if (!data?.summary) return null;

    const { summary } = data;

    return (
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6'>
        {/* 전체 서버 수 */}
        <div className='bg-white p-3 sm:p-4 rounded-lg shadow border-l-4 border-blue-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
              >
                전체 서버
              </p>
              <p
                className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}
              >
                {summary.serverCount}
              </p>
            </div>
            <Activity
              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-500`}
            />
          </div>
        </div>

        {/* 헬스 스코어 */}
        <div className='bg-white p-3 sm:p-4 rounded-lg shadow border-l-4 border-green-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
              >
                헬스 스코어
              </p>
              <p
                className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}
              >
                {summary.healthScore}%
              </p>
            </div>
            <TrendingUp
              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-green-500`}
            />
          </div>
        </div>

        {/* 심각한 이슈 */}
        <div className='bg-white p-3 sm:p-4 rounded-lg shadow border-l-4 border-red-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
              >
                {isMobile ? '심각이슈' : '심각한 이슈'}
              </p>
              <p
                className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}
              >
                {summary.criticalIssues}
              </p>
            </div>
            <AlertTriangle
              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-red-500`}
            />
          </div>
        </div>

        {/* 경고 */}
        <div className='bg-white p-3 sm:p-4 rounded-lg shadow border-l-4 border-yellow-500'>
          <div className='flex items-center justify-between'>
            <div>
              <p
                className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}
              >
                경고
              </p>
              <p
                className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}
              >
                {summary.warnings}
              </p>
            </div>
            <AlertTriangle
              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-yellow-500`}
            />
          </div>
        </div>
      </div>
    );
  };

  // 📊 차트 그리드
  const renderChartsGrid = () => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
      {/* 시스템 성능 차트 */}
      <div className='bg-white rounded-lg shadow'>
        <Suspense
          fallback={<ChartLoadingSkeleton title='시스템 성능' type='bar' />}
        >
          <ChartErrorBoundary chartName='시스템 성능'>
            <PerformanceChart
              data={transformPerformanceChartData(data)}
              isLoading={loading}
              isMobile={isMobile}
              height={isMobile ? 200 : 264}
            />
          </ChartErrorBoundary>
        </Suspense>
      </div>

      {/* 가용성 차트 */}
      <div className='lg:col-span-1'>
        <Suspense
          fallback={<ChartLoadingSkeleton title='가용성' type='donut' />}
        >
          <ChartErrorBoundary chartName='가용성'>
            <AvailabilityChart
              data={transformAvailabilityChartData(data)}
              isLoading={loading}
              isMobile={isMobile}
              height={isMobile ? 200 : 280}
            />
          </ChartErrorBoundary>
        </Suspense>
      </div>

      {/* 시스템 알림 차트 */}
      <div className='bg-white rounded-lg shadow lg:col-span-2'>
        <Suspense
          fallback={<ChartLoadingSkeleton title='시스템 알림' type='line' />}
        >
          <ChartErrorBoundary chartName='시스템 알림'>
            <AlertsChart
              data={transformAlertsChartData(data)}
              isLoading={loading}
              isMobile={isMobile}
              height={isMobile ? 200 : 264}
            />
          </ChartErrorBoundary>
        </Suspense>
      </div>
    </div>
  );

  // 🚨 전역 에러 상태
  if (error && !data) {
    return (
      <div className='p-6'>
        {renderHeader()}
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <AlertTriangle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-red-800 mb-2'>
            데이터 로드 실패
          </h3>
          <p className='text-red-600 mb-4'>{error}</p>
          <button
            onClick={refresh}
            className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 📊 메인 렌더링
  return (
    <div className='p-6 space-y-6 bg-gray-50 min-h-screen'>
      {renderHeader()}
      {renderSummaryCards()}
      {renderChartsGrid()}

      {/* 🔄 로딩 오버레이 */}
      {loading && data && (
        <div className='fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50'>
          <RefreshCw className='w-4 h-4 animate-spin' />
          <span className='text-sm'>데이터 업데이트 중...</span>
        </div>
      )}

      {/* 📊 디버그 정보 (개발 환경) */}
      {process.env.NODE_ENV === 'development' && (
        <div className='mt-8 p-4 bg-gray-100 rounded-lg border'>
          <h4 className='font-semibold text-gray-800 mb-2'>🔧 디버그 정보</h4>
          <div className='text-sm text-gray-600 space-y-1'>
            <p>
              • 마지막 업데이트:{' '}
              {lastUpdate?.toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
              }) || '없음'}
            </p>
            <p>• 자동 새로고침: {autoRefresh ? '활성화' : '비활성화'}</p>
            <p>• 로딩 상태: {loading ? '로딩 중' : '완료'}</p>
            <p>• 에러: {error || '없음'}</p>
            <p>• 데이터 존재: {data ? '있음' : '없음'}</p>
            <p>• 전체 상태: {data?.summary.overallStatus || '알 수 없음'}</p>
            <p>• 데이터 소스: {data?.summary.dataSource || '알 수 없음'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
