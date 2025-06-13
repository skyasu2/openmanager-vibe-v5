/**
 * 🏭 AI 엔진 팩토리
 * 
 * Factory Pattern: AI 엔진 인스턴스 생성과 초기화를 담당
 * Dependency Injection: 엔진 간 의존성 관리
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
// TensorFlow 엔진 제거됨 → 경량 ML 엔진으로 대체
import { KoreanAIEngine } from '../../korean-ai-engine';
import { TransformersEngine } from '../../transformers-engine';
import { LocalVectorDB } from '../../local-vector-db';
import { LightweightMLEngine } from '../../lightweight-ml-engine'; // ✅ 새로운 경량 ML 엔진
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
    koreanEngine: KoreanAIEngine;
    transformersEngine: TransformersEngine;
    lightweightMLEngine: LightweightMLEngine; // ✅ 경량 ML 엔진 추가
    vectorDB: LocalVectorDB;
  } {
    console.log('🏭 AI 엔진 팩토리에서 엔진 인스턴스 생성');

    const mcpClient = new RealMCPClient();
    const koreanEngine = new KoreanAIEngine();
    const transformersEngine = new TransformersEngine();
    const lightweightMLEngine = new LightweightMLEngine(); // ✅ 경량 ML 엔진 생성
    const vectorDB = new LocalVectorDB();

    // 엔진 등록
    this.registerEngine('mcp', mcpClient);
    this.registerEngine('korean', koreanEngine);
    this.registerEngine('transformers', transformersEngine);
    this.registerEngine('lightweightML', lightweightMLEngine); // ✅ 경량 ML 엔진 등록
    this.registerEngine('vector', vectorDB);

    return {
      mcpClient,
      koreanEngine,
      transformersEngine,
      lightweightMLEngine, // ✅ 경량 ML 엔진 반환
      vectorDB,
    };
  }

  /**
   * 우선순위 기반 엔진 초기화
   */
  public async initializeEngines(engines: {
    mcpClient: RealMCPClient;
    koreanEngine: KoreanAIEngine;
    transformersEngine: TransformersEngine;
    lightweightMLEngine: LightweightMLEngine; // ✅ 경량 ML 엔진 추가
    vectorDB: LocalVectorDB;
  }): Promise<EngineStats> {
    console.log('🚀 우선순위 기반 엔진 초기화 시작');

    const stats: EngineStats = {
      korean: { initialized: false, successCount: 0, avgTime: 0 },
      lightweightML: { initialized: false, successCount: 0, avgTime: 0 }, // ✅ 경량 ML 통계
      transformers: { initialized: false, successCount: 0, avgTime: 0 },
      vector: { initialized: false, documentCount: 0, searchCount: 0 },
    };

    // Phase 1: 고우선순위 엔진들 병렬 초기화
    const corePromises = [];

    if (this.configuration.korean.enabled) {
      corePromises.push(this.initializeKoreanEngine(engines.koreanEngine, stats));
    }

    if (this.configuration.lightweightML.enabled) { // ✅ 경량 ML 초기화
      corePromises.push(this.initializeLightweightMLEngine(engines.lightweightMLEngine, stats));
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
   * 경량 ML 엔진 초기화 (TensorFlow 대체)
   */
  private async initializeLightweightMLEngine(
    engine: LightweightMLEngine,
    stats: EngineStats
  ): Promise<void> {
    try {
      const startTime = Date.now();
      await engine.initialize();
      stats.lightweightML.initialized = true;
      stats.lightweightML.avgTime = Date.now() - startTime;
      console.log('✅ 경량 ML 엔진 초기화 완료 (TensorFlow 대체)');
    } catch (error) {
      console.warn('⚠️ 경량 ML 엔진 초기화 실패:', error);
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
      console.log('✅ Transformers 엔진 초기화 완료');
    } catch (error) {
      console.warn('⚠️ Transformers 엔진 초기화 실패:', error);
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
      await vectorDB.initialize();
      stats.vector.initialized = true;
      stats.vector.documentCount = 0; // 기본값
      console.log('✅ 벡터 DB 초기화 완료');
    } catch (error) {
      console.warn('⚠️ 벡터 DB 초기화 실패:', error);
    }
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
      lightweightML: { // ✅ 경량 ML 기본 설정
        enabled: true,
        priority: 2,
        models: ['linear-regression', 'simple-statistics', 'ml-regression'],
      },
      transformers: {
        enabled: true,
        priority: 3,
        models: ['xenova/transformers'],
      },
      vector: {
        enabled: true,
        priority: 4,
        threshold: 0.7,
      },
      mcp: {
        enabled: true,
        priority: 5,
      },
    };
  }

  /**
   * 엔진 상태 조회
   */
  public getEngineStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.engines.forEach((engine, name) => {
      status[name] = engine.initialized;
    });
    return status;
  }

  /**
   * 정리
   */
  public dispose(): void {
    this.engines.forEach(engine => {
      if (engine.dispose) {
        engine.dispose();
      }
    });
    this.engines.clear();
    console.log('🧹 엔진 팩토리 정리 완료');
  }
} 