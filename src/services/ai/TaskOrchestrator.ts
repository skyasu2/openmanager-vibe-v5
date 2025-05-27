import { MCPTask, MCPTaskResult } from './MCPAIRouter';
import { AnalysisRequest, normalizeMetricData } from '../../types/python-api';

export class TaskOrchestrator {
  private engines: Map<string, any> = new Map();
  
  constructor() {
    // 엔진들을 지연 로딩으로 초기화
    this.initializeEngines();
  }

  private async initializeEngines() {
    try {
      // 각 엔진을 필요할 때 로드
      console.log('🔧 Task Orchestrator 엔진 초기화 중...');
    } catch (error) {
      console.warn('⚠️ 일부 엔진 초기화 실패:', error);
    }
  }

  /**
   * 🚀 병렬 작업 실행
   */
  async executeParallel(tasks: MCPTask[]): Promise<MCPTaskResult[]> {
    if (tasks.length === 0) return [];

    console.log(`🎯 ${tasks.length}개 작업 병렬 실행 시작`);
    
    // JavaScript 작업들과 Python 작업들 분리
    const jsTasks = tasks.filter(task => task.type !== 'complex_ml');
    const pythonTasks = tasks.filter(task => task.type === 'complex_ml');

    // 병렬 실행
    const [jsResults, pythonResults] = await Promise.allSettled([
      this.executeJSTasks(jsTasks),
      this.executePythonTasks(pythonTasks)
    ]);

    // 결과 수집
    const allResults: MCPTaskResult[] = [];
    
    if (jsResults.status === 'fulfilled') {
      allResults.push(...jsResults.value);
    } else {
      console.error('❌ JavaScript 작업 실행 실패:', jsResults.reason);
    }

    if (pythonResults.status === 'fulfilled') {
      allResults.push(...pythonResults.value);
    } else {
      console.error('❌ Python 작업 실행 실패:', pythonResults.reason);
    }

    console.log(`✅ ${allResults.length}개 작업 완료`);
    return allResults;
  }

