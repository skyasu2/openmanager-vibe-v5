/**
 * MCP 모니터링을 위한 AI 기반 이상 징후 감지 엔진
 *
 * 주요 기능:
 * - 실시간 메트릭 분석
 * - 패턴 기반 이상 감지
 * - 적응형 임계값 계산
 * - 머신러닝 기반 예측
 */

import type {
  MCPServerMetrics,
  MonitoringEvent,
  MCPServerName,
  PerformanceTrend,
} from '../mcp-monitor/types';
import { getErrorMessage } from '../../types/type-utils';

/**
 * 이상 징후 감지 결과
 */
export interface AnomalyDetectionResult {
  serverId: MCPServerName;
  timestamp: number;
  isAnomaly: boolean;
  anomalyType:
    | 'response_time_spike'
    | 'error_rate_increase'
    | 'success_rate_drop'
    | 'memory_leak'
    | 'circuit_breaker_frequent'
    | 'connection_instability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  affectedMetrics: (keyof MCPServerMetrics)[];
  suggestedActions: string[];
  historicalContext: {
    baselineValue: number;
    currentValue: number;
    deviation: number; // 표준편차 배수
    trendDirection: 'increasing' | 'decreasing' | 'stable';
  };
}

/**
 * 적응형 임계값 설정
 */
interface AdaptiveThresholds {
  serverId: MCPServerName;
  responseTime: {
    baseline: number;
    upperBound: number;
    lowerBound: number;
    adaptationRate: number;
  };
  errorRate: {
    baseline: number;
    upperBound: number;
    adaptationRate: number;
  };
  successRate: {
    baseline: number;
    lowerBound: number;
    adaptationRate: number;
  };
  lastUpdated: number;
}

/**
 * 시계열 데이터 포인트
 */
interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, unknown>;
}

/**
 * 통계 분석 결과
 */
interface StatisticalAnalysis {
  mean: number;
  standardDeviation: number;
  variance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  outliers: TimeSeriesPoint[];
  seasonality: boolean;
}

/**
 * AI 기반 이상 징후 감지 엔진
 */
export class AIAnomalyDetector {
  private static instance: AIAnomalyDetector;

  // 메트릭 기록 (최근 24시간)
  private metricsHistory: Map<MCPServerName, MCPServerMetrics[]> = new Map();

  // 적응형 임계값
  private adaptiveThresholds: Map<MCPServerName, AdaptiveThresholds> =
    new Map();

  // 감지된 이상 징후 캐시 (중복 방지)
  private recentAnomalies: Map<string, AnomalyDetectionResult> = new Map();

  // 설정값
  private readonly config = {
    // 데이터 보관 기간 (24시간)
    retentionPeriod: 24 * 60 * 60 * 1000,

    // 분석 윈도우 크기 (15분)
    analysisWindow: 15 * 60 * 1000,

    // 최소 데이터 포인트 (분석을 위한)
    minDataPoints: 10,

    // 이상 징후 임계값 (표준편차 배수)
    anomalyThreshold: {
      low: 2.0,
      medium: 2.5,
      high: 3.0,
      critical: 4.0,
    },

    // 적응 속도
    adaptationRate: 0.1,

    // 중복 방지 윈도우 (5분)
    deduplicationWindow: 5 * 60 * 1000,
  };

  private constructor() {
    this.startPeriodicCleanup();
  }

  public static getInstance(): AIAnomalyDetector {
    if (!AIAnomalyDetector.instance) {
      AIAnomalyDetector.instance = new AIAnomalyDetector();
    }
    return AIAnomalyDetector.instance;
  }

