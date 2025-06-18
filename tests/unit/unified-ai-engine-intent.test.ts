import { describe, it, expect, vi } from 'vitest';
import { unifiedAIEngine } from '@/core/ai/UnifiedAIEngine';

// UnifiedAIEngine이 IntentClassifier 결과를 응답에 반영하는지 확인

describe('UnifiedAIEngine intent classification', () => {
  it('processQuery 결과의 intent 값이 분류 결과와 일치한다', async () => {
    const engine: any = unifiedAIEngine;

    vi.spyOn(engine, 'checkComponentHealth').mockResolvedValue({
      availableComponents: [],
      overallHealth: 'healthy',
    });
    vi.spyOn(engine, 'determineProcessingStrategy').mockReturnValue({ tier: 'core_only' });
    vi.spyOn(engine, 'performGracefulAnalysis').mockResolvedValue({
      success: true,
      content: 'ok',
      confidence: 0.9,
      sources: [],
    });

    vi.spyOn(engine.intentClassifier, 'classify').mockResolvedValue({
      name: 'server_status',
      confidence: 0.95,
      category: 'monitoring',
      priority: 1,
      entities: {},
      urgency: 'low',
    });

    const res = await engine.processQuery({ query: '서버 상태 알려줘' });

    expect(res.intent.primary).toBe('server_status');
    expect(res.intent.confidence).toBeCloseTo(0.95);
  });
});