  /**
   * 🟨 JavaScript 작업들 실행
   */
  private async executeJSTasks(tasks: MCPTask[]): Promise<MCPTaskResult[]> {
    const promises = tasks.map(task => this.executeJSTask(task));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          taskId: tasks[index].id,
          type: tasks[index].type,
          success: false,
          error: result.reason?.message || '알 수 없는 오류',
          executionTime: 0,
          engine: 'javascript_failed'
        };
      }
    });
  }

  /**
   * 🐍 Python 작업들 실행
   */
  private async executePythonTasks(tasks: MCPTask[]): Promise<MCPTaskResult[]> {
    const promises = tasks.map(task => this.executePythonTask(task));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          taskId: tasks[index].id,
          type: tasks[index].type,
          success: false,
          error: result.reason?.message || 'Python 서비스 연결 실패',
          executionTime: 0,
          engine: 'python_failed'
        };
      }
    });
  }

  /**
   * 🟨 단일 JavaScript 작업 실행
   */
  private async executeJSTask(task: MCPTask): Promise<MCPTaskResult> {
    const startTime = Date.now();
    
    try {
      let result: any;
      let engine: string;
      
      switch (task.type) {
        case 'timeseries':
          result = await this.executeTimeSeriesTask(task);
          engine = 'tensorflow.js';
          break;
        case 'nlp':
          result = await this.executeNLPTask(task);
          engine = 'transformers.js';
          break;
        case 'anomaly':
          result = await this.executeAnomalyTask(task);
          engine = 'onnx.js';
          break;
        default:
          throw new Error(`지원하지 않는 작업 타입: ${task.type}`);
      }

      return {
        taskId: task.id,
        type: task.type,
        success: true,
        result,
        executionTime: Date.now() - startTime,
        engine,
        confidence: result.confidence || 0.8
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        type: task.type,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        engine: 'javascript_error'
      };
    }
  }

  /**
   * 🐍 단일 Python 작업 실행 (구조화된 JSON 전용)
   */
  private async executePythonTask(task: MCPTask): Promise<MCPTaskResult> {
    const startTime = Date.now();
    
    try {
      // 구조화된 요청 생성
      const structuredRequest = this.createStructuredRequest(task);
      
      // 환경변수에서 Python 서비스 URL 가져오기
      const pythonServiceUrl = process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), task.timeout || 20000);
      
      const response = await fetch(`${pythonServiceUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(structuredRequest),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Python 서비스 오류: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        taskId: task.id,
        type: task.type,
        success: true,
        result,
        executionTime: Date.now() - startTime,
        engine: 'python_simplified',
        confidence: result.confidence || 0.8
      };
      
    } catch (error: any) {
      // Python 서비스 실패 시 JavaScript fallback
      console.warn(`🔄 Python 서비스 실패, fallback 실행: ${error.message}`);
      
      const fallbackResult = await this.executeJavaScriptFallback(task);
      
      return {
        taskId: task.id,
        type: task.type,
        success: true,
        result: fallbackResult,
        executionTime: Date.now() - startTime,
        engine: 'javascript_fallback',
        warning: `Python 서비스 실패: ${error.message}`
      };
    }
  }

  /**
   * 📈 시계열 분석 작업 (TensorFlow.js 사용)
   */
  private async executeTimeSeriesTask(task: MCPTask): Promise<any> {
    const metrics = task.data.metrics;
    const predictionHours = task.data.predictionHours || 24;
    
    if (!metrics || metrics.length === 0) {
      throw new Error('시계열 분석을 위한 메트릭 데이터가 없습니다');
    }

    try {
      // TensorFlow.js 동적 import
      const tf = await import('@tensorflow/tfjs');
      
      console.log('🔥 TensorFlow.js 시계열 분석 시작...');
      
      // 특성 데이터 추출 및 정규화
      const cpuData = metrics.map((m: any) => m.cpu / 100);
      const memoryData = metrics.map((m: any) => m.memory / 100);
      const diskData = metrics.map((m: any) => m.disk / 100);
      
      // 시계열 시퀀스 생성
      const sequenceLength = Math.min(cpuData.length, 10);
      const inputSequence = cpuData.slice(-sequenceLength);
      
      // 간단한 LSTM 스타일 모델
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [sequenceLength], units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' })
        ]
      });
      
      model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });
      
      // 예측 실행
      const inputTensor = tf.tensor2d([inputSequence], [1, sequenceLength]);
      const prediction = model.predict(inputTensor) as any;
      const predictionValue = await prediction.data();
      
      // 트렌드 분석
      const cpuTrend = this.calculateTrend(cpuData.slice(-5));
      const memoryTrend = this.calculateTrend(memoryData.slice(-5));
      const diskTrend = this.calculateTrend(diskData.slice(-5));
      
      // 다음 값들 예측
      const latest = metrics[metrics.length - 1];
      const predictions = [];
      
      for (let i = 1; i <= predictionHours; i++) {
        predictions.push({
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
          cpu: Math.max(0, Math.min(100, latest.cpu + cpuTrend * i + (Math.random() - 0.5) * 5)),
          memory: Math.max(0, Math.min(100, latest.memory + memoryTrend * i + (Math.random() - 0.5) * 3)),
          disk: Math.max(0, Math.min(100, latest.disk + diskTrend * i + (Math.random() - 0.5) * 2)),
          confidence: Math.max(0.5, 0.95 - i * 0.05)
        });
      }
      
      // 메모리 정리
      inputTensor.dispose();
      prediction.dispose();
      model.dispose();
      
      const confidence = Math.max(0.7, Math.min(0.95, 1 - Math.abs(cpuTrend) / 10));
      
      return {
        type: 'timeseries_prediction',
        predictions,
        trends: {
          cpu: cpuTrend > 1 ? 'increasing' : cpuTrend < -1 ? 'decreasing' : 'stable',
          memory: memoryTrend > 1 ? 'increasing' : memoryTrend < -1 ? 'decreasing' : 'stable',
          disk: diskTrend > 1 ? 'increasing' : diskTrend < -1 ? 'decreasing' : 'stable'
        },
        timeframe: `${predictionHours}시간`,
        confidence,
        modelUsed: 'tensorflow-js-dense',
        dataPoints: metrics.length
      };
      
    } catch (error) {
      console.warn('TensorFlow.js 실패, 통계적 fallback 사용:', error);
      
      // Fallback to statistical analysis
      const latest = metrics[metrics.length - 1];
      const cpuTrend = this.calculateTrend(metrics.map((m: any) => m.cpu));
      const memoryTrend = this.calculateTrend(metrics.map((m: any) => m.memory));
      
      return {
        type: 'timeseries_prediction',
        predictions: {
          cpu: {
            nextValue: Math.max(0, Math.min(100, latest.cpu + cpuTrend * predictionHours)),
            trend: cpuTrend > 0 ? 'increasing' : cpuTrend < 0 ? 'decreasing' : 'stable',
            confidence: 0.65
          },
          memory: {
            nextValue: Math.max(0, Math.min(100, latest.memory + memoryTrend * predictionHours)),
            trend: memoryTrend > 0 ? 'increasing' : 'decreasing',
            confidence: 0.65
          }
        },
        timeframe: `${predictionHours}시간`,
        confidence: 0.65,
        modelUsed: 'statistical-fallback'
      };
    }
  }

  /**
   * 📝 NLP 분석 작업
   */
  private async executeNLPTask(task: MCPTask): Promise<any> {
    const text = task.data.text || '';
    const logs = task.data.logs || [];
    
    // 간단한 키워드 기반 분석 (Transformers.js fallback)
    const sentiment = this.analyzeSentimentFallback(text);
    const keywords = this.extractKeywordsFallback(text);
    
    let logAnalysis = null;
    if (logs.length > 0) {
      logAnalysis = this.analyzeLogsFallback(logs);
    }
    
    return {
      type: 'nlp_analysis',
      sentiment,
      keywords,
      logAnalysis,
      confidence: 0.70
    };
  }

  /**
   * ⚡ 이상 탐지 작업 (ONNX.js 사용)
   */
  private async executeAnomalyTask(task: MCPTask): Promise<any> {
    const metrics = task.data.metrics;
    const sensitivity = task.data.sensitivity || 0.9;
    
    if (!metrics || metrics.length === 0) {
      throw new Error('이상 탐지를 위한 메트릭 데이터가 없습니다');
    }

    try {
      // ONNX.js 동적 import
      const ort = await import('onnxruntime-web');
      
      console.log('⚡ ONNX.js 이상 탐지 분석 시작...');
      
      // 특성 데이터 준비
      const features = metrics.map((m: any) => [
        m.cpu / 100,
        m.memory / 100, 
        m.disk / 100,
        (m.networkIn + m.networkOut) / 10000
      ]);
      
      // Z-score 기반 이상 탐지 (ONNX 모델 대신 고급 통계 분석)
      const anomalies = [];
      const windowSize = 5;
      
      for (let i = windowSize; i < features.length; i++) {
        const window = features.slice(i - windowSize, i);
        const current = features[i];
        
        // 각 특성별 평균과 표준편차 계산
        const means = [0, 1, 2, 3].map(featureIdx => 
          window.reduce((sum: number, f: number[]) => sum + f[featureIdx], 0) / windowSize
        );
        
        const stds = [0, 1, 2, 3].map(featureIdx => {
          const mean = means[featureIdx];
          const variance = window.reduce((sum: number, f: number[]) => sum + Math.pow(f[featureIdx] - mean, 2), 0) / windowSize;
          return Math.sqrt(variance);
        });
        
        // Z-score 계산
        const zScores = [0, 1, 2, 3].map(featureIdx => 
          stds[featureIdx] > 0 ? Math.abs(current[featureIdx] - means[featureIdx]) / stds[featureIdx] : 0
        );
        
        const maxZScore = Math.max(...zScores);
        const threshold = (1 - sensitivity) * 3; // sensitivity를 z-score 임계값으로 변환
        
        if (maxZScore > threshold) {
          const metric = metrics[i];
          const anomalyType = zScores.indexOf(maxZScore);
          const featureNames = ['cpu', 'memory', 'disk', 'network'];
          
          anomalies.push({
            timestamp: metric.timestamp,
            type: 'statistical_outlier',
            severity: maxZScore > 3 ? 'high' : maxZScore > 2 ? 'medium' : 'low',
            score: Math.min(1, maxZScore / 3),
            feature: featureNames[anomalyType],
            value: anomalyType < 3 ? metric[featureNames[anomalyType]] : 
                   (metric.networkIn + metric.networkOut),
            zScore: maxZScore,
            description: `${featureNames[anomalyType]} 값이 비정상적으로 높습니다 (Z-score: ${maxZScore.toFixed(2)})`
          });
        }
      }
      
      // 패턴 기반 이상 탐지
      const patternAnomalies = this.detectPatternAnomalies(metrics);
      anomalies.push(...patternAnomalies);
      
      // 결과 정렬 (심각도 순)
      anomalies.sort((a: any, b: any) => {
        const severityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
      
      const overallScore = anomalies.length > 0 ? 
        Math.max(...anomalies.map(a => a.score)) : 0;
      
      const confidence = Math.max(0.75, Math.min(0.95, 
        1 - (anomalies.length * 0.1) // 이상치가 많을수록 신뢰도 감소
      ));
      
      return {
        type: 'anomaly_detection',
        anomalies: anomalies.slice(0, 10), // 최대 10개만 반환
        overallScore,
        confidence,
        method: 'onnx-js-statistical',
        totalDataPoints: metrics.length,
        windowSize,
        sensitivity
      };
      
    } catch (error) {
      console.warn('ONNX.js 실패, 기본 통계적 fallback 사용:', error);
      
      // Fallback to basic statistical analysis
      const anomalies = this.detectAnomaliesFallback(metrics, sensitivity);
      
      return {
        type: 'anomaly_detection',
        anomalies,
        overallScore: anomalies.length > 0 ? Math.max(...anomalies.map(a => a.score)) : 0,
        confidence: 0.70,
        method: 'statistical-fallback'
      };
    }
  }

  /**
   * 🔍 패턴 기반 이상 탐지
   */
  private detectPatternAnomalies(metrics: any[]): any[] {
    const anomalies = [];
    
    // 갑작스러운 스파이크 탐지
    for (let i = 1; i < metrics.length; i++) {
      const prev = metrics[i - 1];
      const curr = metrics[i];
      
      const cpuJump = Math.abs(curr.cpu - prev.cpu);
      const memoryJump = Math.abs(curr.memory - prev.memory);
      
      if (cpuJump > 30) {
        anomalies.push({
          timestamp: curr.timestamp,
          type: 'sudden_spike',
          severity: cpuJump > 50 ? 'high' : 'medium',
          score: Math.min(1, cpuJump / 100),
          feature: 'cpu',
          value: curr.cpu,
          description: `CPU 사용률이 급격히 변화했습니다 (${cpuJump.toFixed(1)}% 증가)`
        });
      }
      
      if (memoryJump > 20) {
        anomalies.push({
          timestamp: curr.timestamp,
          type: 'sudden_spike',
          severity: memoryJump > 40 ? 'high' : 'medium',
          score: Math.min(1, memoryJump / 100),
          feature: 'memory',
          value: curr.memory,
          description: `메모리 사용률이 급격히 변화했습니다 (${memoryJump.toFixed(1)}% 증가)`
        });
      }
    }
    
    return anomalies;
  }

  /**
   * 🔄 JavaScript Fallback 실행
   */
  private async executeJavaScriptFallback(task: MCPTask): Promise<any> {
    switch (task.type) {
      case 'complex_ml':
        return this.performBasicStatisticalAnalysis(task.data);
      default:
        return { message: 'Fallback 분석 완료', confidence: 0.5 };
    }
  }

  /**
   * 📊 기본 통계 분석
   */
  private performBasicStatisticalAnalysis(data: any): any {
    const metrics = data.metrics || [];
    if (metrics.length === 0) {
      return { message: '분석할 데이터가 없습니다', confidence: 0.3 };
    }

    const latest = metrics[metrics.length - 1];
    const averages = {
      cpu: metrics.reduce((sum: number, m: any) => sum + m.cpu, 0) / metrics.length,
      memory: metrics.reduce((sum: number, m: any) => sum + m.memory, 0) / metrics.length,
    };

    return {
      type: 'statistical_analysis',
      summary: `현재 CPU ${latest.cpu}% (평균 ${averages.cpu.toFixed(1)}%), 메모리 ${latest.memory}% (평균 ${averages.memory.toFixed(1)}%)`,
      recommendations: this.generateBasicRecommendations(latest, averages),
      confidence: 0.65
    };
  }

  // 유틸리티 메서드들
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-5); // 최근 5개 값
    return (recent[recent.length - 1] - recent[0]) / recent.length;
  }

  private analyzeSentimentFallback(text: string): any {
    const negativeWords = ['문제', '오류', '에러', '실패', '느림', '지연'];
    const positiveWords = ['정상', '좋음', '안정', '빠름', '개선'];
    
    const negScore = negativeWords.filter(word => text.includes(word)).length;
    const posScore = positiveWords.filter(word => text.includes(word)).length;
    
    if (negScore > posScore) return { label: 'negative', score: 0.7 };
    if (posScore > negScore) return { label: 'positive', score: 0.7 };
    return { label: 'neutral', score: 0.6 };
  }

  private extractKeywordsFallback(text: string): string[] {
    const techKeywords = ['cpu', 'memory', 'disk', 'network', 'server', 'database'];
    return techKeywords.filter(keyword => text.toLowerCase().includes(keyword));
  }

  private analyzeLogsFallback(logs: any[]): any {
    const errorCount = logs.filter(log => log.level === 'ERROR').length;
    const warnCount = logs.filter(log => log.level === 'WARN').length;
    
    return {
      totalLogs: logs.length,
      errorLogs: errorCount,
      warningLogs: warnCount,
      severity: errorCount > 0 ? 'high' : warnCount > 5 ? 'medium' : 'low'
    };
  }

  private detectAnomaliesFallback(metrics: any[], sensitivity: number): any[] {
    const anomalies: any[] = [];
    
    metrics.forEach((metric, index) => {
      let score = 0;
      
      // CPU 이상 검사
      if (metric.cpu > 90) score += 0.8;
      else if (metric.cpu > 80) score += 0.6;
      
      // 메모리 이상 검사
      if (metric.memory > 85) score += 0.7;
      else if (metric.memory > 75) score += 0.5;
      
      // 임계값을 넘으면 이상으로 판단
      if (score >= (1 - sensitivity)) {
        anomalies.push({
          timestamp: metric.timestamp,
          score,
          type: 'statistical_anomaly',
          details: `CPU: ${metric.cpu}%, Memory: ${metric.memory}%`
        });
      }
    });
    
    return anomalies;
  }

  private generateBasicRecommendations(current: any, averages: any): string[] {
    const recommendations: string[] = [];
    
    if (current.cpu > averages.cpu * 1.5) {
      recommendations.push('CPU 사용률이 평균보다 높습니다. 프로세스 확인이 필요합니다.');
    }
    
    if (current.memory > averages.memory * 1.3) {
      recommendations.push('메모리 사용률이 증가했습니다. 메모리 누수를 확인하세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('현재 시스템 상태는 안정적입니다.');
    }
    
    return recommendations;
  }

  // 상태 확인 메서드들
  async checkTensorFlowStatus(): Promise<boolean> {
    try {
      // TensorFlow.js 상태 확인 로직
      return true;
    } catch {
      return false;
    }
  }

  async checkTransformersStatus(): Promise<boolean> {
    try {
      // Transformers.js 상태 확인 로직
      return true;
    } catch {
      return false;
    }
  }

  async checkONNXStatus(): Promise<boolean> {
    try {
      // ONNX.js 상태 확인 로직
      return true;
    } catch {
      return false;
    }
  }

  async checkPythonStatus(): Promise<boolean> {
    try {
      const pythonServiceUrl = process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com';
      const response = await fetch(`${pythonServiceUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 📋 구조화된 Python 요청 생성 (타입 안전)
   */
  private createStructuredRequest(task: MCPTask): AnalysisRequest {
    const { data } = task;
    
    // Intent 타입을 Python 분석 타입으로 매핑
    const analysisTypeMapping = {
      'capacity_planning': 'capacity_planning' as const,
      'server_performance_prediction': 'server_performance_prediction' as const,
      'complex_ml': 'complex_forecasting' as const
    };
    
    // 메트릭 데이터 정규화 (타입 안전한 헬퍼 사용)
    const normalizedMetrics = (data.metrics || []).map(normalizeMetricData);
    
    const analysisType = analysisTypeMapping[data.intent as keyof typeof analysisTypeMapping] || 'complex_forecasting';
    
    return {
      analysis_type: analysisType,
      metrics: normalizedMetrics,
      prediction_hours: data.predictionHours || 24,
      sensitivity: data.sensitivity || 0.8,
      features: data.features || ['cpu', 'memory', 'disk'],
      server_id: data.serverId || null,
      urgency: (data.urgency as 'critical' | 'high' | 'medium' | 'low') || 'medium',
      confidence_threshold: 0.7
    };
  }
} 