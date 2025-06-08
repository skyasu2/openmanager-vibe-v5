/**
 * 🏭 AI 엔진 팩토리
 * 
 * Factory Pattern: AI 엔진 인스턴스 생성과 초기화를 담당
 * Dependency Injection: 엔진 간 의존성 관리
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { TensorFlowAIEngine } from '../../tensorflow-engine';
import { KoreanAIEngine } from '../../korean-ai-engine';
import { TransformersEngine } from '../../transformers-engine';
import { LocalVectorDB } from '../../local-vector-db';
import { EngineInstance, EngineConfiguration, EngineStats } from '../types/HybridTypes';

export class EngineFactory {
  private static instance: EngineFactory;
  private engines: Map<string, EngineInstance> = new Map();
  private configuration: EngineConfiguration;

  private constructor(configuration?: Partial<EngineConfiguration>) {
    this.configuration = this.getDefaultConfiguration();
    if (configuration) {
      this.configuration = { ...this.configuration, ...configuration };
    }
  }

  public static getInstance(configuration?: Partial<EngineConfiguration>): EngineFactory {
    if (!EngineFactory.instance) {
      EngineFactory.instance = new EngineFactory(configuration);
    }
    return EngineFactory.instance;
  }

  /**
   * 모든 엔진 인스턴스 생성
   */
  public createEngines(): {
    mcpClient: RealMCPClient;
    tensorflowEngine: TensorFlowAIEngine;
    koreanEngine: KoreanAIEngine;
    transformersEngine: TransformersEngine;
    vectorDB: LocalVectorDB;
  } {
    console.log('🏭 AI 엔진 팩토리에서 엔진 인스턴스 생성');

    const mcpClient = new RealMCPClient();
    const tensorflowEngine = new TensorFlowAIEngine();
    const koreanEngine = new KoreanAIEngine();
    const transformersEngine = new TransformersEngine();
    const vectorDB = new LocalVectorDB();

    // 엔진 등록
    this.registerEngine('mcp', mcpClient);
    this.registerEngine('tensorflow', tensorflowEngine);
    this.registerEngine('korean', koreanEngine);
    this.registerEngine('transformers', transformersEngine);
    this.registerEngine('vector', vectorDB);

    return {
      mcpClient,
      tensorflowEngine,
      koreanEngine,
      transformersEngine,
      vectorDB,
    };
  }

  /**
   * 우선순위 기반 엔진 초기화
   */
  public async initializeEngines(engines: {
    mcpClient: RealMCPClient;
    tensorflowEngine: TensorFlowAIEngine;
    koreanEngine: KoreanAIEngine;
    transformersEngine: TransformersEngine;
    vectorDB: LocalVectorDB;
  }): Promise<EngineStats> {
    console.log('🚀 우선순위 기반 엔진 초기화 시작');

    const stats: EngineStats = {
      korean: { initialized: false, successCount: 0, avgTime: 0 },
      tensorflow: { initialized: false, successCount: 0, avgTime: 0 },
      transformers: { initialized: false, successCount: 0, avgTime: 0 },
      vector: { initialized: false, documentCount: 0, searchCount: 0 },
    };

    // Phase 1: 고우선순위 엔진들 병렬 초기화
    const corePromises = [];
    
    if (this.configuration.korean.enabled) {
      corePromises.push(this.initializeKoreanEngine(engines.koreanEngine, stats));
    }
    
    if (this.configuration.transformers.enabled) {
      corePromises.push(this.initializeTransformersEngine(engines.transformersEngine, stats));
    }
    
    if (this.configuration.mcp.enabled) {
      corePromises.push(this.initializeMCPClient(engines.mcpClient));
    }

    await Promise.all(corePromises);
    console.log('✅ 핵심 엔진 초기화 완료');

    // Phase 2: 벡터 DB 초기화
    if (this.configuration.vector.enabled) {
      await this.initializeVectorDB(engines.vectorDB, stats);
    }

    // Phase 3: TensorFlow 백그라운드 초기화
    if (this.configuration.tensorflow.enabled) {
      if (this.configuration.tensorflow.backgroundInit) {
        this.initializeTensorFlowInBackground(engines.tensorflowEngine, stats);
      } else {
        await this.initializeTensorFlowEngine(engines.tensorflowEngine, stats);
      }
    }

    return stats;
  }

  /**
   * 한국어 엔진 초기화
   */
  private async initializeKoreanEngine(
    engine: KoreanAIEngine, 
    stats: EngineStats
  ): Promise<void> {
    try {
      const startTime = Date.now();
      await engine.initialize();
      stats.korean.initialized = true;
      stats.korean.avgTime = Date.now() - startTime;
      console.log('✅ 한국어 AI 엔진 초기화 완료');
    } catch (error) {
      console.warn('⚠️ 한국어 엔진 초기화 실패:', error);
    }
  }

  /**
   * Transformers 엔진 초기화
   */
  private async initializeTransformersEngine(
    engine: TransformersEngine,
    stats: EngineStats
  ): Promise<void> {
    try {
      const startTime = Date.now();
      await engine.initialize();
      stats.transformers.initialized = true;
      stats.transformers.avgTime = Date.now() - startTime;
      console.log('✅ Transformers.js 엔진 초기화 완료');
    } catch (error) {
      console.warn('⚠️ Transformers.js 엔진 초기화 실패:', error);
    }
  }

  /**
   * MCP 클라이언트 초기화
   */
  private async initializeMCPClient(client: RealMCPClient): Promise<void> {
    try {
      await client.initialize();
      console.log('✅ MCP 클라이언트 초기화 완료');
    } catch (error) {
      console.warn('⚠️ MCP 클라이언트 초기화 실패:', error);
    }
  }

  /**
   * 벡터 DB 초기화
   */
  private async initializeVectorDB(
    vectorDB: LocalVectorDB,
    stats: EngineStats
  ): Promise<void> {
    try {
      // 벡터 DB는 별도 초기화가 필요하지 않음
      stats.vector.initialized = true;
      console.log('✅ 로컬 벡터 DB 초기화 완료');
    } catch (error) {
      console.warn('⚠️ 벡터 DB 초기화 실패:', error);
    }
  }

  /**
   * TensorFlow 엔진 초기화
   */
  private async initializeTensorFlowEngine(
    engine: TensorFlowAIEngine,
    stats: EngineStats
  ): Promise<void> {
    try {
      const startTime = Date.now();
      await engine.initialize();
      stats.tensorflow.initialized = true;
      stats.tensorflow.avgTime = Date.now() - startTime;
      console.log('✅ TensorFlow.js 엔진 초기화 완료');
    } catch (error) {
      console.warn('⚠️ TensorFlow.js 엔진 초기화 실패:', error);
    }
  }

  /**
   * TensorFlow 백그라운드 초기화
   */
  private initializeTensorFlowInBackground(
    engine: TensorFlowAIEngine,
    stats: EngineStats
  ): void {
    setTimeout(async () => {
      try {
        const startTime = Date.now();
        await engine.initialize();
        stats.tensorflow.initialized = true;
        stats.tensorflow.avgTime = Date.now() - startTime;
        console.log('✅ TensorFlow.js 백그라운드 초기화 완료');
      } catch (error) {
        console.warn('⚠️ TensorFlow.js 백그라운드 초기화 실패:', error);
      }
    }, 1000);
  }

  /**
   * 엔진 등록
   */
  private registerEngine(name: string, engine: any): void {
    this.engines.set(name, {
      name,
      initialized: false,
      initialize: engine.initialize?.bind(engine) || (() => Promise.resolve()),
      dispose: engine.dispose?.bind(engine),
    });
  }

  /**
   * 기본 설정 반환
   */
  private getDefaultConfiguration(): EngineConfiguration {
    return {
      korean: {
        enabled: true,
        priority: 1,
      },
      tensorflow: {
        enabled: true,
        priority: 3,
        backgroundInit: true,
      },
      transformers: {
        enabled: true,
        priority: 2,
      },
      vector: {
        enabled: true,
        maxDocuments: 1000,
      },
      mcp: {
        enabled: true,
        timeout: 5000,
      },
    };
  }

  /**
   * 모든 엔진 정리
   */
  public async disposeAllEngines(): Promise<void> {
    console.log('🧹 모든 엔진 정리 시작');
    
    for (const [name, engine] of this.engines) {
      try {
        if (engine.dispose) {
          await engine.dispose();
          console.log(`✅ ${name} 엔진 정리 완료`);
        }
      } catch (error) {
        console.warn(`⚠️ ${name} 엔진 정리 실패:`, error);
      }
    }

    this.engines.clear();
    console.log('🧹 모든 엔진 정리 완료');
  }

  /**
   * 엔진 상태 조회
   */
  public getEngineStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    
    for (const [name, engine] of this.engines) {
      status.set(name, engine.initialized);
    }

    return status;
  }

  /**
   * 설정 업데이트
   */
  public updateConfiguration(newConfig: Partial<EngineConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
    console.log('🔧 엔진 설정 업데이트 완료');
  }

  /**
   * 현재 설정 반환
   */
  public getConfiguration(): EngineConfiguration {
    return { ...this.configuration };
  }
} 