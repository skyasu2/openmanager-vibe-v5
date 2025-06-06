export interface AIQuery {
  text: string;
  options?: Record<string, any>;
}

export interface AIResponse {
  response: string;
  analysis: any;
  confidence: number;
  processingTime: number;
  fromCache: boolean;
}

export class FastAPIClient {
  async connect(): Promise<void> {
    return;
  }

  async analyzeText(query: AIQuery): Promise<AIResponse> {
    return {
      response: 'Python 서비스가 제거되었습니다.',
      analysis: {},
      confidence: 0,
      processingTime: 0,
      fromCache: false
    };
  }

  async getConnectionStatus() {
    return { isConnected: false, healthStatus: 'removed', lastHealthCheck: Date.now() };
  }

  async checkHealth() {
    return { isConnected: false, healthStatus: 'removed', lastHealthCheck: Date.now() };
  }

  async warmup() {
    return false;
  }
}

export const fastApiClient = new FastAPIClient();
