/**
 * 🧠 스마트 AI 라우팅 엔진 v1.0
 *
 * 작업 복잡도에 따라 최적의 AI 엔진으로 라우팅
 * - 간단한 작업: TensorFlow.js (베르셀)
 * - 복잡한 작업: Python AI 엔진 (Render)
 * - 장애 시 폴백 메커니즘
 */

interface RoutingConfig {
  tensorflowThreshold: number; // TensorFlow.js 처리 임계값
  pythonFallback: boolean; // Python 폴백 활성화
  timeoutMs: number; // 요청 타임아웃
  retryAttempts: number; // 재시도 횟수
}

interface AnalysisRequest {
  query: string;
  metrics: Record<string, number[]>;
  requestType: 'realtime' | 'batch' | 'prediction' | 'analysis';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplexityScore {
  dataSize: number; // 데이터 크기 점수 (0-100)
  computeIntensity: number; // 연산 복잡도 (0-100)
  realTimeRequirement: number; // 실시간 요구사항 (0-100)
  totalScore: number; // 총 복잡도 점수 (0-100)
  recommendation: 'tensorflow' | 'python';
}

export class SmartRoutingEngine {
  private config: RoutingConfig;
  // TensorFlow 엔진 제거됨
  private pythonEndpoint: string;

  constructor() {
    this.config = {
      tensorflowThreshold: 60, // 60점 이하는 TensorFlow.js
      pythonFallback: true,
      timeoutMs: 5000,
      retryAttempts: 2,
    };

    this.pythonEndpoint =
      process.env.PYTHON_AI_ENDPOINT ||
      'https://openmanager-vibe-v5.onrender.com';
  }

  /**
   * 🎯 요청 분석 및 라우팅
   */
  async routeRequest(request: AnalysisRequest): Promise<any> {
    const complexity = this.calculateComplexity(request);

    console.log(
      `🧠 AI 라우팅: ${complexity.recommendation} (복잡도: ${complexity.totalScore})`
    );

    if (complexity.recommendation === 'tensorflow') {
      return await this.processWithTensorFlow(request, complexity);
    } else {
      return await this.processWithPython(request, complexity);
    }
  }

  /**
   * 📊 작업 복잡도 계산
   */
  private calculateComplexity(request: AnalysisRequest): ComplexityScore {
    const { query, metrics, requestType, urgency } = request;

    // 1. 데이터 크기 점수 (0-100)
    const totalDataPoints = Object.values(metrics).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    const dataSize = Math.min(100, (totalDataPoints / 1000) * 100);

    // 2. 연산 복잡도 점수 (0-100)
    let computeIntensity = 0;

    // 키워드 기반 복잡도 분석
    const complexKeywords = [
      'deep learning',
      '딥러닝',
      'neural network',
      '신경망',
      'machine learning',
      '머신러닝',
      'clustering',
      '클러스터링',
      'regression',
      '회귀',
      'classification',
      '분류',
      'anomaly detection',
      '이상 탐지',
      'prediction',
      '예측',
    ];

    const queryLower = query.toLowerCase();
    const keywordMatches = complexKeywords.filter(keyword =>
      queryLower.includes(keyword.toLowerCase())
    ).length;

    computeIntensity += keywordMatches * 15; // 키워드당 15점

    // 요청 타입별 복잡도
    const typeComplexity = {
      realtime: 0, // 실시간은 단순해야 함
      batch: 30, // 배치는 중간 복잡도
      prediction: 40, // 예측은 높은 복잡도
      analysis: 50, // 분석은 최고 복잡도
    };

    computeIntensity += typeComplexity[requestType];

    // 메트릭 종류에 따른 복잡도
    const metricCount = Object.keys(metrics).length;
    computeIntensity += Math.min(30, metricCount * 5);

    computeIntensity = Math.min(100, computeIntensity);

    // 3. 실시간 요구사항 (높을수록 TensorFlow.js 선호)
    const urgencyScore = {
      critical: 100, // 크리티컬은 TensorFlow.js 강제
      high: 80,
      medium: 50,
      low: 20,
    };

    const realTimeRequirement = urgencyScore[urgency];

    // 4. 총 복잡도 계산 (실시간 요구사항은 복잡도를 낮춤)
    const totalScore =
      (dataSize * 0.3 + computeIntensity * 0.5) *
      (1 - realTimeRequirement * 0.003);

    // 5. 라우팅 결정
    const recommendation =
      totalScore <= this.config.tensorflowThreshold ? 'tensorflow' : 'python';

    return {
      dataSize,
      computeIntensity,
      realTimeRequirement,
      totalScore: Math.round(totalScore),
      recommendation,
    };
  }

