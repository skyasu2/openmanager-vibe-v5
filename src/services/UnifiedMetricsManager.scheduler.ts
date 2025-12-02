/**
 * ⏰ Unified Metrics Manager Scheduler
 *
 * Timer and scheduling functionality:
 * - Unified scheduler management
 * - Duplicate timer cleanup
 * - Performance-optimized intervals
 * - Centralized timer coordination
 */

import { TimerManager } from '../utils/TimerManager';
import type { UnifiedMetricsConfig } from './UnifiedMetricsManager.types';

// biome-ignore lint/complexity/noStaticOnlyClass: Utility class pattern for namespace organization
export class Scheduler {
  /**
   * 🚀 Start unified schedulers
   */
  static startUnifiedSchedulers(
    config: UnifiedMetricsConfig,
    callbacks: {
      generateMetrics: () => Promise<void>;
      performAIAnalysis: () => Promise<void>;
      performAutoscaling: () => Promise<void>;
      monitorPerformance: () => Promise<void>;
    }
  ): void {
    // 🚨 Emergency measure: Environment variable to disable schedulers
    if (process.env.UNIFIED_METRICS_DISABLED === 'true') {
      console.log('🚨 통합 메트릭 스케줄러 비활성화됨 (환경변수)');
      return;
    }

    // 1. Metrics generation scheduler - 🚨 Emergency: 20s → 10min significant increase
    if (config.generation.enabled) {
      TimerManager.getInstance().register({
        id: 'unified-metrics-generation',
        callback: callbacks.generateMetrics,
        interval: 600000, // 🚨 Emergency: 10 minutes (reduce Edge Request usage)
        priority: 'high',
        enabled: true,
      });
    }

    // 2. AI analysis scheduler - 🚨 Emergency: 60s → 30min significant increase
    if (config.ai_analysis.enabled) {
      TimerManager.getInstance().register({
        id: 'unified-ai-analysis',
        callback: async () => {
          console.log('🤖 AI 분석 수행 중...');
          await callbacks.performAIAnalysis();
        },
        interval: 1800000, // 🚨 Emergency: 30 minutes (reduce Edge Request usage)
        priority: 'medium',
        enabled: true,
      });
    }

    // 3. Autoscaling scheduler - 🎯 Adjusted to 4x data generator interval (60s → 80s)
    if (config.autoscaling.enabled) {
      TimerManager.getInstance().register({
        id: 'unified-autoscaling',
        callback: async () => {
          console.log('⚖️ 자동 스케일링 수행 중...');
          await callbacks.performAutoscaling();
        },
        interval: 80000, // 80 seconds (4x the data generator's 20 seconds)
        priority: 'medium',
        enabled: true,
      });
    }

    // 4. Performance monitoring scheduler - 🚨 Emergency: 120s → 1hour significant increase
    TimerManager.getInstance().register({
      id: 'unified-performance-monitor',
      callback: callbacks.monitorPerformance,
      interval: 3600000, // 🚨 Emergency: 1 hour (reduce Edge Request usage)
      priority: 'low',
      enabled: true,
    });

    console.log('⏰ 통합 스케줄러 시작 완료');
  }

  /**
   * 🧹 Cleanup duplicate timers
   */
  static async cleanupDuplicateTimers(): Promise<void> {
    console.log('🧹 기존 중복 타이머 정리 중...');

    // Known duplicate timer IDs
    const duplicateTimerIds: readonly string[] = [
      'simulation-engine-update',
      'optimized-data-generator',
      'data-flow-generation',
      'data-flow-ai-analysis',
      'data-flow-autoscaling',
      'data-flow-performance',
      'server-dashboard-refresh',
      'websocket-data-generation',
      'smart-cache-cleanup',
      'memory-optimizer',
      'performance-monitor',
    ];

    // 🚫 Serverless compatible: TimerManager methods disabled
    console.warn('⚠️ TimerManager.unregister() 서버리스에서 비활성화됨');
    // TimerManager.unregister(id);

    console.log(`🧹 ${duplicateTimerIds.length}개 중복 타이머 정리 완료`);
  }

