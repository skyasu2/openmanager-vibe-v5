import { describe, it, expect, beforeAll } from 'vitest';
import { HybridAIEngine } from '@/services/ai/hybrid-ai-engine';

// 통합 테스트: HybridAIEngine의 TensorFlow 분석 결과 확인

describe('HybridAIEngine TensorFlow integration', () => {
  const hybridAIEngine = new HybridAIEngine();

  beforeAll(async () => {
    await hybridAIEngine.initialize();
    // TensorFlow 백그라운드 초기화 대기
    await new Promise(res => setTimeout(res, 200));
  });

  it('processHybridQuery 호출 시 TensorFlow 분석 결과와 AI 인사이트가 생성된다', async () => {
    const result =
      await hybridAIEngine.processHybridQuery('서버 장애를 예측해 줘');

    expect(result.success).toBe(true);
    expect(result.tensorflowPredictions).toBeDefined();
    expect(result.reasoning.some(r => r.includes('TensorFlow'))).toBe(true);
  });
});
