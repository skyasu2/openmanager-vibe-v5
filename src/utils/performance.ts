'use client';

/**
 * 🚀 성능 최적화 유틸리티 모듈
 *
 * @description OpenManager Vibe v5 성능 향상 도구
 * - 메모이제이션 최적화
 * - 레이지 로딩 지원
 * - 번들 크기 최적화
 * - 렌더링 성능 향상
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

// 🎯 성능 메트릭 인터페이스
export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  bundleSize: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

// 📊 성능 모니터링 클래스
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  private static observers: PerformanceObserver[] = [];

  static startMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`);
    }
  }

  static endMeasure(name: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);

      const measure = window.performance.getEntriesByName(name)[0];
      const duration = measure?.duration || 0;

      this.metrics.set(name, duration);
      return duration;
    }
    return 0;
  }

  static getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  static getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static initWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals 모니터링
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              this.metrics.set('FCP', entry.startTime);
            }
            break;
          case 'largest-contentful-paint':
            this.metrics.set('LCP', entry.startTime);
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              const currentCLS = this.metrics.get('CLS') || 0;
              this.metrics.set('CLS', currentCLS + (entry as any).value);
            }
            break;
        }
      }
    });

    try {
      observer.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'],
      });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// 🎨 컴포넌트 성능 최적화 훅
export function usePerformanceOptimization(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const renderTime = Date.now() - startTime.current;

    if (renderCount.current > 1) {
      // PerformanceMonitor.recordMetric을 대신 사용
      PerformanceMonitor.startMeasure(`${componentName}-render`);
      PerformanceMonitor.endMeasure(`${componentName}-render`);
    }

    startTime.current = Date.now();
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    measureRender: (callback: () => void) => {
      PerformanceMonitor.startMeasure(`${componentName}-operation`);
      callback();
      return PerformanceMonitor.endMeasure(`${componentName}-operation`);
    },
  };
}

// 🔄 디바운스 훅 (성능 최적화)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 🚀 스로틀 훅 (성능 최적화)
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useMemo(() => {
    return throttle(callback, delay, { leading: true, trailing: false });
  }, [callback, delay]);

  return throttledCallback as T;
}

// 📱 Intersection Observer 훅 (레이지 로딩)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return [targetRef, isIntersecting];
}

// 🎯 메모이제이션 최적화 훅
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  compare?: (a: T, b: T) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | undefined>(
    undefined
  );

  const hasChanged =
    !ref.current ||
    deps.length !== ref.current.deps.length ||
    deps.some((dep, index) => dep !== ref.current!.deps[index]);

  if (hasChanged) {
    const newValue = factory();

    if (ref.current && compare && compare(ref.current.value, newValue)) {
      // 값이 동일하다고 판단되면 이전 값을 유지
      ref.current.deps = deps;
    } else {
      ref.current = { deps, value: newValue };
    }
  }

  return ref.current.value;
}

// 🔧 리소스 프리로딩 유틸리티
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();

  static preloadImage(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  static preloadScript(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  }

  static preloadCSS(href: string): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve();
      };
      link.onerror = reject;
      link.href = href;
      document.head.appendChild(link);
    });
  }
}

// 🧠 메모리 사용량 모니터링
export function useMemoryMonitoring(): {
  memoryUsage: number;
  isHighMemoryUsage: boolean;
} {
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
        setMemoryUsage(usage);
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage();

    return () => clearInterval(interval);
  }, []);

  return {
    memoryUsage,
    isHighMemoryUsage: memoryUsage > 0.8, // 80% 이상 사용 시 경고
  };
}

// 📊 렌더링 성능 분석기
export class RenderingProfiler {
  private static renderTimes: Map<string, number[]> = new Map();

  static recordRender(componentName: string, renderTime: number): void {
    const times = this.renderTimes.get(componentName) || [];
    times.push(renderTime);

    // 최근 100개만 유지
    if (times.length > 100) {
      times.shift();
    }

    this.renderTimes.set(componentName, times);
  }

  static getAverageRenderTime(componentName: string): number {
    const times = this.renderTimes.get(componentName);
    if (!times || times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static getSlowComponents(threshold: number = 16): string[] {
    const slowComponents: string[] = [];

    this.renderTimes.forEach((times, componentName) => {
      const avgTime = this.getAverageRenderTime(componentName);
      if (avgTime > threshold) {
        slowComponents.push(componentName);
      }
    });

    return slowComponents;
  }

  static generateReport(): Record<string, any> {
    const report: Record<string, any> = {};

    this.renderTimes.forEach((times, componentName) => {
      const avgTime = this.getAverageRenderTime(componentName);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      report[componentName] = {
        averageRenderTime: avgTime,
        maxRenderTime: maxTime,
        minRenderTime: minTime,
        renderCount: times.length,
        isSlow: avgTime > 16,
      };
    });

    return report;
  }
}

// 🔥 번들 크기 최적화 도우미
export const bundleOptimization = {
  // 동적 임포트 래퍼
  lazyImport: <T>(
    factory: () => Promise<{ default: T }>
  ): (() => Promise<T>) => {
    return async () => {
      const moduleExport = await factory();
      return moduleExport.default;
    };
  },

  // 청크 분할 도우미
  chunkify: (modules: Record<string, () => Promise<any>>) => {
    return Object.fromEntries(
      Object.entries(modules).map(([key, factory]) => [
        key,
        bundleOptimization.lazyImport(factory),
      ])
    );
  },
};

// 초기화
if (typeof window !== 'undefined') {
  PerformanceMonitor.initWebVitals();
}

export default {
  PerformanceMonitor,
  ResourcePreloader,
  RenderingProfiler,
  bundleOptimization,
};
