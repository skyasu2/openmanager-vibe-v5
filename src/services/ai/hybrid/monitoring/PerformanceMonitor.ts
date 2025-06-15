/**
 * 🔄 하이브리드 AI 시스템 성능 모니터 - 통합 버전 래퍼
 *
 * 통합된 성능 모니터링 시스템을 사용하도록 리다이렉트
 * - 하위 호환성 보장
 * - 하이브리드 AI 특화 기능 유지
 * - 중복 코드 제거
 */

'use client';

// 통합 성능 모니터에서 필요한 기능 가져오기
import {
  UnifiedPerformanceMonitor,
  UnifiedMetrics
} from '../../../monitoring/UnifiedPerformanceMonitor';

// 기존 타입들 (하위 호환성)
import {
  SmartQuery,
  EngineStats,
  ProcessingMetrics,
} from '../types/HybridTypes';

/**
 * 📊 하이브리드 AI 시스템 성능 모니터 (통합 버전 래퍼)
 */
export class PerformanceMonitor {
  private unifiedMonitor: UnifiedPerformanceMonitor;
  private engineStats: EngineStats;
  private processingHistory: ProcessingMetrics[] = [];
  private readonly maxHistorySize = 1000;

  constructor() {
    this.engineStats = {
      korean: { initialized: false, successCount: 0, avgTime: 0 },
      lightweightML: { initialized: false, successCount: 0, avgTime: 0 },
      transformers: { initialized: false, successCount: 0, avgTime: 0 },
      vector: { initialized: false, documentCount: 0, searchCount: 0 },
    };

    // 통합 모니터 인스턴스 가져오기
    this.unifiedMonitor = UnifiedPerformanceMonitor.getInstance({
      enabled: true,
      monitors: {
        learning: false,
        hybrid: true,
        system: false,
        benchmark: false,
      },
    });
  }

  /**
   * 처리 메트릭 시작
   */
  startProcessing(): ProcessingMetrics {
    return {
      startTime: Date.now(),
    };
  }

  /**
   * 초기화 시간 기록
   */
  recordInitTime(metrics: ProcessingMetrics): void {
    metrics.initTime = Date.now() - metrics.startTime;
  }

  /**
   * 검색 시간 기록
   */
  recordSearchTime(metrics: ProcessingMetrics): void {
    const currentTime = Date.now();
    metrics.searchTime =
      currentTime - (metrics.startTime + (metrics.initTime || 0));
  }

  /**
   * 분석 시간 기록
   */
  recordAnalysisTime(metrics: ProcessingMetrics): void {
    const currentTime = Date.now();
    const previousTime =
      metrics.startTime + (metrics.initTime || 0) + (metrics.searchTime || 0);
    metrics.analysisTime = currentTime - previousTime;
  }

  /**
   * 응답 시간 기록
   */
  recordResponseTime(metrics: ProcessingMetrics): void {
    const currentTime = Date.now();
    const previousTime =
      metrics.startTime +
      (metrics.initTime || 0) +
      (metrics.searchTime || 0) +
      (metrics.analysisTime || 0);
    metrics.responseTime = currentTime - previousTime;
  }

  /**
   * 총 처리 시간 계산 및 기록
   */
  finishProcessing(metrics: ProcessingMetrics): ProcessingMetrics {
    metrics.totalTime = Date.now() - metrics.startTime;

    // 히스토리에 추가
    this.addToHistory(metrics);

    return metrics;
  }

  /**
   * 엔진별 통계 업데이트
   */
  updateEngineStats(smartQuery: SmartQuery, processingTime: number): void {
    if (smartQuery.isKorean) {
      this.updateKoreanStats(processingTime);
    }

    if (smartQuery.useTransformers) {
      this.updateTransformersStats(processingTime);
    }

    if (smartQuery.useVectorSearch) {
      this.updateVectorStats();
    }

    // LightweightML은 별도 조건으로 판단
    if (smartQuery.tensorflowModels.length > 0) {
      this.updateLightweightMLStats(processingTime);
    }
  }

  /**
   * 한국어 엔진 통계 업데이트
   */
  private updateKoreanStats(processingTime: number): void {
    const stats = this.engineStats.korean;
    stats.successCount++;
    stats.avgTime =
      (stats.avgTime * (stats.successCount - 1) + processingTime) /
      stats.successCount;
  }

