/**
 * 🎭 Dual-Core Orchestrator
 *
 * MCP Engine과 RAG Engine을 조합하여 관리:
 * - 두 엔진의 독립적 동작 보장
 * - 결과 융합 및 최적화
 * - 장애 시 자동 폴백
 * - 성능 모니터링 및 로드 밸런싱
 */

import { MCPEngine, MCPEngineResponse } from './MCPEngine';
import { RAGEngine, RAGSearchResult } from './RAGEngine';

export interface DualCoreConfig {
  mcpWeight: number; // MCP 결과 가중치 (0-1)
  ragWeight: number; // RAG 결과 가중치 (0-1)
  fusionThreshold: number; // 결과 융합 임계값
  fallbackMode: 'mcp' | 'rag' | 'both'; // 장애 시 폴백 모드
  enableLoadBalancing: boolean;
}

export interface DualCoreResult {
  success: boolean;
  query: string;
  mcpResult?: MCPEngineResponse;
  ragResult?: RAGSearchResult;
  fusedResult: {
    response: string;
    confidence: number;
    sources: string[];
    suggestions: string[];
    processingTime: number;
  };
  engineStatus: {
    mcp: 'active' | 'fallback' | 'failed';
    rag: 'active' | 'fallback' | 'failed';
  };
  performance: {
    mcpTime: number;
    ragTime: number;
    fusionTime: number;
    totalTime: number;
  };
}

export class DualCoreOrchestrator {
  private mcpEngine: MCPEngine;
  private ragEngine: RAGEngine;
  private config: DualCoreConfig;
  private stats: {
    totalQueries: number;
    mcpSuccessRate: number;
    ragSuccessRate: number;
    averageResponseTime: number;
    lastHealthCheck: string;
  };

  constructor(config?: Partial<DualCoreConfig>) {
    this.config = {
      mcpWeight: 0.6,
      ragWeight: 0.4,
      fusionThreshold: 0.5,
      fallbackMode: 'both',
      enableLoadBalancing: true,
      ...config,
    };

    this.mcpEngine = MCPEngine.getInstance();
    this.ragEngine = new RAGEngine();

    this.stats = {
      totalQueries: 0,
      mcpSuccessRate: 100,
      ragSuccessRate: 100,
      averageResponseTime: 0,
      lastHealthCheck: new Date().toISOString(),
    };

    console.log('🎭 Dual-Core Orchestrator 생성됨');
  }

  /**
   * 🚀 이중 코어 시스템 초기화
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🚀 Dual-Core Orchestrator 초기화 시작...');

      // RAG 엔진 초기화 (MCP는 이미 초기화됨)
      await this.ragEngine.initialize();

      console.log('✅ Dual-Core Orchestrator 초기화 완료');
      console.log(
        `⚖️ 가중치 - MCP: ${this.config.mcpWeight}, RAG: ${this.config.ragWeight}`
      );
    } catch (error) {
      console.error('❌ Dual-Core Orchestrator 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🔍 이중 코어 검색 (병렬 실행 + 결과 융합)
   */
  public async search(
    query: string,
    options?: {
      preferEngine?: 'mcp' | 'rag' | 'auto';
      maxResults?: number;
      enableFusion?: boolean;
    }
  ): Promise<DualCoreResult> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      // 엔진 선택 로직
      const useEngine = this.selectEngine(options?.preferEngine);

      let mcpResult: MCPEngineResponse | undefined;
      let ragResult: RAGSearchResult | undefined;
      let mcpTime = 0;
      let ragTime = 0;

      // 병렬 검색 실행
      const searchPromises: Promise<any>[] = [];

      if (useEngine.mcp) {
        const mcpStart = Date.now();
        searchPromises.push(
          this.mcpEngine
            .processQuery(query, {
              maxResults: options?.maxResults,
              enableMLAnalysis: true,
            })
            .then(result => {
              mcpResult = result;
              mcpTime = Date.now() - mcpStart;
              return result;
            })
            .catch(error => {
              console.warn('⚠️ MCP Engine 검색 실패:', error);
              mcpTime = Date.now() - mcpStart;
              return null;
            })
        );
      }

