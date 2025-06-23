import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { EngineResult } from './types';

const googleAI = GoogleAIService.getInstance();

export class FallbackManager {
  private enabled = process.env.EXTERNAL_AI_FALLBACK_ENABLED !== 'false';

  async query(question: string): Promise<EngineResult | null> {
    if (!this.enabled) return null;

    const start = Date.now();
    try {
      if (!googleAI.isAvailable()) {
        return null;
      }
      const result = await googleAI.generateContent(question, { isNaturalLanguage: true });
      return {
        success: true,
        answer: (result as any).content || (result as any).response || '응답 없음',
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