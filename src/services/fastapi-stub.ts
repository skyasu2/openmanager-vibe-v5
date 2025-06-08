// 임시 fastapi-stub (삭제된 파일의 간단한 대체)

export interface AIQuery {
  id: string;
  text: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  options?: {
    maxTokens?: number;
    temperature?: number;
    includeEmbedding?: boolean;
    includeEntities?: boolean;
    includeSentiment?: boolean;
    language?: string;
    context?: Record<string, any>;
    userId?: string;
    sessionId?: string;
  };
}

export interface AIResponse {
  id: string;
  queryId: string;
  answer: string;
  confidence: number;
  sources: any[];
  analysis?: any;
  recommendations: string[];
  actions: any[];
  metadata: {
    processingTime: number;
    engine: string;
    fromCache: boolean;
  };
  timestamp: number;
}

export class FastAPIClient {
  private isConnected = false;

  async connect(): Promise<void> {
    console.log('FastAPI Client connecting...');
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    console.log('FastAPI Client disconnecting...');
    this.isConnected = false;
  }

  async query(aiQuery: AIQuery): Promise<AIResponse> {
    if (!this.isConnected) {
      throw new Error('FastAPI Client not connected');
    }

    return {
      id: `response-${Date.now()}`,
      queryId: aiQuery.id,
      answer: `FastAPI Stub response for: ${aiQuery.text}`,
      confidence: 0.8,
      sources: [],
      recommendations: [],
      actions: [],
      metadata: {
        processingTime: 100,
        engine: 'fastapi-stub',
        fromCache: false,
      },
      timestamp: Date.now(),
    };
  }

  async analyzeText(aiQuery: AIQuery): Promise<any> {
    if (!this.isConnected) {
      throw new Error('FastAPI Client not connected');
    }

    return {
      sentiment: 'neutral',
      intent: 'general',
      entities: [],
      keywords: aiQuery.text.split(' ').slice(0, 3),
      confidence: 0.8,
      analysis: {
        language: 'ko',
        complexity: 'medium',
      },
    };
  }

  async getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      status: this.isConnected ? 'connected' : 'disconnected',
      lastHealthCheck: Date.now(),
      healthStatus: this.isConnected ? 'healthy' : 'disconnected',
      version: '1.0.0',
    };
  }

  async getStatus() {
    return {
      status: this.isConnected ? 'connected' : 'disconnected',
      version: '1.0.0',
    };
  }
}

export class FastAPIStub {
  async initialize() {
    console.log('FastAPI Stub initialized');
  }

  async getStatus() {
    return {
      status: 'active',
      version: '1.0.0',
    };
  }

  async processRequest(data: any) {
    return {
      success: true,
      result: data,
    };
  }
}

export const fastAPIStub = new FastAPIStub();