      if (useEngine.rag) {
        const ragStart = Date.now();
        searchPromises.push(
          this.ragEngine
            .search(query, {
              maxResults: options?.maxResults,
              enableMLAnalysis: true,
            })
            .then(result => {
              ragResult = result;
              ragTime = Date.now() - ragStart;
              return result;
            })
            .catch(error => {
              console.warn('⚠️ RAG Engine 검색 실패:', error);
              ragTime = Date.now() - ragStart;
              return null;
            })
        );
      }

      // 모든 검색 완료 대기
      await Promise.all(searchPromises);

      // 결과 융합
      const fusionStart = Date.now();
      const fusedResult = await this.fuseResults(mcpResult, ragResult, query);
      const fusionTime = Date.now() - fusionStart;

      // 엔진 상태 결정
      const engineStatus = {
        mcp:
          mcpResult && mcpResult.confidence > 0.3
            ? 'active'
            : ((useEngine.mcp ? 'failed' : 'fallback') as
                | 'active'
                | 'fallback'
                | 'failed'),
        rag: ragResult?.success
          ? 'active'
          : ((useEngine.rag ? 'failed' : 'fallback') as
              | 'active'
              | 'fallback'
              | 'failed'),
      };

      // 성능 통계 업데이트
      const totalTime = Date.now() - startTime;
      this.updateStats(
        (mcpResult && mcpResult.confidence > 0.3) || false,
        ragResult?.success || false,
        totalTime
      );

