/**
 * 🔍 실시간 성능 모니터링 컴포넌트
 * Core Web Vitals 추적 및 최적화 가이드
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import { Activity, AlertTriangle, Clock, TrendingUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface WebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
}

interface PerformanceMetrics {
  webVitals: WebVitals;
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

// 성능 임계값
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 600, poor: 1500 },
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [_history, setHistory] = useState<PerformanceMetrics[]>([]);

  // Core Web Vitals 수집
  const collectWebVitals = useCallback(() => {
    const vitals: WebVitals = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
    };

    // Performance Observer로 메트릭 수집
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // LCP 측정
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          vitals.lcp = lastEntry.startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID 측정
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          vitals.fid =
            (entry as PerformanceEventTiming).processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS 측정
      new PerformanceObserver((entryList) => {
        let clsValue = 0;
        entryList.getEntries().forEach((entry: PerformanceEntry) => {
          const layoutShiftEntry = entry as {
            value?: number;
            hadRecentInput?: boolean;
          }; // Layout Shift 전용 타입
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value || 0;
          }
        });
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // Navigation Timing API로 FCP, TTFB 측정
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
      }

      // Paint Timing API로 FCP 측정
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(
        (entry) => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry) {
        vitals.fcp = fcpEntry.startTime;
      }
    }

    return vitals;
  }, []);

  // 성능 메트릭 수집
  const collectMetrics = useCallback(() => {
    const webVitals = collectWebVitals();

    // 메모리 사용량
    const memoryUsage =
      (performance as { memory?: { usedJSHeapSize?: number } }).memory
        ?.usedJSHeapSize || 0;

    // 로드 시간
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    const loadTime = navigation
      ? navigation.loadEventEnd -
        (navigation.fetchStart || navigation.startTime)
      : 0;

    // 렌더 시간
    const renderTime = navigation
      ? navigation.domContentLoadedEventEnd -
        (navigation.fetchStart || navigation.startTime)
      : 0;

    const newMetrics: PerformanceMetrics = {
      webVitals,
      bundleSize: 0, // 실제 번들 크기는 별도 계산 필요
      loadTime,
      renderTime,
      memoryUsage,
      timestamp: Date.now(),
    };

    setMetrics(newMetrics);
    setHistory((prev) => [...prev.slice(-9), newMetrics]); // 최근 10개 유지
  }, [collectWebVitals]);

  // 성능 등급 계산
  const getPerformanceGrade = (
    metric: keyof WebVitals,
    value: number | null
  ): 'good' | 'needs-improvement' | 'poor' => {
    if (value === null) return 'poor';

    const threshold = THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  // 색상 매핑
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // 성능 점수 계산 (0-100)
  const calculateScore = (metrics: WebVitals): number => {
    let score = 0;
    let count = 0;

    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== null) {
        const grade = getPerformanceGrade(key as keyof WebVitals, value);
        score +=
          grade === 'good' ? 100 : grade === 'needs-improvement' ? 60 : 20;
        count++;
      }
    });

    return count > 0 ? Math.round(score / count) : 0;
  };

  // 초기화
  useEffect(() => {
    const timer = setTimeout(() => {
      collectMetrics();
    }, 1000);

    return () => clearTimeout(timer);
  }, [collectMetrics]);

  // 주기적 업데이트 (5분 간격 - 포트폴리오 무료 티어 최적화)
  useEffect(() => {
    const interval = setInterval(collectMetrics, 300000); // 5분
    return () => clearInterval(interval);
  }, [collectMetrics]);

  if (!metrics) {
    return (
      <div className="fixed bottom-4 right-4 rounded-lg bg-gray-900/90 p-4 text-white">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="text-sm">성능 분석 중...</span>
        </div>
      </div>
    );
  }

  const score = calculateScore(metrics.webVitals);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 토글 버튼 */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-2 flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          score >= 90
            ? 'bg-green-500/90 text-white'
            : score >= 70
              ? 'bg-yellow-500/90 text-white'
              : 'bg-red-500/90 text-white'
        }`}
      >
        <Activity className="h-4 w-4" />
        <span>성능 점수: {score}</span>
        {score < 70 && <AlertTriangle className="h-4 w-4" />}
      </button>

      {/* 상세 패널 */}
      {isVisible && (
        <div className="w-80 rounded-lg bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:bg-gray-900/95">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              성능 모니터링
            </h3>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ×
            </button>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">LCP</span>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono text-sm ${getGradeColor(getPerformanceGrade('lcp', metrics.webVitals.lcp))}`}
                >
                  {metrics.webVitals.lcp
                    ? `${Math.round(metrics.webVitals.lcp)}ms`
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">목표: 2.5s</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">FID</span>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono text-sm ${getGradeColor(getPerformanceGrade('fid', metrics.webVitals.fid))}`}
                >
                  {metrics.webVitals.fid
                    ? `${Math.round(metrics.webVitals.fid)}ms`
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">목표: 100ms</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">CLS</span>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono text-sm ${getGradeColor(getPerformanceGrade('cls', metrics.webVitals.cls))}`}
                >
                  {metrics.webVitals.cls
                    ? metrics.webVitals.cls.toFixed(3)
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">목표: 0.1</div>
              </div>
            </div>

            {/* 추가 메트릭 */}
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm">
                <span>메모리 사용량</span>
                <span className="font-mono">
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>로드 시간</span>
                <span className="font-mono">
                  {(metrics.loadTime / 1000).toFixed(2)}s
                </span>
              </div>
            </div>

            {/* 개선 제안 */}
            {score < 70 && (
              <div className="mt-3 rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  개선 제안
                </h4>
                <ul className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {metrics.webVitals.lcp && metrics.webVitals.lcp > 2500 && (
                    <li>• 이미지 최적화 및 지연 로딩 적용</li>
                  )}
                  {metrics.webVitals.fid && metrics.webVitals.fid > 100 && (
                    <li>• JavaScript 번들 크기 감소</li>
                  )}
                  {metrics.webVitals.cls && metrics.webVitals.cls > 0.1 && (
                    <li>• 레이아웃 이동 방지 (크기 사전 정의)</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceMonitor;
