/**
 * MCP 모니터링을 위한 성능 예측 모델
 *
 * 주요 기능:
 * - 시계열 데이터 기반 성능 예측
 * - 트렌드 분석 및 계절성 감지
 * - 리소스 사용량 예측
 * - 용량 계획 지원
 */

import type {
  MCPServerMetrics,
  MCPServerName,
  PerformanceTrend,
} from '../mcp-monitor/types';
import { getErrorMessage } from '../../types/type-utils';

/**
 * 예측 결과
 */
export interface PredictionResult {
  serverId: MCPServerName;
  metric: keyof MCPServerMetrics;
  currentValue: number;
  predictions: {
    timestamp: number;
    value: number;
    confidence: number; // 0-1
    upperBound: number;
    lowerBound: number;
  }[];
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number; // 0-1
    changeRate: number; // per hour
    seasonality: boolean;
  };
  alerts: {
    type: 'threshold_breach' | 'capacity_limit' | 'degradation_risk';
    timeToAlert: number; // minutes
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r2: number; // R-squared
  };
}

/**
 * 용량 계획 결과
 */
export interface CapacityPlanningResult {
  serverId: MCPServerName;
  currentUtilization: {
    responseTime: number; // % of threshold
    errorRate: number; // % of threshold
    throughput: number; // requests/hour
  };
  projectedUtilization: {
    in1Hour: number;
    in6Hours: number;
    in24Hours: number;
    in7Days: number;
  };
  recommendations: {
    action: 'scale_up' | 'scale_down' | 'optimize' | 'monitor';
    urgency: 'immediate' | 'within_hour' | 'within_day' | 'planned';
    description: string;
    expectedImpact: string;
  }[];
  riskAssessment: {
    overloadRisk: number; // 0-1
    failureRisk: number; // 0-1
    timeToRisk: number; // minutes
  };
}

/**
 * 계절성 패턴
 */
interface SeasonalPattern {
  period: number; // in milliseconds
  amplitude: number;
  phase: number;
  confidence: number;
}

/**
 * 예측 모델 파라미터
 */
interface ModelParameters {
  trend: {
    slope: number;
    intercept: number;
    confidence: number;
  };
  seasonality: SeasonalPattern[];
  noise: {
    variance: number;
    distribution: 'normal' | 'exponential';
  };
  outliers: {
    threshold: number;
    count: number;
  };
}

/**
 * 성능 예측 엔진
 */
export class PerformancePredictor {
  private static instance: PerformancePredictor;

  // 메트릭 기록 (최근 7일)
  private metricsHistory: Map<MCPServerName, MCPServerMetrics[]> = new Map();

  // 예측 모델 캐시
  private modelCache: Map<string, ModelParameters> = new Map();

  // 예측 결과 캐시
  private predictionCache: Map<string, PredictionResult> = new Map();

  // 설정값
  private readonly config = {
    // 데이터 보관 기간 (7일)
    retentionPeriod: 7 * 24 * 60 * 60 * 1000,

    // 예측 기간 (24시간)
    predictionHorizon: 24 * 60 * 60 * 1000,

    // 예측 간격 (1시간)
    predictionInterval: 60 * 60 * 1000,

    // 최소 데이터 포인트
    minDataPoints: 20,

    // 모델 재학습 간격 (1시간)
    modelRetrainingInterval: 60 * 60 * 1000,

    // 성능 임계값
    thresholds: {
      responseTime: 1000, // ms
      errorRate: 5, // %
      successRate: 95, // %
    },

    // 캐시 TTL (30분)
    cacheTTL: 30 * 60 * 1000,
  };

  private constructor() {
    this.startPeriodicModelRetraining();
  }

  public static getInstance(): PerformancePredictor {
    if (!PerformancePredictor.instance) {
      PerformancePredictor.instance = new PerformancePredictor();
    }
    return PerformancePredictor.instance;
  }

