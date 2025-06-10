/**
 * 🎭 AI 엔진 오케스트레이터 v1.0
 *
 * 책임:
 * - 여러 AI 엔진 초기화 및 관리
 * - 엔진 성능 통계 및 모니터링
 * - 하이브리드 분석 실행
 * - 엔진 상태 관리 및 복구
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { TensorFlowAIEngine } from '../../tensorflow-engine';
import { KoreanAIEngine } from '../../korean-ai-engine';
import { TransformersEngine } from '../../transformers-engine';
import { DocumentContext } from '../managers/DocumentIndexManager';

interface SmartQuery {
  originalQuery: string;
  intent:
    | 'analysis'
    | 'search'
    | 'prediction'
    | 'optimization'
    | 'troubleshooting';
  keywords: string[];
  requiredDocs: string[];
  mcpActions: string[];
  tensorflowModels: string[];
  isKorean: boolean;
  useTransformers: boolean;
  useVectorSearch: boolean;
}

interface EngineStats {
  korean: {
    initialized: boolean;
    successCount: number;
    avgTime: number;
    errorCount: number;
  };
  tensorflow: {
    initialized: boolean;
    successCount: number;
    avgTime: number;
    errorCount: number;
  };
  transformers: {
    initialized: boolean;
    successCount: number;
    avgTime: number;
    errorCount: number;
  };
  mcp: {
    initialized: boolean;
    successCount: number;
    avgTime: number;
    errorCount: number;
  };
}

interface HybridAnalysisResult {
  korean?: any;
  tensorflow?: any;
  transformers?: any;
  mcp?: any;
  confidence: number;
  engineUsed: 'korean' | 'tensorflow' | 'transformers' | 'mcp' | 'hybrid';
  processingTime: number;
  success: boolean;
}

export class AIEngineOrchestrator {
  private mcpClient: RealMCPClient;
  private tensorflowEngine: TensorFlowAIEngine;
  private koreanEngine: KoreanAIEngine;
  private transformersEngine: TransformersEngine;

  private isInitialized = false;
  private initializationAttempts = 0;
  private readonly maxInitAttempts = 3;

  // 성능 추적
  private engineStats: EngineStats = {
    korean: { initialized: false, successCount: 0, avgTime: 0, errorCount: 0 },
    tensorflow: {
      initialized: false,
      successCount: 0,
      avgTime: 0,
      errorCount: 0,
    },
    transformers: {
      initialized: false,
      successCount: 0,
      avgTime: 0,
      errorCount: 0,
    },
    mcp: { initialized: false, successCount: 0, avgTime: 0, errorCount: 0 },
  };

  constructor() {
    this.mcpClient = new RealMCPClient();
    this.tensorflowEngine = new TensorFlowAIEngine();
    this.koreanEngine = new KoreanAIEngine();
    this.transformersEngine = new TransformersEngine();

    console.log('🎭 AI Engine Orchestrator 인스턴스 생성');
  }

  /**
   * 🚀 AI 엔진들 초기화 (우선순위 기반)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.initializationAttempts++;
    console.log(
      `🚀 AI 엔진들 초기화 시작... (시도 ${this.initializationAttempts}/${this.maxInitAttempts})`
    );

    try {
      // Phase 1: 핵심 엔진 병렬 초기화 (빠른 응답을 위해)
      const corePromises = [
        this.initializeKoreanEngine(),
        this.initializeTransformersEngine(),
        this.initializeMCPClient(),
      ];

      await Promise.allSettled(corePromises);
      console.log('✅ 핵심 엔진 초기화 완료 (한국어 + Transformers + MCP)');

      // Phase 2: TensorFlow.js 백그라운드 초기화 (옵션)
      this.initializeTensorFlowInBackground();
      console.log('⏳ TensorFlow.js 백그라운드 초기화 시작');

      this.isInitialized = true;
      this.logEngineStatus();

      console.log(`✅ AI 엔진 오케스트레이터 초기화 완료`);
    } catch (error) {
      console.error(
        `❌ AI 엔진 초기화 실패 (시도 ${this.initializationAttempts}):`,
        error
      );

      if (this.initializationAttempts < this.maxInitAttempts) {
        console.log(`🔄 ${this.initializationAttempts + 1}초 후 재시도...`);
        setTimeout(
          () => this.initialize(),
          (this.initializationAttempts + 1) * 1000
        );
      } else {
        console.error(
          `💥 최대 초기화 시도 횟수 초과 (${this.maxInitAttempts})`
        );
        throw error;
      }
    }
  }

  /**
   * 🇰🇷 한국어 엔진 초기화
   */
  private async initializeKoreanEngine(): Promise<void> {
    const startTime = Date.now();

    try {
      await this.koreanEngine.initialize();
      this.engineStats.korean.initialized = true;
      this.updateEngineStats('korean', Date.now() - startTime, true);
      console.log('✅ 한국어 AI 엔진 초기화 완료');
    } catch (error) {
      this.updateEngineStats('korean', Date.now() - startTime, false);
      console.warn('⚠️ 한국어 엔진 초기화 실패:', error);
    }
  }

  /**
   * 🤖 Transformers.js 엔진 초기화
   */
  private async initializeTransformersEngine(): Promise<void> {
    const startTime = Date.now();

    try {
      await this.transformersEngine.initialize();
      this.engineStats.transformers.initialized = true;
      this.updateEngineStats('transformers', Date.now() - startTime, true);
      console.log('✅ Transformers.js 엔진 초기화 완료');
    } catch (error) {
      this.updateEngineStats('transformers', Date.now() - startTime, false);
      console.warn('⚠️ Transformers.js 엔진 초기화 실패:', error);
    }
  }

  /**
   * 📚 MCP 클라이언트 초기화
   */
  private async initializeMCPClient(): Promise<void> {
    const startTime = Date.now();

    try {
      await this.mcpClient.initialize();
      this.engineStats.mcp.initialized = true;
      this.updateEngineStats('mcp', Date.now() - startTime, true);
      console.log('✅ MCP 클라이언트 초기화 완료');
    } catch (error) {
      this.updateEngineStats('mcp', Date.now() - startTime, false);
      console.warn('⚠️ MCP 클라이언트 초기화 실패:', error);
    }
  }

  /**
   * 🔧 TensorFlow.js 백그라운드 초기화
   */
  private async initializeTensorFlowInBackground(): Promise<void> {
    setTimeout(async () => {
      const startTime = Date.now();

      try {
        await this.tensorflowEngine.initialize();
        this.engineStats.tensorflow.initialized = true;
        this.updateEngineStats('tensorflow', Date.now() - startTime, true);
        console.log('✅ TensorFlow.js 엔진 백그라운드 초기화 완료');
      } catch (error) {
        this.updateEngineStats('tensorflow', Date.now() - startTime, false);
        console.warn('⚠️ TensorFlow.js 엔진 초기화 실패:', error);
      }
    }, 2000); // 2초 후 초기화
  }

  /**
   * 🔄 하이브리드 분석 실행
   */
  async runHybridAnalysis(
    smartQuery: SmartQuery,
    documents: DocumentContext[]
  ): Promise<HybridAnalysisResult> {
    const startTime = Date.now();
    console.log(`🔄 하이브리드 분석 시작: "${smartQuery.originalQuery}"`);

    const results: Partial<HybridAnalysisResult> = {
      confidence: 0,
      engineUsed: 'hybrid',
      success: false,
    };

    try {
      // 병렬로 여러 엔진 실행
      const analysisPromises: Promise<any>[] = [];

      // 1. 한국어 분석 (한국어 쿼리인 경우)
      if (smartQuery.isKorean && this.engineStats.korean.initialized) {
        analysisPromises.push(this.runKoreanAnalysis(smartQuery, documents));
      }

      // 2. Transformers.js 분석 (항상 실행)
      if (
        smartQuery.useTransformers &&
        this.engineStats.transformers.initialized
      ) {
        analysisPromises.push(
          this.runTransformersAnalysis(smartQuery, documents)
        );
      }

      // 3. TensorFlow 분석 (예측 작업인 경우)
      if (
        smartQuery.intent === 'prediction' &&
        this.engineStats.tensorflow.initialized
      ) {
        analysisPromises.push(
          this.runTensorFlowAnalysis(smartQuery, documents)
        );
      }

      // 4. MCP 액션 실행
      if (
        smartQuery.mcpActions.length > 0 &&
        this.engineStats.mcp.initialized
      ) {
        analysisPromises.push(this.executeMCPActions(smartQuery));
      }

      // 모든 분석 결과 수집
      const analysisResults = await Promise.allSettled(analysisPromises);

      // 결과 통합
      let totalConfidence = 0;
      let successfulResults = 0;

      analysisResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successfulResults++;

          if (index === 0 && smartQuery.isKorean) {
            results.korean = result.value;
            totalConfidence += result.value.confidence || 0.7;
          } else if (index === 1 || (index === 0 && !smartQuery.isKorean)) {
            results.transformers = result.value;
            totalConfidence += result.value.confidence || 0.8;
          } else if (smartQuery.intent === 'prediction') {
            results.tensorflow = result.value;
            totalConfidence += result.value.confidence || 0.6;
          } else {
            results.mcp = result.value;
            totalConfidence += 0.5; // MCP 액션은 고정 신뢰도
          }
        }
      });

      // 평균 신뢰도 계산
      results.confidence =
        successfulResults > 0 ? totalConfidence / successfulResults : 0;
      results.success = successfulResults > 0;

      // 주요 엔진 결정
      results.engineUsed = this.determineMainEngine(results, smartQuery);

      const processingTime = Date.now() - startTime;
      results.processingTime = processingTime;

      console.log(
        `✅ 하이브리드 분석 완료: 신뢰도 ${(results.confidence * 100).toFixed(1)}% (${processingTime}ms)`
      );
      console.log(
        `📊 사용된 엔진: ${results.engineUsed}, 성공한 분석: ${successfulResults}개`
      );

      return results as HybridAnalysisResult;
    } catch (error) {
      console.error('❌ 하이브리드 분석 실패:', error);
      return {
        confidence: 0,
        engineUsed: 'hybrid',
        processingTime: Date.now() - startTime,
        success: false,
      };
    }
  }

  /**
   * 🇰🇷 한국어 분석 실행
   */
  private async runKoreanAnalysis(
    smartQuery: SmartQuery,
    documents: DocumentContext[]
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // 임시: KoreanAIEngine.analyze() 메서드 시뮬레이션
      const result = {
        success: true,
        analysis: `한국어 분석 결과: ${smartQuery.originalQuery}`,
        confidence: 0.8,
        keywords: smartQuery.keywords,
      };
      this.updateEngineStats('korean', Date.now() - startTime, true);
      return { ...result, confidence: 0.8 };
    } catch (error) {
      this.updateEngineStats('korean', Date.now() - startTime, false);
      console.warn('⚠️ 한국어 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 🤖 Transformers.js 분석 실행
   */
  private async runTransformersAnalysis(
    smartQuery: SmartQuery,
    documents: DocumentContext[]
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // 임시: TransformersEngine.analyze() 메서드 시뮬레이션
      const result = {
        success: true,
        analysis: `Transformers 분석 결과: ${smartQuery.originalQuery}`,
        confidence: 0.9,
        embeddings: [],
      };
      this.updateEngineStats('transformers', Date.now() - startTime, true);
      return { ...result, confidence: 0.9 };
    } catch (error) {
      this.updateEngineStats('transformers', Date.now() - startTime, false);
      console.warn('⚠️ Transformers 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 🧠 TensorFlow 분석 실행
   */
  private async runTensorFlowAnalysis(
    smartQuery: SmartQuery,
    documents: DocumentContext[]
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // 실제 TensorFlow 엔진 사용
      if (this.tensorflowEngine?.predictFailureFromRealData) {
        // 실제 데이터 기반 예측
        const realPrediction =
          await this.tensorflowEngine.predictFailureFromRealData();
        this.updateEngineStats('tensorflow', Date.now() - startTime, true);

        console.log(
          `🎯 실제 데이터 기반 TensorFlow 분석 완료: ${realPrediction.data_source}, ${realPrediction.sample_size}개 샘플`
        );

        return {
          predictions: realPrediction.prediction,
          confidence: realPrediction.confidence,
          modelUsed: realPrediction.model_info,
          dataSource: realPrediction.data_source,
          sampleSize: realPrediction.sample_size,
          processingTime: realPrediction.processing_time,
        };
      }

      // Fallback: 기존 더미 방식
      console.warn('⚠️ TensorFlow 실제 데이터 분석 불가, fallback 사용');
      const mockPrediction = {
        predictions: [0.3, 0.2, 0.4], // 낮은 더미값
        confidence: 0.3,
        modelUsed: 'fallback-model',
        dataSource: 'mock',
        sampleSize: 0,
      };

      this.updateEngineStats('tensorflow', Date.now() - startTime, true);
      return mockPrediction;
    } catch (error) {
      this.updateEngineStats('tensorflow', Date.now() - startTime, false);
      console.warn('⚠️ TensorFlow 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 📚 MCP 액션 실행
   */
  private async executeMCPActions(smartQuery: SmartQuery): Promise<string[]> {
    const startTime = Date.now();

    try {
      const results: string[] = [];

      for (const action of smartQuery.mcpActions) {
        try {
          // 임시: RealMCPClient.executeAction() 메서드 시뮬레이션
          const result = `MCP 액션 실행됨: ${action}`;
          results.push(`${action}: ${result}`);
        } catch (error) {
          console.warn(`⚠️ MCP 액션 실패 (${action}):`, error);
          results.push(`${action}: 실패`);
        }
      }

      this.updateEngineStats('mcp', Date.now() - startTime, true);
      return results;
    } catch (error) {
      this.updateEngineStats('mcp', Date.now() - startTime, false);
      console.warn('⚠️ MCP 액션 실행 실패:', error);
      throw error;
    }
  }

  /**
   * 🎯 주요 엔진 결정
   */
  private determineMainEngine(
    results: Partial<HybridAnalysisResult>,
    smartQuery: SmartQuery
  ): HybridAnalysisResult['engineUsed'] {
    if (results.korean && smartQuery.isKorean) return 'korean';
    if (results.transformers) return 'transformers';
    if (results.tensorflow && smartQuery.intent === 'prediction')
      return 'tensorflow';
    if (results.mcp) return 'mcp';
    return 'hybrid';
  }

  /**
   * 📊 엔진 통계 업데이트
   */
  private updateEngineStats(
    engine: keyof EngineStats,
    processingTime: number,
    success: boolean
  ): void {
    const stats = this.engineStats[engine];

    if (success) {
      stats.successCount++;
      // 평균 시간 업데이트
      const totalTime =
        stats.avgTime * (stats.successCount - 1) + processingTime;
      stats.avgTime = totalTime / stats.successCount;
    } else {
      stats.errorCount++;
    }
  }

  /**
   * 📊 엔진 상태 로깅
   */
  private logEngineStatus(): void {
    console.log('📊 AI 엔진 상태:');
    Object.entries(this.engineStats).forEach(([engine, stats]) => {
      const status = stats.initialized ? '✅' : '❌';
      const successRate =
        stats.successCount + stats.errorCount > 0
          ? Math.round(
              (stats.successCount / (stats.successCount + stats.errorCount)) *
                100
            )
          : 0;

      console.log(
        `   ${status} ${engine}: 초기화됨=${stats.initialized}, 성공률=${successRate}%, 평균시간=${Math.round(stats.avgTime)}ms`
      );
    });
  }

  /**
   * 🔄 엔진 재시작
   */
  async restartEngine(engineName: keyof EngineStats): Promise<void> {
    console.log(`🔄 ${engineName} 엔진 재시작 중...`);

    try {
      switch (engineName) {
        case 'korean':
          await this.initializeKoreanEngine();
          break;
        case 'transformers':
          await this.initializeTransformersEngine();
          break;
        case 'tensorflow':
          await this.initializeTensorFlowInBackground();
          break;
        case 'mcp':
          await this.initializeMCPClient();
          break;
      }
      console.log(`✅ ${engineName} 엔진 재시작 완료`);
    } catch (error) {
      console.error(`❌ ${engineName} 엔진 재시작 실패:`, error);
    }
  }

  /**
   * 📊 성능 통계 조회
   */
  getPerformanceStats(): EngineStats {
    return JSON.parse(JSON.stringify(this.engineStats));
  }

  /**
   * 🔍 엔진 헬스 체크
   */
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    engines: Record<keyof EngineStats, 'healthy' | 'unhealthy'>;
    recommendations: string[];
  }> {
    const engines: Record<keyof EngineStats, 'healthy' | 'unhealthy'> = {
      korean: this.engineStats.korean.initialized ? 'healthy' : 'unhealthy',
      transformers: this.engineStats.transformers.initialized
        ? 'healthy'
        : 'unhealthy',
      tensorflow: this.engineStats.tensorflow.initialized
        ? 'healthy'
        : 'unhealthy',
      mcp: this.engineStats.mcp.initialized ? 'healthy' : 'unhealthy',
    };

    const healthyCount = Object.values(engines).filter(
      status => status === 'healthy'
    ).length;
    const recommendations: string[] = [];

    // 권장사항 생성
    if (!engines.korean) recommendations.push('한국어 엔진 재시작 필요');
    if (!engines.transformers)
      recommendations.push('Transformers 엔진 재시작 필요');
    if (!engines.mcp) recommendations.push('MCP 클라이언트 재연결 필요');

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount >= 3) overall = 'healthy';
    else if (healthyCount >= 2) overall = 'degraded';
    else overall = 'unhealthy';

    return { overall, engines, recommendations };
  }

  /**
   * 🧹 정리
   */
  dispose(): void {
    // 각 엔진 정리
    // 임시: dispose 메서드들이 구현되지 않아 주석 처리
    // this.koreanEngine?.dispose?.();
    // this.transformersEngine?.dispose?.();
    // this.tensorflowEngine?.dispose?.();
    // this.mcpClient?.dispose?.();

    // 통계 리셋
    Object.keys(this.engineStats).forEach(key => {
      const engine = key as keyof EngineStats;
      this.engineStats[engine] = {
        initialized: false,
        successCount: 0,
        avgTime: 0,
        errorCount: 0,
      };
    });

    this.isInitialized = false;
    console.log('🧹 AI Engine Orchestrator 정리 완료');
  }
}