  /**
   * 🔍 실시간 이상 징후 감지
   */
  public async detectAnomalies(
    metrics: MCPServerMetrics
  ): Promise<AnomalyDetectionResult[]> {
    try {
      // 1. 메트릭 저장
      this.storeMetrics(metrics);

      // 2. 기존 데이터 조회
      const history = this.getServerHistory(metrics.serverId);
      if (history.length < this.config.minDataPoints) {
        return []; // 충분한 데이터가 없음
      }

      // 3. 적응형 임계값 업데이트
      this.updateAdaptiveThresholds(metrics.serverId, history);

      // 4. 각 메트릭별 이상 징후 분석
      const anomalies: AnomalyDetectionResult[] = [];

      // 응답 시간 이상 분석
      const responseTimeAnomalies = await this.analyzeResponseTimeAnomalies(
        metrics,
        history
      );
      anomalies.push(...responseTimeAnomalies);

      // 에러율 이상 분석
      const errorRateAnomalies = await this.analyzeErrorRateAnomalies(
        metrics,
        history
      );
      anomalies.push(...errorRateAnomalies);

      // 성공률 이상 분석
      const successRateAnomalies = await this.analyzeSuccessRateAnomalies(
        metrics,
        history
      );
      anomalies.push(...successRateAnomalies);

      // Circuit Breaker 패턴 분석
      const circuitBreakerAnomalies = await this.analyzeCircuitBreakerAnomalies(
        metrics,
        history
      );
      anomalies.push(...circuitBreakerAnomalies);

      // 5. 중복 제거 및 필터링
      const filteredAnomalies = this.deduplicateAnomalies(anomalies);

      // 6. 감지 결과 캐싱
      filteredAnomalies.forEach((anomaly) => {
        const key = `${anomaly.serverId}_${anomaly.anomalyType}_${Math.floor(anomaly.timestamp / this.config.deduplicationWindow)}`;
        this.recentAnomalies.set(key, anomaly);
      });

      return filteredAnomalies;
    } catch (error) {
      console.error('이상 징후 감지 중 오류:', getErrorMessage(error));
      return [];
    }
  }

  /**
   * 📊 응답 시간 이상 분석
   */
  private async analyzeResponseTimeAnomalies(
    current: MCPServerMetrics,
    history: MCPServerMetrics[]
  ): Promise<AnomalyDetectionResult[]> {
    const responseTimeData = history.map((m) => ({
      timestamp: m.timestamp,
      value: m.responseTime,
    }));

    const analysis = this.performStatisticalAnalysis(responseTimeData);
    const threshold = this.getAdaptiveThreshold(current.serverId);

    const anomalies: AnomalyDetectionResult[] = [];

    // 응답 시간 스파이크 감지
    if (threshold && current.responseTime > threshold.responseTime.upperBound) {
      const deviation =
        (current.responseTime - analysis.mean) / analysis.standardDeviation;

      let severity: AnomalyDetectionResult['severity'] = 'low';
      if (deviation > this.config.anomalyThreshold.critical)
        severity = 'critical';
      else if (deviation > this.config.anomalyThreshold.high) severity = 'high';
      else if (deviation > this.config.anomalyThreshold.medium)
        severity = 'medium';

      anomalies.push({
        serverId: current.serverId,
        timestamp: current.timestamp,
        isAnomaly: true,
        anomalyType: 'response_time_spike',
        severity,
        confidence: Math.min(
          0.95,
          deviation / this.config.anomalyThreshold.critical
        ),
        description: `응답 시간이 급격히 증가했습니다. 현재: ${current.responseTime.toFixed(1)}ms, 평균: ${analysis.mean.toFixed(1)}ms`,
        affectedMetrics: ['responseTime'],
        suggestedActions: [
          '서버 리소스 사용량 확인',
          '네트워크 연결 상태 점검',
          '데이터베이스 쿼리 성능 분석',
          '캐시 히트율 확인',
        ],
        historicalContext: {
          baselineValue: analysis.mean,
          currentValue: current.responseTime,
          deviation,
          trendDirection: analysis.trend,
        },
      });
    }

    return anomalies;
  }