  /**
   * Transformers 엔진 통계 업데이트
   */
  private updateTransformersStats(processingTime: number): void {
    const stats = this.engineStats.transformers;
    stats.successCount++;
    stats.avgTime =
      (stats.avgTime * (stats.successCount - 1) + processingTime) /
      stats.successCount;
  }

  /**
   * LightweightML 엔진 통계 업데이트
   */
  private updateLightweightMLStats(processingTime: number): void {
    const stats = this.engineStats.lightweightML;
    stats.successCount++;
    stats.avgTime =
      (stats.avgTime * (stats.successCount - 1) + processingTime) /
      stats.successCount;
  }

  /**
   * 벡터 검색 통계 업데이트
   */
  private updateVectorStats(): void {
    this.engineStats.vector.searchCount++;
  }

  /**
   * 사용된 엔진 결정
   */
  determineEngineUsed(
    analysisResults: any
  ): 'korean' | 'lightweightML' | 'transformers' | 'vector' | 'hybrid' {
    const usedEngines: string[] = [];

    if (analysisResults.korean) usedEngines.push('korean');
    if (analysisResults.tensorflow || analysisResults.lightweightML)
      usedEngines.push('lightweightML');
    if (analysisResults.transformers) usedEngines.push('transformers');
    if (analysisResults.vectorSearchResults) usedEngines.push('vector');

    if (usedEngines.length === 0) return 'hybrid'; // 기본값
    if (usedEngines.length === 1) return usedEngines[0] as any;
    return 'hybrid'; // 여러 엔진 사용
  }

  /**
   * 엔진 초기화 상태 업데이트
   */
  markEngineInitialized(engineName: keyof EngineStats): void {
    this.engineStats[engineName].initialized = true;
  }

  /**
   * 문서 개수 업데이트
   */
  updateDocumentCount(count: number): void {
    this.engineStats.vector.documentCount = count;
  }

  /**
   * 성능 통계 반환 (통합 모니터와 동기화)
   */
  getPerformanceStats(): EngineStats {
    try {
      // 통합 모니터에서 최신 하이브리드 메트릭 가져오기
      const currentMetrics = this.unifiedMonitor.getCurrentMetrics();

      if (currentMetrics && currentMetrics.hybrid) {
        // 통합 메트릭으로 로컬 stats 업데이트
        this.engineStats = {
          korean: currentMetrics.hybrid.korean,
          lightweightML: currentMetrics.hybrid.lightweightML,
          transformers: currentMetrics.hybrid.transformers,
          vector: currentMetrics.hybrid.vector,
        };
      }
    } catch (error) {
      console.warn('⚠️ [Hybrid PerformanceMonitor] 통합 메트릭 동기화 실패:', error);
    }

    return { ...this.engineStats };
  }

