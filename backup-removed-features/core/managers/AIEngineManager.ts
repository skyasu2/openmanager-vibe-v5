/**
 * 🤖 AI 엔진 관리자 v1.0
 *
 * 📋 책임:
 * - AI 엔진 인스턴스 생성 및 관리
 * - 엔진 초기화 및 상태 모니터링
 * - 엔진간 의존성 관리
 * - 엔진 상태 조회 API 제공
 *
 * 🔧 분리된 기능:
 * - UnifiedAIEngineRouter에서 엔진 관리 로직 분리
 * - SOLID 원칙 적용: 단일 책임 원칙
 */

import { SolutionDatabase } from '@/core/ai/databases/SolutionDatabase';
import { IncidentDetectionEngine } from '@/core/ai/engines/IncidentDetectionEngine';
import { AutoIncidentReportSystem } from '@/core/ai/systems/AutoIncidentReportSystem';
import { getSupabaseRAGEngine } from '@/lib/ml/supabase-rag-engine';
import { CustomEngines } from '@/services/ai/engines/CustomEngines';
import { OpenSourceEngines } from '@/services/ai/engines/OpenSourceEngines';
import { createGoogleAIService, RequestScopedGoogleAIService } from '@/services/ai/GoogleAIService';
import { KoreanAIEngine } from '@/services/ai/korean-ai-engine';
import { TransformersEngine } from '@/services/ai/transformers-engine';
import type { AIMode } from '@/types/ai-types';

// 서버 사이드에서만 MCP 클라이언트 사용
let RealMCPClient: any = null;
if (typeof window === 'undefined') {
  try {
    RealMCPClient = require('@/services/mcp/real-mcp-client').RealMCPClient;
  } catch (error) {
    console.warn('⚠️ MCP 클라이언트 로드 실패 (서버 사이드 전용):', error);
  }
}

export interface EngineStatus {
  initialized: boolean;
  engines: Record<
    string,
    {
      name: string;
      status: 'active' | 'inactive' | 'error';
      lastInitialized?: string;
      errorMessage?: string;
    }
  >;
  initializationTime?: number;
  totalEngines: number;
  activeEngines: number;
}

export class AIEngineManager {
  // 메인 엔진들
  public readonly supabaseRAG = getSupabaseRAGEngine();
  public readonly googleAI: RequestScopedGoogleAIService;
  public readonly mcpClient: any; // 🎯 역할 변경: AI 엔진 → 컨텍스트 수집기

  // 고급 엔진들 (임시 비활성화)
  public readonly intelligentMonitoring: any = null;
  public autoIncidentReport: AutoIncidentReportSystem | null = null;

  // 하위 AI 도구들 (모든 모드에서 사용 가능)
  public readonly koreanEngine: KoreanAIEngine;
  public readonly transformersEngine: TransformersEngine;
  public readonly openSourceEngines: OpenSourceEngines;
  public readonly customEngines: CustomEngines;

  // 상태 관리
  private _initialized = false;
  private _initializationStartTime: number = 0;
  private _initializationEndTime: number = 0;
  private engineStatus: Record<
    string,
    {
      name: string;
      status: 'active' | 'inactive' | 'error';
      lastInitialized?: string;
      errorMessage?: string;
    }
  > = {};

  constructor() {
    this.googleAI = createGoogleAIService();
    this.mcpClient = RealMCPClient ? RealMCPClient.getInstance() : null;

    this.koreanEngine = new KoreanAIEngine();
    this.transformersEngine = new TransformersEngine();
    this.openSourceEngines = new OpenSourceEngines();
    this.customEngines = new CustomEngines(this.openSourceEngines);

    // 초기 상태 설정
    this.initializeEngineStatus();

    console.log('🔧 AI 엔진 관리자 생성 완료');
  }

  /**
   * 🚀 모든 AI 엔진 초기화
   */
  public async initialize(): Promise<void> {
    if (this._initialized) return;

    console.log('🚀 AI 엔진 관리자 초기화 시작...');
    this._initializationStartTime = Date.now();

    try {
      // 1단계: 메인 엔진들 병렬 초기화
      await this.initializeMainEngines();

      // 2단계: 고급 엔진들 초기화 (임시 비활성화)
      await this.initializeAdvancedEngines();

      // 3단계: 하위 AI 도구들 병렬 초기화
      await this.initializeSubEngines();

      this._initialized = true;
      this._initializationEndTime = Date.now();

      console.log(
        `✅ AI 엔진 관리자 초기화 완료 (${this._initializationEndTime - this._initializationStartTime}ms)`
      );
    } catch (error) {
      console.error('❌ AI 엔진 관리자 초기화 실패:', error);
      // 초기화 실패해도 기본 기능은 동작하도록
      this._initialized = true;
      this._initializationEndTime = Date.now();
    }
  }

  /**
   * 🔧 메인 엔진들 초기화
   */
  private async initializeMainEngines(): Promise<void> {
    const mainEnginePromises = [
      this.initializeSupabaseRAG(),
      this.initializeGoogleAI(),
      this.initializeMCPContextHelper(),
    ];

    const results = await Promise.allSettled(mainEnginePromises);

    // 결과 처리
    results.forEach((result, index) => {
      const engineNames = ['supabaseRAG', 'googleAI', 'mcpClient'];
      const engineName = engineNames[index];

      if (result.status === 'fulfilled') {
        this.updateEngineStatus(engineName, 'active');
      } else {
        this.updateEngineStatus(engineName, 'error', result.reason?.message);
      }
    });
  }