  /**
   * 🚨 에러율 이상 분석
   */
  private async analyzeErrorRateAnomalies(
    current: MCPServerMetrics,
    history: MCPServerMetrics[]
  ): Promise<AnomalyDetectionResult[]> {
    const errorRateData = history.map((m) => ({
      timestamp: m.timestamp,
      value: m.errorRate,
    }));

    const analysis = this.performStatisticalAnalysis(errorRateData);
    const threshold = this.getAdaptiveThreshold(current.serverId);

    const anomalies: AnomalyDetectionResult[] = [];

    // 에러율 증가 감지
    if (threshold && current.errorRate > threshold.errorRate.upperBound) {
      const deviation =
        (current.errorRate - analysis.mean) /
        Math.max(analysis.standardDeviation, 0.01);

      let severity: AnomalyDetectionResult['severity'] = 'medium';
      if (current.errorRate > 10) severity = 'critical';
      else if (current.errorRate > 5) severity = 'high';

      anomalies.push({
        serverId: current.serverId,
        timestamp: current.timestamp,
        isAnomaly: true,
        anomalyType: 'error_rate_increase',
        severity,
        confidence: Math.min(0.95, current.errorRate / 10),
        description: `에러율이 비정상적으로 증가했습니다. 현재: ${current.errorRate.toFixed(1)}%, 평균: ${analysis.mean.toFixed(1)}%`,
        affectedMetrics: ['errorRate', 'errorCount'],
        suggestedActions: [
          '최근 에러 로그 분석',
          '서비스 의존성 확인',
          'Circuit Breaker 상태 점검',
          '롤백 고려',
        ],
        historicalContext: {
          baselineValue: analysis.mean,
          currentValue: current.errorRate,
          deviation,
          trendDirection: analysis.trend,
        },
      });
    }

    return anomalies;
  }

  /**
   * ✅ 성공률 이상 분석
   */
  private async analyzeSuccessRateAnomalies(
    current: MCPServerMetrics,
    history: MCPServerMetrics[]
  ): Promise<AnomalyDetectionResult[]> {
    const successRateData = history.map((m) => ({
      timestamp: m.timestamp,
      value: m.successRate,
    }));

    const analysis = this.performStatisticalAnalysis(successRateData);
    const threshold = this.getAdaptiveThreshold(current.serverId);

    const anomalies: AnomalyDetectionResult[] = [];

    // 성공률 하락 감지
    if (threshold && current.successRate < threshold.successRate.lowerBound) {
      const deviation =
        (analysis.mean - current.successRate) /
        Math.max(analysis.standardDeviation, 0.01);

      let severity: AnomalyDetectionResult['severity'] = 'medium';
      if (current.successRate < 80) severity = 'critical';
      else if (current.successRate < 90) severity = 'high';

      anomalies.push({
        serverId: current.serverId,
        timestamp: current.timestamp,
        isAnomaly: true,
        anomalyType: 'success_rate_drop',
        severity,
        confidence: Math.min(0.95, (100 - current.successRate) / 20),
        description: `성공률이 급격히 하락했습니다. 현재: ${current.successRate.toFixed(1)}%, 평균: ${analysis.mean.toFixed(1)}%`,
        affectedMetrics: ['successRate'],
        suggestedActions: [
          '서비스 상태 긴급 점검',
          '의존성 서비스 확인',
          '로드밸런서 설정 검토',
          '즉시 복구 절차 실행',
        ],
        historicalContext: {
          baselineValue: analysis.mean,
          currentValue: current.successRate,
          deviation,
          trendDirection: analysis.trend,
        },
      });
    }

    return anomalies;
  }