  /**
   * 상세 성능 리포트 생성
   */
  generatePerformanceReport(): {
    summary: any;
    engineStats: EngineStats;
    recentMetrics: ProcessingMetrics[];
    recommendations: string[];
  } {
    const recentMetrics = this.processingHistory.slice(-10);
    const avgProcessingTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.totalTime || 0), 0) / recentMetrics.length
      : 0;

    const summary = {
      totalProcessed: this.processingHistory.length,
      averageProcessingTime: Math.round(avgProcessingTime),
      successRate: this.calculateSuccessRate(),
      mostUsedEngine: this.getMostUsedEngine(),
      memoryUsage: this.getMemoryUsage(),
    };

    const recommendations = this.generateRecommendations();

    return {
      summary,
      engineStats: this.getPerformanceStats(),
      recentMetrics,
      recommendations,
    };
  }

  /**
   * 성공률 계산
   */
  private calculateSuccessRate(): number {
    const totalRequests = Object.values(this.engineStats).reduce(
      (sum, stats) => {
        if ('successCount' in stats) {
          return sum + stats.successCount;
        }
        return sum;
      },
      0
    );

    if (totalRequests === 0) return 100;

    // 실패한 요청은 별도 추적이 없으므로 성공률을 높게 가정
    return Math.min(100, (totalRequests / (totalRequests + 1)) * 100);
  }

  /**
   * 가장 많이 사용된 엔진 찾기
   */
  private getMostUsedEngine(): string {
    let maxCount = 0;
    let mostUsedEngine = 'hybrid';

    Object.entries(this.engineStats).forEach(([engine, stats]) => {
      let count = 0;
      if ('successCount' in stats) {
        count = stats.successCount;
      } else if ('searchCount' in stats) {
        count = stats.searchCount;
      }

      if (count > maxCount) {
        maxCount = count;
        mostUsedEngine = engine;
      }
    });

    return mostUsedEngine;
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const recentMetrics = this.processingHistory.slice(-10);

    // 평균 처리 시간 분석
    if (recentMetrics.length > 0) {
      const avgTime = recentMetrics.reduce((sum, m) => sum + (m.totalTime || 0), 0) / recentMetrics.length;

      if (avgTime > 2000) {
        recommendations.push('평균 처리 시간이 2초를 초과합니다. 성능 최적화를 고려하세요.');
      }
    }

    // 엔진별 성능 분석
    const koreanStats = this.engineStats.korean;
    if (koreanStats.avgTime > 1000) {
      recommendations.push('한국어 처리 엔진의 응답 시간이 느립니다. 캐싱을 고려하세요.');
    }

    const vectorStats = this.engineStats.vector;
    if (vectorStats.documentCount > 10000 && vectorStats.searchCount > 1000) {
      recommendations.push('벡터 검색 부하가 높습니다. 인덱스 최적화를 권장합니다.');
    }

    // 메모리 사용량 분석
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage.percentage > 80) {
      recommendations.push('메모리 사용률이 높습니다. 가비지 컬렉션 또는 캐시 정리를 고려하세요.');
    }

    return recommendations.length > 0 ? recommendations : ['시스템이 정상적으로 작동하고 있습니다.'];
  }

  /**
   * 히스토리에 메트릭 추가
   */
  private addToHistory(metrics: ProcessingMetrics): void {
    this.processingHistory.push(metrics);

    // 최대 크기 제한
    if (this.processingHistory.length > this.maxHistorySize) {
      this.processingHistory = this.processingHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 엔진 상태 로깅
   */
  logEngineStatus(): void {
    console.log('🔍 [Hybrid PerformanceMonitor] 엔진 상태:');
    console.log('  한국어 엔진:', {
      초기화됨: this.engineStats.korean.initialized,
      성공횟수: this.engineStats.korean.successCount,
      평균시간: `${this.engineStats.korean.avgTime.toFixed(0)}ms`,
    });
    console.log('  LightweightML:', {
      초기화됨: this.engineStats.lightweightML.initialized,
      성공횟수: this.engineStats.lightweightML.successCount,
      평균시간: `${this.engineStats.lightweightML.avgTime.toFixed(0)}ms`,
    });
    console.log('  Transformers:', {
      초기화됨: this.engineStats.transformers.initialized,
      성공횟수: this.engineStats.transformers.successCount,
      평균시간: `${this.engineStats.transformers.avgTime.toFixed(0)}ms`,
    });
    console.log('  벡터 검색:', {
      초기화됨: this.engineStats.vector.initialized,
      문서수: this.engineStats.vector.documentCount,
      검색횟수: this.engineStats.vector.searchCount,
    });
  }

  /**
   * 메트릭 초기화
   */
  resetMetrics(): void {
    this.engineStats = {
      korean: { initialized: false, successCount: 0, avgTime: 0 },
      lightweightML: { initialized: false, successCount: 0, avgTime: 0 },
      transformers: { initialized: false, successCount: 0, avgTime: 0 },
      vector: { initialized: false, documentCount: 0, searchCount: 0 },
    };
    this.processingHistory = [];
    console.log('🔄 [Hybrid PerformanceMonitor] 메트릭이 초기화되었습니다.');
  }

  /**
   * 실시간 모니터링 시작
   */
  startRealTimeMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      this.logEngineStatus();

      // 통합 모니터와 동기화
      try {
        this.unifiedMonitor.collectUnifiedMetrics();
      } catch (error) {
        console.warn('⚠️ [Hybrid PerformanceMonitor] 통합 모니터 동기화 실패:', error);
      }
    }, intervalMs);
  }

  /**
   * 메모리 사용량 조회
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const used = Math.round(usage.heapUsed / 1024 / 1024); // MB
      const total = Math.round(usage.heapTotal / 1024 / 1024); // MB
      const percentage = Math.round((usage.heapUsed / usage.heapTotal) * 100);

      return { used, total, percentage };
    }

    // 브라우저 환경에서는 기본값 반환
    return { used: 0, total: 0, percentage: 0 };
  }
}
