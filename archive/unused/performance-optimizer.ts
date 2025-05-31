/**
 * 🚀 성능 최적화 유틸리티
 * 
 * 시스템 전체의 성능 문제를 감지하고 자동으로 최적화하는 도구
 */

import { timerManager } from './TimerManager';
import { memoryOptimizer } from './MemoryOptimizer';

interface PerformanceMetrics {
  memoryUsage: number;
  activeTimers: number;
  cpuUsage: number;
  timestamp: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isOptimizing = false;
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 100;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private constructor() {
    this.startMonitoring();
  }

  /**
   * 🔍 성능 모니터링 시작
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) return;

    console.log('🔍 성능 모니터링 시작');
    
    this.monitoringInterval = setInterval(() => {
      this.checkPerformance();
    }, 60000); // 1분마다 체크
  }

  /**
   * 📊 성능 체크 및 자동 최적화
   */
  private async checkPerformance(): Promise<void> {
    if (this.isOptimizing) return;

    const metrics = this.collectMetrics();
    this.metrics.push(metrics);

    // 히스토리 제한
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_HISTORY);
    }

    // 성능 문제 감지
    const needsOptimization = this.detectPerformanceIssues(metrics);
    
    if (needsOptimization) {
      console.log('🚨 성능 문제 감지 - 자동 최적화 시작');
      await this.performOptimization();
    }
  }

  /**
   * 📈 현재 메트릭 수집
   */
  private collectMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const timerStats = timerManager.getStatus();
    
    return {
      memoryUsage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      activeTimers: timerStats.activeTimers,
      cpuUsage: process.cpuUsage().user / 1000000, // 마이크로초를 초로 변환
      timestamp: Date.now()
    };
  }

  /**
   * 🚨 성능 문제 감지
   */
  private detectPerformanceIssues(metrics: PerformanceMetrics): boolean {
    // 메모리 사용률이 85% 이상
    if (metrics.memoryUsage > 85) {
      console.log(`🚨 높은 메모리 사용률: ${metrics.memoryUsage.toFixed(1)}%`);
      return true;
    }

    // 활성 타이머가 25개 이상
    if (metrics.activeTimers > 25) {
      console.log(`🚨 과도한 타이머: ${metrics.activeTimers}개`);
      return true;
    }

    // 최근 5분간 메모리 사용률이 지속적으로 증가
    const recentMetrics = this.metrics.slice(-5);
    if (recentMetrics.length >= 5) {
      const memoryTrend = recentMetrics.map(m => m.memoryUsage);
      const isIncreasing = memoryTrend.every((val, i) => 
        i === 0 || val >= memoryTrend[i - 1]
      );
      
      if (isIncreasing && memoryTrend[memoryTrend.length - 1] > 70) {
        console.log('🚨 메모리 사용률 지속 증가 감지');
        return true;
      }
    }

    return false;
  }

  /**
   * ⚡ 성능 최적화 실행
   */
  private async performOptimization(): Promise<void> {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    
    try {
      console.log('⚡ 성능 최적화 시작...');
      
      // 1. 타이머 최적화
      timerManager.enablePerformanceMode();
      
      // 2. 메모리 최적화
      const memoryStats = memoryOptimizer.getCurrentMemoryStats();
      if (memoryStats.usagePercent > 75) {
        await memoryOptimizer.optimizeMemoryNow();
      }
      
      // 3. 가비지 컬렉션 강제 실행
      if (global.gc) {
        global.gc();
      }
      
      console.log('✅ 성능 최적화 완료');
      
      // 10분 후 성능 모드 해제
      setTimeout(() => {
        timerManager.disablePerformanceMode();
        console.log('🔄 성능 최적화 모드 해제');
      }, 10 * 60 * 1000);
      
    } catch (error) {
      console.error('❌ 성능 최적화 실패:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * 📊 성능 통계 조회
   */
  getPerformanceStats(): {
    current: PerformanceMetrics;
    average: PerformanceMetrics;
    trend: 'improving' | 'stable' | 'degrading';
  } {
    const current = this.collectMetrics();
    
    if (this.metrics.length === 0) {
      return {
        current,
        average: current,
        trend: 'stable'
      };
    }

    const average = {
      memoryUsage: this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length,
      activeTimers: Math.round(this.metrics.reduce((sum, m) => sum + m.activeTimers, 0) / this.metrics.length),
      cpuUsage: this.metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / this.metrics.length,
      timestamp: Date.now()
    };

    // 트렌드 분석 (최근 10개 메트릭 기준)
    const recentMetrics = this.metrics.slice(-10);
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    
    if (recentMetrics.length >= 5) {
      const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
      const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) {
        trend = 'degrading';
      } else if (firstAvg > secondAvg + 5) {
        trend = 'improving';
      }
    }

    return { current, average, trend };
  }

  /**
   * 🛑 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 성능 모니터링 중지');
    }
  }

  /**
   * 🧹 정리
   */
  cleanup(): void {
    this.stopMonitoring();
    this.metrics = [];
    this.isOptimizing = false;
  }
}

// 싱글톤 인스턴스 export
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// 브라우저 환경에서 페이지 언로드 시 자동 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceOptimizer.cleanup();
  });
} 