/**
 * Google AI 엔진 (2% 가중치)
 * Google AI Studio 베타 연동
 */

import { GoogleAIService } from '../../../services/ai/GoogleAIService';

export interface GoogleAIRequest {
  query: string;
  category?: string;
  context?: any;
}

export interface GoogleAIResponse {
  success: boolean;
  response?: string;
  data?: any;
  confidence: number;
  error?: string;
}

export class GoogleAIEngine {
  private googleAIService: GoogleAIService;
  private initialized = false;

  constructor() {
    this.googleAIService = new GoogleAIService();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.googleAIService.initialize();
      this.initialized = true;
      console.log('✅ Google AI 엔진 초기화 완료');
    } catch (error) {
      console.error('❌ Google AI 엔진 초기화 실패:', error);
      throw error;
    }
  }

  public async processQuery(
    request: GoogleAIRequest
  ): Promise<GoogleAIResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = await this.googleAIService.generateResponse(request.query);

      return {
        success: result.success,
        response: result.content,
        data: result,
        confidence: result.confidence || 0.8,
      };
    } catch (error) {
      console.error('Google AI 엔진 처리 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        confidence: 0,
      };
    }
  }

  public isReady(): boolean {
    return this.initialized;
  }
}
