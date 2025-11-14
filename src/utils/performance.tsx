/**
 * 🚀 성능 최적화 유틸리티
 * React 컴포넌트 렌더링 성능 측정 및 최적화 도구
 */
import React from 'react';

interface PerformanceMeasurement {
  name: string;
  duration: number;
  timestamp: number;
  componentName?: string;
  renderCount?: number;
}

class PerformanceTracker {
  private measurements: PerformanceMeasurement[] = [];
  private renderCounts = new Map<string, number>();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * 성능 측정 시작
   */
  startMeasurement(name: string, componentName?: string): void {
    if (!this.isEnabled || typeof performance === 'undefined') return;
    
    performance.mark(`${name}-start`);
    
    // 렌더링 카운트 증가
    if (componentName) {
      const count = this.renderCounts.get(componentName) || 0;
      this.renderCounts.set(componentName, count + 1);
    }
  }

  /**
   * 성능 측정 종료 및 기록
   */
  endMeasurement(name: string, componentName?: string): number {
    if (!this.isEnabled || typeof performance === 'undefined') return 0;

    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      if (!measure) {
        return 0;
      }
      const duration = measure.duration;
      
      const measurement: PerformanceMeasurement = {
        name,
        duration,
        timestamp: Date.now(),
        componentName,
        renderCount: componentName ? this.renderCounts.get(componentName) : undefined,
      };
      
      this.measurements.push(measurement);
      
      // 개발환경에서 성능 로그 출력
      if (duration > 16) { // 16ms 초과 시 경고 (60fps 기준)
        console.warn(`🐌 성능 경고: ${name} - ${duration.toFixed(2)}ms`);
      } else if (duration > 5) {
        console.log(`⚡ 성능 측정: ${name} - ${duration.toFixed(2)}ms`);
      }
      
      // 메모리 정리 (최근 100개만 유지)
      if (this.measurements.length > 100) {
        this.measurements = this.measurements.slice(-100);
      }
      
      return duration;
    } catch (error) {
      console.error('성능 측정 오류:', error);
      return 0;
    }
  }

  /**
   * 컴포넌트 렌더링 횟수 조회
   */
  getRenderCount(componentName: string): number {
    return this.renderCounts.get(componentName) || 0;
  }

  /**
   * 최근 성능 측정 결과 조회
   */
  getRecentMeasurements(limit: number = 10): PerformanceMeasurement[] {
    return this.measurements.slice(-limit);
  }

  /**
   * 평균 성능 계산
   */
  getAveragePerformance(name: string): number {
    const filteredMeasurements = this.measurements.filter(m => m.name === name);
    if (filteredMeasurements.length === 0) return 0;
    
    const total = filteredMeasurements.reduce((sum, m) => sum + m.duration, 0);
    return total / filteredMeasurements.length;
  }

  /**
   * 성능 통계 리포트 생성
   */
  generateReport(): string {
    const componentStats = new Map<string, { count: number; avgDuration: number }>();
    
    this.measurements.forEach(m => {
      if (m.componentName) {
        const existing = componentStats.get(m.componentName) || { count: 0, avgDuration: 0 };
        existing.count++;
        existing.avgDuration = (existing.avgDuration * (existing.count - 1) + m.duration) / existing.count;
        componentStats.set(m.componentName, existing);
      }
    });

    let report = '📊 React 성능 최적화 리포트\n';
    report += '================================\n\n';
    
    componentStats.forEach((stats, componentName) => {
      report += `🔹 ${componentName}\n`;
      report += `   렌더링 횟수: ${stats.count}회\n`;
      report += `   평균 렌더링 시간: ${stats.avgDuration.toFixed(2)}ms\n`;
      report += `   상태: ${stats.avgDuration > 16 ? '🐌 최적화 필요' : '⚡ 최적화됨'}\n\n`;
    });
    
    return report;
  }

  /**
   * 성능 데이터 초기화
   */
  clear(): void {
    this.measurements = [];
    this.renderCounts.clear();
  }
}

// 싱글톤 인스턴스
export const performanceTracker = new PerformanceTracker();

/**
 * React Hook: 컴포넌트 렌더링 성능 측정
 */
export function usePerformanceTracking(componentName: string) {
  const startTime = Date.now();
  
  // 컴포넌트 마운트 시 측정 시작
  React.useEffect(() => {
    performanceTracker.startMeasurement(`${componentName}-render`, componentName);
    
    // 컴포넌트 언마운트 시 측정 종료
    return () => {
      performanceTracker.endMeasurement(`${componentName}-render`, componentName);
    };
  });

  // 렌더링 시간 측정
  React.useLayoutEffect(() => {
    const renderTime = Date.now() - startTime;
    if (renderTime > 5) {
      console.log(`📊 ${componentName} 렌더링 시간: ${renderTime}ms`);
    }
  });

  return {
    getRenderCount: () => performanceTracker.getRenderCount(componentName),
    getAverageRenderTime: () => performanceTracker.getAveragePerformance(`${componentName}-render`),
  };
}

/**
 * HOC: 성능 측정을 자동으로 적용하는 고차 컴포넌트
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;
  
  const WithPerformanceTracking: React.FC<P> = (props) => {
    usePerformanceTracking(displayName);
    return <WrappedComponent {...props} />;
  };
  
  WithPerformanceTracking.displayName = `withPerformanceTracking(${displayName})`;
  return WithPerformanceTracking;
}

/**
 * 렌더링 최적화를 위한 조건부 메모이제이션
 */
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  threshold: number = 5 // ms
): T {
  const [value, setValue] = React.useState<T>(() => factory());
  const lastDeps = React.useRef<React.DependencyList>(deps);
  
  React.useMemo(() => {
    const startTime = performance.now();
    
    // 의존성 배열 비교
    if (deps.some((dep, index) => dep !== lastDeps.current[index])) {
      const newValue = factory();
      const duration = performance.now() - startTime;
      
      if (duration > threshold) {
        console.warn(`🐌 메모이제이션 계산 시간 초과: ${duration.toFixed(2)}ms`);
      }
      
      setValue(newValue);
      lastDeps.current = deps;
    }
  }, deps);
  
  return value;
}
