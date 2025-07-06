import { EngineResult } from './types';

// 🚫 GoogleAIService.getInstance() 제거됨 - 서버리스 환경에서 사용 금지
// 대신 createGoogleAIService() 팩토리 함수 사용 권장

console.warn('⚠️ FallbackManager: GoogleAIService.getInstance() 제거됨');
console.warn('🔧 대신 createGoogleAIService()를 사용하세요');

export class FallbackManager {
  private enabled = process.env.EXTERNAL_AI_FALLBACK_ENABLED !== 'false';

  async query(question: string): Promise<EngineResult | null> {
    if (!this.enabled) return null;

    const start = Date.now();
    try {
      if (!googleAI.isAvailable()) {
        return null;
      }
      const result = await googleAI.processQuery({
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
}
