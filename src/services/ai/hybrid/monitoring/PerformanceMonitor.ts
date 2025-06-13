/**
 * 📊 성능 모니터
 *
 * Single Responsibility: 엔진 성능 모니터링과 메트릭 수집
 * Observer Pattern: 성능 이벤트 관찰 및 통지
 */

import {
  SmartQuery,
  EngineStats,
  ProcessingMetrics,
} from '../types/HybridTypes';
import * as os from 'os';

export class PerformanceMonitor {
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
   * 성능 통계 반환
   */
  getPerformanceStats(): EngineStats {
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
    const avgTotalTime =
      recentMetrics.reduce((sum, m) => sum + (m.totalTime || 0), 0) /
      recentMetrics.length;

    const summary = {
      totalRequests: this.processingHistory.length,
      avgProcessingTime: Math.round(avgTotalTime),
      successRate: this.calculateSuccessRate(),
      mostUsedEngine: this.getMostUsedEngine(),
    };

    const recommendations = this.generateRecommendations();

    return {
      summary,
      engineStats: this.engineStats,
      recentMetrics,
      recommendations,
    };
  }

  /**
   * 성공률 계산
   */
  private calculateSuccessRate(): number {
    const totalRequests = Object.values(this.engineStats).reduce(
      (sum, stats) => sum + (stats.successCount || 0),
      0
    );

    return totalRequests > 0
      ? (totalRequests / this.processingHistory.length) * 100
      : 0;
  }

  /**
   * 가장 많이 사용된 엔진 찾기
   */
  private getMostUsedEngine(): string {
    let maxCount = 0;
    let mostUsed = 'none';

    Object.entries(this.engineStats).forEach(([engine, stats]) => {
      const count = stats.successCount || 0;
      if (count > maxCount) {
        maxCount = count;
        mostUsed = engine;
      }
    });

    return mostUsed;
  }

  /**
   * 성능 개선 권장사항 생성
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const recentMetrics = this.processingHistory.slice(-20);

    if (recentMetrics.length === 0) {
      return ['데이터가 충분하지 않습니다'];
    }

    const avgTotalTime =
      recentMetrics.reduce((sum, m) => sum + (m.totalTime || 0), 0) /
      recentMetrics.length;

    // 처리 시간 기반 권장사항
    if (avgTotalTime > 5000) {
      recommendations.push(
        '⚠️ 평균 처리 시간이 5초를 초과합니다. 성능 최적화가 필요합니다.'
      );
    }

    // 엔진별 권장사항
    if (this.engineStats.korean.avgTime > 3000) {
      recommendations.push(
        '🇰🇷 한국어 엔진의 응답 시간이 느립니다. 모델 최적화를 고려하세요.'
      );
    }

    if (this.engineStats.lightweightML.avgTime > 8000) {
      recommendations.push(
        '🤖 TensorFlow 엔진의 초기화 시간이 깁니다. 백그라운드 로딩을 활용하세요.'
      );
    }

    if (this.engineStats.vector.documentCount > 1000) {
      recommendations.push(
        '📚 벡터 DB 문서 수가 많습니다. 인덱스 최적화를 고려하세요.'
      );
    }

    // 사용 패턴 기반 권장사항
    const koreanUsage = this.engineStats.korean.successCount;
    const totalUsage = Object.values(this.engineStats).reduce(
      (sum, stats) => sum + (stats.successCount || 0),
      0
    );

    if (koreanUsage / totalUsage > 0.8) {
      recommendations.push(
        '🔤 한국어 쿼리가 대부분입니다. 한국어 엔진 성능 최적화에 집중하세요.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 현재 성능 상태가 양호합니다.');
    }

    return recommendations;
  }

  /**
   * 처리 히스토리에 추가
   */
  private addToHistory(metrics: ProcessingMetrics): void {
    this.processingHistory.push(metrics);

    // 히스토리 크기 제한
    if (this.processingHistory.length > this.maxHistorySize) {
      this.processingHistory.shift();
    }
  }

  /**
   * 엔진 상태 로깅
   */
  logEngineStatus(): void {
    console.log('📊 엔진 성능 상태:');
    console.table({
      한국어: {
        초기화: this.engineStats.korean.initialized ? '✅' : '❌',
        성공횟수: this.engineStats.korean.successCount,
        평균시간: `${Math.round(this.engineStats.korean.avgTime)}ms`,
      },
      TensorFlow: {
        초기화: this.engineStats.lightweightML.initialized ? '✅' : '❌',
        성공횟수: this.engineStats.lightweightML.successCount,
        평균시간: `${Math.round(this.engineStats.lightweightML.avgTime)}ms`,
      },
      Transformers: {
        초기화: this.engineStats.transformers.initialized ? '✅' : '❌',
        성공횟수: this.engineStats.transformers.successCount,
        평균시간: `${Math.round(this.engineStats.transformers.avgTime)}ms`,
      },
      'Vector DB': {
        초기화: this.engineStats.vector.initialized ? '✅' : '❌',
        문서수: this.engineStats.vector.documentCount,
        검색횟수: this.engineStats.vector.searchCount,
      },
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
    console.log('🧹 성능 메트릭 초기화 완료');
  }

  /**
   * 실시간 성능 모니터링
   */
  startRealTimeMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      this.logEngineStatus();

      const report = this.generatePerformanceReport();
      if (report.recommendations.some(rec => rec.includes('⚠️'))) {
        console.warn('⚠️ 성능 경고가 감지되었습니다:', report.recommendations);
      }
    }, intervalMs);
  }

  /**
   * 메모리 사용량 모니터링
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const usedMem = memUsage.heapUsed;

    return {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100),
    };
  }
}
