/**
 * 🤖 Google AI 엔진 - 싱글톤 프록시 버전
 * 
 * ⚠️ 이제 독립 인스턴스가 아닌 GoogleAIService 싱글톤의 프록시입니다
 * ✅ 할당량 관리 중앙화
 * ✅ 메모리 사용량 최적화
 */

import { createGoogleAIService, RequestScopedGoogleAIService } from '@/services/ai/GoogleAIService';

interface GoogleAIRequest {
  query: string;
  context?: any;
}

interface GoogleAIResponse {
  success: boolean;
  response?: string;
  error?: string;
  data?: any;
  confidence: number;
}

export class GoogleAIEngine implements AIEngine {
  private googleAIService: RequestScopedGoogleAIService;
  private initialized = false;

  constructor() {
    // 🚫 서버리스 호환: 요청별 Google AI 서비스 생성
    this.googleAIService = createGoogleAIService();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // GoogleAIService는 이미 싱글톤으로 초기화되어 있음
      await this.googleAIService.initialize();
      this.initialized = true;
      console.log('✅ Google AI 엔진 프록시 초기화 완료');
    } catch (error) {
      console.error('❌ Google AI 엔진 프록시 초기화 실패:', error);
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
      // 🎯 싱글톤 서비스로 요청 프록시
      const result = await this.googleAIService.generateResponse(request.query);

      return {
        success: result.success,
        response: result.content,
        data: result,
        confidence: result.confidence || 0.8,
      };
    } catch (error) {
      console.error('Google AI 엔진 프록시 처리 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        confidence: 0,
      };
    }
  }

  public isReady(): boolean {
    return this.initialized && this.googleAIService.isReady();
  }

  /**
   * 🎯 싱글톤 서비스 직접 접근 (고급 사용)
   */
  public getService(): RequestScopedGoogleAIService {
    return this.googleAIService;
  }
}
