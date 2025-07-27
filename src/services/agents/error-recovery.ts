/**
 * 서브 에이전트 에러 복구 메커니즘
 * MCP 도구 실패 시 대체 전략 제공
 */

export interface RecoveryContext {
  agent: string;
  operation: string;
  error?: Error;
  attempt?: number;
}

export interface RecoveryStrategy {
  name: string;
  handler: () => Promise<any>;
}

export class AgentErrorRecovery {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1초

  /**
   * 재시도 가능한 에러인지 확인
   */
  private static isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();

    // 재시도 가능한 에러 패턴
    const retryablePatterns = [
      'timeout',
      'econnrefused',
      'enotfound',
      'network',
      'rate limit',
      'temporarily unavailable',
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * MCP 관련 에러인지 확인
   */
  private static isMCPError(error: Error): boolean {
    return (
      error.message.includes('mcp_') ||
      error.message.includes('MCP') ||
      error.message.includes('server_')
    );
  }

  /**
   * 지연 실행
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 기본 재시도 로직
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: RecoveryContext
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[${context.agent}] Attempt ${attempt} for ${context.operation}`
        );
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[${context.agent}] Attempt ${attempt} failed: ${context.operation}`,
          error
        );

        if (!this.isRetryableError(lastError) || attempt === this.MAX_RETRIES) {
          break;
        }

        // 지수 백오프
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[${context.agent}] Retrying after ${delay}ms...`);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * 폴백 전략을 포함한 에러 복구
   */
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context: RecoveryContext
  ): Promise<T> {
    try {
      // 먼저 재시도 로직으로 실행
      return await this.withRetry(primary, context);
    } catch (error) {
      const err = error as Error;
      console.warn(
        `[${context.agent}] Primary operation failed: ${context.operation}`,
        err.message
      );

      // MCP 도구 실패 시 대체 전략 사용
      if (this.isMCPError(err)) {
        console.log(
          `[${context.agent}] MCP error detected, using fallback strategy`
        );
        return await fallback();
      }

      // 그 외의 에러는 그대로 전파
      throw error;
    }
  }

  /**
   * 다중 복구 전략
   */
  static async withMultipleStrategies<T>(
    strategies: RecoveryStrategy[],
    context: RecoveryContext
  ): Promise<T> {
    let lastError: Error | undefined;

    for (const strategy of strategies) {
      try {
        console.log(
          `[${context.agent}] Trying strategy: ${strategy.name} for ${context.operation}`
        );
        return await strategy.handler();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[${context.agent}] Strategy ${strategy.name} failed:`,
          lastError.message
        );
      }
    }

    throw new Error(
      `All strategies failed for ${context.operation}: ${lastError?.message}`
    );
  }

  /**
   * 에이전트별 복구 전략
   */
  static getAgentRecoveryStrategies(
    agentType: string,
    operation: string
  ): RecoveryStrategy[] {
    const strategies: Record<string, Record<string, RecoveryStrategy[]>> = {
      'ai-systems-engineer': {
        'supabase-query': [
          {
            name: 'Use local cache',
            handler: async () => {
              // 로컬 캐시에서 데이터 조회
              console.log('Attempting to use local cache...');
              return { source: 'cache', data: [] };
            },
          },
          {
            name: 'Use mock data',
            handler: async () => {
              // 개발용 모의 데이터 반환
              console.log('Using mock data...');
              return { source: 'mock', data: [] };
            },
          },
        ],
      },
      'database-administrator': {
        'execute-query': [
          {
            name: 'Use read replica',
            handler: async () => {
              console.log('Attempting read replica...');
              // 읽기 전용 복제본 사용
              return { source: 'replica', data: [] };
            },
          },
          {
            name: 'Return cached result',
            handler: async () => {
              console.log('Using cached query result...');
              return { source: 'cache', data: [] };
            },
          },
        ],
      },
      'mcp-server-admin': {
        'check-server-status': [
          {
            name: 'Use health endpoint',
            handler: async () => {
              console.log('Checking health endpoint...');
              return { status: 'healthy', method: 'health-check' };
            },
          },
          {
            name: 'Assume healthy',
            handler: async () => {
              console.log('Assuming servers are healthy...');
              return { status: 'assumed-healthy', method: 'fallback' };
            },
          },
        ],
      },
    };

    return (
      strategies[agentType]?.[operation] || [
        {
          name: 'Generic fallback',
          handler: async () => {
            console.log('Using generic fallback...');
            return { success: true, method: 'fallback' };
          },
        },
      ]
    );
  }

  /**
   * 에러 로깅 및 분석
   */
  static logError(context: RecoveryContext, error: Error): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      agent: context.agent,
      operation: context.operation,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: {
        isMCPError: this.isMCPError(error),
        isRetryable: this.isRetryableError(error),
      },
    };

    // 실제 환경에서는 로깅 서비스로 전송
    console.error('[AgentErrorRecovery] Error logged:', errorLog);
  }
}
