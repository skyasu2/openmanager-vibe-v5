'use client';

import { useEffect } from 'react';

/**
 * CSP 호환 성능 모니터링 컴포넌트
 * dangerouslySetInnerHTML 대신 안전한 방식으로 성능 스크립트 실행
 */
export default function SafePerformanceScript() {
  useEffect(() => {
    // CSP-safe performance monitoring
    const initPerformanceMonitoring = () => {
      try {
        // 📶 네트워크 정보 추적 (CSP 호환)
        if ('connection' in navigator && (navigator as any).connection) {
          const connection = (navigator as any).connection;
          console.log(
            `📶 Network: ${connection.effectiveType}, ${connection.downlink}Mbps`
          );
        }

        // 🧠 메모리 사용량 추적 (CSP 호환)
        if ('memory' in performance && (performance as any).memory) {
          const memory = (performance as any).memory;
          const memoryInfo = {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          };
          console.log(
            `🧠 Memory: ${memoryInfo.used}MB / ${memoryInfo.total}MB (Limit: ${memoryInfo.limit}MB)`
          );
        }

        // ⚡ Core Web Vitals 측정
        if ('PerformanceObserver' in window) {
          // LCP (Largest Contentful Paint)
          const lcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              console.log(`🎯 LCP: ${Math.round(entry.startTime)}ms`);
            }
          });

          // FID (First Input Delay) - INP로 대체
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              console.log(
                `👆 FID: ${Math.round((entry as any).processingStart - entry.startTime)}ms`
              );
            }
          });

          // CLS (Cumulative Layout Shift)
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            if (clsValue > 0) {
              console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
            }
          });

          try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            fidObserver.observe({ entryTypes: ['first-input'] });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
          } catch (e) {
            // Observer not supported in some browsers
            console.warn('⚠️ Some performance observers not supported');
          }
        }

        // 🏷️ 번들 크기 및 로딩 시간 측정
        if (performance.timing) {
          const timing = performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domContentLoaded =
            timing.domContentLoadedEventEnd - timing.navigationStart;

          console.log(`⏱️ Page Load: ${loadTime}ms`);
          console.log(`📄 DOM Ready: ${domContentLoaded}ms`);
        }

        // 🎨 페인트 메트릭스
        if (performance.getEntriesByType) {
          const paintEntries = performance.getEntriesByType('paint');
          paintEntries.forEach((entry) => {
            console.log(`🎨 ${entry.name}: ${Math.round(entry.startTime)}ms`);
          });
        }

        // 📊 리소스 로딩 분석
        const analyzeResources = () => {
          if (performance.getEntriesByType) {
            const resources = performance.getEntriesByType(
              'resource'
            ) as PerformanceResourceTiming[];
            const jsResources = resources.filter((r) => r.name.includes('.js'));
            const cssResources = resources.filter((r) =>
              r.name.includes('.css')
            );

            if (jsResources.length > 0) {
              const totalJsSize = jsResources.reduce(
                (sum, r) => sum + (r.transferSize || 0),
                0
              );
              console.log(
                `📦 JS Bundle: ${Math.round(totalJsSize / 1024)}KB (${jsResources.length} files)`
              );
            }

            if (cssResources.length > 0) {
              const totalCssSize = cssResources.reduce(
                (sum, r) => sum + (r.transferSize || 0),
                0
              );
              console.log(
                `🎨 CSS Bundle: ${Math.round(totalCssSize / 1024)}KB (${cssResources.length} files)`
              );
            }
          }
        };

        // 페이지 로드 완료 후 분석
        if (document.readyState === 'complete') {
          analyzeResources();
        } else {
          window.addEventListener('load', analyzeResources);
        }

        // 🔄 실시간 성능 모니터링 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          const monitorPerformance = () => {
            if ((performance as any).memory) {
              const memory = (performance as any).memory;
              const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);

              // 메모리 사용량이 100MB를 초과하면 경고
              if (used > 100) {
                console.warn(`⚠️ High Memory Usage: ${used}MB`);
              }
            }
          };

          // 30초마다 모니터링
          const performanceInterval = setInterval(monitorPerformance, 30000);

          return () => {
            clearInterval(performanceInterval);
          };
        }
      } catch (error) {
        console.warn('⚠️ Performance monitoring initialization failed:', error);
      }
    };

    // CSP 호환 방식으로 스크립트 실행
    const cleanup = initPerformanceMonitoring();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return null; // 렌더링 없음, 성능 추적만
}

/**
 * Vercel 환경에서 안전한 성능 스크립트 실행을 위한 타입
 */
export interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
  bundle?: {
    js: number;
    css: number;
  };
}
