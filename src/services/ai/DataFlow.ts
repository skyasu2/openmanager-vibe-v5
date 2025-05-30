/**
 * 🔄 OpenManager v5 데이터 플로우 매니저
 * 
 * 데이터 생성기 → 서버 모니터링 → AI 에이전트 간의
 * 체계적인 데이터 흐름 관리 및 최적화
 */

import { EnhancedServerMetrics } from '../simulationEngine';
import { simulationEngine } from '../simulationEngine';
import { PythonWarmupService } from './PythonWarmupService';
import { autoScalingEngine } from './AutoScalingEngine';

export interface DataFlowMetrics {
  serverCount: number;
  dataGeneration: {
    lastUpdate: Date;
    updateInterval: number;
    generatedMetrics: number;
    realisticPatterns: boolean;
  };
  aiProcessing: {
    lastAnalysis: Date;
    aiResponses: number;
    pythonEngineActive: boolean;
    predictionAccuracy: number;
  };
  autoScaling: {
    lastDecision: Date;
    scalingActions: number;
    currentPolicy: any;
    targetServers: number;
  };
  performance: {
    dataLatency: number;
    aiLatency: number;
    uiRenderTime: number;
    memoryUsage: number;
  };
}

export class DataFlowManager {
  private static instance: DataFlowManager;
  private isRunning: boolean = false;
  private dataFlowMetrics: DataFlowMetrics;
  private pythonWarmup: PythonWarmupService;
  private lastServerData: EnhancedServerMetrics[] = [];
  
  // 데이터 플로우 타이밍 최적화
  private readonly FLOW_INTERVALS = {
    DATA_GENERATION: 5000,    // 5초마다 데이터 생성
    AI_ANALYSIS: 10000,       // 10초마다 AI 분석
    AUTO_SCALING: 30000,      // 30초마다 스케일링 검토
    UI_UPDATE: 3000,          // 3초마다 UI 업데이트
    PERFORMANCE_CHECK: 15000  // 15초마다 성능 체크
  };

  private constructor() {
    this.pythonWarmup = PythonWarmupService.getInstance();
    this.dataFlowMetrics = this.initializeMetrics();
  }

  static getInstance(): DataFlowManager {
    if (!this.instance) {
      this.instance = new DataFlowManager();
    }
    return this.instance;
  }

  private initializeMetrics(): DataFlowMetrics {
    return {
      serverCount: 0,
      dataGeneration: {
        lastUpdate: new Date(),
        updateInterval: this.FLOW_INTERVALS.DATA_GENERATION,
        generatedMetrics: 0,
        realisticPatterns: true
      },
      aiProcessing: {
        lastAnalysis: new Date(),
        aiResponses: 0,
        pythonEngineActive: false,
        predictionAccuracy: 0
      },
      autoScaling: {
        lastDecision: new Date(),
        scalingActions: 0,
        currentPolicy: null,
        targetServers: 8
      },
      performance: {
        dataLatency: 0,
        aiLatency: 0,
        uiRenderTime: 0,
        memoryUsage: 0
      }
    };
  }

  /**
   * 🚀 데이터 플로우 시작
   */
  async startDataFlow(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ 데이터 플로우가 이미 실행 중입니다');
      return;
    }

    console.log('🚀 데이터 플로우 매니저 시작...');
    this.isRunning = true;

    try {
      // Python AI 엔진 웜업
      const pythonStatus = await this.pythonWarmup.checkPythonStatus();
      this.dataFlowMetrics.aiProcessing.pythonEngineActive = pythonStatus.isWarm;
      
      // 데이터 플로우 타이머 시작
      this.startDataGenerationFlow();
      this.startAIAnalysisFlow();
      this.startAutoScalingFlow();
      this.startPerformanceMonitoring();

      console.log('✅ 데이터 플로우 매니저 시작 완료');
      
    } catch (error) {
      console.error('❌ 데이터 플로우 시작 실패:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 📊 데이터 생성 플로우
   */
  private startDataGenerationFlow(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      const startTime = Date.now();
      
      try {
        // 시뮬레이션 엔진에서 서버 데이터 가져오기
        const servers = simulationEngine.getServers();
        
        // 데이터 플로우 메트릭 업데이트
        this.dataFlowMetrics.serverCount = servers.length;
        this.dataFlowMetrics.dataGeneration.lastUpdate = new Date();
        this.dataFlowMetrics.dataGeneration.generatedMetrics++;
        this.dataFlowMetrics.performance.dataLatency = Date.now() - startTime;
        
        // 최신 데이터 캐시
        this.lastServerData = servers;
        
        console.log(`📊 데이터 생성 완료: ${servers.length}개 서버, ${Date.now() - startTime}ms`);
        
      } catch (error) {
        console.error('❌ 데이터 생성 플로우 오류:', error);
      }
    }, this.FLOW_INTERVALS.DATA_GENERATION);
  }