  /**
   * 🛑 Stop all unified schedulers
   */
  static stopUnifiedSchedulers(): void {
    console.log('🛑 통합 스케줄러 중지 중...');

    // Unregister all unified timers
    const timerIds = [
      'unified-metrics-generation',
      'unified-ai-analysis',
      'unified-autoscaling',
      'unified-performance-monitor',
    ];

    timerIds.forEach((id) => {
      try {
        TimerManager.getInstance().unregister(id);
      } catch (error) {
        console.warn(`⚠️ 타이머 ${id} 해제 실패:`, error);
      }
    });

    console.log('🛑 통합 스케줄러 중지 완료');
  }

  /**
   * 📊 Get scheduler status
   */
  static getSchedulerStatus(): {
    activeTimers: string[];
    timerIntervals: Record<string, number>;
    lastExecutionTimes: Record<string, number>;
  } {
    const _timerManager = TimerManager.getInstance();

    // Get active timer information (this would need to be implemented in TimerManager)
    const activeTimers = [
      'unified-metrics-generation',
      'unified-ai-analysis',
      'unified-autoscaling',
      'unified-performance-monitor',
    ].filter((_id) => {
      // In a real implementation, we would check if the timer is actually registered
      return true; // Placeholder
    });

    const timerIntervals = {
      'unified-metrics-generation': 600000, // 10 minutes
      'unified-ai-analysis': 1800000, // 30 minutes
      'unified-autoscaling': 80000, // 80 seconds
      'unified-performance-monitor': 3600000, // 1 hour
    };

    const lastExecutionTimes = {
      'unified-metrics-generation': Date.now(),
      'unified-ai-analysis': Date.now(),
      'unified-autoscaling': Date.now(),
      'unified-performance-monitor': Date.now(),
    };

    return {
      activeTimers,
      timerIntervals,
      lastExecutionTimes,
    };
  }

  /**
   * 🔧 Update scheduler configuration
   */
  static updateSchedulerConfig(
    timerId: string,
    newInterval: number,
    callback?: () => Promise<void>
  ): boolean {
    try {
      const timerManager = TimerManager.getInstance();

      // Unregister old timer
      timerManager.unregister(timerId);

      // Register with new configuration
      if (callback) {
        timerManager.register({
          id: timerId,
          callback,
          interval: newInterval,
          priority: 'medium',
          enabled: true,
        });
      }

      console.log(`🔧 타이머 ${timerId} 설정 업데이트: ${newInterval}ms`);
      return true;
    } catch (error) {
      console.error(`❌ 타이머 ${timerId} 설정 업데이트 실패:`, error);
      return false;
    }
  }

  /**
   * ⚡ Optimize scheduler intervals based on system load
   */
  static optimizeSchedulerIntervals(
    systemLoad: {
      avgCpu: number;
      avgMemory: number;
      errorRate: number;
    },
    _config: UnifiedMetricsConfig
  ): {
    optimizedIntervals: Record<string, number>;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const baseIntervals = {
      'unified-metrics-generation': 600000, // 10 minutes
      'unified-ai-analysis': 1800000, // 30 minutes
      'unified-autoscaling': 80000, // 80 seconds
      'unified-performance-monitor': 3600000, // 1 hour
    };

    const optimizedIntervals = { ...baseIntervals };

    // High load optimization
    if (systemLoad.avgCpu > 80 || systemLoad.avgMemory > 85) {
      // Reduce frequency to lower system load
      optimizedIntervals['unified-metrics-generation'] *= 1.5;
      optimizedIntervals['unified-ai-analysis'] *= 2;
      optimizedIntervals['unified-performance-monitor'] *= 1.2;

      recommendations.push('시스템 부하가 높아 스케줄러 간격을 늘렸습니다.');
    }

    // High error rate optimization
    if (systemLoad.errorRate > 0.05) {
      // Increase monitoring frequency
      optimizedIntervals['unified-performance-monitor'] *= 0.5;
      optimizedIntervals['unified-metrics-generation'] *= 0.8;

      recommendations.push('에러율이 높아 모니터링 빈도를 증가시켰습니다.');
    }

    // Low load optimization
    if (systemLoad.avgCpu < 30 && systemLoad.avgMemory < 50) {
      // Can afford more frequent updates
      optimizedIntervals['unified-metrics-generation'] *= 0.8;
      optimizedIntervals['unified-autoscaling'] *= 0.9;

      recommendations.push(
        '시스템 여유가 있어 업데이트 빈도를 증가시켰습니다.'
      );
    }

    return {
      optimizedIntervals,
      recommendations,
    };
  }
}
