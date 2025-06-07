/**
 * 🎯 MCP 분석 통합 테스트
 */

import { describe, it, expect } from 'vitest';
import { IntentClassifier } from '@/modules/ai-agent/processors/IntentClassifier';

describe('🎯 통합 Intent Classification 시스템', () => {
  it('예측 관련 문구를 정확히 분류한다', async () => {
    const classifier = new IntentClassifier();
    const result = await classifier.classify('서버 성능을 예측해 줘');

    expect(result.primary).toBe('server_performance_prediction');
    expect(result.confidence).toBeGreaterThan(0);
  });
});
