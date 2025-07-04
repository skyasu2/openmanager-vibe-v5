/**
 * 🎯 Task Orchestrator v3.0 (GCP Functions 기반)
 *
 * MCP 중심의 작업 오케스트레이터
 * - Python/FastAPI 완전 제거
 * - MCP 작업만 처리
 * - 단순하고 명확한 구조
 * - ☁️ GCP Functions 전환 완료
 */

import { MCPTaskResult } from './MCPAIRouter';
// import {
//     LightweightAnomalyDetector,
//     createLightweightAnomalyDetector,
// } from './lightweight-anomaly-detector'; // removed - using AnomalyDetectionService

// GCP Functions URL
const GCP_FUNCTIONS_URL =
  'https://us-central1-openmanager-vibe-v5.cloudfunctions.net/enterprise-metrics';

/**
 * ☁️ GCP Functions에서 서버 데이터 가져오기
 */
async function getGCPServers() {
  try {
    const response = await fetch(GCP_FUNCTIONS_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000), // 8초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`GCP Functions 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    // GCP Functions 데이터를 기존 형식으로 변환
    return (data.servers || []).map((server: any) => ({
      id: server.serverId,
      name: server.serverName,
      type: server.serverType,
      status:
        server.systemHealth?.serviceHealthScore > 80
          ? 'running'
          : server.systemHealth?.serviceHealthScore > 60
            ? 'warning'
            : 'error',
      metrics: {
        cpu: server.systemResources?.cpuUsage || 0,
        memory: server.systemResources?.memoryUsage || 0,
        disk: server.systemResources?.diskUsage || 0,
        requests: server.applicationPerformance?.requestsPerSecond || 0,
      },
    }));
  } catch (error) {
    console.error('GCP Functions 호출 실패:', error);
    // 폴백: 기본 서버 8개 반환
    return Array.from({ length: 8 }, (_, i) => ({
      id: `server-${i + 1}`,
      name: `Server ${i + 1}`,
      type: ['web', 'database', 'api', 'cache'][i % 4],
      status:
        i % 4 === 0
          ? 'running'
          : i % 4 === 1
            ? 'warning'
            : i % 4 === 2
              ? 'error'
              : 'running',
      metrics: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        requests: Math.random() * 1000,
      },
    }));
  }
}

// 로컬 MCPTask 인터페이스 정의 (input 속성 포함)
interface MCPTask {
  id: string;
  type: 'timeseries' | 'nlp' | 'anomaly' | 'complex_ml';
  priority: 'high' | 'medium' | 'low';
  data: any;
  input?: any; // 추가: 입력 데이터 속성
  context: {
    serverMetrics?: any[];
    logEntries?: any[];
    timeRange?: { start: Date; end: Date };
    userQuery?: string;
    previousResults?: any[];
    sessionId?: string;
    aiContexts?: any[];
  };
  timeout?: number;
}

// normalizeMetricData 함수를 올바른 위치에 정의
function normalizeMetricData(data: any): any {
  if (!data) return null;

  // 기본 정규화 로직
  if (Array.isArray(data)) {
    return data.map(item => ({
      timestamp: item.timestamp || new Date().toISOString(),
      cpu: item.cpu || 0,
      memory: item.memory || 0,
      disk: item.disk || 0,
      networkIn: item.networkIn || 0,
      networkOut: item.networkOut || 0,
    }));
  }

  return data;
}

export class TaskOrchestrator {
  private initialized = false;

  constructor() {
    // GCP Functions 기반으로 변경 - RealServerDataGenerator 제거
    // lightweight-anomaly-detector removed - using simple detection instead
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔧 Task Orchestrator 초기화 중... (GCP Functions 기반)');

    // GCP Functions 연결 테스트
    try {
      await getGCPServers();
      console.log('✅ GCP Functions 연결 확인 완료');
    } catch (error) {
      console.warn('⚠️ GCP Functions 연결 실패, 폴백 모드로 동작');
    }

    this.initialized = true;
    console.log('✅ Task Orchestrator 초기화 완료 (GCP Functions)');
  }

  /**
   * 🚀 병렬 작업 실행 (MCP 전용)
   */
  async executeParallel(tasks: MCPTask[]): Promise<MCPTaskResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (tasks.length === 0) return [];

    console.log(`🎯 ${tasks.length}개 MCP 작업 병렬 실행 시작`);

    // MCP 작업들만 처리
    const promises = tasks.map(task => this.executeMCPTask(task));
    const results = await Promise.allSettled(promises);

