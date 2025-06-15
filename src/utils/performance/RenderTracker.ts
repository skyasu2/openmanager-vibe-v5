/**
 * 🎯 Render Tracker v1.0
 * 
 * 성능 추적 및 모니터링 시스템
 * - 컴포넌트 렌더링 횟수 추적
 * - 갱신 주기 모니터링
 * - 메모리 사용량 체크
 * - 성능 메트릭 수집
 */

interface RenderMetric {
  componentName: string;
  renderCount: number;
  lastRender: number;
  averageRenderTime: number;
  totalRenderTime: number;
  updateFrequency: number;
}

interface PerformanceStats {
  totalComponents: number;
  totalRenders: number;
  averageRenderTime: number;
  memoryUsage: number;
  updateFrequency: number;
  lastUpdate: number;
}

class RenderTracker {
  private static instance: RenderTracker;
  private metrics: Map<string, RenderMetric> = new Map();
  private startTime = Date.now();
  private isEnabled = process.env.NODE_ENV === 'development';

  private constructor() {
    if (this.isEnabled) {
      console.log('🎯 RenderTracker 초기화');
      this.startPerformanceMonitoring();
    }
  }

  public static getInstance(): RenderTracker {
    if (!RenderTracker.instance) {
      RenderTracker.instance = new RenderTracker();
    }
    return RenderTracker.instance;
  }