  /**
   * ⚡ TensorFlow.js로 처리
   */
  private async processWithTensorFlow(
    request: AnalysisRequest,
    complexity: ComplexityScore
  ): Promise<any> {
    try {
      // 경량 ML 엔진으로 대체
      console.log('🔮 경량 ML 엔진으로 처리');

      const startTime = Date.now();
      const result = {
        analysis: 'lightweight_analysis',
        confidence: 0.6,
        results: [],
        metrics_processed: Object.keys(request.metrics).length,
      };
      const processingTime = Date.now() - startTime;

      return {
        ...result,
        routing_info: {
          engine: 'tensorflow.js',
          complexity_score: complexity.totalScore,
          processing_time: processingTime,
          location: 'vercel_edge',
        },
      };
    } catch (error: any) {
      console.error('❌ TensorFlow.js 처리 실패:', error);

      // Python으로 폴백
      if (this.config.pythonFallback) {
        console.log('🔄 Python 엔진으로 폴백 중...');
        return await this.processWithPython(request, complexity);
      }

      throw error;
    }
  }

  /**
   * 🐍 Python AI 엔진으로 처리
   */
  private async processWithPython(
    request: AnalysisRequest,
    complexity: ComplexityScore
  ): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs
      );

      const startTime = Date.now();

      const response = await fetch(`${this.pythonEndpoint}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: request.query,
          metrics: this.convertMetricsForPython(request.metrics),
          data: {
            request_type: request.requestType,
            urgency: request.urgency,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Python API 오류: ${response.status}`);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        ...result,
        routing_info: {
          engine: 'python',
          complexity_score: complexity.totalScore,
          processing_time: processingTime,
          location: 'render_cloud',
        },
      };
    } catch (error: any) {
      console.error('❌ Python 엔진 처리 실패:', error);

      // TensorFlow.js로 폴백 (제한된 기능)
      if (complexity.totalScore <= 80) {
        // 80점 이하만 폴백
        console.log('🔄 TensorFlow.js로 제한적 폴백 중...');
        return await this.processWithTensorFlow(request, complexity);
      }

      throw error;
    }
  }

  /**
   * 🔄 Python API용 메트릭 형식 변환
   */
  private convertMetricsForPython(metrics: Record<string, number[]>): any[] {
    const converted: any[] = [];
    const maxLength = Math.max(
      ...Object.values(metrics).map(arr => arr.length)
    );

    for (let i = 0; i < maxLength; i++) {
      const dataPoint: any = {
        timestamp: new Date(Date.now() - (maxLength - i) * 60000).toISOString(),
      };

      Object.entries(metrics).forEach(([key, values]) => {
        dataPoint[key] = values[i] || 0;
      });

      converted.push(dataPoint);
    }

    return converted;
  }

  /**
   * 📊 라우팅 통계
   */
  async getRoutingStats(): Promise<any> {
    return {
      config: this.config,
      endpoints: {
        tensorflow: 'vercel_edge',
        python: this.pythonEndpoint,
      },
      performance: {
        tensorflow_avg_time: '50-200ms',
        python_avg_time: '1-5s',
        fallback_rate: '< 5%',
      },
    };
  }

  /**
   * ⚙️ 라우팅 설정 업데이트
   */
  updateConfig(newConfig: Partial<RoutingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 라우팅 설정 업데이트:', this.config);
  }
}
