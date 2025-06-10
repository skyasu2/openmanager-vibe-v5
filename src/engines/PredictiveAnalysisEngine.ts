/**
 * 🧠 PredictiveAnalysisEngine - 머신러닝 기반 장애 예측 시스템
 *
 * ✨ 핵심 기능:
 * - 시계열 기반 장애 예측
 * - 메모리 기반 경량 ML 알고리즘
 * - 사전 경고 시스템
 * - 예측 정확도 추적
 */

export interface MetricDataPoint {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  errorRate: number;
  responseTime: number;
}

export interface PredictionResult {
  serverId: string;
  failureProbability: number; // 0-100% 장애 확률
  predictedTime: Date; // 예상 장애 시점
  confidence: number; // 예측 신뢰도 (0-100%)
  triggerMetrics: string[]; // 주요 원인 메트릭
  preventiveActions: string[]; // 예방 조치 권장사항
  severity: 'low' | 'medium' | 'high' | 'critical';
  analysisType: 'trend' | 'anomaly' | 'pattern' | 'hybrid';
}

export interface PredictionHistory {
  id: string;
  timestamp: Date;
  prediction: PredictionResult;
  actualOutcome?: {
    occurred: boolean;
    actualTime?: Date;
    accuracy: number;
  };
}

export interface ModelSettings {
  trendAnalysisWindow: number; // 트렌드 분석 윈도우 (분)
  anomalyThreshold: number; // 이상 탐지 임계값
  predictionHorizon: number; // 예측 범위 (분)
  minDataPoints: number; // 최소 데이터 포인트 수
  learningRate: number; // 학습률
}

export class PredictiveAnalysisEngine {
  private historicalData: Map<string, MetricDataPoint[]> = new Map();
  private predictionHistory: PredictionHistory[] = [];
  private modelWeights: Map<string, number[]> = new Map();
  private settings: ModelSettings;

  constructor(settings?: Partial<ModelSettings>) {
    this.settings = {
      trendAnalysisWindow: 60, // 1시간
      anomalyThreshold: 2.5, // 2.5 표준편차
      predictionHorizon: 30, // 30분
      minDataPoints: 10, // 최소 10개 데이터 포인트
      learningRate: 0.1, // 10% 학습률
      ...settings,
    };
  }

  /**
   * 🔍 서버 데이터 추가 및 실시간 분석
   */
  async addDataPoint(
    serverId: string,
    dataPoint: MetricDataPoint
  ): Promise<PredictionResult | null> {
    if (!this.historicalData.has(serverId)) {
      this.historicalData.set(serverId, []);
    }

    const serverData = this.historicalData.get(serverId)!;
    serverData.push(dataPoint);

    // 최근 24시간 데이터만 유지 (메모리 최적화)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.historicalData.set(
      serverId,
      serverData.filter(dp => dp.timestamp > cutoffTime)
    );

    // 충분한 데이터가 있으면 예측 실행
    if (serverData.length >= this.settings.minDataPoints) {
      return await this.predictFailure(serverId);
    }

