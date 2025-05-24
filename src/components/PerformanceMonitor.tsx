'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // 성능 메트릭 수집
    const reportPerformanceMetrics = () => {
      try {
        if (typeof window === 'undefined' || !performance.getEntriesByType) return;

        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (!navigation) return;

        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          networkTime: navigation.responseEnd - navigation.requestStart,
        };

        // 성능 데이터 로깅
        console.log('[Performance Metrics]', metrics);

        // 성능 기준 체크
        if (metrics.pageLoadTime > 3000) {
          console.warn(`[Performance] Slow page load: ${metrics.pageLoadTime}ms`);
        }

        // 프로덕션에서는 분석 서비스로 전송
        if (process.env.NODE_ENV === 'production') {
          fetch('/api/analytics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metrics,
              timestamp: new Date().toISOString(),
              url: window.location.href,
            })
          }).catch(() => {
            // 실패해도 조용히 무시
          });
        }

      } catch (error) {
        console.error('[Performance Monitor] Error:', error);
      }
    };

    // 페이지 로드 완료 후 메트릭 수집
    if (document.readyState === 'complete') {
      setTimeout(reportPerformanceMetrics, 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(reportPerformanceMetrics, 100);
      });
    }
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

export default PerformanceMonitor; 