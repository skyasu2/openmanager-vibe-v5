import { createGoogleAIService } from '@/services/ai/GoogleAIService';
import { EngineResult } from './types';

// 🚫 GoogleAIService.getInstance() 제거됨 - 서버리스 환경에서 사용 금지
// 대신 createGoogleAIService() 팩토리 함수 사용 권장

console.warn('⚠️ FallbackManager: GoogleAIService.getInstance() 제거됨');
console.warn('🔧 대신 createGoogleAIService()를 사용하세요');

export class FallbackManager {
  private enabled = process.env.EXTERNAL_AI_FALLBACK_ENABLED !== 'false';
  private googleAI = createGoogleAIService();

  async query(question: string): Promise<EngineResult | null> {
    if (!this.enabled) return null;

    const start = Date.now();
    try {
      if (!this.googleAI.isAvailable()) {
        return null;
      }
      const result = await this.googleAI.processQuery({
        query: question,
        mode: 'GOOGLE_ONLY',
        context: { isNaturalLanguage: true },
      });
      return {
        success: true,
        answer: result.response || '응답 없음',
        confidence: (result as any).confidence || 0.8,
        engine: 'google-ai',
        processingTime: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        answer: error.message || 'External AI 오류',
        confidence: 0,
        engine: 'google-ai',
        processingTime: Date.now() - start,
        metadata: { error: true },
      };
    }
  }

  async processWithFallback(query: string, context: any) {
    try {
      if (!this.googleAI.isAvailable()) {
        throw new Error('Google AI 서비스 사용 불가');
      }
      const result = await this.googleAI.processQuery({
        query,
        context
      });
      return result;
    } catch (error) {
      console.error('Fallback 처리 오류:', error);
      throw error;
    }
  }
}
