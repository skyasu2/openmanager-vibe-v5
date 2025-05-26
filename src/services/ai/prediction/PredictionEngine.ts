import { hybridMetricsBridge, TimeSeriesPoint } from '@/services/metrics/HybridMetricsBridge';

/**
 * 예측 결과 인터페이스
 */
export interface PredictionResult {
  serverId: string;
  forecastTime: string; // 예측 시점
  forecast: {
    cpu: { nextValue: number; confidence: number };
    memory: { nextValue: number; confidence: number };
    responseTime: { nextValue: number; confidence: number };
    alerts: { nextValue: number; confidence: number };
  };
  trend: {
    direction: 'increasing' | 'stable' | 'decreasing';
    changeRate: number; // % per hour
    volatility: number; // 변동성 지수 (0-1)
  };
  warnings: string[];
  metadata: {
    dataPoints: number;
    predictionInterval: string;
    algorithm: string;
    confidence: number; // 전체 신뢰도
  };
}

/**
 * 전체 예측 리포트 인터페이스
 */
export interface PredictionReport {
  timestamp: string;
  summary: {
    totalServers: number;
    serversAtRisk: number;
    avgConfidence: number;
    overallTrend: 'increasing' | 'stable' | 'decreasing';
  };
  predictions: PredictionResult[];
  globalWarnings: string[];
  recommendations: string[];
  textReport: string; // AI 에이전트용 텍스트 리포트
}

/**
 * 추세 분석 결과
 */
export interface TrendAnalysis {
  metric: 'cpu' | 'memory' | 'responseTime' | 'alerts';
  direction: 'increasing' | 'stable' | 'decreasing';
  changeRate: number; // % per hour
  volatility: number;
  confidence: number;
}

/**
 * 🔮 PredictionEngine
 * 
 * HybridMetricsBridge의 시계열 데이터를 기반으로 미래 서버 상태를 예측하는 AI 엔진
 * 
 * 🎯 주요 기능:
 * - 이동 평균 + 변화율 기반 선형 예측
 * - 추세 분석 및 변동성 측정
 * - 임계값 기반 위험 감지
 * - AI 에이전트용 텍스트 리포트 생성
 */
export class PredictionEngine {
  private static instance: PredictionEngine;
  
  // 임계값 설정
  private readonly THRESHOLDS = {
    cpu: { warning: 80, critical: 90 },
    memory: { warning: 85, critical: 95 },
    responseTime: { warning: 2000, critical: 5000 },
    alerts: { warning: 5, critical: 10 }
  };

  // 예측 알고리즘 설정
  private readonly PREDICTION_CONFIG = {
    movingAverageWindow: 12, // 1시간 데이터 (5분 간격 * 12)
    trendAnalysisWindow: 24, // 2시간 데이터 (5분 간격 * 24)
    volatilityWindow: 18,    // 1.5시간 데이터
    minDataPoints: 6,        // 최소 필요 데이터 포인트 (30분)
    stabilityThreshold: 5,   // 안정 상태 판정 임계값 (%)
  };

  private constructor() {}

  public static getInstance(): PredictionEngine {
    if (!this.instance) {
      this.instance = new PredictionEngine();
    }
    return this.instance;
  }

  /**
   * 🔮 메트릭 예측 (메인 메서드)
   * 
   * @param timeSeries 시계열 데이터
   * @param interval 예측 간격
   * @returns 예측 결과
   */
  async forecastMetrics(
    timeSeries: TimeSeriesPoint[], 
    interval: '10min' | '30min' | '1h' = '30min'
  ): Promise<PredictionResult[]> {
    console.log(`🔮 PredictionEngine: Forecasting metrics for ${interval} interval...`);

    if (timeSeries.length < this.PREDICTION_CONFIG.minDataPoints) {
      throw new Error('Insufficient data points for prediction');
    }

    // 서버별 그룹핑
    const serverGroups = this.groupByServer(timeSeries);
    const predictions: PredictionResult[] = [];

    // 예측 시점 계산
    const forecastTime = this.calculateForecastTime(interval);

    for (const [serverId, serverTimeSeries] of serverGroups.entries()) {
      if (serverTimeSeries.length < this.PREDICTION_CONFIG.minDataPoints) {
        console.warn(`⚠️ Insufficient data for server ${serverId}`);
        continue;
      }

      const prediction = await this.predictServerMetrics(
        serverId, 
        serverTimeSeries, 
        interval, 
        forecastTime
      );
      
      predictions.push(prediction);
    }

    console.log(`✅ Generated predictions for ${predictions.length} servers`);
    return predictions;
  }

