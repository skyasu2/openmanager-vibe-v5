/**
 * 🔍 서버 간 상관관계 분석 엔진
 *
 * Simple Statistics를 활용한 실시간 메트릭 상관관계 분석
 * CPU-메모리-응답시간-디스크 상관관계 실시간 분석
 * Vercel 메모리 제약(1GB) 및 실행시간 제약(10초) 최적화
 */

import * as ss from 'simple-statistics';

export interface ServerMetrics {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  responseTime: number;
  diskUsage: number;
  networkIO: number;
  timestamp: number;
}

export interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
  significance: number;
  serverCount: number;
}

export interface CorrelationInsights {
  topCorrelations: CorrelationResult[];
  criticalCorrelations: CorrelationResult[];
  anomalies: string[];
  recommendations: string[];
  analysisTime: number;
  memoryUsage: string;
}

export class CorrelationEngine {
  private readonly CORRELATION_THRESHOLD = {
    strong: 0.7,
    moderate: 0.4,
    weak: 0.2,
  };

  private readonly MAX_SERVERS_BATCH = 50; // 메모리 최적화
  private readonly METRICS_TO_ANALYZE = [
    'cpu',
    'memory',
    'responseTime',
    'diskUsage',
    'networkIO',
  ];

  /**
   * 🔍 실시간 서버 상관관계 분석 (5분 내 구현)
   */
  async analyzeCorrelations(
    servers: ServerMetrics[]
  ): Promise<CorrelationInsights> {
    const startTime = Date.now();

    try {
      // 1. 메모리 최적화: 배치 처리
      const serverBatches = this.batchServers(servers, this.MAX_SERVERS_BATCH);
      const allCorrelations: CorrelationResult[] = [];

      for (const batch of serverBatches) {
        const batchCorrelations = await this.analyzeBatchCorrelations(batch);
        allCorrelations.push(...batchCorrelations);
      }

      // 2. 상관관계 결과 정렬 및 필터링
      const topCorrelations = allCorrelations
        .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
        .slice(0, 10);

      const criticalCorrelations = allCorrelations.filter(
        c => Math.abs(c.correlation) >= this.CORRELATION_THRESHOLD.strong
      );

      // 3. 이상 징후 및 권장사항 생성
      const anomalies = this.detectAnomalies(allCorrelations);
      const recommendations = this.generateRecommendations(
        topCorrelations,
        criticalCorrelations
      );

      const analysisTime = Date.now() - startTime;
      const memoryUsage = this.estimateMemoryUsage(servers.length);

      return {
        topCorrelations,
        criticalCorrelations,
        anomalies,
        recommendations,
        analysisTime,
        memoryUsage,
      };
    } catch (error) {
      console.error('❌ 상관관계 분석 실패:', error);
      return this.getFallbackAnalysis(servers.length, Date.now() - startTime);
    }
  }

  /**
   * 배치별 상관관계 분석
   */
  private async analyzeBatchCorrelations(
    servers: ServerMetrics[]
  ): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    if (servers.length < 2) return correlations;

    // 모든 메트릭 쌍에 대해 상관관계 계산
    for (let i = 0; i < this.METRICS_TO_ANALYZE.length; i++) {
      for (let j = i + 1; j < this.METRICS_TO_ANALYZE.length; j++) {
        const metric1 = this.METRICS_TO_ANALYZE[i];
        const metric2 = this.METRICS_TO_ANALYZE[j];

        try {
          const correlationResult = this.calculateMetricCorrelation(
            servers,
            metric1,
            metric2
          );

          if (correlationResult) {
            correlations.push(correlationResult);
          }
        } catch (error) {
          console.warn(`⚠️ ${metric1}-${metric2} 상관관계 계산 실패:`, error);
        }
      }
    }