  /**
   * 🔮 성능 예측 실행
   */
  public async predictPerformance(
    serverId: MCPServerName,
    metric: keyof MCPServerMetrics = 'responseTime',
    horizonHours: number = 24
  ): Promise<PredictionResult | null> {
    try {
      const cacheKey = `${serverId}_${metric}_${horizonHours}`;
      const cached = this.predictionCache.get(cacheKey);

      if (
        cached &&
        Date.now() - cached.predictions[0]?.timestamp < this.config.cacheTTL
      ) {
        return cached;
      }

      const history = this.getServerHistory(serverId);
      if (history.length < this.config.minDataPoints) {
        return null; // 충분한 데이터가 없음
      }

      // 1. 시계열 데이터 준비
      const timeSeriesData = this.prepareTimeSeriesData(history, metric);

      // 2. 모델 학습/업데이트
      const model = await this.trainPredictionModel(
        serverId,
        metric,
        timeSeriesData
      );

      // 3. 예측 실행
      const predictions = this.generatePredictions(
        timeSeriesData,
        model,
        horizonHours * 60 * 60 * 1000
      );

      // 4. 트렌드 분석
      const trend = this.analyzeTrend(timeSeriesData, model);

      // 5. 알림 생성
      const alerts = this.generatePredictionAlerts(predictions, metric, trend);

      // 6. 정확도 계산
      const accuracy = this.calculateAccuracy(timeSeriesData, model);

      const result: PredictionResult = {
        serverId,
        metric,
        currentValue: timeSeriesData[timeSeriesData.length - 1]?.value || 0,
        predictions,
        trend,
        alerts,
        accuracy,
      };

      // 캐시 저장
      this.predictionCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('성능 예측 중 오류:', getErrorMessage(error));
      return null;
    }
  }

  /**
   * 📊 용량 계획 분석
   */
  public async analyzeCapacityPlanning(
    serverId: MCPServerName
  ): Promise<CapacityPlanningResult | null> {
    try {
      const history = this.getServerHistory(serverId);
      if (history.length < this.config.minDataPoints) {
        return null;
      }

      const current = history[history.length - 1];

      // 현재 활용도 계산
      const currentUtilization = {
        responseTime:
          (current.responseTime / this.config.thresholds.responseTime) * 100,
        errorRate: (current.errorRate / this.config.thresholds.errorRate) * 100,
        throughput: current.requestCount * 60, // per hour
      };

      // 미래 활용도 예측
      const responseTimePrediction = await this.predictPerformance(
        serverId,
        'responseTime',
        24
      );
      const errorRatePrediction = await this.predictPerformance(
        serverId,
        'errorRate',
        24
      );

      const projectedUtilization = {
        in1Hour: this.calculateProjectedUtilization(responseTimePrediction, 1),
        in6Hours: this.calculateProjectedUtilization(responseTimePrediction, 6),
        in24Hours: this.calculateProjectedUtilization(
          responseTimePrediction,
          24
        ),
        in7Days: this.calculateProjectedUtilization(
          responseTimePrediction,
          168
        ),
      };

      // 권장사항 생성
      const recommendations = this.generateCapacityRecommendations(
        currentUtilization,
        projectedUtilization,
        responseTimePrediction,
        errorRatePrediction
      );

      // 위험도 평가
      const riskAssessment = this.assessCapacityRisks(
        currentUtilization,
        projectedUtilization,
        responseTimePrediction
      );

      return {
        serverId,
        currentUtilization,
        projectedUtilization,
        recommendations,
        riskAssessment,
      };
    } catch (error) {
      console.error('용량 계획 분석 중 오류:', getErrorMessage(error));
      return null;
    }
  }

