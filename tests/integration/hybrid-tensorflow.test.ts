import { describe, it, expect } from 'vitest';
import { TensorFlowAIEngine } from '@/services/ai/tensorflow-engine';
import { HybridAIEngine } from '@/services/ai/hybrid-ai-engine';

// TensorFlowAIEngine의 기본 동작 확인
describe('TensorFlowAIEngine', () => {
  it('메트릭 분석 후 인사이트를 반환한다', async () => {
    const engine = new TensorFlowAIEngine();
    const result = await engine.analyzeMetricsWithAI({ metric: [1,2,3,4,5,6,7,8,9,10] });
    expect(result.ai_insights.length).toBeGreaterThan(0);
  });
});

// HybridAIEngine의 TensorFlow 분석 및 MCP 액션 실행 확인
describe('HybridAIEngine', () => {
  it('TensorFlow 분석과 MCP 액션을 수행한다', async () => {
    const engine = new HybridAIEngine();
    (engine as any).mcpClient = {
      searchDocuments: async () => ({ success: true, results: [] }),
      getServerStatus: async () => ({ ok: true })
    };
    (engine as any).engineStats.tensorflow.initialized = true;

    const tfResult = await (engine as any).runTensorFlowAnalysis(
      { intent: 'prediction', originalQuery: '', keywords: [], requiredDocs: [], mcpActions: [], tensorflowModels: [], isKorean: false, useTransformers: false, useVectorSearch: false },
      [{ path: 'd.md', content: '1 2 3 4 5', keywords: [], lastModified: 0, relevanceScore: 1, contextLinks: [] }]
    );
    expect(tfResult.failure_predictions).toBeDefined();

    const actions = await (engine as any).executeMCPActions({
      intent: 'search',
      originalQuery: 'test',
      keywords: [],
      requiredDocs: [],
      mcpActions: ['search_docs', 'check_system'],
      tensorflowModels: [],
      isKorean: false,
      useTransformers: false,
      useVectorSearch: false
    });
    expect(actions.length).toBe(2);
  });
});