  /**
   * 컴포넌트 렌더링 추적
   */
  public trackRender(componentName: string, renderTime?: number): void {
    if (!this.isEnabled) return;

    const now = Date.now();
    const currentMetric = this.metrics.get(componentName);
    const actualRenderTime = renderTime || 0;

    if (currentMetric) {
      // 기존 메트릭 업데이트
      const newRenderCount = currentMetric.renderCount + 1;
      const newTotalTime = currentMetric.totalRenderTime + actualRenderTime;
      const timeSinceLastRender = now - currentMetric.lastRender;

      this.metrics.set(componentName, {
        ...currentMetric,
        renderCount: newRenderCount,
        lastRender: now,
        totalRenderTime: newTotalTime,
        averageRenderTime: newTotalTime / newRenderCount,
        updateFrequency: timeSinceLastRender,
      });
    } else {
      // 새 메트릭 생성
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        lastRender: now,
        averageRenderTime: actualRenderTime,
        totalRenderTime: actualRenderTime,
        updateFrequency: 0,
      });
    }

    // 과도한 렌더링 경고
    const metric = this.metrics.get(componentName)!;
    if (metric.renderCount > 100 && metric.renderCount % 50 === 0) {
      console.warn(`⚠️ ${componentName}: 과도한 렌더링 감지 (${metric.renderCount}회)`);
    }

    // 빠른 갱신 경고
    if (metric.updateFrequency > 0 && metric.updateFrequency < 1000) {
      console.warn(`⚠️ ${componentName}: 너무 빠른 갱신 (${metric.updateFrequency}ms)`);
    }
  }

  /**
   * 성능 통계 조회
   */
  public getStats(): PerformanceStats {
    const metrics = Array.from(this.metrics.values());
    const totalRenders = metrics.reduce((sum, m) => sum + m.renderCount, 0);
    const totalRenderTime = metrics.reduce((sum, m) => sum + m.totalRenderTime, 0);
    const averageUpdateFreq = metrics.reduce((sum, m) => sum + m.updateFrequency, 0) / metrics.length;

    return {
      totalComponents: this.metrics.size,
      totalRenders,
      averageRenderTime: totalRenderTime / totalRenders || 0,
      memoryUsage: this.getMemoryUsage(),
      updateFrequency: averageUpdateFreq || 0,
      lastUpdate: Date.now(),
    };
  }

  /**
   * 컴포넌트별 상세 메트릭 조회
   */
  public getComponentMetrics(componentName?: string): RenderMetric[] {
    if (componentName) {
      const metric = this.metrics.get(componentName);
      return metric ? [metric] : [];
    }
    return Array.from(this.metrics.values()).sort((a, b) => b.renderCount - a.renderCount);
  }

  /**
   * 성능 보고서 생성
   */
  public generateReport(): string {
    const stats = this.getStats();
    const topComponents = this.getComponentMetrics().slice(0, 10);
    const uptime = Date.now() - this.startTime;

    let report = `
🎯 성능 추적 보고서
==================
📊 전체 통계:
- 추적된 컴포넌트: ${stats.totalComponents}개
- 총 렌더링 횟수: ${stats.totalRenders}회
- 평균 렌더링 시간: ${stats.averageRenderTime.toFixed(2)}ms
- 메모리 사용량: ${stats.memoryUsage.toFixed(2)}MB
- 평균 갱신 주기: ${stats.updateFrequency.toFixed(0)}ms
- 가동 시간: ${(uptime / 1000 / 60).toFixed(1)}분

🔥 상위 렌더링 컴포넌트:
`;

    topComponents.forEach((metric, index) => {
      report += `${index + 1}. ${metric.componentName}: ${metric.renderCount}회 (평균 ${metric.averageRenderTime.toFixed(2)}ms)\n`;
    });

    return report;
  }

  /**
   * 메모리 사용량 측정
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB 단위
    }
    return 0;
  }

  /**
   * 성능 모니터링 시작
   */
  private startPerformanceMonitoring(): void {
    // 5분마다 성능 보고서 출력
    setInterval(() => {
      console.log(this.generateReport());
    }, 300000);

    // 메모리 사용량 모니터링
    setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage > 100) { // 100MB 초과 시 경고
        console.warn(`⚠️ 높은 메모리 사용량: ${memoryUsage.toFixed(2)}MB`);
      }
    }, 60000);
  }

  /**
   * 메트릭 초기화
   */
  public reset(): void {
    console.log('🧹 성능 메트릭 초기화');
    this.metrics.clear();
    this.startTime = Date.now();
  }

  /**
   * 특정 컴포넌트 메트릭 제거
   */
  public removeComponent(componentName: string): void {
    if (this.metrics.delete(componentName)) {
      console.log(`🗑️ 컴포넌트 메트릭 제거: ${componentName}`);
    }
  }

  /**
   * 성능 최적화 제안
   */
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = Array.from(this.metrics.values());

    // 과도한 렌더링 컴포넌트 찾기
    const highRenderComponents = metrics.filter(m => m.renderCount > 50);
    if (highRenderComponents.length > 0) {
      suggestions.push(`🔄 과도한 렌더링: ${highRenderComponents.map(m => m.componentName).join(', ')} - React.memo 사용 고려`);
    }

    // 빠른 갱신 컴포넌트 찾기
    const fastUpdateComponents = metrics.filter(m => m.updateFrequency > 0 && m.updateFrequency < 5000);
    if (fastUpdateComponents.length > 0) {
      suggestions.push(`⚡ 빠른 갱신: ${fastUpdateComponents.map(m => m.componentName).join(', ')} - 갱신 주기 조정 필요`);
    }

    // 메모리 사용량 체크
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > 50) {
      suggestions.push(`💾 높은 메모리 사용량: ${memoryUsage.toFixed(2)}MB - 메모리 누수 확인 필요`);
    }

    return suggestions;
  }
}

// 싱글톤 인스턴스 내보내기
export const renderTracker = RenderTracker.getInstance();

// React 컴포넌트용 훅
import React from 'react';

export function useRenderTracker(componentName: string) {
  const startTime = Date.now();
  
  // 컴포넌트 언마운트 시 렌더링 시간 기록
  React.useEffect(() => {
    return () => {
      const renderTime = Date.now() - startTime;
      renderTracker.trackRender(componentName, renderTime);
    };
  }, [componentName, startTime]);

  // 렌더링 추적 함수 반환
  return {
    trackRender: () => renderTracker.trackRender(componentName),
    getMetrics: () => renderTracker.getComponentMetrics(componentName),
  };
}

export default RenderTracker; 