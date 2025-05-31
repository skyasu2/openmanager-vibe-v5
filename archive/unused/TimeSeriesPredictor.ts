/**
 * 🔮 Time Series Predictor v3.0
 * 
 * AI 기반 시계열 예측 및 패턴 분석 엔진
 * - 선형 회귀 기반 트렌드 예측
 * - 계절성 패턴 자동 감지
 * - 이동평균 및 지수평활법
 * - 신뢰구간 및 불확실성 정량화
 * - 30분/1시간/1일 앞선 예측
 */

import { SimpleLinearRegression } from 'ml-regression';
import { Matrix } from 'ml-matrix';
import { format, addMinutes, addHours, addDays, differenceInMinutes } from 'date-fns';

// 🎯 타입 정의
export interface TimeSeriesPoint {
  timestamp: string | Date;
  value: number;
  metadata?: {
    serverId?: string;
    metric?: string;
    [key: string]: any;
  };
}

export interface PredictionRequest {
  metric: string;
  horizon: number; // 예측 시간 (분)
  confidence: number; // 신뢰도 (0.8-0.99)
  data?: TimeSeriesPoint[];
}

export interface PredictionResult {
  predicted_value: number;
  confidence_interval: [number, number];
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: {
    detected: boolean;
    period?: number;
    strength?: number;
  };
  accuracy_score: number;
  recommendations: string[];
  metadata: {
    model_type: string;
    data_points: number;
    prediction_horizon: number;
    computation_time: number;
  };
}

export interface PatternAnalysis {
  trends: {
    short_term: 'up' | 'down' | 'stable';
    long_term: 'up' | 'down' | 'stable';
    volatility: number;
  };
  seasonality: {
    daily_pattern: number[];
    weekly_pattern?: number[];
    peak_hours: number[];
    low_hours: number[];
  };
  anomalies: {
    timestamp: string;
    value: number;
    severity: 'low' | 'medium' | 'high';
    type: 'spike' | 'drop' | 'plateau';
  }[];
  correlations: {
    metric: string;
    correlation: number;
    significance: number;
  }[];
}

export class TimeSeriesPredictor {
  private cache: Map<string, any> = new Map();
  private models: Map<string, SimpleLinearRegression> = new Map();
  
  constructor() {
    console.log('🔮 TimeSeriesPredictor 초기화 완료');
  }
  