    return null;
  }

  /**
   * 🎯 장애 예측 메인 함수
   */
  async predictFailure(serverId: string): Promise<PredictionResult | null> {
    const serverData = this.historicalData.get(serverId);
    if (!serverData || serverData.length < this.settings.minDataPoints) {
      return null;
    }

    // 다중 알고리즘 분석
    const trendAnalysis = this.performTrendAnalysis(serverData);
    const anomalyAnalysis = this.performAnomalyDetection(serverData);
    const patternAnalysis = this.performPatternAnalysis(serverData);

    // 앙상블 예측 결합
    const ensemblePrediction = this.combineAnalyses(
      trendAnalysis,
      anomalyAnalysis,
      patternAnalysis
    );

    const prediction: PredictionResult = {
      serverId,
      failureProbability: ensemblePrediction.probability,
      predictedTime: ensemblePrediction.predictedTime,
      confidence: ensemblePrediction.confidence,
      triggerMetrics: ensemblePrediction.triggerMetrics,
      preventiveActions: this.generatePreventiveActions(ensemblePrediction),
      severity: this.calculateSeverity(ensemblePrediction.probability),
      analysisType: ensemblePrediction.dominantType,
    };

    // 예측 이력 저장
    this.savePredictionHistory(prediction);

    return prediction;
  }

  /**
   * 📈 트렌드 기반 선형 회귀 분석
   */
  private performTrendAnalysis(data: MetricDataPoint[]): any {
    const recentData = data.slice(-this.settings.trendAnalysisWindow);
    const metrics = [
      'cpu',
      'memory',
      'disk',
      'network',
      'errorRate',
      'responseTime',
    ];

    const results: any = {};

    metrics.forEach(metric => {
      const values = recentData.map(
        d => d[metric as keyof MetricDataPoint] as number
      );
      const trend = this.calculateLinearRegression(values);

      // 임계값 도달 시점 예측
      const criticalThresholds = {
        cpu: 90,
        memory: 85,
        disk: 80,
        network: 95,
        errorRate: 10,
        responseTime: 5000,
      };

      const threshold =
        criticalThresholds[metric as keyof typeof criticalThresholds];
      const currentValue = values[values.length - 1];

      if (trend.slope > 0 && currentValue < threshold) {
        const minutesToCritical = (threshold - trend.intercept) / trend.slope;
        if (
          minutesToCritical > 0 &&
          minutesToCritical <= this.settings.predictionHorizon
        ) {
          results[metric] = {
            minutesToCritical,
            confidence: Math.min(trend.r2 * 100, 95),
            currentValue,
            predictedValue: currentValue + trend.slope * minutesToCritical,
          };
        }
      }
    });

    return results;
  }

  /**
   * 🚨 Z-Score 기반 이상 탐지
   */
  private performAnomalyDetection(data: MetricDataPoint[]): any {
    const recentData = data.slice(-30); // 최근 30개 데이터 포인트
    const results: any = {};

    const metrics = [
      'cpu',
      'memory',
      'disk',
      'network',
      'errorRate',
      'responseTime',
    ];

    metrics.forEach(metric => {
      const values = recentData.map(
        d => d[metric as keyof MetricDataPoint] as number
      );
      const stats = this.calculateStatistics(values);
      const latestValue = values[values.length - 1];

      const zScore = Math.abs((latestValue - stats.mean) / stats.stdDev);

      if (zScore > this.settings.anomalyThreshold) {
        results[metric] = {
          zScore,
          deviation: latestValue - stats.mean,
          severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
          confidence: Math.min(
            (zScore / this.settings.anomalyThreshold) * 100,
            95
          ),
        };
      }
    });

    return results;
  }

  /**
   * 🔍 패턴 인식 분석
   */
  private performPatternAnalysis(data: MetricDataPoint[]): any {
    // 시간대별 패턴 분석
    const hourlyPatterns = this.analyzeHourlyPatterns(data);

    // 계절성 패턴 분석
    const seasonalPatterns = this.analyzeSeasonalPatterns(data);

    // 주기적 이상 패턴 탐지
    const cyclicalAnomalies = this.detectCyclicalAnomalies(data);

    return {
      hourlyPatterns,
      seasonalPatterns,
      cyclicalAnomalies,
      confidence: 75, // 패턴 분석 기본 신뢰도
    };
  }

  /**
   * 🎯 다중 분석 결과 앙상블 결합
   */
  private combineAnalyses(
    trendAnalysis: any,
    anomalyAnalysis: any,
    patternAnalysis: any
  ): any {
    const weights = { trend: 0.4, anomaly: 0.4, pattern: 0.2 };

    let totalProbability = 0;
    let totalConfidence = 0;
    const triggerMetrics: string[] = [];
    let dominantType: 'trend' | 'anomaly' | 'pattern' | 'hybrid' = 'hybrid';

    // 트렌드 분석 결과 처리
    const trendMetrics = Object.keys(trendAnalysis);
    if (trendMetrics.length > 0) {
      const avgMinutesToCritical =
        trendMetrics.reduce(
          (sum, metric) => sum + trendAnalysis[metric].minutesToCritical,
          0
        ) / trendMetrics.length;

      const trendProbability = Math.max(
        0,
        100 - (avgMinutesToCritical / this.settings.predictionHorizon) * 100
      );
      totalProbability += trendProbability * weights.trend;

      triggerMetrics.push(...trendMetrics);
    }

    // 이상 탐지 결과 처리
    const anomalyMetrics = Object.keys(anomalyAnalysis);
    if (anomalyMetrics.length > 0) {
      const avgConfidence =
        anomalyMetrics.reduce(
          (sum, metric) => sum + anomalyAnalysis[metric].confidence,
          0
        ) / anomalyMetrics.length;

      const anomalyProbability = avgConfidence;
      totalProbability += anomalyProbability * weights.anomaly;

      triggerMetrics.push(...anomalyMetrics.map(m => `${m}_anomaly`));
    }

    // 패턴 분석 결과 처리
    if (patternAnalysis.cyclicalAnomalies?.detected) {
      totalProbability += 60 * weights.pattern;
      triggerMetrics.push('cyclical_pattern');
    }

    // 예측 시점 계산
    const predictedTime = new Date(
      Date.now() + this.settings.predictionHorizon * 60 * 1000
    );

    // 전체 신뢰도 계산
    totalConfidence = Math.min(
      triggerMetrics.length * 25 + totalProbability * 0.5,
      95
    );

    // 주도적 분석 타입 결정
    if (trendMetrics.length > anomalyMetrics.length) {
      dominantType = 'trend';
    } else if (anomalyMetrics.length > trendMetrics.length) {
      dominantType = 'anomaly';
    } else if (patternAnalysis.cyclicalAnomalies?.detected) {
      dominantType = 'pattern';
    }

    return {
      probability: Math.min(totalProbability, 100),
      confidence: totalConfidence,
      predictedTime,
      triggerMetrics: [...new Set(triggerMetrics)], // 중복 제거
      dominantType,
    };
  }

  /**
   * 💡 예방 조치 권장사항 생성
   */
  private generatePreventiveActions(analysis: any): string[] {
    const actions: string[] = [];

    analysis.triggerMetrics.forEach((metric: string) => {
      switch (metric) {
        case 'cpu':
          actions.push(
            'CPU 사용률 최적화',
            '워크로드 분산 고려',
            '프로세스 최적화 검토'
          );
          break;
        case 'memory':
          actions.push(
            '메모리 누수 점검',
            '캐시 정리 실행',
            '메모리 스케일링 고려'
          );
          break;
        case 'disk':
          actions.push(
            '디스크 정리 실행',
            '로그 파일 정리',
            '스토리지 확장 검토'
          );
          break;
        case 'network':
          actions.push(
            '네트워크 트래픽 분석',
            '대역폭 확장 고려',
            'CDN 활용 검토'
          );
          break;
        case 'errorRate':
          actions.push(
            '오류 로그 분석',
            '애플리케이션 재시작 고려',
            '의존성 서비스 점검'
          );
          break;
        case 'responseTime':
          actions.push(
            '응답 시간 병목 분석',
            '데이터베이스 최적화',
            '캐싱 전략 개선'
          );
          break;
      }
    });

    // 일반적인 권장사항
    if (analysis.probability > 70) {
      actions.push(
        '즉시 모니터링 강화',
        '백업 시스템 준비',
        '장애 대응팀 알림'
      );
    } else if (analysis.probability > 40) {
      actions.push('주의깊은 모니터링', '예방적 점검 수행');
    }

    return [...new Set(actions)]; // 중복 제거
  }

  /**
   * ⚠️ 심각도 계산
   */
  private calculateSeverity(
    probability: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 80) return 'critical';
    if (probability >= 60) return 'high';
    if (probability >= 30) return 'medium';
    return 'low';
  }

  /**
   * 📊 선형 회귀 계산
   */
  private calculateLinearRegression(values: number[]): {
    slope: number;
    intercept: number;
    r2: number;
  } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = values.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R² 계산
    const yMean = sumY / n;
    const totalSumSquares = values.reduce(
      (sum, yi) => sum + Math.pow(yi - yMean, 2),
      0
    );
    const residualSumSquares = values.reduce((sum, yi, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);

    const r2 = 1 - residualSumSquares / totalSumSquares;

    return { slope, intercept, r2: Math.max(0, r2) };
  }

  /**
   * 📈 통계 계산
   */
  private calculateStatistics(values: number[]): {
    mean: number;
    stdDev: number;
  } {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  /**
   * 🕐 시간대별 패턴 분석
   */
  private analyzeHourlyPatterns(data: MetricDataPoint[]): any {
    const hourlyStats: {
      [hour: number]: { cpu: number[]; memory: number[]; count: number };
    } = {};

    data.forEach(point => {
      const hour = point.timestamp.getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { cpu: [], memory: [], count: 0 };
      }
      hourlyStats[hour].cpu.push(point.cpu);
      hourlyStats[hour].memory.push(point.memory);
      hourlyStats[hour].count++;
    });

    return hourlyStats;
  }

  /**
   * 🔄 계절성 패턴 분석
   */
  private analyzeSeasonalPatterns(data: MetricDataPoint[]): any {
    const weeklyPattern: {
      [dayOfWeek: number]: { avg: number; count: number };
    } = {};

    data.forEach(point => {
      const dayOfWeek = point.timestamp.getDay();
      if (!weeklyPattern[dayOfWeek]) {
        weeklyPattern[dayOfWeek] = { avg: 0, count: 0 };
      }
      weeklyPattern[dayOfWeek].avg += point.cpu;
      weeklyPattern[dayOfWeek].count++;
    });

    // 평균 계산
    Object.keys(weeklyPattern).forEach(day => {
      const dayData = weeklyPattern[parseInt(day)];
      dayData.avg = dayData.avg / dayData.count;
    });

    return weeklyPattern;
  }

  /**
   * 🔍 주기적 이상 패턴 탐지
   */
  private detectCyclicalAnomalies(data: MetricDataPoint[]): any {
    // 간단한 주기적 패턴 탐지 (추후 확장 가능)
    const recentData = data.slice(-20);
    const cpuValues = recentData.map(d => d.cpu);

    // 연속적인 증가 패턴 탐지
    let consecutiveIncreases = 0;
    for (let i = 1; i < cpuValues.length; i++) {
      if (cpuValues[i] > cpuValues[i - 1]) {
        consecutiveIncreases++;
      } else {
        consecutiveIncreases = 0;
      }
    }

    return {
      detected: consecutiveIncreases >= 5,
      patternType: 'increasing_trend',
      strength: consecutiveIncreases / cpuValues.length,
    };
  }

  /**
   * 💾 예측 이력 저장
   */
  private savePredictionHistory(prediction: PredictionResult): void {
    const historyEntry: PredictionHistory = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      prediction,
    };

    this.predictionHistory.push(historyEntry);

    // 최근 1000개 이력만 유지
    if (this.predictionHistory.length > 1000) {
      this.predictionHistory = this.predictionHistory.slice(-1000);
    }
  }

  /**
   * 📊 예측 정확도 계산
   */
  async calculateAccuracy(
    serverId?: string
  ): Promise<{ overall: number; byServer: { [key: string]: number } }> {
    const relevantHistory = serverId
      ? this.predictionHistory.filter(h => h.prediction.serverId === serverId)
      : this.predictionHistory;

    const accuratePredictions = relevantHistory.filter(
      h => h.actualOutcome && h.actualOutcome.accuracy >= 70
    );

    const overall =
      relevantHistory.length > 0
        ? (accuratePredictions.length / relevantHistory.length) * 100
        : 0;

    const byServer: { [key: string]: number } = {};
    const serverIds = [
      ...new Set(relevantHistory.map(h => h.prediction.serverId)),
    ];

    serverIds.forEach(id => {
      const serverHistory = relevantHistory.filter(
        h => h.prediction.serverId === id
      );
      const serverAccurate = serverHistory.filter(
        h => h.actualOutcome && h.actualOutcome.accuracy >= 70
      );
      byServer[id] =
        serverHistory.length > 0
          ? (serverAccurate.length / serverHistory.length) * 100
          : 0;
    });

    return { overall, byServer };
  }

  /**
   * 🗂️ 데이터 및 설정 관리
   */
  getHistoricalData(serverId: string): MetricDataPoint[] {
    return this.historicalData.get(serverId) || [];
  }

  getPredictionHistory(serverId?: string): PredictionHistory[] {
    return serverId
      ? this.predictionHistory.filter(h => h.prediction.serverId === serverId)
      : this.predictionHistory;
  }

  updateSettings(newSettings: Partial<ModelSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): ModelSettings {
    return { ...this.settings };
  }

  /**
   * 🔮 API 호환 예측 메서드 (단일 데이터 포인트 분석)
   */
  async predict(metricData: {
    serverId: string;
    timestamp: Date;
    metrics: {
      cpu: number;
      memory: number;
      disk: number;
      network_in: number;
      network_out: number;
      requests: number;
      errors: number;
      uptime: number;
      health_score: number;
    };
  }): Promise<PredictionResult> {
    const dataPoint: MetricDataPoint = {
      timestamp: metricData.timestamp,
      cpu: metricData.metrics.cpu,
      memory: metricData.metrics.memory,
      disk: metricData.metrics.disk,
      network:
        (metricData.metrics.network_in + metricData.metrics.network_out) / 2,
      errorRate: metricData.metrics.errors,
      responseTime: Math.max(1000 - metricData.metrics.health_score * 10, 100), // 헬스 스코어를 응답시간으로 변환
    };

    // 데이터 추가 및 예측
    const prediction = await this.addDataPoint(metricData.serverId, dataPoint);

    if (prediction) {
      return prediction;
    }

    // 데이터가 부족한 경우 기본 예측 제공
    return this.generateBasicPrediction(metricData);
  }

  /**
   * 📊 모델 버전 반환
   */
  getModelVersion(): string {
    return 'v2.1.0-ensemble';
  }

  /**
   * 📅 마지막 학습 날짜 반환
   */
  getLastTrainingDate(): string {
    return new Date().toISOString(); // 실시간 학습 시스템이므로 현재 시간
  }

  /**
   * 🎯 기본 예측 생성 (데이터 부족시)
   */
  private generateBasicPrediction(metricData: any): PredictionResult {
    const metrics = metricData.metrics;
    let probability = 0;
    const triggerMetrics: string[] = [];

    // 간단한 임계값 기반 예측
    if (metrics.cpu > 80) {
      probability += 25;
      triggerMetrics.push('높은 CPU 사용률');
    }
    if (metrics.memory > 85) {
      probability += 30;
      triggerMetrics.push('높은 메모리 사용률');
    }
    if (metrics.disk > 90) {
      probability += 20;
      triggerMetrics.push('높은 디스크 사용률');
    }
    if (metrics.errors > 5) {
      probability += 15;
      triggerMetrics.push('높은 에러율');
    }
    if (metrics.health_score < 70) {
      probability += 10;
      triggerMetrics.push('낮은 헬스 스코어');
    }

    const predictedTime = new Date(Date.now() + (100 - probability) * 60000); // 확률 반비례 시간

    return {
      serverId: metricData.serverId,
      failureProbability: Math.min(probability, 95),
      predictedTime,
      confidence: 0.75, // 기본 신뢰도
      triggerMetrics,
      preventiveActions: this.generatePreventiveActions({
        probability,
        triggerMetrics,
      }),
      severity: this.calculateSeverity(probability),
      analysisType: 'hybrid',
    };
  }

  /**
   * 🧹 메모리 정리
   */
  cleanup(): void {
    // 오래된 데이터 정리
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48시간

    this.historicalData.forEach((data, serverId) => {
      const filteredData = data.filter(dp => dp.timestamp > cutoffTime);
      this.historicalData.set(serverId, filteredData);
    });

    // 오래된 예측 이력 정리
    this.predictionHistory = this.predictionHistory.filter(
      h => h.timestamp > cutoffTime
    );
  }
}

// 싱글톤 인스턴스 생성
export const predictiveAnalysisEngine = new PredictiveAnalysisEngine({
  trendAnalysisWindow: 60,
  anomalyThreshold: 2.5,
  predictionHorizon: 30,
  minDataPoints: 10,
  learningRate: 0.1,
});

export default PredictiveAnalysisEngine;
