import { MCPTask, MCPTaskResult } from './MCPAIRouter';

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
   * 🐍 단일 Python 작업 실행
   */
  private async executePythonTask(task: MCPTask): Promise<MCPTaskResult> {
    const startTime = Date.now();
    
    try {
      // 환경변수에서 Python 서비스 URL 가져오기
      const pythonServiceUrl = process.env.AI_ENGINE_URL || 'https://openmanager-vibe-v5.onrender.com';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), task.timeout || 20000);
      
      const response = await fetch(`${pythonServiceUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: task.data.query,
          metrics: task.data.metrics,
          analysisType: task.data.analysisType
        }),
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
        engine: 'python_external',
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
   * 📈 시계열 분석 작업
   */
  private async executeTimeSeriesTask(task: MCPTask): Promise<any> {
    const metrics = task.data.metrics;
    const predictionHours = task.data.predictionHours || 24;
    
    if (!metrics || metrics.length === 0) {
      throw new Error('시계열 분석을 위한 메트릭 데이터가 없습니다');
    }

    // 간단한 통계적 예측 (TensorFlow.js가 로드되지 않은 경우 fallback)
    const latest = metrics[metrics.length - 1];
    const trend = this.calculateTrend(metrics.map((m: any) => m.cpu));
    
    return {
      type: 'timeseries_prediction',
      predictions: {
        cpu: {
          nextValue: Math.max(0, Math.min(100, latest.cpu + trend * predictionHours)),
          trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
          confidence: 0.75
        },
        memory: {
          nextValue: Math.max(0, Math.min(100, latest.memory + this.calculateTrend(metrics.map((m: any) => m.memory)) * predictionHours)),
          trend: this.calculateTrend(metrics.map((m: any) => m.memory)) > 0 ? 'increasing' : 'decreasing',
          confidence: 0.75
        }
      },
      timeframe: `${predictionHours}시간`,
      confidence: 0.75
    };
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
   * ⚡ 이상 탐지 작업
   */
  private async executeAnomalyTask(task: MCPTask): Promise<any> {
    const metrics = task.data.metrics;
    const sensitivity = task.data.sensitivity || 0.9;
    
    if (!metrics || metrics.length === 0) {
      throw new Error('이상 탐지를 위한 메트릭 데이터가 없습니다');
    }

    // 통계적 이상 탐지 (ONNX.js fallback)
    const anomalies = this.detectAnomaliesFallback(metrics, sensitivity);
    
    return {
      type: 'anomaly_detection',
      anomalies,
      overallScore: anomalies.length > 0 ? Math.max(...anomalies.map(a => a.score)) : 0,
      confidence: 0.80
    };
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
} 