  /**
   * 🤖 AI 분석 플로우
   */
  private startAIAnalysisFlow(): void {
    setInterval(async () => {
      if (!this.isRunning || this.lastServerData.length === 0) return;

      const startTime = Date.now();
      
      try {
        // Python AI 엔진 상태 확인
        const pythonStatus = await this.pythonWarmup.checkPythonStatus();
        this.dataFlowMetrics.aiProcessing.pythonEngineActive = pythonStatus.isWarm;
        
        // AI 분석 실행 (Python 우선, TypeScript 폴백)
        let analysisResult = null;
        
        if (pythonStatus.isWarm) {
          // Python AI 엔진 사용
          try {
            const response = await fetch('/api/ai/mcp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'analyze',
                servers: this.lastServerData.slice(0, 10) // 성능을 위해 최대 10개 서버만 분석
              })
            });
            
            if (response.ok) {
              analysisResult = await response.json();
            }
          } catch (pythonError) {
            console.warn('⚠️ Python AI 분석 실패, TypeScript 폴백:', pythonError);
          }
        }
        
        // TypeScript 폴백 분석 (간단한 메트릭 계산)
        if (!analysisResult) {
          analysisResult = this.performBasicAnalysis(this.lastServerData);
        }
        
        // AI 분석 메트릭 업데이트
        this.dataFlowMetrics.aiProcessing.lastAnalysis = new Date();
        this.dataFlowMetrics.aiProcessing.aiResponses++;
        this.dataFlowMetrics.performance.aiLatency = Date.now() - startTime;
        
        console.log(`🤖 AI 분석 완료: ${this.dataFlowMetrics.aiProcessing.pythonEngineActive ? 'Python' : 'TypeScript'} 엔진, ${Date.now() - startTime}ms`);
        
      } catch (error) {
        console.error('❌ AI 분석 플로우 오류:', error);
      }
    }, this.FLOW_INTERVALS.AI_ANALYSIS);
  }

  /**
   * ⚖️ 자동 스케일링 플로우
   */
  private startAutoScalingFlow(): void {
    setInterval(async () => {
      if (!this.isRunning || this.lastServerData.length === 0) return;

      try {
        // 자동 스케일링 의사결정
        const scalingDecision = await autoScalingEngine.makeScalingDecision(this.lastServerData);
        
        // 스케일링 시뮬레이션 로그
        if (scalingDecision.action !== 'maintain') {
          console.log(`⚖️ 스케일링 시뮬레이션: ${scalingDecision.action} (${scalingDecision.currentServers} → ${scalingDecision.targetServers})`);
          this.dataFlowMetrics.autoScaling.scalingActions++;
        }
        
        // 스케일링 메트릭 업데이트
        this.dataFlowMetrics.autoScaling.lastDecision = new Date();
        this.dataFlowMetrics.autoScaling.currentPolicy = autoScalingEngine.getCurrentConfig();
        this.dataFlowMetrics.autoScaling.targetServers = scalingDecision.targetServers;
        
        console.log(`⚖️ 스케일링 검토 완료: ${scalingDecision.action}, 타겟: ${scalingDecision.targetServers}개`);
        
      } catch (error) {
        console.error('❌ 자동 스케일링 플로우 오류:', error);
      }
    }, this.FLOW_INTERVALS.AUTO_SCALING);
  }

  /**
   * 📈 성능 모니터링
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      if (!this.isRunning) return;

      try {
        // 메모리 사용량 추정
        const estimatedMemory = process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;
        this.dataFlowMetrics.performance.memoryUsage = estimatedMemory;
        
        // UI 렌더링 시간 추정 (평균 응답 시간 기반)
        const avgLatency = (this.dataFlowMetrics.performance.dataLatency + this.dataFlowMetrics.performance.aiLatency) / 2;
        this.dataFlowMetrics.performance.uiRenderTime = avgLatency;
        
        // 성능 경고 체크
        if (avgLatency > 5000) { // 5초 이상
          console.warn('⚠️ 데이터 플로우 지연 감지:', avgLatency, 'ms');
        }
        
        if (estimatedMemory > 512) { // 512MB 이상
          console.warn('⚠️ 높은 메모리 사용량 감지:', estimatedMemory.toFixed(1), 'MB');
        }
        
      } catch (error) {
        console.error('❌ 성능 모니터링 오류:', error);
      }
    }, this.FLOW_INTERVALS.PERFORMANCE_CHECK);
  }

  /**
   * 📊 기본 분석 수행 (TypeScript 폴백)
   */
  private performBasicAnalysis(servers: EnhancedServerMetrics[]): any {
    const totalServers = servers.length;
    const avgCpu = servers.reduce((sum, s) => sum + s.cpu_usage, 0) / totalServers;
    const avgMemory = servers.reduce((sum, s) => sum + s.memory_usage, 0) / totalServers;
    const criticalServers = servers.filter(s => s.status === 'critical').length;
    
    return {
      analysis: 'basic_metrics',
      server_count: totalServers,
      avg_cpu: avgCpu.toFixed(1),
      avg_memory: avgMemory.toFixed(1),
      critical_servers: criticalServers,
      health_score: ((totalServers - criticalServers) / totalServers * 100).toFixed(1),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🛑 데이터 플로우 중지
   */
  stopDataFlow(): void {
    console.log('🛑 데이터 플로우 매니저 중지...');
    this.isRunning = false;
  }

  /**
   * 📊 현재 데이터 플로우 메트릭 반환
   */
  getMetrics(): DataFlowMetrics {
    return { ...this.dataFlowMetrics };
  }

  /**
   * 🔍 데이터 플로우 상태 확인
   */
  getStatus(): {
    isRunning: boolean;
    serverCount: number;
    lastUpdate: Date;
    aiEngineActive: boolean;
    scalingActive: boolean;
  } {
    return {
      isRunning: this.isRunning,
      serverCount: this.dataFlowMetrics.serverCount,
      lastUpdate: this.dataFlowMetrics.dataGeneration.lastUpdate,
      aiEngineActive: this.dataFlowMetrics.aiProcessing.pythonEngineActive,
      scalingActive: this.dataFlowMetrics.autoScaling.scalingActions > 0
    };
  }

  /**
   * 🎯 최신 서버 데이터 반환
   */
  getLatestServerData(): EnhancedServerMetrics[] {
    return [...this.lastServerData];
  }
}

// 싱글톤 인스턴스 내보내기
export const dataFlowManager = DataFlowManager.getInstance(); 