/**
 * 🐍 Python ML 브릿지
 * 
 * Render Python 서비스와의 통신 및 로컬 폴백 처리
 * - 고급 ML 분석을 위한 Python 호출
 * - 서비스 장애 시 로컬 폴백
 * - 성능 모니터링 및 캐싱
 */

export interface PythonResponse {
  success: boolean;
  data?: any;
  error?: string;
  processing_time?: number;
  model_version?: string;
}

export interface MLRequest {
  method: string;
  params: any;
  context?: any;
  timeout?: number;
}

/**
 * 🔗 Python ML 브릿지 메인 클래스
 */
export class PythonMLBridge {
  private apiUrl: string;
  private defaultTimeout: number = 30000;
  private retryCount: number = 2;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private requestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    fallbackUsed: 0,
    averageResponseTime: 0
  };

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    this.startCacheCleanup();
  }

  /**
   * 🚀 Python 서비스 메인 호출 메서드
   */
  async call(method: string, params: any, timeout?: number): Promise<any> {
    const startTime = Date.now();
    this.requestMetrics.totalRequests++;

    try {
      console.log(`🐍 Python ML 호출: ${method}`);

      // 캐시 확인
      const cacheKey = this.generateCacheKey(method, params);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log(`📋 캐시에서 결과 반환: ${method}`);
        return cachedResult;
      }

      // Python 서비스 호출
      const result = await this.callPythonService(method, params, timeout);
      
      if (result.success) {
        this.requestMetrics.successfulRequests++;
        
        // 결과 캐싱 (성공한 경우만)
        this.setCache(cacheKey, result.data, 300000); // 5분 TTL
        
        this.updateResponseTime(Date.now() - startTime);
        return result.data;
      } else {
        throw new Error(result.error || 'Python service returned error');
      }

    } catch (error: any) {
      console.warn(`⚠️ Python 서비스 오류, 로컬 폴백 사용: ${error.message}`);
      
      this.requestMetrics.failedRequests++;
      this.requestMetrics.fallbackUsed++;

      // 로컬 폴백 실행
      const fallbackResult = await this.localFallback(method, params);
      this.updateResponseTime(Date.now() - startTime);
      
      return fallbackResult;
    }
  }

  /**
   * 🌐 Python 서비스 실제 호출
   */
  private async callPythonService(method: string, params: any, timeout?: number): Promise<PythonResponse> {
    const requestTimeout = timeout || this.defaultTimeout;
    
    const requestBody: MLRequest = {
      method,
      params,
      context: this.prepareContext(params),
      timeout: requestTimeout
    };

    let lastError: Error | null = null;

    // 재시도 로직
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        const response = await fetch(`${this.apiUrl}/api/ml/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OpenManager-Vibe-v5/MCP'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: PythonResponse = await response.json();
        
        console.log(`✅ Python 서비스 호출 성공: ${method}`, {
          processingTime: result.processing_time,
          attempt: attempt + 1
        });

        return result;

      } catch (error: any) {
        lastError = error;
        console.warn(`❌ Python 서비스 호출 실패 (시도 ${attempt + 1}/${this.retryCount}):`, error.message);
        
        if (attempt < this.retryCount - 1) {
          // 지수 백오프로 재시도 대기
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * 🔧 컨텍스트 준비
   */
  private prepareContext(params: any): any {
    return {
      business_hours: this.isBusinessHours(),
      system_load: this.getSystemLoadHint(),
      analysis_priority: params.priority || 'normal',
      client_info: {
        source: 'mcp-orchestrator',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 💤 대기 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🏠 로컬 폴백 처리
   */
  private async localFallback(method: string, params: any): Promise<any> {
    console.log(`🏠 로컬 폴백 실행: ${method}`);

    switch (method) {
      case 'statistical_analysis':
        return this.localStatisticalAnalysis(params);
      
      case 'advanced_anomaly_detection':
        return this.localAnomalyDetection(params);
      
      case 'forecast':
        return this.localForecast(params);
      
      case 'correlation_analysis':
        return this.localCorrelationAnalysis(params);
      
      case 'pattern_analysis':
        return this.localPatternAnalysis(params);
      
      default:
        console.warn(`⚠️ 지원하지 않는 로컬 폴백 메서드: ${method}`);
        return {
          success: false,
          error: `Local fallback not available for method: ${method}`,
          fallback_used: true
        };
    }
  }

  /**
   * 📊 로컬 통계 분석
   */
  private async localStatisticalAnalysis(params: any): Promise<any> {
    const data = params.data || [];
    if (!Array.isArray(data) || data.length === 0) {
      return { error: 'Invalid data for analysis', fallback_used: true };
    }

    const values = data.flat().filter(val => typeof val === 'number' && !isNaN(val));
    if (values.length === 0) {
      return { error: 'No numeric data found', fallback_used: true };
    }

    // 기본 통계 계산
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    return {
      basic_stats: {
        count: values.length,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        std: Math.round(std * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
        q1: Math.round(q1 * 100) / 100,
        q3: Math.round(q3 * 100) / 100
      },
      distribution: {
        skewness: this.calculateSkewness(values, mean, std),
        kurtosis: this.calculateKurtosis(values, mean, std)
      },
      outliers: this.detectOutliers(values, q1, q3),
      fallback_used: true,
      confidence: 0.7
    };
  }

  /**
   * 🚨 로컬 이상 탐지
   */
  private async localAnomalyDetection(params: any): Promise<any> {
    const data = params.data || params.metrics;
    if (!data) {
      return { error: 'No data provided for anomaly detection', fallback_used: true };
    }

    // Z-Score 기반 이상 탐지
    const values = Array.isArray(data) ? data : Object.values(data).filter(v => typeof v === 'number');
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    const threshold = params.sensitivity ? (3 - params.sensitivity * 2) : 2; // 기본 2 시그마
    const anomalies = values.map((val: number, index: number) => {
      const zScore = Math.abs((val - mean) / std);
      return {
        index,
        value: val,
        z_score: Math.round(zScore * 100) / 100,
        is_anomaly: zScore > threshold,
        severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium'
      };
    }).filter(item => item.is_anomaly);

    return {
      anomalies,
      summary: {
        total_points: values.length,
        anomaly_count: anomalies.length,
        anomaly_rate: Math.round((anomalies.length / values.length) * 10000) / 100, // 백분율
        threshold_used: threshold
      },
      statistics: {
        mean: Math.round(mean * 100) / 100,
        std: Math.round(std * 100) / 100
      },
      fallback_used: true,
      confidence: 0.6
    };
  }

  /**
   * 📈 로컬 예측 분석
   */
  private async localForecast(params: any): Promise<any> {
    const data = params.data || params.historical_data;
    const periods = params.periods || params.forecast_periods || 10;
    
    if (!Array.isArray(data) || data.length < 3) {
      return { error: 'Insufficient data for forecasting', fallback_used: true };
    }

    // 간단한 선형 트렌드 기반 예측
    const values = data.filter(val => typeof val === 'number' && !isNaN(val));
    const n = values.length;
    
    // 선형 회귀 계수 계산
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 예측값 생성
    const predictions = Array.from({ length: periods }, (_, i) => {
      const futureX = n + i;
      const prediction = slope * futureX + intercept;
      
      // 약간의 불확실성 추가
      const uncertainty = Math.abs(prediction * 0.1);
      
      return {
        period: i + 1,
        value: Math.max(0, Math.round(prediction * 100) / 100),
        lower_bound: Math.max(0, Math.round((prediction - uncertainty) * 100) / 100),
        upper_bound: Math.round((prediction + uncertainty) * 100) / 100
      };
    });

    return {
      predictions,
      model_info: {
        type: 'linear_trend',
        slope: Math.round(slope * 1000) / 1000,
        intercept: Math.round(intercept * 100) / 100,
        data_points: n
      },
      trend: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      fallback_used: true,
      confidence: 0.5
    };
  }

  /**
   * 📊 로컬 상관관계 분석
   */
  private async localCorrelationAnalysis(params: any): Promise<any> {
    // 간단한 상관관계 분석 구현
    return {
      correlations: [],
      message: 'Local correlation analysis - limited functionality',
      fallback_used: true,
      confidence: 0.4
    };
  }

  /**
   * 🔍 로컬 패턴 분석
   */
  private async localPatternAnalysis(params: any): Promise<any> {
    // 간단한 패턴 분석 구현
    return {
      patterns: [],
      message: 'Local pattern analysis - limited functionality',
      fallback_used: true,
      confidence: 0.4
    };
  }

  // === 헬퍼 메서드들 ===

  private calculateSkewness(values: number[], mean: number, std: number): number {
    const n = values.length;
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;
    return Math.round(skewness * 1000) / 1000;
  }

  private calculateKurtosis(values: number[], mean: number, std: number): number {
    const n = values.length;
    const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n - 3;
    return Math.round(kurtosis * 1000) / 1000;
  }

  private detectOutliers(values: number[], q1: number, q3: number): number[] {
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(val => val < lowerBound || val > upperBound);
  }

  private isBusinessHours(): boolean {
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 18;
  }

  private getSystemLoadHint(): 'low' | 'medium' | 'high' {
    // 간단한 시스템 부하 추정 (실제로는 더 정교한 로직 필요)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) return 'high';
    if (hour >= 18 && hour <= 22) return 'medium';
    return 'low';
  }

  // === 캐싱 관련 메서드들 ===

  private generateCacheKey(method: string, params: any): string {
    // 파라미터를 해시화하여 캐시 키 생성
    const paramsStr = JSON.stringify(params);
    const hash = this.simpleHash(paramsStr);
    return `${method}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash).toString(36);
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private startCacheCleanup(): void {
    // 10분마다 만료된 캐시 정리
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache.entries()) {
        if (now > cached.timestamp + cached.ttl) {
          this.cache.delete(key);
        }
      }
    }, 600000);
  }

  private updateResponseTime(responseTime: number): void {
    const total = this.requestMetrics.totalRequests;
    const current = this.requestMetrics.averageResponseTime;
    this.requestMetrics.averageResponseTime = (current * (total - 1) + responseTime) / total;
  }

  // === 공개 메서드들 ===

  /**
   * 📊 브릿지 통계 반환
   */
  getMetrics(): any {
    return {
      ...this.requestMetrics,
      cacheSize: this.cache.size,
      successRate: this.requestMetrics.totalRequests > 0 
        ? Math.round((this.requestMetrics.successfulRequests / this.requestMetrics.totalRequests) * 10000) / 100 
        : 0,
      fallbackRate: this.requestMetrics.totalRequests > 0 
        ? Math.round((this.requestMetrics.fallbackUsed / this.requestMetrics.totalRequests) * 10000) / 100 
        : 0
    };
  }

  /**
   * 🧹 캐시 정리
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Python ML 브릿지 캐시 정리 완료');
  }

  /**
   * 🏥 연결 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
} 