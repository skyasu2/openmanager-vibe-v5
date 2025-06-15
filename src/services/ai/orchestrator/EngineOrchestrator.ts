import { MCPAdapter } from './adapters/MCPAdapter';
import { RAGAdapter } from './adapters/RAGAdapter';
import { MLAdapter } from './adapters/MLAdapter';
import { SmartQueryAdapter } from './adapters/SmartQueryAdapter';
import { EngineAdapter, CombinedResponse, EngineResult } from './types';
import { evaluateResponse } from './QualityEvaluator';
import { combineResponses } from './ResponseCombiner';
import { FallbackManager } from './FallbackManager';

const PARALLEL_TIMEOUT = Number(process.env.AI_PARALLEL_TIMEOUT || 10000);

export class EngineOrchestrator {
  private adapters: EngineAdapter[] = [];
  private fallbackManager = new FallbackManager();

  constructor() {
    this.adapters = [
      new MCPAdapter(),
      new RAGAdapter(),
      new MLAdapter(),
      new SmartQueryAdapter(),
    ];
  }

  async query(question: string, context?: any): Promise<CombinedResponse> {
    const start = Date.now();

    // 1. 사용 가능한 어댑터 필터링
    const availableAdapters: EngineAdapter[] = [];
    for (const adapter of this.adapters) {
      if (await adapter.isAvailable()) {
        availableAdapters.push(adapter);
      }
    }

    // 실행 준비된 프라미스 리스트
    const promises = availableAdapters.map(adapter =>
      this.withTimeout(adapter.query(question, context), PARALLEL_TIMEOUT)
    );

    const settled = await Promise.allSettled(promises);
    const internalResults: EngineResult[] = settled.map((result, idx) => {
      const engineName = availableAdapters[idx].name;
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          answer: result.reason?.message || '오류',
          confidence: 0,
          engine: engineName,
          processingTime: PARALLEL_TIMEOUT,
          metadata: { error: true },
        };
      }
    });

    // 2. 품질 평가
    const { qualityScore, sufficient } = evaluateResponse(internalResults);

    let finalAnswer: CombinedResponse;

    if (sufficient) {
      const best = combineResponses(internalResults);
      finalAnswer = {
        success: true,
        answer: best.answer,
        confidence: best.confidence,
        engine: best.engine,
        sources: best.sources,
        internalResults,
        processingTime: Date.now() - start,
      };
    } else {
      // 3. 외부 AI 폴백
      const externalResult = await this.fallbackManager.query(question);

      const allResults = [...internalResults];
      if (externalResult) {
        allResults.push(externalResult);
      }

      const best = combineResponses(allResults);
      finalAnswer = {
        success: best.confidence > 0,
        answer: best.answer,
        confidence: best.confidence,
        engine: best.engine,
        sources: best.sources,
        internalResults,
        externalResult: externalResult || undefined,
        processingTime: Date.now() - start,
      };
    }

    return finalAnswer;
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    );
    return Promise.race([promise, timeout]);
  }
} 