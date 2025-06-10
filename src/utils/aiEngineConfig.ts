/**
 * AI Engine Configuration Utility
 * AI 엔진 설정 및 환경변수 관리
 */

declare const process: {
  env: { [key: string]: string | undefined };
};

export interface AIEngineConfig {
  timeout: number;
  retryCount: number;
  internalEngineEnabled: boolean;
  fallbackEnabled: boolean;
}

export class AIEngineConfigManager {
  private static instance: AIEngineConfigManager;
  private config: AIEngineConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): AIEngineConfigManager {
    if (!AIEngineConfigManager.instance) {
      AIEngineConfigManager.instance = new AIEngineConfigManager();
    }
    return AIEngineConfigManager.instance;
  }

  /**
   * 환경변수에서 AI 엔진 설정 로드
   */
  private loadConfig(): AIEngineConfig {
    return {
      timeout: parseInt(process.env.AI_ENGINE_TIMEOUT || '30000'),
      retryCount: parseInt(process.env.AI_ENGINE_RETRY_COUNT || '3'),
      internalEngineEnabled: process.env.INTERNAL_AI_ENGINE_ENABLED !== 'false',
      fallbackEnabled: process.env.INTERNAL_AI_ENGINE_FALLBACK !== 'false',
    };
  }

  /**
   * 현재 AI 엔진 설정 반환
   */
  public getConfig(): AIEngineConfig {
    return { ...this.config };
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<AIEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * AI 엔진 URL 결정 (내부 vs 외부)
   */
  public getAIEngineUrl(preferInternal: boolean = true): string {
    if (preferInternal && this.config.internalEngineEnabled) {
      return '/api/ai/unified';
    }
    return '/api/ai/unified';
  }

  /**
   * 요청 옵션 생성
   */
  public createRequestOptions(body?: any): RequestInit {
    return {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenManager-AI-Client',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.config.timeout),
    };
  }

  /**
   * 재시도 로직이 포함된 AI 요청
   */
  public async makeAIRequest(
    endpoint: string,
    body?: any,
    useInternal: boolean = true
  ): Promise<any> {
    let lastError: Error | null = null;

    // 내부 엔진 시도
    if (useInternal && this.config.internalEngineEnabled) {
      try {
        console.log(`🤖 내부 AI 엔진 호출 시도: /api/ai/unified${endpoint}`);

        // 서버 환경에서는 직접 함수 호출, 클라이언트에서는 fetch 사용
        if (typeof window === 'undefined') {
          // 서버 환경: 동적 import로 내부 AI 엔진 함수 직접 호출
          try {
            const { POST } = await import('@/app/api/ai/unified/route');
            const mockRequest = {
              json: () => Promise.resolve(body || {}),
              url: `/api/ai/unified${endpoint}`,
              method: 'POST',
            } as any;

            const response = await POST(mockRequest);
            const result = await response.json();

            console.log(`✅ 내부 AI 엔진 직접 호출 성공`);
            return result;
          } catch (importError) {
            console.warn('⚠️ 내부 AI 엔진 직접 호출 실패:', importError);
            throw importError;
          }
        } else {
          // 클라이언트 환경: fetch 사용
          const url = `${window.location.origin}/api/ai/unified${endpoint}`;
          const options = this.createRequestOptions(body);

          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log(`✅ 내부 AI 엔진 fetch 성공`);
          return result;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ 내부 AI 엔진 호출 실패:`, lastError.message);
      }
    }

    // 외부 엔진은 더 이상 사용하지 않음

    throw lastError || new Error('모든 AI 엔진 호출 실패');
  }

  /**
   * 설정 검증
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.timeout < 1000) {
      errors.push('AI_ENGINE_TIMEOUT은 최소 1000ms 이상이어야 합니다');
    }

    if (this.config.retryCount < 1 || this.config.retryCount > 10) {
      errors.push('AI_ENGINE_RETRY_COUNT는 1-10 사이여야 합니다');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 설정 정보 출력 (디버깅용)
   */
  public logConfig(): void {
    console.log('🔧 AI Engine Configuration:', {
      timeout: `${this.config.timeout}ms`,
      retryCount: this.config.retryCount,
      internalEngineEnabled: this.config.internalEngineEnabled,
      fallbackEnabled: this.config.fallbackEnabled,
      // Python 관련 옵션 제거됨
    });
  }
}

// 편의 함수들
export const getAIConfig = () =>
  AIEngineConfigManager.getInstance().getConfig();
export const makeAIRequest = (
  endpoint: string,
  body?: any,
  useInternal?: boolean
) =>
  AIEngineConfigManager.getInstance().makeAIRequest(
    endpoint,
    body,
    useInternal
  );
export const validateAIConfig = () =>
  AIEngineConfigManager.getInstance().validateConfig();