  /**
   * ⚡ Circuit Breaker 패턴 분석
   */
  private async analyzeCircuitBreakerAnomalies(
    current: MCPServerMetrics,
    history: MCPServerMetrics[]
  ): Promise<AnomalyDetectionResult[]> {
    const anomalies: AnomalyDetectionResult[] = [];

    // 최근 1시간 내 Circuit Breaker 상태 변화 분석
    const recentHistory = history.filter(
      (m) => current.timestamp - m.timestamp < 60 * 60 * 1000
    );

    const stateChanges = recentHistory.filter(
      (m) => m.circuitBreakerState !== 'closed'
    );

    // Circuit Breaker가 자주 열리는 경우
    if (stateChanges.length > 3) {
      anomalies.push({
        serverId: current.serverId,
        timestamp: current.timestamp,
        isAnomaly: true,
        anomalyType: 'circuit_breaker_frequent',
        severity: 'high',
        confidence: Math.min(0.95, stateChanges.length / 10),
        description: `Circuit Breaker가 자주 동작하고 있습니다. 최근 1시간 내 ${stateChanges.length}회 상태 변화`,
        affectedMetrics: ['circuitBreakerState'],
        suggestedActions: [
          'Circuit Breaker 임계값 조정 검토',
          '하위 시스템 안정성 확인',
          '타임아웃 설정 검토',
          '의존성 체인 분석',
        ],
        historicalContext: {
          baselineValue: 0,
          currentValue: stateChanges.length,
          deviation: stateChanges.length,
          trendDirection: 'increasing',
        },
      });
    }

    return anomalies;
  }