    return correlations;
  }

  /**
   * 두 메트릭 간 상관관계 계산
   */
  private calculateMetricCorrelation(
    servers: ServerMetrics[],
    metric1: string,
    metric2: string
  ): CorrelationResult | null {
    const values1: number[] = [];
    const values2: number[] = [];

    // 유효한 값만 추출
    servers.forEach(server => {
      const val1 = (server as any)[metric1];
      const val2 = (server as any)[metric2];

      if (
        typeof val1 === 'number' &&
        typeof val2 === 'number' &&
        !isNaN(val1) &&
        !isNaN(val2)
      ) {
        values1.push(val1);
        values2.push(val2);
      }
    });

    if (values1.length < 3) return null; // 최소 3개 데이터 포인트 필요

    try {
      const correlationValue = ss.sampleCorrelation(values1, values2);

      if (isNaN(correlationValue)) return null;

      const strength = this.determineCorrelationStrength(
        Math.abs(correlationValue)
      );
      const direction = correlationValue >= 0 ? 'positive' : 'negative';
      const significance = this.calculateSignificance(
        correlationValue,
        values1.length
      );

      return {
        metric1: this.getMetricDisplayName(metric1),
        metric2: this.getMetricDisplayName(metric2),
        correlation: correlationValue,
        strength,
        direction,
        significance,
        serverCount: values1.length,
      };
    } catch (error) {
      console.warn(`⚠️ ${metric1}-${metric2} 상관관계 계산 오류:`, error);
      return null;
    }
  }

  /**
   * 상관관계 강도 판정
   */
  private determineCorrelationStrength(
    absCorrelation: number
  ): 'strong' | 'moderate' | 'weak' | 'none' {
    if (absCorrelation >= this.CORRELATION_THRESHOLD.strong) return 'strong';
    if (absCorrelation >= this.CORRELATION_THRESHOLD.moderate)
      return 'moderate';
    if (absCorrelation >= this.CORRELATION_THRESHOLD.weak) return 'weak';
    return 'none';
  }

  /**
   * 통계적 유의성 계산 (간단한 근사)
   */
  private calculateSignificance(
    correlation: number,
    sampleSize: number
  ): number {
    const tStat =
      Math.abs(correlation) *
      Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    return Math.min(0.99, Math.max(0.01, 1 - tStat / (tStat + sampleSize - 2)));
  }

  /**
   * 이상 징후 탐지
   */
  private detectAnomalies(correlations: CorrelationResult[]): string[] {
    const anomalies: string[] = [];

    // 예상치 못한 강한 음의 상관관계
    const unexpectedNegative = correlations.filter(
      c => c.correlation < -0.8 && c.direction === 'negative'
    );

    unexpectedNegative.forEach(c => {
      anomalies.push(
        `⚠️ 비정상적인 음의 상관관계: ${c.metric1} ↔ ${c.metric2} (${(c.correlation * 100).toFixed(1)}%)`
      );
    });

    // CPU-메모리 상관관계 이상
    const cpuMemoryCorr = correlations.find(
      c =>
        (c.metric1.includes('CPU') && c.metric2.includes('메모리')) ||
        (c.metric1.includes('메모리') && c.metric2.includes('CPU'))
    );

    if (cpuMemoryCorr && Math.abs(cpuMemoryCorr.correlation) < 0.3) {
      anomalies.push(
        '🔍 CPU-메모리 상관관계가 예상보다 낮음 - 시스템 불균형 가능성'
      );
    }

    return anomalies;
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    topCorrelations: CorrelationResult[],
    criticalCorrelations: CorrelationResult[]
  ): string[] {
    const recommendations: string[] = [];

    if (criticalCorrelations.length > 0) {
      recommendations.push(
        '🎯 강한 상관관계가 발견되었습니다. 연관 메트릭 동시 모니터링을 권장합니다.'
      );
    }

    const responseTimeCorrelations = topCorrelations.filter(
      c => c.metric1.includes('응답시간') || c.metric2.includes('응답시간')
    );

    if (responseTimeCorrelations.length > 0) {
      const strongestRT = responseTimeCorrelations[0];
      recommendations.push(
        `⚡ 응답시간은 ${strongestRT.metric1.includes('응답시간') ? strongestRT.metric2 : strongestRT.metric1}와 강한 상관관계 (${(strongestRT.correlation * 100).toFixed(1)}%)`
      );
    }

    if (topCorrelations.length < 3) {
      recommendations.push(
        '📊 메트릭 간 상관관계가 낮습니다. 독립적인 모니터링 전략을 고려하세요.'
      );
    }

    return recommendations;
  }

  /**
   * 서버 배치 분할 (메모리 최적화)
   */
  private batchServers(
    servers: ServerMetrics[],
    batchSize: number
  ): ServerMetrics[][] {
    const batches: ServerMetrics[][] = [];
    for (let i = 0; i < servers.length; i += batchSize) {
      batches.push(servers.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 메트릭 표시명 변환
   */
  private getMetricDisplayName(metric: string): string {
    const displayNames: Record<string, string> = {
      cpu: 'CPU 사용률',
      memory: '메모리 사용률',
      responseTime: '응답시간',
      diskUsage: '디스크 사용률',
      networkIO: '네트워크 I/O',
    };
    return displayNames[metric] || metric;
  }

  /**
   * 메모리 사용량 추정
   */
  private estimateMemoryUsage(serverCount: number): string {
    const baseMemory = 0.5; // MB
    const perServerMemory = 0.01; // MB per server
    const totalMB = baseMemory + serverCount * perServerMemory;
    return `~${totalMB.toFixed(1)}MB`;
  }

  /**
   * 폴백 분석 결과
   */
  private getFallbackAnalysis(
    serverCount: number,
    analysisTime: number
  ): CorrelationInsights {
    return {
      topCorrelations: [],
      criticalCorrelations: [],
      anomalies: ['⚠️ 상관관계 분석 중 오류 발생'],
      recommendations: ['🔄 나중에 다시 시도해주세요'],
      analysisTime,
      memoryUsage: this.estimateMemoryUsage(serverCount),
    };
  }
}

export const correlationEngine = new CorrelationEngine();
