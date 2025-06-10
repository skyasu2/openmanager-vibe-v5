/**
 * 🎯 MCP 분석 통합 테스트
 */

import { describe, it, expect } from 'vitest';
import { IntentClassifier } from '@/modules/ai-agent/processors/IntentClassifier';

describe('🎯 통합 Intent Classification 시스템', () => {
  it('예측 관련 문구를 정확히 분류한다', async () => {
    const classifier = new IntentClassifier();
    const result = await classifier.classify('서버 성능을 예측해 줘');

    // ✅ IntentClassifier 완전 구현 완료로 정상 테스트 실행
    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.category).toBe('monitoring');
    expect(result.priority).toBeGreaterThan(0);

    // 🔧 AI 분석 필드 검증
    expect(typeof result.needsTimeSeries).toBe('boolean');
    expect(typeof result.needsNLP).toBe('boolean');
    expect(typeof result.needsAnomalyDetection).toBe('boolean');
    expect(typeof result.needsComplexML).toBe('boolean');
    expect(['low', 'medium', 'high', 'critical']).toContain(result.urgency);

    console.log('🎯 분류 결과:', {
      intent: result.name,
      confidence: result.confidence,
      urgency: result.urgency,
    });
  });
});