  /**
   * 📊 추세 분석
   */
  analyzeTrend(timeSeries: TimeSeriesPoint[]): Map<string, TrendAnalysis[]> {
    const serverGroups = this.groupByServer(timeSeries);
    const trendResults = new Map<string, TrendAnalysis[]>();

    serverGroups.forEach((serverData, serverId) => {
      const trends: TrendAnalysis[] = [];
      
      // 각 메트릭별 추세 분석
      const metrics = ['cpu', 'memory', 'responseTime', 'alerts'] as const;
      
      metrics.forEach(metric => {
        const trendAnalysis = this.analyzeSingleMetricTrend(serverData, metric);
        trends.push(trendAnalysis);
      });

      trendResults.set(serverId, trends);
    });

    return trendResults;
  }

  /**
   * ⚠️ 위험 감지
   */
  detectRisk(predictions: PredictionResult[]): string[] {
    const risks: string[] = [];

    predictions.forEach(prediction => {
      const { serverId, forecast, forecastTime } = prediction;
      
      // CPU 위험 체크
      if (forecast.cpu.nextValue >= this.THRESHOLDS.cpu.critical) {
        risks.push(`🚨 ${serverId}: ${this.formatTime(forecastTime)} CPU가 ${forecast.cpu.nextValue.toFixed(1)}%로 위험 수준에 도달할 예상`);
      } else if (forecast.cpu.nextValue >= this.THRESHOLDS.cpu.warning) {
        risks.push(`⚠️ ${serverId}: ${this.formatTime(forecastTime)} CPU가 ${forecast.cpu.nextValue.toFixed(1)}%로 경고 수준 예상`);
      }

      // Memory 위험 체크
      if (forecast.memory.nextValue >= this.THRESHOLDS.memory.critical) {
        risks.push(`🚨 ${serverId}: ${this.formatTime(forecastTime)} 메모리가 ${forecast.memory.nextValue.toFixed(1)}%로 위험 수준에 도달할 예상`);
      } else if (forecast.memory.nextValue >= this.THRESHOLDS.memory.warning) {
        risks.push(`⚠️ ${serverId}: ${this.formatTime(forecastTime)} 메모리가 ${forecast.memory.nextValue.toFixed(1)}%로 경고 수준 예상`);
      }

      // ResponseTime 위험 체크
      if (forecast.responseTime.nextValue >= this.THRESHOLDS.responseTime.critical) {
        risks.push(`🚨 ${serverId}: ${this.formatTime(forecastTime)} 응답시간이 ${forecast.responseTime.nextValue.toFixed(0)}ms로 심각한 지연 예상`);
      } else if (forecast.responseTime.nextValue >= this.THRESHOLDS.responseTime.warning) {
        risks.push(`⚠️ ${serverId}: ${this.formatTime(forecastTime)} 응답시간이 ${forecast.responseTime.nextValue.toFixed(0)}ms로 지연 예상`);
      }

      // Alerts 증가 체크
      if (forecast.alerts.nextValue >= this.THRESHOLDS.alerts.critical) {
        risks.push(`🚨 ${serverId}: ${this.formatTime(forecastTime)} 알림이 ${forecast.alerts.nextValue.toFixed(0)}개로 급증할 예상`);
      }
    });

    return risks;
  }

  /**
   * 📋 전체 예측 리포트 생성
   */
  async generatePredictionReport(
    interval: '10min' | '30min' | '1h' = '30min',
    serverIds: string[] = []
  ): Promise<PredictionReport> {
    console.log('📋 Generating comprehensive prediction report...');

    try {
      // HybridMetricsBridge에서 병합 데이터 획득
      const mergedData = await hybridMetricsBridge.getMergedTimeSeries({
        duration: '24h' // 예측을 위해 24시간 데이터 사용
      });

      // 시계열 데이터 추출
      let timeSeries: TimeSeriesPoint[] = [];
      mergedData.serverGroups.forEach((serverData) => {
        timeSeries.push(...serverData);
      });

      // 서버 필터링 (지정된 경우)
      if (serverIds.length > 0) {
        timeSeries = timeSeries.filter(point => serverIds.includes(point.serverId));
      }

      // 예측 수행
      const predictions = await this.forecastMetrics(timeSeries, interval);
      
      // 위험 감지
      const globalWarnings = this.detectRisk(predictions);
      
      // 요약 통계 생성
      const summary = this.generateSummaryStats(predictions);
      
      // 권장사항 생성
      const recommendations = this.generateRecommendations(predictions, globalWarnings);
      
      // AI 에이전트용 텍스트 리포트 생성
      const textReport = this.generateTextReport(predictions, globalWarnings, recommendations, interval);

      const report: PredictionReport = {
        timestamp: new Date().toISOString(),
        summary,
        predictions,
        globalWarnings,
        recommendations,
        textReport
      };

      console.log(`✅ Prediction report generated: ${predictions.length} servers, ${globalWarnings.length} warnings`);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate prediction report:', error);
      throw new Error('Failed to generate prediction report');
    }
  }