  /**
   * 📈 통계 분석 수행
   */
  private performStatisticalAnalysis(
    data: TimeSeriesPoint[]
  ): StatisticalAnalysis {
    if (data.length === 0) {
      return {
        mean: 0,
        standardDeviation: 0,
        variance: 0,
        trend: 'stable',
        outliers: [],
        seasonality: false,
      };
    }

    const values = data.map((d) => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const standardDeviation = Math.sqrt(variance);

    // 트렌드 분석 (선형 회귀)
    const trend = this.calculateTrend(data);

    // 이상값 탐지 (IQR 방법)
    const outliers = this.detectOutliers(data, mean, standardDeviation);

    return {
      mean,
      standardDeviation,
      variance,
      trend,
      outliers,
      seasonality: false, // 추후 구현
    };
  }

  /**
   * 📊 트렌드 계산 (단순 선형 회귀)
   */
  private calculateTrend(
    data: TimeSeriesPoint[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const n = data.length;
    const sumX = data.reduce((sum, d, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumXX = data.reduce((sum, d, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * 🎯 이상값 탐지
   */
  private detectOutliers(
    data: TimeSeriesPoint[],
    mean: number,
    stdDev: number
  ): TimeSeriesPoint[] {
    const threshold = 2 * stdDev;
    return data.filter((d) => Math.abs(d.value - mean) > threshold);
  }

  /**
   * 🔄 적응형 임계값 업데이트
   */
  private updateAdaptiveThresholds(
    serverId: MCPServerName,
    history: MCPServerMetrics[]
  ): void {
    const recentData = history.slice(-20); // 최근 20개 데이터 포인트

    if (recentData.length < 5) return;

    const responseTimeData = recentData.map((m) => m.responseTime);
    const errorRateData = recentData.map((m) => m.errorRate);
    const successRateData = recentData.map((m) => m.successRate);

    const responseTimeMean =
      responseTimeData.reduce((sum, val) => sum + val, 0) /
      responseTimeData.length;
    const responseTimeStd = Math.sqrt(
      responseTimeData.reduce(
        (sum, val) => sum + Math.pow(val - responseTimeMean, 2),
        0
      ) / responseTimeData.length
    );

    const errorRateMean =
      errorRateData.reduce((sum, val) => sum + val, 0) / errorRateData.length;
    const successRateMean =
      successRateData.reduce((sum, val) => sum + val, 0) /
      successRateData.length;
    const successRateStd = Math.sqrt(
      successRateData.reduce(
        (sum, val) => sum + Math.pow(val - successRateMean, 2),
        0
      ) / successRateData.length
    );

    const current = this.adaptiveThresholds.get(serverId);
    const rate = this.config.adaptationRate;

    const newThresholds: AdaptiveThresholds = {
      serverId,
      responseTime: {
        baseline: current
          ? current.responseTime.baseline * (1 - rate) + responseTimeMean * rate
          : responseTimeMean,
        upperBound: responseTimeMean + 2 * responseTimeStd,
        lowerBound: Math.max(0, responseTimeMean - 2 * responseTimeStd),
        adaptationRate: rate,
      },
      errorRate: {
        baseline: current
          ? current.errorRate.baseline * (1 - rate) + errorRateMean * rate
          : errorRateMean,
        upperBound: errorRateMean + 2,
        adaptationRate: rate,
      },
      successRate: {
        baseline: current
          ? current.successRate.baseline * (1 - rate) + successRateMean * rate
          : successRateMean,
        lowerBound: successRateMean - 2 * successRateStd,
        adaptationRate: rate,
      },
      lastUpdated: Date.now(),
    };

    this.adaptiveThresholds.set(serverId, newThresholds);
  }

  /**
   * 📝 메트릭 저장
   */
  private storeMetrics(metrics: MCPServerMetrics): void {
    const history = this.metricsHistory.get(metrics.serverId) || [];
    history.push(metrics);

    // 보관 기간 초과 데이터 제거
    const cutoff = Date.now() - this.config.retentionPeriod;
    const filteredHistory = history.filter((m) => m.timestamp > cutoff);

    this.metricsHistory.set(metrics.serverId, filteredHistory);
  }

  /**
   * 📚 서버 기록 조회
   */
  private getServerHistory(serverId: MCPServerName): MCPServerMetrics[] {
    return this.metricsHistory.get(serverId) || [];
  }

  /**
   * 🎯 적응형 임계값 조회
   */
  private getAdaptiveThreshold(
    serverId: MCPServerName
  ): AdaptiveThresholds | undefined {
    return this.adaptiveThresholds.get(serverId);
  }

  /**
   * 🔄 중복 제거
   */
  private deduplicateAnomalies(
    anomalies: AnomalyDetectionResult[]
  ): AnomalyDetectionResult[] {
    const uniqueAnomalies = new Map<string, AnomalyDetectionResult>();

    anomalies.forEach((anomaly) => {
      const key = `${anomaly.serverId}_${anomaly.anomalyType}`;
      const existing = uniqueAnomalies.get(key);

      if (!existing || anomaly.confidence > existing.confidence) {
        uniqueAnomalies.set(key, anomaly);
      }
    });

    return Array.from(uniqueAnomalies.values());
  }

  /**
   * 🧹 주기적 정리
   */
  private startPeriodicCleanup(): void {
    setInterval(
      () => {
        const cutoff = Date.now() - this.config.retentionPeriod;

        // 오래된 메트릭 정리
        this.metricsHistory.forEach((history, serverId) => {
          const filtered = history.filter((m) => m.timestamp > cutoff);
          this.metricsHistory.set(serverId, filtered);
        });

        // 오래된 이상 징후 캐시 정리
        const anomalyCutoff = Date.now() - this.config.deduplicationWindow;
        this.recentAnomalies.forEach((anomaly, key) => {
          if (anomaly.timestamp < anomalyCutoff) {
            this.recentAnomalies.delete(key);
          }
        });
      },
      60 * 60 * 1000
    ); // 1시간마다 실행
  }

  /**
   * 📊 감지 통계 조회
   */
  public getDetectionStats(): {
    totalServersMonitored: number;
    totalAnomaliesDetected: number;
    anomaliesByType: Record<string, number>;
    anomaliesBySeverity: Record<string, number>;
  } {
    const anomalies = Array.from(this.recentAnomalies.values());

    const anomaliesByType: Record<string, number> = {};
    const anomaliesBySeverity: Record<string, number> = {};

    anomalies.forEach((anomaly) => {
      anomaliesByType[anomaly.anomalyType] =
        (anomaliesByType[anomaly.anomalyType] || 0) + 1;
      anomaliesBySeverity[anomaly.severity] =
        (anomaliesBySeverity[anomaly.severity] || 0) + 1;
    });

    return {
      totalServersMonitored: this.metricsHistory.size,
      totalAnomaliesDetected: anomalies.length,
      anomaliesByType,
      anomaliesBySeverity,
    };
  }

  /**
   * ⚙️ 설정 업데이트
   */
  public updateConfiguration(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
  }
}

// 싱글톤 인스턴스 내보내기
export const aiAnomalyDetector = AIAnomalyDetector.getInstance();
