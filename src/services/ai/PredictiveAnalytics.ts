/**
 * 🤖 AI 기반 예측 분석 시스템 v2.0
 * 
 * OpenManager AI v5.12.0 - 고급 예측 분석
 * - 서버 부하 예측
 * - 장애 발생 예측
 * - 리소스 사용량 예측
 * - 성능 트렌드 분석
 * - 자동 스케일링 권장사항
 */

import { EnhancedServerMetrics } from '../simulationEngine';
import { cacheService } from '../cacheService';

interface PredictionModel {
  type: 'linear' | 'exponential' | 'polynomial' | 'neural';
  accuracy: number;
  lastTrained: number;
  parameters: Record<string, number>;
}

interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: number; // 예측 시간 (분)
  trend: 'increasing' | 'decreasing' | 'stable';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface FailurePrediction {
  serverId: string;
  failureProbability: number;
  estimatedTimeToFailure: number; // 분
  riskFactors: string[];
  recommendedActions: string[];
}

interface ResourceForecast {
  resource: 'cpu' | 'memory' | 'disk' | 'network';
  currentUsage: number;
  predictedUsage: number[];
  timePoints: number[];
  capacityLimit: number;
  estimatedExhaustionTime?: number;
}

export class PredictiveAnalytics {
  private static instance: PredictiveAnalytics;
  private models: Map<string, PredictionModel> = new Map();
  private historicalData: Map<string, number[]> = new Map();
  private maxHistorySize = 1000; // 최대 1000개 데이터 포인트

  static getInstance(): PredictiveAnalytics {
    if (!this.instance) {
      this.instance = new PredictiveAnalytics();
    }
    return this.instance;
  }

  /**
   * 📊 서버 메트릭 데이터 수집 및 저장
   */
  async collectMetrics(servers: EnhancedServerMetrics[]): Promise<void> {
    const timestamp = Date.now();
    
    for (const server of servers) {
      // CPU 사용률 저장
      this.addDataPoint(`${server.id}_cpu`, server.cpu_usage);
      
      // 메모리 사용률 저장
      this.addDataPoint(`${server.id}_memory`, server.memory_usage);
      
      // 디스크 사용률 저장
      this.addDataPoint(`${server.id}_disk`, server.disk_usage);
      
      // 네트워크 사용률 저장 (network_in 사용)
      this.addDataPoint(`${server.id}_network`, server.network_in);
      
      // 응답시간 저장
      this.addDataPoint(`${server.id}_responseTime`, server.response_time);
      
      // 전체 시스템 메트릭
      this.addDataPoint('system_totalServers', servers.length);
      this.addDataPoint('system_healthyServers', servers.filter(s => s.status === 'healthy').length);
      this.addDataPoint('system_avgCpu', servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length);
      this.addDataPoint('system_avgMemory', servers.reduce((sum, s) => sum + s.memory_usage, 0) / servers.length);
    }
    
    console.log(`📊 ${servers.length}개 서버의 메트릭 데이터 수집 완료`);
  }

  /**
   * �� 데이터 포인트 추가
   */
  private addDataPoint(key: string, value: number): void {
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }
    
    const data = this.historicalData.get(key)!;
    data.push(value);
    
