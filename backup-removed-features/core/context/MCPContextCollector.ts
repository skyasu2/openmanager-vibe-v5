/**
 * MCP 컨텍스트 수집기 - 중복 코드 제거 및 통합 모듈
 * 작성일: 2025-07-01 01:28:00 (KST)
 *
 * TDD Green 단계: 테스트를 통과시키는 구현
 * - UnifiedAIEngineRouter와 FallbackModeManager의 중복 코드 통합
 * - MCP 클라이언트 관리 및 컨텍스트 수집 전담
 * - 에러 처리 및 클라이언트/서버 환경 분기
 */

import KoreanTimeUtil from '@/utils/koreanTime';

/**
 * MCP 컨텍스트 결과 인터페이스
 */
export interface MCPContextResult {
  summary: string;
  category?: string;
  additionalInfo?: string;
  timestamp: string;
  source: string;
}

/**
 * MCP 컨텍스트 수집 옵션
 */
export interface MCPCollectionOptions {
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
  enhanceQuery?: boolean;
}

/**
 * MCP 컨텍스트 수집기 클래스
 *
 * 역할:
 * - 다양한 AI 모듈에서 공통으로 사용되는 MCP 컨텍스트 수집 로직 통합
 * - 중복 코드 제거 및 일관된 에러 처리
 * - 클라이언트/서버 환경 분기 관리
 */
export class MCPContextCollector {
  private mcpClient: any = null;
  private isInitialized = false;

  constructor(mcpClient?: any) {
    this.mcpClient = mcpClient;
  }

  /**
   * MCP 클라이언트 설정
   */
  public setMCPClient(mcpClient: any): void {
    this.mcpClient = mcpClient;
    this.isInitialized = !!mcpClient;
  }

  /**
   * 현재 환경이 서버 측인지 확인
   */
  private isServerSide(): boolean {
    return typeof window === 'undefined';
  }

  /**
   * MCP 컨텍스트 수집 가능 여부 확인
   */
  public canCollectContext(): boolean {
    return this.isServerSide() && !!this.mcpClient;
  }

  /**
   * 🔍 메인 MCP 컨텍스트 수집 메서드
   *
   * @param query 검색 쿼리
   * @param context 추가 컨텍스트
   * @param options 수집 옵션
   * @returns MCP 컨텍스트 결과 또는 null
   */
  public async collectContext(
    query: string,
    context?: any,
    options: MCPCollectionOptions = {}
  ): Promise<MCPContextResult | null> {
    const { enableLogging = true, timeout = 5000 } = options;

    try {
      // 클라이언트 측에서는 MCP 비활성화
      if (!this.canCollectContext()) {
        if (enableLogging) {
          console.log('⚠️ MCP 컨텍스트 수집: 클라이언트 측에서 비활성화');
        }
        return null;
      }

      if (enableLogging) {
        console.log(
          `🔍 MCP 컨텍스트 수집 시작: "${query.substring(0, 50)}..."`
        );
      }

      // 타임아웃 설정
      const mcpPromise = this.mcpClient.performComplexQuery(query, context);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('MCP 컨텍스트 수집 타임아웃')),
          timeout
        )
      );

      const mcpResult = await Promise.race([mcpPromise, timeoutPromise]);

      if (mcpResult && typeof mcpResult === 'object') {
        const contextResult: MCPContextResult = {
          summary:
            mcpResult.response ||
            mcpResult.summary ||
            '컨텍스트를 수집했습니다.',
          category: mcpResult.category,
          additionalInfo: mcpResult.additionalInfo || mcpResult.context,
          timestamp: KoreanTimeUtil.now(),
          source: 'mcp-context-helper',
        };

        if (enableLogging) {
          console.log('✅ MCP 컨텍스트 수집 성공:', {
            summary: contextResult.summary.substring(0, 100) + '...',
            category: contextResult.category,
            timestamp: contextResult.timestamp,
          });
        }

        return contextResult;
      }

      if (enableLogging) {
        console.warn('⚠️ MCP 결과가 유효하지 않음:', typeof mcpResult);
      }
      return null;
    } catch (error) {
      if (enableLogging) {
        console.warn('❌ MCP 컨텍스트 수집 실패:', error);
      }
      return null;
    }
  }

  /**
   * 🔄 재시도 로직이 포함된 컨텍스트 수집
   */
  public async collectContextWithRetry(
    query: string,
    context?: any,
    options: MCPCollectionOptions = {}
  ): Promise<MCPContextResult | null> {
    const { retryAttempts = 2, enableLogging = true } = options;

    for (let attempt = 1; attempt <= retryAttempts + 1; attempt++) {
      const result = await this.collectContext(query, context, {
        ...options,
        enableLogging: enableLogging && attempt === 1, // 첫 시도에만 로깅
      });

      if (result) {
        if (enableLogging && attempt > 1) {
          console.log(`✅ MCP 컨텍스트 수집 성공 (${attempt}번째 시도)`);
        }
        return result;
      }

      if (attempt <= retryAttempts) {
        if (enableLogging) {
          console.log(
            `🔄 MCP 컨텍스트 수집 재시도 ${attempt}/${retryAttempts}`
          );
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 지수 백오프
      }
    }

    return null;
  }

  /**
   * 🎯 쿼리 향상을 위한 컨텍스트 수집
   */
  public async enhanceQuery(
    originalQuery: string,
    context?: any,
    options: MCPCollectionOptions = {}
  ): Promise<string> {
    const mcpContext = await this.collectContext(
      originalQuery,
      context,
      options
    );

    if (!mcpContext || !mcpContext.summary) {
      return originalQuery;
    }

    return `${originalQuery}\n\n[컨텍스트: ${mcpContext.summary}]`;
  }

  /**
   * 📊 응답 향상을 위한 컨텍스트 정보 추가
   */
  public enhanceResponse(
    originalResponse: string,
    mcpContext: MCPContextResult | null,
    includeAdditionalInfo = true
  ): string {
    if (!mcpContext) {
      return originalResponse;
    }

    let enhancedResponse = originalResponse;

    if (includeAdditionalInfo && mcpContext.additionalInfo) {
      enhancedResponse += `\n\n🔍 추가 정보: ${mcpContext.additionalInfo}`;
    }

    return enhancedResponse;
  }

  /**
   * 🛠️ 디버깅 및 상태 확인
   */
  public getStatus(): {
    isInitialized: boolean;
    canCollectContext: boolean;
    isServerSide: boolean;
    hasMCPClient: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      canCollectContext: this.canCollectContext(),
      isServerSide: this.isServerSide(),
      hasMCPClient: !!this.mcpClient,
    };
  }
}