  /**
   * 🔧 Private Methods
   */

  private groupByServer(timeSeries: TimeSeriesPoint[]): Map<string, TimeSeriesPoint[]> {
    const groups = new Map<string, TimeSeriesPoint[]>();
    
    timeSeries.forEach(point => {
      if (!groups.has(point.serverId)) {
        groups.set(point.serverId, []);
      }
      groups.get(point.serverId)!.push(point);
    });

    // 시간 순으로 정렬
    groups.forEach((points, serverId) => {
      points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    return groups;
  }

  private calculateForecastTime(interval: string): string {
    const now = new Date();
    const minutes = interval === '10min' ? 10 : interval === '30min' ? 30 : 60;
    const forecastTime = new Date(now.getTime() + minutes * 60 * 1000);
    return forecastTime.toISOString();
  }

  private async predictServerMetrics(
    serverId: string,
    timeSeries: TimeSeriesPoint[],
    interval: string,
    forecastTime: string
  ): Promise<PredictionResult> {
    
    // 각 메트릭별 예측
    const cpuForecast = this.predictMetricValue(timeSeries, 'cpu');
    const memoryForecast = this.predictMetricValue(timeSeries, 'memory');
    const responseTimeForecast = this.predictMetricValue(timeSeries, 'responseTime');
    const alertsForecast = this.predictMetricValue(timeSeries, 'alerts');

    // 추세 분석
    const trend = this.calculateOverallTrend(timeSeries);

    // 경고 생성
    const warnings = this.generateWarningsForServer(serverId, {
      cpu: cpuForecast,
      memory: memoryForecast,
      responseTime: responseTimeForecast,
      alerts: alertsForecast
    }, forecastTime);

    // 전체 신뢰도 계산
    const overallConfidence = (
      cpuForecast.confidence + 
      memoryForecast.confidence + 
      responseTimeForecast.confidence + 
      alertsForecast.confidence
    ) / 4;

    return {
      serverId,
      forecastTime,
      forecast: {
        cpu: cpuForecast,
        memory: memoryForecast,
        responseTime: responseTimeForecast,
        alerts: alertsForecast
      },
      trend,
      warnings,
      metadata: {
        dataPoints: timeSeries.length,
        predictionInterval: interval,
        algorithm: 'moving_average_linear_regression',
        confidence: overallConfidence
      }
    };
  }

  private predictMetricValue(
    timeSeries: TimeSeriesPoint[], 
    metric: keyof TimeSeriesPoint['metrics']
  ): { nextValue: number; confidence: number } {
    
    // 최근 데이터 추출
    const recentData = timeSeries
      .slice(-this.PREDICTION_CONFIG.movingAverageWindow)
      .map(point => {
        const value = point.metrics[metric];
        return typeof value === 'number' ? value : 0;
      });

    if (recentData.length < 3) {
      return { nextValue: recentData[recentData.length - 1] || 0, confidence: 0.3 };
    }

    // 이동 평균 계산
    const movingAverage = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;

    // 변화율 계산 (최근 3개 데이터 포인트 기준)
    const recent3 = recentData.slice(-3);
    const changeRate = recent3.length >= 2 ? 
      (recent3[recent3.length - 1] - recent3[0]) / (recent3.length - 1) : 0;

    // 선형 예측
    const predictedValue = movingAverage + changeRate;

    // 변동성 기반 신뢰도 계산
    const variance = recentData.reduce((sum, val) => sum + Math.pow(val - movingAverage, 2), 0) / recentData.length;
    const volatility = Math.sqrt(variance);
    const confidence = Math.max(0.4, Math.min(0.95, 1 - (volatility / movingAverage)));

    // 메트릭별 범위 제한
    let clampedValue = predictedValue;
    if (metric === 'cpu' || metric === 'memory' || metric === 'disk') {
      clampedValue = Math.max(0, Math.min(100, predictedValue));
    } else if (metric === 'responseTime') {
      clampedValue = Math.max(0, predictedValue);
    } else if (metric === 'alerts') {
      clampedValue = Math.max(0, Math.round(predictedValue));
    }

    return {
      nextValue: clampedValue,
      confidence: confidence
    };
  }

  private analyzeSingleMetricTrend(
    timeSeries: TimeSeriesPoint[], 
    metric: 'cpu' | 'memory' | 'responseTime' | 'alerts'
  ): TrendAnalysis {
    
    const recentData = timeSeries
      .slice(-this.PREDICTION_CONFIG.trendAnalysisWindow)
      .map(point => {
        const value = point.metrics[metric];
        return typeof value === 'number' ? value : 0;
      });

    if (recentData.length < 4) {
      return {
        metric,
        direction: 'stable',
        changeRate: 0,
        volatility: 0,
        confidence: 0.3
      };
    }

    // 선형 회귀로 추세 계산
    const n = recentData.length;
    const sumX = n * (n + 1) / 2;
    const sumY = recentData.reduce((sum, val) => sum + val, 0);
    const sumXY = recentData.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
    const sumX2 = n * (n + 1) * (2 * n + 1) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // 시간당 변화율 계산 (5분 간격 기준)
    const changeRatePerHour = slope * 12; // 5분 * 12 = 1시간

    // 방향 결정
    let direction: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const average = sumY / n;
    const changePercentage = Math.abs(changeRatePerHour / average) * 100;

    if (changePercentage > this.PREDICTION_CONFIG.stabilityThreshold) {
      direction = changeRatePerHour > 0 ? 'increasing' : 'decreasing';
    }

    // 변동성 계산
    const variance = recentData.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / n;
    const volatility = average > 0 ? Math.sqrt(variance) / average : 0;

    // 신뢰도 계산
    const confidence = Math.max(0.4, Math.min(0.95, 1 - volatility));

    return {
      metric,
      direction,
      changeRate: changeRatePerHour,
      volatility: Math.min(1, volatility),
      confidence
    };
  }

  private calculateOverallTrend(timeSeries: TimeSeriesPoint[]): {
    direction: 'increasing' | 'stable' | 'decreasing';
    changeRate: number;
    volatility: number;
  } {
    
    // 주요 메트릭들의 추세 분석
    const cpuTrend = this.analyzeSingleMetricTrend(timeSeries, 'cpu');
    const memoryTrend = this.analyzeSingleMetricTrend(timeSeries, 'memory');
    const responseTimeTrend = this.analyzeSingleMetricTrend(timeSeries, 'responseTime');

    // 가중 평균으로 전체 추세 계산
    const avgChangeRate = (
      cpuTrend.changeRate * 0.4 + 
      memoryTrend.changeRate * 0.4 + 
      responseTimeTrend.changeRate * 0.2
    );

    const avgVolatility = (
      cpuTrend.volatility * 0.4 + 
      memoryTrend.volatility * 0.4 + 
      responseTimeTrend.volatility * 0.2
    );

    // 전체 방향 결정
    let direction: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (Math.abs(avgChangeRate) > 2) { // 시간당 2% 이상 변화
      direction = avgChangeRate > 0 ? 'increasing' : 'decreasing';
    }

    return {
      direction,
      changeRate: avgChangeRate,
      volatility: avgVolatility
    };
  }

  private generateWarningsForServer(
    serverId: string,
    forecast: any,
    forecastTime: string
  ): string[] {
    const warnings: string[] = [];
    const timeStr = this.formatTime(forecastTime);

    // CPU 경고
    if (forecast.cpu.nextValue >= this.THRESHOLDS.cpu.critical) {
      warnings.push(`${timeStr} CPU가 ${forecast.cpu.nextValue.toFixed(1)}%로 위험 수준에 도달할 예상`);
    } else if (forecast.cpu.nextValue >= this.THRESHOLDS.cpu.warning) {
      warnings.push(`${timeStr} CPU가 ${forecast.cpu.nextValue.toFixed(1)}%로 경고 수준 예상`);
    }

    // Memory 경고
    if (forecast.memory.nextValue >= this.THRESHOLDS.memory.critical) {
      warnings.push(`${timeStr} 메모리가 ${forecast.memory.nextValue.toFixed(1)}%로 위험 수준에 도달할 예상`);
    } else if (forecast.memory.nextValue >= this.THRESHOLDS.memory.warning) {
      warnings.push(`${timeStr} 메모리가 ${forecast.memory.nextValue.toFixed(1)}%로 경고 수준 예상`);
    }

    return warnings;
  }

  private generateSummaryStats(predictions: PredictionResult[]): PredictionReport['summary'] {
    const totalServers = predictions.length;
    const serversAtRisk = predictions.filter(p => p.warnings.length > 0).length;
    const avgConfidence = predictions.reduce((sum, p) => sum + p.metadata.confidence, 0) / totalServers;
    
    // 전체 추세 계산
    const increasingCount = predictions.filter(p => p.trend.direction === 'increasing').length;
    const decreasingCount = predictions.filter(p => p.trend.direction === 'decreasing').length;
    
    let overallTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (increasingCount > decreasingCount && increasingCount > totalServers * 0.6) {
      overallTrend = 'increasing';
    } else if (decreasingCount > increasingCount && decreasingCount > totalServers * 0.6) {
      overallTrend = 'decreasing';
    }

    return {
      totalServers,
      serversAtRisk,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      overallTrend
    };
  }

  private generateRecommendations(
    predictions: PredictionResult[], 
    warnings: string[]
  ): string[] {
    const recommendations: string[] = [];

    // 위험 서버 기반 권장사항
    const highRiskServers = predictions.filter(p => 
      p.forecast.cpu.nextValue >= 85 || p.forecast.memory.nextValue >= 85
    );

    if (highRiskServers.length > 0) {
      recommendations.push(`${highRiskServers.length}대 서버의 리소스 모니터링 강화 필요`);
      recommendations.push('부하 분산 또는 스케일 아웃 검토 권장');
    }

    // 전체 추세 기반 권장사항
    const increasingTrendCount = predictions.filter(p => p.trend.direction === 'increasing').length;
    if (increasingTrendCount > predictions.length * 0.7) {
      recommendations.push('시스템 전체 부하 증가 추세 - 용량 계획 검토 필요');
    }

    // 신뢰도 기반 권장사항
    const lowConfidenceCount = predictions.filter(p => p.metadata.confidence < 0.6).length;
    if (lowConfidenceCount > predictions.length * 0.3) {
      recommendations.push('데이터 품질 개선을 위한 모니터링 주기 단축 고려');
    }

    return recommendations;
  }

  private generateTextReport(
    predictions: PredictionResult[], 
    warnings: string[], 
    recommendations: string[],
    interval: string
  ): string {
    const timeStr = interval === '10min' ? '10분' : interval === '30min' ? '30분' : '1시간';
    
    let report = `🔮 **${timeStr} 후 서버 상태 예측 리포트**\n\n`;
    
    // 요약
    report += `📊 **요약**\n`;
    report += `- 분석 서버: ${predictions.length}대\n`;
    report += `- 위험 예상 서버: ${predictions.filter(p => p.warnings.length > 0).length}대\n`;
    report += `- 평균 예측 신뢰도: ${(predictions.reduce((sum, p) => sum + p.metadata.confidence, 0) / predictions.length * 100).toFixed(1)}%\n\n`;

    // 주요 경고
    if (warnings.length > 0) {
      report += `⚠️ **주요 경고사항**\n`;
      warnings.slice(0, 5).forEach(warning => {
        report += `- ${warning}\n`;
      });
      if (warnings.length > 5) {
        report += `- 기타 ${warnings.length - 5}건의 추가 경고\n`;
      }
      report += '\n';
    }

    // 권장사항
    if (recommendations.length > 0) {
      report += `💡 **권장사항**\n`;
      recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
      report += '\n';
    }

    // 상위 위험 서버 상세
    const topRiskServers = predictions
      .filter(p => p.warnings.length > 0)
      .sort((a, b) => b.warnings.length - a.warnings.length)
      .slice(0, 3);

    if (topRiskServers.length > 0) {
      report += `🚨 **상위 위험 서버**\n`;
      topRiskServers.forEach(server => {
        report += `**${server.serverId}**\n`;
        report += `  - CPU: ${server.forecast.cpu.nextValue.toFixed(1)}% (신뢰도: ${(server.forecast.cpu.confidence * 100).toFixed(0)}%)\n`;
        report += `  - 메모리: ${server.forecast.memory.nextValue.toFixed(1)}% (신뢰도: ${(server.forecast.memory.confidence * 100).toFixed(0)}%)\n`;
        report += `  - 추세: ${this.getTrendText(server.trend.direction)}\n`;
        server.warnings.forEach(warning => {
          report += `  - ⚠️ ${warning}\n`;
        });
        report += '\n';
      });
    }

    report += `---\n`;
    report += `리포트 생성 시간: ${new Date().toLocaleString()}\n`;
    report += `예측 엔진: PredictionEngine v1.0\n`;

    return report;
  }

  private getTrendText(direction: string): string {
    switch (direction) {
      case 'increasing': return '증가 추세 📈';
      case 'decreasing': return '감소 추세 📉';
      default: return '안정 상태 ➡️';
    }
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

// 싱글톤 인스턴스 export
export const predictionEngine = PredictionEngine.getInstance(); 