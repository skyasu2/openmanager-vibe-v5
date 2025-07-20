/**
 * AI Agent Service
 *
 * 🚀 독립적인 AI 에이전트 서비스 레이어
 * - 클라이언트/서버 완전 분리
 * - 의존성 격리
 * - 확장 가능한 아키텍처
 */

export interface AIAgentConfig {
  apiEndpoint: string;
  websocketEndpoint?: string;
  apiKey?: string;
  timeout: number;
  enableStreaming: boolean;
  enableThinking: boolean;
  retryAttempts: number;
}

export interface AIQuery {
  query: string;
  sessionId?: string;
  userId?: string;
  context?: Record<string, any>;
  mode?: 'basic' | 'advanced' | 'auto';
  enableThinking?: boolean;
}

export interface AIResponse {
  success: boolean;
  response: string;
  mode: 'basic' | 'advanced';
  confidence: number;
  intent: {
    name: string;
    confidence: number;
    entities: Record<string, any>;
  };
  metadata: {
    processingTime: number;
    timestamp: string;
    sessionId: string;
  };
  thinkingSessionId?: string;
  error?: string;
}

export interface ThinkingStep {
  step: number;
  type: 'analysis' | 'reasoning' | 'solution' | 'verification';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class AIAgentService {
  private config: AIAgentConfig;
  private websocket?: WebSocket;
  private thinkingCallbacks: Map<string, (step: ThinkingStep) => void> =
    new Map();

  constructor(config: Partial<AIAgentConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/ai-agent',
      websocketEndpoint: undefined,
      apiKey: undefined,
      timeout: 30000,
      enableStreaming: true,
      enableThinking: true,
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * 메인 AI 질의 처리
   */
  async query(request: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest('/api/ai-agent/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI 처리 실패');
      }

      return {
        success: true,
        response: data.response,
        mode: data.mode,
        confidence: data.analysis?.confidence || 0,
        intent: data.intent,
        metadata: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          sessionId: data.metadata.sessionId,
        },
        thinkingSessionId: data.thinkingSessionId,
      };
    } catch (error) {
      console.error('AI Agent query failed:', error);

      return {
        success: false,
        response: '죄송합니다. AI 처리 중 오류가 발생했습니다.',
        mode: 'basic',
        confidence: 0,
        intent: {
          name: 'error',
          confidence: 0,
          entities: {},
        },
        metadata: {
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          sessionId: 'error',
        },
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 실시간 사고 과정 스트리밍
   */
  subscribeToThinking(
    thinkingSessionId: string,
    callback: (step: ThinkingStep) => void
  ): () => void {
    if (!this.config.enableThinking) {
      console.warn('Thinking is disabled in config');
      return () => {};
    }

    this.thinkingCallbacks.set(thinkingSessionId, callback);

    // SSE 연결 설정
    const eventSource = new EventSource(
      `/api/ai-agent/thinking?thinkingSessionId=${thinkingSessionId}&sessionId=${this.generateSessionId()}`
    );

    eventSource.onmessage = event => {
      try {
        const step: ThinkingStep = JSON.parse(event.data);
        callback(step);
      } catch (error) {
        console.error('Failed to parse thinking step:', error);
      }
    };

    eventSource.onerror = error => {
      console.error('Thinking stream error:', error);
      eventSource.close();
    };

    // 정리 함수 반환
    return () => {
      eventSource.close();
      this.thinkingCallbacks.delete(thinkingSessionId);
    };
  }

  /**
   * 🔧 AI 상태 확인 (백엔드 스탠바이 모드 지원)
   */
  async getStatus(): Promise<{
    healthy: boolean;
    mode: string;
    uptime: number;
    performance: Record<string, any>;
  }> {
    try {
      const response = await this.makeRequest('/api/ai-agent?action=status');

      if (!response.ok) {
        console.warn(
          `AI 상태 확인 실패: ${response.status} ${response.statusText}`
        );
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();

      // 응답 구조 검증
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid status response format');
      }

      // data.data가 있으면 사용하고, 없으면 data 자체를 사용
      const statusData = data.data || data;

      return {
        healthy: statusData.isInitialized ?? statusData.healthy ?? true,
        mode: statusData.mode || 'active',
        uptime: statusData.uptime || Date.now(),
        performance: statusData.performance || {},
      };
    } catch (error) {
      console.warn(
        'AI 상태 확인 중 오류 - 백엔드 스탠바이 모드로 전환:',
        error
      );

      // 🔄 연결 실패 시 standby 모드로 응답 (완전 비활성화 아님)
      return {
        healthy: false,
        mode: 'standby', // ✨ standby 모드로 변경
        uptime: Date.now(),
        performance: {
          standbyMode: true,
          lastAttempt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Connection failed',
          reconnectReady: true,
        },
      };
    }
  }

  /**
   * AI 전원 관리
   */
  async setPowerMode(mode: 'activate' | 'deactivate'): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/ai-agent/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode }),
      });

      return response.ok;
    } catch (error) {
      console.error(`AI power ${mode} failed:`, error);
      return false;
    }
  }

  /**
   * 활동 기록 (자동 활성화용)
   */
  async recordActivity(): Promise<void> {
    try {
      await this.makeRequest('/api/ai-agent/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activity' }),
      });
    } catch (error) {
      console.warn('Failed to record AI activity:', error);
    }
  }

  /**
   * 네트워크 요청 헬퍼
   */
  private async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    if (this.websocket) {
      this.websocket.close();
    }
    this.thinkingCallbacks.clear();
  }
}

// 싱글톤 인스턴스
let globalAIService: AIAgentService | null = null;

export const createAIAgentService = (
  config?: Partial<AIAgentConfig>
): AIAgentService => {
  return new AIAgentService(config);
};

export const getGlobalAIService = (): AIAgentService => {
  if (!globalAIService) {
    globalAIService = new AIAgentService();
  }
  return globalAIService;
};

export default AIAgentService;