    // 최대 크기 제한
    if (data.length > this.maxHistorySize) {
      data.shift();
    }
  }

  /**
   * 🔮 서버 부하 예측
   */
  async predictServerLoad(serverId: string, timeframeMinutes: number = 30): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = [];
    
    const metrics = ['cpu', 'memory', 'disk', 'network'];
    
    for (const metric of metrics) {
      const key = `${serverId}_${metric}`;
      const data = this.historicalData.get(key);
      
      if (!data || data.length < 10) {
        continue; // 충분한 데이터가 없음
      }
      
      const prediction = this.generatePrediction(key, data, timeframeMinutes);
      if (prediction) {
        predictions.push(prediction);
      }
    }
    
    return predictions;
  }

  /**
   * 🚨 장애 발생 예측
   */
  async predictFailures(servers: EnhancedServerMetrics[]): Promise<FailurePrediction[]> {
    const failurePredictions: FailurePrediction[] = [];
    
    for (const server of servers) {
      const riskFactors: string[] = [];
      let riskScore = 0;
      
      // CPU 위험도 분석
      if (server.cpu_usage > 90) {
        riskFactors.push('CPU 사용률 위험 (90% 이상)');
        riskScore += 30;
      } else if (server.cpu_usage > 80) {
        riskFactors.push('CPU 사용률 높음 (80% 이상)');
        riskScore += 15;
      }
      
      // 메모리 위험도 분석
      if (server.memory_usage > 95) {
        riskFactors.push('메모리 사용률 위험 (95% 이상)');
        riskScore += 35;
      } else if (server.memory_usage > 85) {
        riskFactors.push('메모리 사용률 높음 (85% 이상)');
        riskScore += 20;
      }
      
      // 디스크 위험도 분석
      if (server.disk_usage > 95) {
        riskFactors.push('디스크 사용률 위험 (95% 이상)');
        riskScore += 25;
      } else if (server.disk_usage > 90) {
        riskFactors.push('디스크 사용률 높음 (90% 이상)');
        riskScore += 10;
      }
      
      // 응답시간 위험도 분석
      if (server.response_time > 5000) {
        riskFactors.push('응답시간 매우 느림 (5초 이상)');
        riskScore += 20;
      } else if (server.response_time > 2000) {
        riskFactors.push('응답시간 느림 (2초 이상)');
        riskScore += 10;
      }
      
      // 트렌드 분석
      const cpuTrend = this.analyzeTrend(`${server.id}_cpu`);
      const memoryTrend = this.analyzeTrend(`${server.id}_memory`);
      
      if (cpuTrend === 'increasing') {
        riskFactors.push('CPU 사용률 증가 추세');
        riskScore += 10;
      }
      
      if (memoryTrend === 'increasing') {
        riskFactors.push('메모리 사용률 증가 추세');
        riskScore += 15;
      }
      
      // 장애 확률 계산 (0-100%)
      const failureProbability = Math.min(riskScore, 100);
      
      // 예상 장애 시간 계산 (분)
      let estimatedTimeToFailure = 0;
      if (failureProbability > 80) {
        estimatedTimeToFailure = 5; // 5분 이내
      } else if (failureProbability > 60) {
        estimatedTimeToFailure = 15; // 15분 이내
      } else if (failureProbability > 40) {
        estimatedTimeToFailure = 60; // 1시간 이내
      } else if (failureProbability > 20) {
        estimatedTimeToFailure = 240; // 4시간 이내
      } else {
        estimatedTimeToFailure = 1440; // 24시간 이내
      }
      
      // 권장 조치사항
      const recommendedActions = this.generateRecommendedActions(server, riskFactors);
      
      if (failureProbability > 20) { // 20% 이상일 때만 예측 결과 포함
        failurePredictions.push({
          serverId: server.id,
          failureProbability,
          estimatedTimeToFailure,
          riskFactors,
          recommendedActions
        });
      }
    }
    
    // 위험도 순으로 정렬
    return failurePredictions.sort((a, b) => b.failureProbability - a.failureProbability);
  }

  /**
   * 📊 리소스 사용량 예측
   */
  async forecastResourceUsage(timeframeHours: number = 24): Promise<ResourceForecast[]> {
    const forecasts: ResourceForecast[] = [];
    const resources = ['cpu', 'memory', 'disk', 'network'];
    
    for (const resource of resources) {
      const systemKey = `system_avg${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
      const data = this.historicalData.get(systemKey);
      
      if (!data || data.length < 20) {
        continue;
      }
      
      const currentUsage = data[data.length - 1];
      const timePoints: number[] = [];
      const predictedUsage: number[] = [];
      
      // 시간별 예측 (1시간 간격)
      for (let hour = 1; hour <= timeframeHours; hour++) {
        timePoints.push(hour);
        
        // 선형 회귀를 사용한 간단한 예측
        const prediction = this.linearRegression(data, hour);
        predictedUsage.push(Math.max(0, Math.min(100, prediction)));
      }
      
      // 용량 한계 설정
      const capacityLimit = resource === 'memory' ? 95 : 
                           resource === 'disk' ? 90 : 
                           resource === 'cpu' ? 85 : 80;
      
      // 용량 고갈 시간 예측
      let estimatedExhaustionTime: number | undefined;
      for (let i = 0; i < predictedUsage.length; i++) {
        if (predictedUsage[i] >= capacityLimit) {
          estimatedExhaustionTime = timePoints[i];
          break;
        }
      }
      
      forecasts.push({
        resource: resource as any,
        currentUsage,
        predictedUsage,
        timePoints,
        capacityLimit,
        estimatedExhaustionTime
      });
    }
    
    return forecasts;
  }

  /**
   * 📈 트렌드 분석
   */
  private analyzeTrend(key: string): 'increasing' | 'decreasing' | 'stable' {
    const data = this.historicalData.get(key);
    if (!data || data.length < 5) {
      return 'stable';
    }
    
    const recent = data.slice(-10); // 최근 10개 데이터 포인트
    const slope = this.calculateSlope(recent);
    
    if (slope > 0.5) return 'increasing';
    if (slope < -0.5) return 'decreasing';
    return 'stable';
  }

  /**
   * 📊 기울기 계산
   */
  private calculateSlope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;
    
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * 🔮 예측 생성
   */
  private generatePrediction(key: string, data: number[], timeframeMinutes: number): PredictionResult | null {
    if (data.length < 5) return null;
    
    const currentValue = data[data.length - 1];
    const trend = this.analyzeTrend(key);
    
    // 선형 회귀를 사용한 예측
    const predictedValue = this.linearRegression(data, timeframeMinutes / 5); // 5분 간격 가정
    
    // 신뢰도 계산 (데이터 일관성 기반)
    const variance = this.calculateVariance(data.slice(-20));
    const confidence = Math.max(0.3, Math.min(0.95, 1 - (variance / 100)));
    
    // 심각도 판정
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (predictedValue > 95) severity = 'critical';
    else if (predictedValue > 85) severity = 'high';
    else if (predictedValue > 75) severity = 'medium';
    
    return {
      metric: key,
      currentValue,
      predictedValue: Math.max(0, Math.min(100, predictedValue)),
      confidence,
      timeframe: timeframeMinutes,
      trend,
      severity
    };
  }

  /**
   * 📊 선형 회귀
   */
  private linearRegression(data: number[], steps: number): number {
    const n = data.length;
    if (n < 2) return data[0] || 0;
    
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return slope * (n - 1 + steps) + intercept;
  }

  /**
   * 📊 분산 계산
   */
  private calculateVariance(data: number[]): number {
    if (data.length < 2) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    
    return Math.sqrt(variance);
  }

  /**
   * 💡 권장 조치사항 생성
   */
  private generateRecommendedActions(server: EnhancedServerMetrics, riskFactors: string[]): string[] {
    const actions: string[] = [];
    
    if (server.cpu_usage > 85) {
      actions.push('CPU 집약적 프로세스 최적화 또는 스케일 아웃');
    }
    
    if (server.memory_usage > 90) {
      actions.push('메모리 누수 점검 및 캐시 정리');
    }
    
    if (server.disk_usage > 90) {
      actions.push('디스크 정리 및 로그 파일 아카이브');
    }
    
    if (server.response_time > 3000) {
      actions.push('애플리케이션 성능 튜닝 및 데이터베이스 최적화');
    }
    
    if (riskFactors.some(factor => factor.includes('증가 추세'))) {
      actions.push('리소스 모니터링 강화 및 자동 스케일링 설정');
    }
    
    if (actions.length === 0) {
      actions.push('정기적인 시스템 점검 및 모니터링 유지');
    }
    
    return actions;
  }

  /**
   * 🤖 자동 스케일링 권장사항
   */
  async generateScalingRecommendations(servers: EnhancedServerMetrics[]): Promise<{
    scaleUp: boolean;
    scaleDown: boolean;
    targetServerCount: number;
    reasoning: string[];
  }> {
    const currentCount = servers.length;
    const avgCpu = servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length;
    const avgMemory = servers.reduce((sum, s) => sum + s.memory_usage, 0) / servers.length;
    const criticalServers = servers.filter(s => s.cpu_usage > 90 || s.memory_usage > 95).length;
    
    const reasoning: string[] = [];
    let targetServerCount = currentCount;
    let scaleUp = false;
    let scaleDown = false;
    
    // 스케일 업 조건
    if (avgCpu > 80 || avgMemory > 85 || criticalServers > currentCount * 0.3) {
      scaleUp = true;
      targetServerCount = Math.ceil(currentCount * 1.5);
      reasoning.push(`평균 리소스 사용률이 높음 (CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%)`);
      reasoning.push(`${criticalServers}개 서버가 위험 상태`);
    }
    
    // 스케일 다운 조건
    else if (avgCpu < 30 && avgMemory < 40 && criticalServers === 0 && currentCount > 3) {
      scaleDown = true;
      targetServerCount = Math.max(3, Math.floor(currentCount * 0.8));
      reasoning.push(`평균 리소스 사용률이 낮음 (CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%)`);
      reasoning.push('모든 서버가 안정 상태');
    }
    
    // 현재 상태 유지
    else {
      reasoning.push('현재 서버 수가 적절함');
      reasoning.push(`평균 리소스 사용률: CPU ${avgCpu.toFixed(1)}%, Memory ${avgMemory.toFixed(1)}%`);
    }
    
    return {
      scaleUp,
      scaleDown,
      targetServerCount,
      reasoning
    };
  }

  /**
   * 📊 예측 정확도 평가
   */
  async evaluatePredictionAccuracy(): Promise<{
    overallAccuracy: number;
    metricAccuracies: Record<string, number>;
  }> {
    // 실제 구현에서는 과거 예측과 실제 값을 비교
    // 여기서는 시뮬레이션된 정확도 반환
    
    const metricAccuracies: Record<string, number> = {
      cpu: 0.85,
      memory: 0.82,
      disk: 0.78,
      network: 0.75,
      responseTime: 0.70
    };
    
    const overallAccuracy = Object.values(metricAccuracies).reduce((sum, acc) => sum + acc, 0) / Object.keys(metricAccuracies).length;
    
    return {
      overallAccuracy,
      metricAccuracies
    };
  }

  /**
   * 🧠 모델 재훈련
   */
  async retrainModels(): Promise<void> {
    console.log('🧠 AI 모델 재훈련 시작...');
    
    // 각 메트릭에 대한 모델 업데이트
    for (const [key, data] of this.historicalData.entries()) {
      if (data.length >= 50) { // 충분한 데이터가 있을 때만
        const accuracy = this.calculateModelAccuracy(data);
        
        this.models.set(key, {
          type: 'linear',
          accuracy,
          lastTrained: Date.now(),
          parameters: this.calculateModelParameters(data)
        });
      }
    }
    
    console.log(`✅ ${this.models.size}개 모델 재훈련 완료`);
  }

  /**
   * 📊 모델 정확도 계산
   */
  private calculateModelAccuracy(data: number[]): number {
    // 교차 검증을 통한 정확도 계산 시뮬레이션
    const variance = this.calculateVariance(data);
    return Math.max(0.5, Math.min(0.95, 1 - (variance / 200)));
  }

  /**
   * 🔧 모델 파라미터 계산
   */
  private calculateModelParameters(data: number[]): Record<string, number> {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = this.calculateVariance(data);
    const slope = this.calculateSlope(data.slice(-20));
    
    return {
      mean,
      variance,
      slope,
      trend: slope > 0 ? 1 : slope < 0 ? -1 : 0
    };
  }

  /**
   * 📈 예측 대시보드 데이터
   */
  async getPredictionDashboard(): Promise<{
    systemHealth: {
      current: string;
      predicted: string;
      confidence: number;
    };
    riskAlerts: FailurePrediction[];
    resourceForecasts: ResourceForecast[];
    scalingRecommendation: any;
    modelAccuracy: any;
  }> {
    // 캐시된 서버 데이터 가져오기
    const cachedServers = await cacheService.getCachedServers();
    const servers = cachedServers?.servers || [];
    
    if (servers.length === 0) {
      throw new Error('서버 데이터가 없습니다');
    }
    
    // 시스템 건강도 계산
    const healthyCount = servers.filter(s => s.status === 'healthy').length;
    const currentHealth = healthyCount / servers.length > 0.8 ? 'healthy' : 
                         healthyCount / servers.length > 0.6 ? 'warning' : 'critical';
    
    // 예측 분석 실행
    const riskAlerts = await this.predictFailures(servers);
    const resourceForecasts = await this.forecastResourceUsage(24);
    const scalingRecommendation = await this.generateScalingRecommendations(servers);
    const modelAccuracy = await this.evaluatePredictionAccuracy();
    
    // 예측된 시스템 건강도
    const avgRisk = riskAlerts.reduce((sum, alert) => sum + alert.failureProbability, 0) / Math.max(riskAlerts.length, 1);
    const predictedHealth = avgRisk < 20 ? 'healthy' : avgRisk < 50 ? 'warning' : 'critical';
    
    return {
      systemHealth: {
        current: currentHealth,
        predicted: predictedHealth,
        confidence: modelAccuracy.overallAccuracy
      },
      riskAlerts: riskAlerts.slice(0, 10), // 상위 10개만
      resourceForecasts,
      scalingRecommendation,
      modelAccuracy
    };
  }
}

// 싱글톤 인스턴스 export
export const predictiveAnalytics = PredictiveAnalytics.getInstance(); 