      return {
        success: fusedResult.confidence > this.config.fusionThreshold,
        query,
        mcpResult,
        ragResult,
        fusedResult,
        engineStatus,
        performance: {
          mcpTime,
          ragTime,
          fusionTime,
          totalTime,
        },
      };
    } catch (error) {
      console.error('❌ Dual-Core 검색 실패:', error);

      return {
        success: false,
        query,
        fusedResult: {
          response: '검색 중 오류가 발생했습니다.',
          confidence: 0,
          sources: [],
          suggestions: [],
          processingTime: Date.now() - startTime,
        },
        engineStatus: {
          mcp: 'failed',
          rag: 'failed',
        },
        performance: {
          mcpTime: 0,
          ragTime: 0,
          fusionTime: 0,
          totalTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 🎯 엔진 선택 로직
   */
  private selectEngine(preference?: 'mcp' | 'rag' | 'auto'): {
    mcp: boolean;
    rag: boolean;
  } {
    if (preference === 'mcp') return { mcp: true, rag: false };
    if (preference === 'rag') return { mcp: false, rag: true };

    // 자동 선택 (로드 밸런싱 고려)
    if (this.config.enableLoadBalancing) {
      const mcpHealthy = this.mcpEngine.isReady();
      const ragHealthy = this.ragEngine.isReady();

      if (!mcpHealthy && ragHealthy) return { mcp: false, rag: true };
      if (mcpHealthy && !ragHealthy) return { mcp: true, rag: false };
      if (!mcpHealthy && !ragHealthy) return { mcp: true, rag: true }; // 둘 다 시도

      // 둘 다 정상이면 성능 기반 선택
      if (this.stats.mcpSuccessRate > this.stats.ragSuccessRate + 10) {
        return { mcp: true, rag: false };
      } else if (this.stats.ragSuccessRate > this.stats.mcpSuccessRate + 10) {
        return { mcp: false, rag: true };
      }
    }

    // 기본값: 둘 다 실행
    return { mcp: true, rag: true };
  }

  /**
   * 🎯 결과 융합 및 최종 응답 생성
   */
  private async fuseResults(
    mcpResult: MCPEngineResponse | undefined,
    ragResult: RAGSearchResult | undefined,
    query: string
  ): Promise<{
    response: string;
    confidence: number;
    sources: string[];
    suggestions: string[];
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      // 🎯 MCP Engine의 구체적인 서버 정보 우선 사용
      if (
        mcpResult &&
        mcpResult.confidence > 0.3 &&
        mcpResult.answer &&
        mcpResult.answer.includes('서버')
      ) {
        console.log('🎯 MCP Engine의 구체적인 서버 정보 우선 사용');

        // MCP 결과를 기본으로 하되, RAG 결과로 보완
        const enhancedAnswer = this.enhanceAnswerWithContext(
          mcpResult.answer,
          ragResult?.response
        );

        return {
          response: enhancedAnswer,
          confidence: Math.max(mcpResult.confidence || 0.8, 0.85), // MCP 결과 신뢰도 보정
          sources: [
            ...(mcpResult.sources || []),
            ...(ragResult?.results?.map(r => r.id) || []),
          ],
          suggestions: mcpResult.recommendations || [],
          processingTime: Date.now() - startTime,
        };
      }

      // RAG 결과가 더 구체적인 경우
      if (
        ragResult?.success &&
        ragResult.response &&
        ragResult.confidence > 0.8
      ) {
        console.log('🎯 RAG Engine 결과 우선 사용');

        const enhancedAnswer = this.enhanceAnswerWithContext(
          ragResult.response,
          mcpResult?.answer
        );

        return {
          response: enhancedAnswer,
          confidence: ragResult.confidence,
          sources: [
            ...(ragResult.results?.map(r => r.id) || []),
            ...(mcpResult?.sources || []),
          ],
          suggestions: ragResult.suggestions || [],
          processingTime: Date.now() - startTime,
        };
      }

      // 가중 평균 융합 (기본 전략)
      const mcpWeight = this.config.mcpWeight;
      const ragWeight = this.config.ragWeight;

      const mcpScore = (mcpResult?.confidence || 0) * mcpWeight;
      const ragScore = (ragResult?.confidence || 0) * ragWeight;

      const totalScore = mcpScore + ragScore;
      const finalConfidence = totalScore > 0 ? totalScore : 0.5;

      // 답변 융합
      let finalAnswer = '';

      if (mcpResult && mcpResult.confidence > 0.3 && ragResult?.success) {
        // 두 결과 모두 성공한 경우 - 통합 답변
        finalAnswer = this.combineAnswers(
          mcpResult.answer,
          ragResult.response,
          query
        );
      } else if (mcpResult && mcpResult.confidence > 0.3) {
        // MCP만 성공한 경우
        finalAnswer = mcpResult.answer;
      } else if (ragResult?.success) {
        // RAG만 성공한 경우
        finalAnswer = ragResult.response;
      } else {
        // 둘 다 실패한 경우
        finalAnswer =
          '죄송합니다. 현재 해당 질문에 대한 정보를 찾을 수 없습니다.';
      }

      return {
        response: finalAnswer,
        confidence: finalConfidence,
        sources: [
          ...(mcpResult?.sources || []),
          ...(ragResult?.results?.map(r => r.id) || []),
        ],
        suggestions: [
          ...(mcpResult?.recommendations || []),
          ...(ragResult?.suggestions || []),
        ],
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('❌ 결과 융합 실패:', error);

      return {
        response: '결과 처리 중 오류가 발생했습니다.',
        confidence: 0,
        sources: [],
        suggestions: [],
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 🔧 답변에 컨텍스트 추가하여 향상
   */
  private enhanceAnswerWithContext(
    primaryAnswer: string,
    secondaryAnswer?: string
  ): string {
    if (!secondaryAnswer) {
      return primaryAnswer;
    }

    // 기본 답변이 이미 충분히 구체적인 경우
    if (primaryAnswer.length > 100 && primaryAnswer.includes('서버')) {
      return primaryAnswer;
    }

    // 보조 답변에서 유용한 정보 추출하여 추가
    const additionalInfo = this.extractUsefulInfo(secondaryAnswer);
    if (additionalInfo) {
      return `${primaryAnswer}\n\n${additionalInfo}`;
    }

    return primaryAnswer;
  }

  /**
   * 🔧 보조 답변에서 유용한 정보 추출
   */
  private extractUsefulInfo(answer: string): string {
    // 서버 관련 정보, 수치 정보 등을 추출
    const serverInfoRegex =
      /(서버|CPU|메모리|디스크|네트워크).*?(\d+%|\d+GB|\d+개)/g;
    const matches = answer.match(serverInfoRegex);

    if (matches && matches.length > 0) {
      return `추가 정보: ${matches.join(', ')}`;
    }

    return '';
  }

  /**
   * 🔧 두 답변을 자연스럽게 결합
   */
  private combineAnswers(
    mcpAnswer: string,
    ragAnswer: string,
    query: string
  ): string {
    // MCP 답변이 구체적인 서버 정보를 포함하는 경우 우선 사용
    if (
      mcpAnswer.includes('서버') &&
      (mcpAnswer.includes('%') || mcpAnswer.includes('GB'))
    ) {
      return mcpAnswer;
    }

    // RAG 답변이 더 포괄적인 경우
    if (ragAnswer.length > mcpAnswer.length * 1.5) {
      return `${mcpAnswer}\n\n📚 **추가 정보:** ${ragAnswer}`;
    }

    // 기본 결합
    return mcpAnswer;
  }

  /**
   * 📊 성능 통계 업데이트
   */
  private updateStats(
    mcpSuccess: boolean,
    ragSuccess: boolean,
    responseTime: number
  ): void {
    // 성공률 업데이트 (이동 평균)
    this.stats.mcpSuccessRate =
      this.stats.mcpSuccessRate * 0.9 + (mcpSuccess ? 100 : 0) * 0.1;
    this.stats.ragSuccessRate =
      this.stats.ragSuccessRate * 0.9 + (ragSuccess ? 100 : 0) * 0.1;

    // 평균 응답 시간 업데이트
    this.stats.averageResponseTime =
      this.stats.averageResponseTime * 0.9 + responseTime * 0.1;

    this.stats.lastHealthCheck = new Date().toISOString();
  }

  /**
   * 📊 상태 정보 반환
   */
  public getStats() {
    return {
      ...this.stats,
      engines: {
        mcp: this.mcpEngine.getStats(),
        rag: this.ragEngine.getStats(),
      },
      config: this.config,
    };
  }

  /**
   * 🏥 헬스체크
   */
  public async healthCheck(): Promise<{
    overall: boolean;
    mcp: boolean;
    rag: boolean;
    details: any;
  }> {
    const mcpHealthy = this.mcpEngine.isReady();
    const ragHealthy = this.ragEngine.isReady();

    return {
      overall: mcpHealthy || ragHealthy, // 하나라도 정상이면 OK
      mcp: mcpHealthy,
      rag: ragHealthy,
      details: {
        mcpStats: this.mcpEngine.getStats(),
        ragStats: this.ragEngine.getStats(),
        orchestratorStats: this.stats,
      },
    };
  }

  /**
   * 🔄 정리 작업
   */
  public async cleanup(): Promise<void> {
    await Promise.all([this.mcpEngine.cleanup(), this.ragEngine.cleanup()]);

    console.log('🧹 Dual-Core Orchestrator 정리 완료');
  }

  /**
   * 🔍 레거시 호환성 메서드들
   */
  public isReady(): boolean {
    return this.mcpEngine.isReady() || this.ragEngine.isReady();
  }

  public async query(query: string, options?: any): Promise<DualCoreResult> {
    return this.search(query, options);
  }

  public async processQuery(query: string, sessionId: string): Promise<any> {
    const result = await this.search(query);
    return {
      response: result.fusedResult.response,
      confidence: result.fusedResult.confidence,
      sources: result.fusedResult.sources,
      suggestions: result.fusedResult.suggestions,
      processingTime: result.performance.totalTime,
      sessionLearning: true,
      reliability:
        result.fusedResult.confidence > 0.7
          ? 'high'
          : result.fusedResult.confidence > 0.4
            ? 'medium'
            : 'low',
      source: 'dual-core-orchestrator',
      engineStatus: result.engineStatus,
    };
  }
}