  /**
   * 📈 시계열 데이터 준비
   */
  private prepareTimeSeriesData(
    history: MCPServerMetrics[],
    metric: keyof MCPServerMetrics
  ): { timestamp: number; value: number }[] {
    return history
      .map((m) => ({
        timestamp: m.timestamp,
        value: Number(m[metric]) || 0,
      }))
      .filter((d) => !isNaN(d.value))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 🤖 예측 모델 학습
   */
  private async trainPredictionModel(
    serverId: MCPServerName,
    metric: keyof MCPServerMetrics,
    data: { timestamp: number; value: number }[]
  ): Promise<ModelParameters> {
    const modelKey = `${serverId}_${metric}`;

    // 기존 모델 확인
    const existingModel = this.modelCache.get(modelKey);
    const lastUpdate = existingModel
      ? Date.now() - data[data.length - 1].timestamp
      : Infinity;

    if (existingModel && lastUpdate < this.config.modelRetrainingInterval) {
      return existingModel;
    }

    // 1. 트렌드 분석 (선형 회귀)
    const trend = this.calculateLinearRegression(data);

    // 2. 계절성 감지
    const seasonality = this.detectSeasonality(data);

    // 3. 노이즈 분석
    const noise = this.analyzeNoise(data, trend, seasonality);

    // 4. 이상값 분석
    const outliers = this.analyzeOutliers(data);

    const model: ModelParameters = {
      trend,
      seasonality,
      noise,
      outliers,
    };

    // 모델 캐시 저장
    this.modelCache.set(modelKey, model);

    return model;
  }

  /**
   * 📊 선형 회귀 계산
   */
  private calculateLinearRegression(
    data: { timestamp: number; value: number }[]
  ): ModelParameters['trend'] {
    const n = data.length;
    if (n < 2) {
      return { slope: 0, intercept: 0, confidence: 0 };
    }

    // 정규화된 시간 좌표 사용
    const baseTime = data[0].timestamp;
    const normalizedData = data.map((d, i) => ({
      x: i,
      y: d.value,
    }));

    const sumX = normalizedData.reduce((sum, d) => sum + d.x, 0);
    const sumY = normalizedData.reduce((sum, d) => sum + d.y, 0);
    const sumXY = normalizedData.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumXX = normalizedData.reduce((sum, d) => sum + d.x * d.x, 0);
    const sumYY = normalizedData.reduce((sum, d) => sum + d.y * d.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R² 계산
    const meanY = sumY / n;
    const ssRes = normalizedData.reduce((sum, d) => {
      const predicted = slope * d.x + intercept;
      return sum + Math.pow(d.y - predicted, 2);
    }, 0);
    const ssTot = normalizedData.reduce(
      (sum, d) => sum + Math.pow(d.y - meanY, 2),
      0
    );
    const r2 = 1 - ssRes / ssTot;

    return {
      slope,
      intercept,
      confidence: Math.max(0, Math.min(1, r2)),
    };
  }

  /**
   * 🔄 계절성 감지
   */
  private detectSeasonality(
    data: { timestamp: number; value: number }[]
  ): SeasonalPattern[] {
    // 간단한 계절성 감지 (추후 FFT 기반으로 개선)
    const patterns: SeasonalPattern[] = [];

    // 일일 패턴 (24시간)
    const dailyPattern = this.detectPattern(data, 24 * 60 * 60 * 1000);
    if (dailyPattern.confidence > 0.3) {
      patterns.push(dailyPattern);
    }

    // 주간 패턴 (7일)
    const weeklyPattern = this.detectPattern(data, 7 * 24 * 60 * 60 * 1000);
    if (weeklyPattern.confidence > 0.3) {
      patterns.push(weeklyPattern);
    }

    return patterns;
  }

  /**
   * 🎯 패턴 감지
   */
  private detectPattern(
    data: { timestamp: number; value: number }[],
    period: number
  ): SeasonalPattern {
    // 단순한 자기상관 기반 패턴 감지
    const periodInPoints = Math.floor(
      period / (data.length > 1 ? data[1].timestamp - data[0].timestamp : 60000)
    );

    if (periodInPoints >= data.length / 2) {
      return { period, amplitude: 0, phase: 0, confidence: 0 };
    }

    let correlation = 0;
    let count = 0;

    for (let i = 0; i < data.length - periodInPoints; i++) {
      const current = data[i].value;
      const shifted = data[i + periodInPoints].value;
      correlation += current * shifted;
      count++;
    }

    const avgCorrelation = correlation / count;
    const confidence = Math.min(1, Math.abs(avgCorrelation) / 1000);

    return {
      period,
      amplitude: Math.sqrt(avgCorrelation),
      phase: 0, // 단순화
      confidence,
    };
  }

  /**
   * 🔊 노이즈 분석
   */
  private analyzeNoise(
    data: { timestamp: number; value: number }[],
    trend: ModelParameters['trend'],
    seasonality: SeasonalPattern[]
  ): ModelParameters['noise'] {
    // 트렌드와 계절성을 제거한 잔차 계산
    const residuals = data.map((point, i) => {
      let predicted = trend.slope * i + trend.intercept;

      // 계절성 효과 추가
      seasonality.forEach((pattern) => {
        const phase =
          ((point.timestamp % pattern.period) / pattern.period) * 2 * Math.PI;
        predicted += pattern.amplitude * Math.sin(phase + pattern.phase);
      });

      return point.value - predicted;
    });

    const variance =
      residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;

    return {
      variance,
      distribution: 'normal', // 추후 개선
    };
  }

  /**
   * 🎯 이상값 분석
   */
  private analyzeOutliers(
    data: { timestamp: number; value: number }[]
  ): ModelParameters['outliers'] {
    const values = data.map((d) => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    const threshold = 2 * std;
    const outlierCount = values.filter(
      (v) => Math.abs(v - mean) > threshold
    ).length;

    return {
      threshold,
      count: outlierCount,
    };
  }

  /**
   * 🔮 예측 생성
   */
  private generatePredictions(
    data: { timestamp: number; value: number }[],
    model: ModelParameters,
    horizonMs: number
  ) {
    const predictions = [];
    const lastPoint = data[data.length - 1];
    const dataInterval =
      data.length > 1 ? data[1].timestamp - data[0].timestamp : 60000;

    for (
      let t = this.config.predictionInterval;
      t <= horizonMs;
      t += this.config.predictionInterval
    ) {
      const futureTime = lastPoint.timestamp + t;
      const timeIndex = data.length + t / dataInterval;

      // 기본 트렌드 예측
      let predicted = model.trend.slope * timeIndex + model.trend.intercept;

      // 계절성 효과 추가
      model.seasonality.forEach((pattern) => {
        const phase =
          ((futureTime % pattern.period) / pattern.period) * 2 * Math.PI;
        predicted += pattern.amplitude * Math.sin(phase + pattern.phase);
      });

      // 신뢰구간 계산
      const confidenceInterval = Math.sqrt(model.noise.variance) * 1.96; // 95% 구간

      predictions.push({
        timestamp: futureTime,
        value: Math.max(0, predicted), // 음수 방지
        confidence: model.trend.confidence,
        upperBound: predicted + confidenceInterval,
        lowerBound: Math.max(0, predicted - confidenceInterval),
      });
    }

    return predictions;
  }

  /**
   * 📈 트렌드 분석
   */
  private analyzeTrend(
    data: { timestamp: number; value: number }[],
    model: ModelParameters
  ): PredictionResult['trend'] {
    const slope = model.trend.slope;
    const confidence = model.trend.confidence;

    // 시간당 변화율 계산 (데이터 간격 고려)
    const dataInterval =
      data.length > 1 ? data[1].timestamp - data[0].timestamp : 60000;
    const changeRatePerHour = (slope * 3600000) / dataInterval;

    return {
      direction:
        Math.abs(slope) < 0.01
          ? 'stable'
          : slope > 0
            ? 'increasing'
            : 'decreasing',
      strength: confidence,
      changeRate: changeRatePerHour,
      seasonality: model.seasonality.length > 0,
    };
  }

  /**
   * 🚨 예측 알림 생성
   */
  private generatePredictionAlerts(
    predictions: PredictionResult['predictions'],
    metric: keyof MCPServerMetrics,
    trend: PredictionResult['trend']
  ): PredictionResult['alerts'] {
    const alerts: PredictionResult['alerts'] = [];
    const thresholds = this.config.thresholds;

    predictions.forEach((prediction, index) => {
      const timeToAlert = (prediction.timestamp - Date.now()) / (60 * 1000); // minutes

      // 임계값 위반 예측
      if (
        metric === 'responseTime' &&
        prediction.value > thresholds.responseTime
      ) {
        alerts.push({
          type: 'threshold_breach',
          timeToAlert,
          severity:
            prediction.value > thresholds.responseTime * 2
              ? 'critical'
              : 'high',
          description: `응답 시간이 ${Math.round(timeToAlert)}분 후 ${thresholds.responseTime}ms를 초과할 것으로 예측됩니다.`,
        });
      }

      if (metric === 'errorRate' && prediction.value > thresholds.errorRate) {
        alerts.push({
          type: 'threshold_breach',
          timeToAlert,
          severity:
            prediction.value > thresholds.errorRate * 2 ? 'critical' : 'high',
          description: `에러율이 ${Math.round(timeToAlert)}분 후 ${thresholds.errorRate}%를 초과할 것으로 예측됩니다.`,
        });
      }
    });

    // 용량 한계 경고
    if (trend.direction === 'increasing' && trend.strength > 0.7) {
      alerts.push({
        type: 'capacity_limit',
        timeToAlert: 60, // 1시간
        severity: 'medium',
        description: `${metric} 지표가 지속적으로 증가하고 있습니다. 용량 확장을 검토해주세요.`,
      });
    }

    return alerts.slice(0, 5); // 최대 5개 알림
  }

  /**
   * 📊 정확도 계산
   */
  private calculateAccuracy(
    data: { timestamp: number; value: number }[],
    model: ModelParameters
  ): PredictionResult['accuracy'] {
    if (data.length < 10) {
      return { mape: 0, rmse: 0, r2: 0 };
    }

    // 최근 데이터의 일부로 검증
    const testSize = Math.min(10, Math.floor(data.length * 0.2));
    const trainData = data.slice(0, -testSize);
    const testData = data.slice(-testSize);

    let sumAbsError = 0;
    let sumSquaredError = 0;
    let sumActual = 0;

    testData.forEach((actual, i) => {
      const timeIndex = trainData.length + i;
      const predicted = model.trend.slope * timeIndex + model.trend.intercept;

      const absError = Math.abs(actual.value - predicted);
      const squaredError = Math.pow(actual.value - predicted, 2);

      sumAbsError += absError / Math.max(1, actual.value); // MAPE
      sumSquaredError += squaredError;
      sumActual += actual.value;
    });

    const mape = (sumAbsError / testSize) * 100;
    const rmse = Math.sqrt(sumSquaredError / testSize);
    const r2 = model.trend.confidence;

    return { mape, rmse, r2 };
  }

  /**
   * 📊 예측 활용도 계산
   */
  private calculateProjectedUtilization(
    prediction: PredictionResult | null,
    hoursAhead: number
  ): number {
    if (!prediction || prediction.predictions.length === 0) return 0;

    // 지정된 시간의 예측값 찾기
    const targetTime = Date.now() + hoursAhead * 60 * 60 * 1000;
    const closestPrediction = prediction.predictions.reduce((prev, curr) =>
      Math.abs(curr.timestamp - targetTime) <
      Math.abs(prev.timestamp - targetTime)
        ? curr
        : prev
    );

    return (
      (closestPrediction.value / this.config.thresholds.responseTime) * 100
    );
  }

  /**
   * 💡 용량 권장사항 생성
   */
  private generateCapacityRecommendations(
    current: CapacityPlanningResult['currentUtilization'],
    projected: CapacityPlanningResult['projectedUtilization'],
    responseTimePrediction: PredictionResult | null,
    errorRatePrediction: PredictionResult | null
  ): CapacityPlanningResult['recommendations'] {
    const recommendations: CapacityPlanningResult['recommendations'] = [];

    // 즉시 스케일업 필요
    if (current.responseTime > 80 || projected.in1Hour > 90) {
      recommendations.push({
        action: 'scale_up',
        urgency: 'immediate',
        description:
          '현재 응답 시간이 임계값에 근접했습니다. 즉시 리소스 확장이 필요합니다.',
        expectedImpact: '응답 시간 30-50% 개선 예상',
      });
    }

    // 계획된 스케일업
    else if (projected.in24Hours > 80) {
      recommendations.push({
        action: 'scale_up',
        urgency: 'within_day',
        description: '24시간 내 용량 한계에 도달할 것으로 예측됩니다.',
        expectedImpact: '향후 성능 저하 방지',
      });
    }

    // 최적화 권장
    if (
      current.errorRate > 3 ||
      errorRatePrediction?.trend.direction === 'increasing'
    ) {
      recommendations.push({
        action: 'optimize',
        urgency: 'within_hour',
        description:
          '에러율이 증가하고 있습니다. 코드 최적화나 설정 조정을 검토해주세요.',
        expectedImpact: '안정성 향상 및 리소스 효율성 개선',
      });
    }

    // 모니터링 강화
    if (
      responseTimePrediction?.trend.strength &&
      responseTimePrediction.trend.strength > 0.5
    ) {
      recommendations.push({
        action: 'monitor',
        urgency: 'planned',
        description:
          '성능 트렌드가 명확합니다. 모니터링 주기를 단축하는 것을 권장합니다.',
        expectedImpact: '조기 이상 감지 및 예방적 대응',
      });
    }

    return recommendations;
  }

  /**
   * ⚠️ 용량 위험도 평가
   */
  private assessCapacityRisks(
    current: CapacityPlanningResult['currentUtilization'],
    projected: CapacityPlanningResult['projectedUtilization'],
    responseTimePrediction: PredictionResult | null
  ): CapacityPlanningResult['riskAssessment'] {
    let overloadRisk = 0;
    let failureRisk = 0;
    let timeToRisk = Infinity;

    // 과부하 위험 계산
    if (current.responseTime > 70) overloadRisk += 0.3;
    if (projected.in1Hour > 80) overloadRisk += 0.4;
    if (projected.in6Hours > 90) overloadRisk += 0.3;

    // 장애 위험 계산
    if (current.errorRate > 3) failureRisk += 0.4;
    if (current.responseTime > 90) failureRisk += 0.6;

    // 위험 시점 계산
    if (responseTimePrediction) {
      const criticalAlert = responseTimePrediction.alerts.find(
        (alert) => alert.severity === 'critical' || alert.severity === 'high'
      );
      if (criticalAlert) {
        timeToRisk = criticalAlert.timeToAlert;
      }
    }

    return {
      overloadRisk: Math.min(1, overloadRisk),
      failureRisk: Math.min(1, failureRisk),
      timeToRisk: Math.max(0, timeToRisk),
    };
  }

  /**
   * 📝 메트릭 저장
   */
  public storeMetrics(metrics: MCPServerMetrics): void {
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
   * 🔄 주기적 모델 재학습
   */
  private startPeriodicModelRetraining(): void {
    setInterval(() => {
      // 오래된 캐시 정리
      const now = Date.now();
      this.predictionCache.forEach((prediction, key) => {
        if (now - prediction.predictions[0]?.timestamp > this.config.cacheTTL) {
          this.predictionCache.delete(key);
        }
      });

      // 모델 재학습은 요청 시점에 수행 (lazy loading)
    }, this.config.modelRetrainingInterval);
  }

  /**
   * ⚙️ 설정 업데이트
   */
  public updateConfiguration(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * 📊 예측 통계 조회
   */
  public getPredictionStats(): {
    totalPredictions: number;
    averageAccuracy: number;
    modelsCached: number;
    serversMonitored: number;
  } {
    const accuracies = Array.from(this.predictionCache.values()).map(
      (p) => p.accuracy.r2
    );
    const averageAccuracy =
      accuracies.length > 0
        ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        : 0;

    return {
      totalPredictions: this.predictionCache.size,
      averageAccuracy,
      modelsCached: this.modelCache.size,
      serversMonitored: this.metricsHistory.size,
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const performancePredictor = PerformancePredictor.getInstance();
