/**
 * AI Engine Configuration Utility
 * AI 엔진 설정 및 환경변수 관리
 */

declare const process: {
  env: { [key: string]: string | undefined };
};

export interface AIEngineConfig {
  fastApiBaseUrl: string;
  timeout: number;
  retryCount: number;
  internalEngineEnabled: boolean;
  fallbackEnabled: boolean;
  warmupEnabled: boolean;
  maxWarmups: number;
  warmupInterval: number;
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
      fastApiBaseUrl: process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com',
      timeout: parseInt(process.env.AI_ENGINE_TIMEOUT || '30000'),
      retryCount: parseInt(process.env.AI_ENGINE_RETRY_COUNT || '3'),
      internalEngineEnabled: process.env.INTERNAL_AI_ENGINE_ENABLED !== 'false',
      fallbackEnabled: process.env.INTERNAL_AI_ENGINE_FALLBACK !== 'false',
      warmupEnabled: process.env.PYTHON_SERVICE_WARMUP_ENABLED !== 'false',
      maxWarmups: parseInt(process.env.PYTHON_SERVICE_MAX_WARMUPS || '4'),
      warmupInterval: parseInt(process.env.PYTHON_SERVICE_WARMUP_INTERVAL || '480000')
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
      return '/api/v3/ai';
    }
    return `${this.config.fastApiBaseUrl}/analyze`;
  }

  /**
   * 요청 옵션 생성
   */
  public createRequestOptions(body?: any): RequestInit {
    return {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenManager-AI-Client'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.config.timeout)
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
    const url = useInternal ? '/api/v3/ai' : `${this.config.fastApiBaseUrl}${endpoint}`;
    const options = this.createRequestOptions(body);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        console.log(`🤖 AI 요청 시도 ${attempt}/${this.config.retryCount}: ${url}`);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ AI 요청 성공 (시도 ${attempt})`);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ AI 요청 실패 (시도 ${attempt}):`, lastError.message);
        
        // 마지막 시도가 아니면 잠시 대기
        if (attempt < this.config.retryCount) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    // 모든 시도 실패 시 폴백 시도
    if (useInternal && this.config.fallbackEnabled) {
      console.log('🔄 외부 AI 엔진으로 폴백 시도...');
      return this.makeAIRequest(endpoint, body, false);
    }
    
    throw lastError || new Error('AI 요청 실패');
  }

  /**
   * 설정 검증
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.fastApiBaseUrl) {
      errors.push('FASTAPI_BASE_URL이 설정되지 않았습니다');
    }
    
    if (this.config.timeout < 1000) {
      errors.push('AI_ENGINE_TIMEOUT은 최소 1000ms 이상이어야 합니다');
    }
    
    if (this.config.retryCount < 1 || this.config.retryCount > 10) {
      errors.push('AI_ENGINE_RETRY_COUNT는 1-10 사이여야 합니다');
    }
    
    if (this.config.maxWarmups < 1 || this.config.maxWarmups > 20) {
      errors.push('PYTHON_SERVICE_MAX_WARMUPS는 1-20 사이여야 합니다');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 설정 정보 출력 (디버깅용)
   */
  public logConfig(): void {
    console.log('🔧 AI Engine Configuration:', {
      fastApiBaseUrl: this.config.fastApiBaseUrl,
      timeout: `${this.config.timeout}ms`,
      retryCount: this.config.retryCount,
      internalEngineEnabled: this.config.internalEngineEnabled,
      fallbackEnabled: this.config.fallbackEnabled,
      warmupEnabled: this.config.warmupEnabled,
      maxWarmups: this.config.maxWarmups,
      warmupInterval: `${this.config.warmupInterval}ms`
    });
  }
}

// 편의 함수들
export const getAIConfig = () => AIEngineConfigManager.getInstance().getConfig();
export const makeAIRequest = (endpoint: string, body?: any, useInternal?: boolean) => 
  AIEngineConfigManager.getInstance().makeAIRequest(endpoint, body, useInternal);
export const validateAIConfig = () => AIEngineConfigManager.getInstance().validateConfig(); 