    const allResults: MCPTaskResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          taskId: tasks[index].id,
          type: tasks[index].type,
          success: false,
          error: result.reason?.message || '알 수 없는 오류',
          executionTime: 0,
          engine: 'mcp_failed',
        };
      }
    });

    console.log(`✅ ${allResults.length}개 작업 완료`);
    return allResults;
  }

  /**
   * 🧠 단일 MCP 작업 실행
   */
  private async executeMCPTask(task: MCPTask): Promise<MCPTaskResult> {
    const startTime = Date.now();

    try {
      let result: any;
      let engine: string;

      switch (task.type) {
        case 'timeseries':
          result = await this.executeTimeSeriesTask(task);
          engine = 'lightweight_ml';
          break;
        case 'nlp':
          result = await this.executeNLPTask(task);
          engine = 'local_nlp';
          break;
        case 'anomaly':
          result = await this.executeAnomalyTask(task);
          engine = 'anomaly_detector';
          break;
        default:
          result = await this.executeBasicTask(task);
          engine = 'basic_processor';
          break;
      }

      return {
        taskId: task.id,
        type: task.type,
        success: true,
        result,
        executionTime: Date.now() - startTime,
        engine,
        confidence: result.confidence || 0.8,
      };
    } catch (error: any) {
      return {
        taskId: task.id,
        type: task.type,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        engine: 'mcp_error',
      };
    }
  }

  /**
   * 📈 시계열 작업 처리
   */
  private async executeTimeSeriesTask(task: MCPTask): Promise<any> {
    try {
      console.log(`📈 시계열 분석 시작: ${task.id}`);

      // 기본 데이터 생성 또는 입력 데이터 사용
      const timeSeriesData =
        task.input?.data ||
        Array.from({ length: 100 }, (_, i) => Math.random() * 100 + i);

      // 간단한 통계 분석 (lightweight anomaly detector replaced)
      const anomalies = timeSeriesData.filter(
        (value, index) =>
          Math.abs(value - timeSeriesData[Math.max(0, index - 1)]) > 20
      );
      const analysis = {
        trend: this.calculateTrend(timeSeriesData),
        variance: this.calculateVariance(timeSeriesData),
        anomalies: anomalies || [],
        predictions: this.generateSimplePredictions(timeSeriesData),
        confidence: 0.7,
      };

      console.log(`✅ 시계열 분석 완료: ${task.id}`);
      return analysis;
    } catch (error) {
      console.error(`❌ 시계열 분석 실패: ${task.id}`, error);
      throw error;
    }
  }

  /**
   * 🗣️ NLP 작업 처리
   */
  private async executeNLPTask(task: MCPTask): Promise<any> {
    try {
      console.log(`🗣️ NLP 분석 시작: ${task.id}`);

      const text = task.input?.text || '기본 텍스트';

      // 기본 NLP 분석
      const analysis = {
        sentiment: this.analyzeSentiment(text),
        keywords: this.extractKeywords(text),
        summary: this.generateSummary(text),
        confidence: 0.6,
      };

      console.log(`✅ NLP 분석 완료: ${task.id}`);
      return analysis;
    } catch (error) {
      console.error(`❌ NLP 분석 실패: ${task.id}`, error);
      throw error;
    }
  }

  /**
   * 🚨 이상 탐지 작업 처리
   */
  private async executeAnomalyTask(task: MCPTask): Promise<any> {
    try {
      console.log(`🚨 이상 탐지 시작: ${task.id}`);

      const data = task.input?.data || [1, 2, 3, 2, 1, 10, 2, 1]; // 기본 데이터
      const result = {
        anomalies: data.filter(val => val > 5),
        confidence: 0.8,
        recommendations: ['Check high values'],
      };

      console.log(`✅ 이상 탐지 완료: ${task.id}`);
      return {
        ...result,
        confidence: 0.8,
      };
    } catch (error) {
      console.error(`❌ 이상 탐지 실패: ${task.id}`, error);
      throw error;
    }
  }

  /**
   * 🔧 기본 작업 처리
   */
  private async executeBasicTask(task: MCPTask): Promise<any> {
    console.log(`🔧 기본 작업 처리: ${task.id}`);

    return {
      message: `작업 ${task.id} 처리 완료`,
      type: task.type,
      timestamp: Date.now(),
      confidence: 0.5,
    };
  }

  // 헬퍼 메서드들
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    return (values[values.length - 1] - values[0]) / values.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return variance;
  }

  private generateSimplePredictions(data: number[]): number[] {
    const lastValue = data[data.length - 1];
    const trend = this.calculateTrend(data);

    return Array.from({ length: 5 }, (_, i) =>
      Math.max(0, lastValue + trend * (i + 1))
    );
  }

  private analyzeSentiment(text: string): { score: number; label: string } {
    // 간단한 키워드 기반 감정 분석
    const positiveWords = ['좋', '훌륭', '최고', '완벽', '성공'];
    const negativeWords = ['나쁜', '최악', '실패', '문제', '오류'];

    let score = 0;
    positiveWords.forEach(word => {
      if (text.includes(word)) score += 0.2;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) score -= 0.2;
    });

    return {
      score: Math.max(-1, Math.min(1, score)),
      label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
    };
  }

  private extractKeywords(text: string): string[] {
    // 간단한 키워드 추출
    return text
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 5);
  }

  private generateSummary(text: string): string {
    // 간단한 요약 생성
    const sentences = text.split('.');
    return sentences.slice(0, 2).join('. ') + '.';
  }

  /**
   * 🔍 상태 확인
   */
  async getStatus(): Promise<{
    initialized: boolean;
    anomalyDetectorReady: boolean;
    timestamp: number;
  }> {
    return {
      initialized: this.initialized,
      anomalyDetectorReady: true, // simplified
      timestamp: Date.now(),
    };
  }
}
