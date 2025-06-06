import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hybridAIEngine } from '@/services/ai/hybrid-ai-engine';

// 하이브리드 AI 엔진 TensorFlow 예측 테스트

describe('Hybrid TensorFlow integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('processHybridQuery 호출 시 TensorFlow 예측과 MCP 액션을 반환한다', async () => {
    // 내부 메서드 모킹
    vi.spyOn(hybridAIEngine as any, 'initialize').mockResolvedValue(undefined);
    vi.spyOn(hybridAIEngine as any, 'analyzeSmartQuery').mockResolvedValue({
      originalQuery: 'cpu 예측',
      intent: 'prediction',
      keywords: ['cpu'],
      requiredDocs: [],
      mcpActions: [],
      tensorflowModels: [],
      isKorean: true,
      useTransformers: false,
      useVectorSearch: false,
    });
    vi.spyOn(hybridAIEngine as any, 'hybridDocumentSearch').mockResolvedValue(
      []
    );
    vi.spyOn(hybridAIEngine as any, 'runHybridAnalysis').mockResolvedValue({
      tensorflow: { ai_insights: ['mock insight'], prediction: {} },
    });
    vi.spyOn(hybridAIEngine as any, 'executeMCPActions').mockResolvedValue([
      'mock action',
    ]);
    vi.spyOn(hybridAIEngine as any, 'generateHybridResponse').mockResolvedValue(
      {
        text: 'ok',
        confidence: 0.9,
        reasoning: [],
      }
    );
    vi.spyOn(hybridAIEngine as any, 'updateEngineStats').mockReturnValue(
      undefined
    );

    const result = await hybridAIEngine.processHybridQuery('cpu 예측');

    expect(result.tensorflowPredictions).toBeDefined();
    expect(result.mcpActions.length).toBeGreaterThan(0);
    expect(result.tensorflowPredictions.ai_insights.length).toBeGreaterThan(0);
  });
});
