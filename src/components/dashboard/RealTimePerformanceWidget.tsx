'use client';

import React, { useMemo } from 'react';
import { usePerformanceObserver } from '@/hooks/usePerformanceObserver';

/**
 * 🚀 실시간 성능 위젯 - Phase 2 핵심 컴포넌트
 * 
 * Core Web Vitals 실시간 모니터링 및 Box-Muller 캐시 성능 추적
 */
export default function RealTimePerformanceWidget() {
  const { 
    metrics, 
    performanceGrade, 
    isSupported,
    startObserving,
    stopObserving,
    resetMetrics,
    updateBoxMullerMetrics
  } = usePerformanceObserver();

  // 🎨 성능 등급에 따른 색상 테마
  const gradeTheme = useMemo(() => {
    switch (performanceGrade) {
      case 'A+':
      case 'A':
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          accent: 'bg-green-500',
          emoji: '🏆'
        };
      case 'B':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          accent: 'bg-blue-500',
          emoji: '👍'
        };
      case 'C':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          accent: 'bg-yellow-500',
          emoji: '⚠️'
        };
      case 'D':
      case 'F':
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          accent: 'bg-red-500',
          emoji: '🚨'
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          accent: 'bg-gray-500',
          emoji: '📊'
        };
    }
  }, [performanceGrade]);

  // 🔄 Core Web Vitals 메트릭 포맷터
  const formatMetric = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${value}${unit}`;
  };

  // 📊 메트릭 상태 판단 (Core Web Vitals 기준)
  const getMetricStatus = (metric: string, value: number | null) => {
    if (value === null) return 'unknown';
    
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  // 🎨 메트릭 상태별 색상 테마
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // 🛡️ Performance Observer 미지원 시 처리
  if (!isSupported) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mb-4 text-4xl">🚫</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            Performance Observer 미지원
          </h3>
          <p className="text-sm text-gray-500">
            현재 브라우저에서 Performance Observer API를 지원하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 📊 전체 성능 등급 카드 */}
      <div className={`rounded-xl border ${gradeTheme.border} ${gradeTheme.bg} p-6 shadow-lg`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <span className="text-xl">{gradeTheme.emoji}</span>
              실시간 성능 모니터링
            </h2>
            <p className="text-sm text-gray-600">
              Core Web Vitals & Box-Muller 캐시
            </p>
          </div>
          
          {/* 전체 성능 등급 */}
          <div className="text-center">
            <div className={`text-3xl font-bold ${gradeTheme.color}`}>
              {performanceGrade}
            </div>
            <div className="text-xs text-gray-500">Performance Grade</div>
          </div>
        </div>

        {/* 제어 버튼들 */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={resetMetrics}
            className="rounded-lg bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
          >
            🔄 초기화
          </button>
          <button
            onClick={updateBoxMullerMetrics}
            className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-600 hover:bg-blue-200 transition-colors"
          >
            📊 캐시 업데이트
          </button>
          {metrics.isCollecting ? (
            <button
              onClick={stopObserving}
              className="rounded-lg bg-red-100 px-3 py-1 text-xs text-red-600 hover:bg-red-200 transition-colors"
            >
              ⏹️ 중지
            </button>
          ) : (
            <button
              onClick={startObserving}
              className="rounded-lg bg-green-100 px-3 py-1 text-xs text-green-600 hover:bg-green-200 transition-colors"
            >
              ▶️ 시작
            </button>
          )}
        </div>

        {/* 수집 상태 표시 */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <div className={`h-2 w-2 rounded-full ${metrics.isCollecting ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-gray-600">
            {metrics.isCollecting ? '실시간 수집 중' : '수집 중지됨'}
          </span>
          {metrics.lastCollected > 0 && (
            <span className="text-xs text-gray-500">
              (마지막: {new Date(metrics.lastCollected).toLocaleTimeString()})
            </span>
          )}
        </div>
      </div>

      {/* 🎯 Core Web Vitals 메트릭 카드들 */}
      <div className="grid grid-cols-1 gap-3">
        {/* LCP (Largest Contentful Paint) */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-lg">🎯</div>
              <div>
                <div className="font-semibold text-gray-700 text-sm">LCP</div>
                <div className="text-xs text-gray-500">Largest Contentful Paint</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(getMetricStatus('lcp', metrics.coreWebVitals.lcp))}`}>
              {formatMetric(metrics.coreWebVitals.lcp)}
            </div>
          </div>
          <div className="text-xs text-gray-500">목표: ≤2.5초</div>
        </div>

        {/* FID (First Input Delay) */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-lg">⚡</div>
              <div>
                <div className="font-semibold text-gray-700 text-sm">FID</div>
                <div className="text-xs text-gray-500">First Input Delay</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(getMetricStatus('fid', metrics.coreWebVitals.fid))}`}>
              {formatMetric(metrics.coreWebVitals.fid)}
            </div>
          </div>
          <div className="text-xs text-gray-500">목표: ≤100ms</div>
        </div>

        {/* CLS (Cumulative Layout Shift) */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-lg">🌊</div>
              <div>
                <div className="font-semibold text-gray-700 text-sm">CLS</div>
                <div className="text-xs text-gray-500">Cumulative Layout Shift</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(getMetricStatus('cls', metrics.coreWebVitals.cls))}`}>
              {formatMetric(metrics.coreWebVitals.cls, '')}
            </div>
          </div>
          <div className="text-xs text-gray-500">목표: ≤0.1</div>
        </div>
      </div>

      {/* 📊 Box-Muller 캐시 성능 카드 */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <div className="text-lg">🧮</div>
          <div>
            <h3 className="font-semibold text-purple-800 text-sm">Box-Muller 캐시</h3>
            <p className="text-xs text-purple-600">LRU 캐시 성능</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* 캐시 히트율 */}
          <div className="rounded-lg border border-purple-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700">히트율</span>
              <span className="text-sm font-bold text-purple-600">
                {metrics.boxMullerCache.hitRate.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-purple-100">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${metrics.boxMullerCache.hitRate}%` }}
              />
            </div>
          </div>

          {/* 총 요청 수 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700">총 요청</span>
            <span className="font-mono text-purple-600">
              {metrics.boxMullerCache.totalRequests.toLocaleString()}회
            </span>
          </div>

          {/* 메모리 사용량 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700">메모리</span>
            <span className="font-mono text-purple-600">
              {metrics.boxMullerCache.memoryUsage}
            </span>
          </div>

          {/* 마지막 업데이트 */}
          {metrics.boxMullerCache.lastUpdated > 0 && (
            <div className="pt-2 border-t border-purple-200">
              <div className="text-xs text-purple-500">
                마지막 업데이트: {new Date(metrics.boxMullerCache.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📈 추가 메트릭 (FCP, TTFB) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">📈 추가 메트릭</h4>
        
        <div className="space-y-2">
          {/* FCP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">🚀 FCP</span>
              <span className="text-xs text-gray-500">(First Contentful Paint)</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(getMetricStatus('fcp', metrics.coreWebVitals.fcp))}`}>
              {formatMetric(metrics.coreWebVitals.fcp)}
            </div>
          </div>

          {/* TTFB */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">⏱️ TTFB</span>
              <span className="text-xs text-gray-500">(Time to First Byte)</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(getMetricStatus('ttfb', metrics.coreWebVitals.ttfb))}`}>
              {formatMetric(metrics.coreWebVitals.ttfb)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}