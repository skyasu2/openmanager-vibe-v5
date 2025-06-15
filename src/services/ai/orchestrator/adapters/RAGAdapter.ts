import { EngineAdapter, EngineResult } from '../types';
import { LocalRAGEngine } from '@/lib/ml/rag-engine';

const ragEngine = new LocalRAGEngine();
let ragInitialized = false;

export class RAGAdapter implements EngineAdapter {
  name = 'rag';

  private async ensureInitialized() {
    if (!ragInitialized) {
      try {
        await ragEngine.initialize();
      } catch {
        // ignore init error
      }
      ragInitialized = true;
    }
  }

  async isAvailable(): Promise<boolean> {
    await this.ensureInitialized();
    return ragInitialized;
  }

  async query(question: string, context?: any): Promise<EngineResult> {
    const start = Date.now();

    try {
      await this.ensureInitialized();
      const res = await ragEngine.processQuery(question, context?.sessionId || 'default');
      return {
        success: !!res && res.success !== false,
        answer: res.response || '응답 없음',
        confidence: res.confidence || 0.6,
        engine: this.name,
        processingTime: Date.now() - start,
        sources: res.results?.map(r => r.document.id),
        metadata: { suggestions: res.suggestions },
      };
    } catch (error: any) {
      return {
        success: false,
        answer: error.message || 'RAG 오류',
        confidence: 0,
        engine: this.name,
        processingTime: Date.now() - start,
        metadata: { error: true },
      };
    }
  }
} 