  /**
   * 🚀 고급 엔진들 초기화
   */
  private async initializeAdvancedEngines(): Promise<void> {
    console.log('⚠️ 고급 엔진들 임시 비활성화 - 기본 기능으로 동작');

    // AutoIncidentReportSystem 초기화
    try {
      const detectionEngine = new IncidentDetectionEngine();
      const solutionDB = new SolutionDatabase();
      // LOCAL 모드를 기본으로 설정
      this.autoIncidentReport = new AutoIncidentReportSystem(
        detectionEngine,
        solutionDB,
        true,
        'LOCAL' as AIMode
      );
      this.updateEngineStatus('autoIncidentReport', 'active');
      console.log('✅ AutoIncidentReportSystem 초기화 완료');
    } catch (error) {
      console.warn('⚠️ AutoIncidentReportSystem 초기화 실패:', error);
      this.updateEngineStatus(
        'autoIncidentReport',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.autoIncidentReport = null;
    }
  }

  /**
   * 🔧 하위 AI 도구들 초기화
   */
  private async initializeSubEngines(): Promise<void> {
    const subEnginePromises = [
      this.initializeKoreanEngine(),
      this.initializeTransformersEngine(),
      // OpenSourceEngines와 CustomEngines는 생성자에서 자동 초기화됨
    ];

    const results = await Promise.allSettled(subEnginePromises);

    // 결과 처리
    results.forEach((result, index) => {
      const engineNames = ['korean', 'transformers'];
      const engineName = engineNames[index];

      if (result.status === 'fulfilled') {
        this.updateEngineStatus(engineName, 'active');
      } else {
        this.updateEngineStatus(engineName, 'error', result.reason?.message);
      }
    });

    // 자동 초기화된 엔진들
    this.updateEngineStatus('openSource', 'active');
    this.updateEngineStatus('custom', 'active');
  }

  /**
   * 🔧 Supabase RAG 엔진 초기화
   */
  private async initializeSupabaseRAG(): Promise<void> {
    await this.supabaseRAG.initialize();
  }

  /**
   * 🔧 Google AI 서비스 초기화
   */
  private async initializeGoogleAI(): Promise<void> {
    try {
      // GoogleAIService는 getInstance()에서 자동 초기화됨
      console.log('✅ Google AI 서비스 초기화 완료');
    } catch (error) {
      console.warn('⚠️ Google AI 서비스 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔧 MCP 컨텍스트 도우미 초기화
   */
  private async initializeMCPContextHelper(): Promise<void> {
    if (!this.mcpClient) {
      console.log('⚠️ MCP 클라이언트를 사용할 수 없음 (브라우저 환경)');
      return;
    }

    try {
      await this.mcpClient.initialize();
      console.log('✅ MCP 컨텍스트 도우미 초기화 완료');
    } catch (error) {
      console.warn('⚠️ MCP 컨텍스트 도우미 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔧 Korean AI 엔진 초기화
   */
  private async initializeKoreanEngine(): Promise<void> {
    await this.koreanEngine.initialize();
  }

  /**
   * 🔧 Transformers 엔진 초기화
   */
  private async initializeTransformersEngine(): Promise<void> {
    await this.transformersEngine.initialize();
  }

  /**
   * 📊 엔진 상태 초기화
   */
  private initializeEngineStatus(): void {
    const engines = [
      'supabaseRAG',
      'googleAI',
      'mcpClient',
      'autoIncidentReport',
      'korean',
      'transformers',
      'openSource',
      'custom',
    ];

    engines.forEach(engine => {
      this.engineStatus[engine] = {
        name: engine,
        status: 'inactive',
      };
    });
  }

  /**
   * 🔄 엔진 상태 업데이트
   */
  private updateEngineStatus(
    engineName: string,
    status: 'active' | 'inactive' | 'error',
    errorMessage?: string
  ): void {
    this.engineStatus[engineName] = {
      name: engineName,
      status,
      lastInitialized: new Date().toISOString(),
      ...(errorMessage && { errorMessage }),
    };
  }

  /**
   * 📊 엔진 상태 조회
   */
  public getEngineStatus(): EngineStatus {
    const activeEngines = Object.values(this.engineStatus).filter(
      engine => engine.status === 'active'
    ).length;

    return {
      initialized: this._initialized,
      engines: { ...this.engineStatus },
      initializationTime:
        this._initializationEndTime - this._initializationStartTime,
      totalEngines: Object.keys(this.engineStatus).length,
      activeEngines,
    };
  }

  /**
   * 🔍 초기화 상태 확인
   */
  public get initialized(): boolean {
    return this._initialized;
  }

  /**
   * 🔄 엔진 상태 리셋
   */
  public resetEngineStatus(): void {
    this.initializeEngineStatus();
    this._initialized = false;
    this._initializationStartTime = 0;
    this._initializationEndTime = 0;
  }
}
