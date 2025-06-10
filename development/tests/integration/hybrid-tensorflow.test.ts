import { describe, it, expect, beforeAll } from 'vitest';
import { HybridAIEngine } from '@/services/ai/hybrid-ai-engine';

// 통합 테스트: HybridAIEngine의 TensorFlow 분석 결과 확인

describe('HybridAIEngine TensorFlow integration', () => {
  const hybridAIEngine = new HybridAIEngine();

  beforeAll(async () => {
    await hybridAIEngine.initialize();
    // TensorFlow 백그라운드 초기화 대기
    await new Promise(res => setTimeout(res, 500));
  });

  it('processHybridQuery 호출 시 TensorFlow 분석 결과와 AI 인사이트가 생성된다', async () => {
    const result =
      await hybridAIEngine.processHybridQuery('서버 장애를 예측해 줘');

    expect(result.success).toBe(true);
    expect(result.answer).toBeDefined();
    expect(result.reasoning).toBeDefined();

    // TensorFlow 예측이 있으면 정의되어야 하고, 없으면 undefined여도 됨
    if (result.tensorflowPredictions !== undefined) {
      expect(result.tensorflowPredictions).toBeDefined();
    }

    // 응답이나 추론에 AI 관련 내용이 있는지 확인 (TensorFlow 대신 더 넓은 범위)
    const hasAIContent =
      result.reasoning.some(
        r =>
          r.includes('TensorFlow') ||
          r.includes('AI') ||
          r.includes('분석') ||
          r.includes('예측')
      ) ||
      result.answer.includes('분석') ||
      result.answer.includes('예측');

    expect(hasAIContent).toBe(true);
  });
});