  /**
   * 🎯 메인 예측 함수
   */
  async predict(request: PredictionRequest): Promise<PredictionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔮 예측 시작: ${request.metric}, ${request.horizon}분 후`);
      
      // 1. 데이터 전처리
      const data = request.data || await this.generateSampleData(request.metric);
      const processedData = this.preprocessData(data);
      
      if (processedData.length < 10) {
        throw new Error('예측을 위해서는 최소 10개 이상의 데이터 포인트가 필요합니다');
      }
      
      // 2. 트렌드 분석
      const trendAnalysis = this.analyzeTrend(processedData);
      
      // 3. 계절성 감지
      const seasonalityAnalysis = this.detectSeasonality(processedData);
      
      // 4. 모델 선택 및 훈련
      const model = this.selectAndTrainModel(processedData, request.metric);
      
      // 5. 예측 실행
      const prediction = this.makePrediction(
        model, 
        processedData, 
        request.horizon,
        seasonalityAnalysis
      );
      
      // 6. 신뢰구간 계산
      const confidenceInterval = this.calculateConfidenceInterval(
        processedData,
        prediction,
        request.confidence
      );
      
      // 7. 정확도 평가
      const accuracyScore = this.evaluateAccuracy(model, processedData);
      
      // 8. 추천사항 생성
      const recommendations = this.generateRecommendations(
        prediction,
        trendAnalysis,
        seasonalityAnalysis,
        request.metric
      );
      
      const result: PredictionResult = {
        predicted_value: Math.round(prediction * 100) / 100,
        confidence_interval: [
          Math.round(confidenceInterval[0] * 100) / 100,
          Math.round(confidenceInterval[1] * 100) / 100
        ],
        trend: trendAnalysis.trend,
        seasonality: seasonalityAnalysis,
        accuracy_score: Math.round(accuracyScore * 100) / 100,
        recommendations,
        metadata: {
          model_type: 'Enhanced Linear Regression',
          data_points: processedData.length,
          prediction_horizon: request.horizon,
          computation_time: Date.now() - startTime
        }
      };
      
      console.log(`✅ 예측 완료: ${result.predicted_value} (${result.metadata.computation_time}ms)`);
      return result;
      
    } catch (error: any) {
      console.error('❌ 예측 실패:', error);
      throw new Error(`예측 실패: ${error.message}`);
    }
  }
  
  /**
   * 📊 데이터 전처리
   */
  private preprocessData(data: TimeSeriesPoint[]): { x: number; y: number; timestamp: Date }[] {
    return data
      .map(point => ({
        timestamp: new Date(point.timestamp),
        value: point.value
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((point, index) => ({
        x: index,
        y: point.value,
        timestamp: point.timestamp
      }))
      .filter(point => !isNaN(point.y) && isFinite(point.y));
  }
  
  /**
   * 📈 트렌드 분석
   */
  private analyzeTrend(data: { x: number; y: number; timestamp: Date }[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    slope: number;
    r_squared: number;
  } {
    if (data.length < 2) {
      return { trend: 'stable', slope: 0, r_squared: 0 };
    }
    
    const x = data.map(p => p.x);
    const y = data.map(p => p.y);
    
    const regression = new SimpleLinearRegression(x, y);
    const slope = regression.slope;
    
    // score() 메서드를 사용하여 r2 값을 얻습니다
    const scoreResult = regression.score(x, y);
    const rSquared = scoreResult.r2 || 0;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.1) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
    
    return { trend, slope, r_squared: rSquared };
  }
  
  /**
   * 🔄 계절성 감지
   */
  private detectSeasonality(data: { x: number; y: number; timestamp: Date }[]): {
    detected: boolean;
    period?: number;
    strength?: number;
  } {
    if (data.length < 24) { // 최소 24개 포인트 필요
      return { detected: false };
    }
    
    // 간단한 자기상관 분석
    const values = data.map(p => p.y);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    let maxCorrelation = 0;
    let bestPeriod = 0;
    
    // 1시간~24시간 주기 검사 (5분 간격 데이터 가정)
    for (let period = 12; period <= Math.min(288, Math.floor(values.length / 2)); period++) {
      const correlation = this.calculateAutocorrelation(values, period, mean);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    const detected = maxCorrelation > 0.3; // 30% 이상 상관관계 시 계절성 있음
    
    return {
      detected,
      period: detected ? bestPeriod : undefined,
      strength: detected ? maxCorrelation : undefined
    };
  }
  
  /**
   * 🔢 자기상관 계산
   */
  private calculateAutocorrelation(values: number[], lag: number, mean: number): number {
    const n = values.length;
    if (lag >= n) return 0;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  /**
   * 🤖 모델 선택 및 훈련
   */
  private selectAndTrainModel(
    data: { x: number; y: number; timestamp: Date }[], 
    metric: string
  ): SimpleLinearRegression {
    const cacheKey = `${metric}_model_${data.length}`;
    
    if (this.models.has(cacheKey)) {
      return this.models.get(cacheKey)!;
    }
    
    const x = data.map(p => p.x);
    const y = data.map(p => p.y);
    
    // 이동평균으로 노이즈 제거
    const smoothedY = this.applyMovingAverage(y, Math.min(5, Math.floor(y.length / 4)));
    
    const model = new SimpleLinearRegression(x, smoothedY);
    this.models.set(cacheKey, model);
    
    return model;
  }
  
  /**
   * 📊 이동평균 적용
   */
  private applyMovingAverage(data: number[], window: number): number[] {
    if (window <= 1) return data;
    
    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(data.length, i + Math.floor(window / 2) + 1);
      
      const slice = data.slice(start, end);
      const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      result.push(average);
    }
    
    return result;
  }
  
  /**
   * 🎯 예측 실행
   */
  private makePrediction(
    model: SimpleLinearRegression,
    data: { x: number; y: number; timestamp: Date }[],
    horizonMinutes: number,
    seasonality: { detected: boolean; period?: number; strength?: number }
  ): number {
    const lastIndex = data.length - 1;
    const futureIndex = lastIndex + (horizonMinutes / 5); // 5분 간격 가정
    
    // 기본 선형 예측
    let prediction = model.predict(futureIndex);
    
    // 계절성 조정
    if (seasonality.detected && seasonality.period && seasonality.strength) {
      const seasonalOffset = this.calculateSeasonalOffset(
        data,
        seasonality.period,
        horizonMinutes
      );
      prediction += seasonalOffset * seasonality.strength;
    }
    
    // 합리적 범위로 제한
    const recentValues = data.slice(-10).map(p => p.y);
    const min = Math.min(...recentValues) * 0.5;
    const max = Math.max(...recentValues) * 1.5;
    
    return Math.max(min, Math.min(max, prediction));
  }
  
  /**
   * 🔄 계절성 오프셋 계산
   */
  private calculateSeasonalOffset(
    data: { x: number; y: number; timestamp: Date }[],
    period: number,
    horizonMinutes: number
  ): number {
    const values = data.map(p => p.y);
    const seasonalIndex = Math.floor(horizonMinutes / 5) % period;
    
    // 같은 계절 인덱스의 값들 평균
    const seasonalValues: number[] = [];
    for (let i = seasonalIndex; i < values.length; i += period) {
      seasonalValues.push(values[i]);
    }
    
    if (seasonalValues.length === 0) return 0;
    
    const seasonalMean = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
    const overallMean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return seasonalMean - overallMean;
  }
  
  /**
   * 📏 신뢰구간 계산
   */
  private calculateConfidenceInterval(
    data: { x: number; y: number; timestamp: Date }[],
    prediction: number,
    confidence: number
  ): [number, number] {
    const values = data.map(p => p.y);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // 표준편차 계산
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // t-분포 근사 (간단한 구현)
    const tValue = this.getTValue(confidence, values.length - 1);
    const margin = tValue * stdDev;
    
    return [prediction - margin, prediction + margin];
  }
  
  /**
   * 📊 t-값 근사 계산
   */
  private getTValue(confidence: number, degreesOfFreedom: number): number {
    // 간단한 t-값 테이블 근사
    const alpha = 1 - confidence;
    
    if (degreesOfFreedom >= 30) {
      // 정규분포 근사
      if (confidence >= 0.99) return 2.576;
      if (confidence >= 0.95) return 1.96;
      if (confidence >= 0.90) return 1.645;
      return 1.282;
    } else {
      // 작은 샘플 크기용 근사
      if (confidence >= 0.95) return 2.5;
      if (confidence >= 0.90) return 2.0;
      return 1.5;
    }
  }
  
  /**
   * 🎯 정확도 평가
   */
  private evaluateAccuracy(
    model: SimpleLinearRegression,
    data: { x: number; y: number; timestamp: Date }[]
  ): number {
    if (data.length < 5) return 0.5; // 기본값
    
    const testSize = Math.min(10, Math.floor(data.length * 0.2));
    const trainData = data.slice(0, -testSize);
    const testData = data.slice(-testSize);
    
    let totalError = 0;
    let totalActual = 0;
    
    for (const point of testData) {
      const predicted = model.predict(point.x);
      const actual = point.y;
      totalError += Math.abs(predicted - actual);
      totalActual += Math.abs(actual);
    }
    
    const mape = totalActual === 0 ? 0 : totalError / totalActual;
    return Math.max(0, Math.min(1, 1 - mape)); // 0~1 사이 정확도
  }
  
  /**
   * 💡 추천사항 생성
   */
  private generateRecommendations(
    prediction: number,
    trend: { trend: string; slope: number },
    seasonality: { detected: boolean; period?: number; strength?: number },
    metric: string
  ): string[] {
    const recommendations: string[] = [];
    
    // 예측값 기반 추천
    if (metric === 'cpu' && prediction > 80) {
      recommendations.push('🚨 CPU 사용률 80% 초과 예상 - 스케일아웃 또는 로드밸런싱 고려');
    } else if (metric === 'memory' && prediction > 85) {
      recommendations.push('🧠 메모리 사용률 85% 초과 예상 - 메모리 증설 또는 캐시 최적화 필요');
    }
    
    // 트렌드 기반 추천
    if (trend.trend === 'increasing' && trend.slope > 0.5) {
      recommendations.push('📈 지속적 증가 트렌드 감지 - 용량 계획 및 자동 스케일링 설정 권장');
    } else if (trend.trend === 'decreasing' && trend.slope < -0.5) {
      recommendations.push('📉 지속적 감소 트렌드 감지 - 리소스 다운스케일링으로 비용 절약 가능');
    }
    
    // 계절성 기반 추천
    if (seasonality.detected && seasonality.strength && seasonality.strength > 0.4) {
      recommendations.push('🔄 강한 주기성 패턴 감지 - 예측 기반 사전 자동 스케일링 설정 권장');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ 현재 안정적인 상태 - 지속적인 모니터링 권장');
    }
    
    return recommendations;
  }
  
  /**
   * 📊 샘플 데이터 생성 (테스트용)
   */
  private async generateSampleData(metric: string): Promise<TimeSeriesPoint[]> {
    const data: TimeSeriesPoint[] = [];
    const now = new Date();
    
    for (let i = 100; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5분 간격
      
      // 기본 트렌드 + 노이즈 + 계절성
      const baseValue = metric === 'cpu' ? 45 : metric === 'memory' ? 60 : 30;
      const trend = i * 0.1; // 약간의 증가 트렌드
      const seasonal = Math.sin(i * 2 * Math.PI / 24) * 10; // 일일 주기
      const noise = (Math.random() - 0.5) * 20;
      
      const value = Math.max(0, Math.min(100, baseValue + trend + seasonal + noise));
      
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.round(value * 10) / 10,
        metadata: { metric, serverId: 'sample-server' }
      });
    }
    
    return data;
  }
  
  /**
   * 🧹 캐시 정리
   */
  clearCache(): void {
    this.cache.clear();
    this.models.clear();
    console.log('🧹 TimeSeriesPredictor 캐시 정리 완료');
  }
  
  /**
   * 📊 모델 통계
   */
  getStats(): {
    cached_models: number;
    cache_size: number;
    memory_usage: string;
  } {
    return {
      cached_models: this.models.size,
      cache_size: this.cache.size,
      memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
  }
}

// 싱글톤 인스턴스
export const timeSeriesPredictor = new TimeSeriesPredictor(); 