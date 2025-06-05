import { describe, it, expect, vi } from 'vitest';

vi.mock('@xenova/transformers', () => {
  const pipelineMock = vi.fn(async () => vi.fn(async () => ({ labels: ['test'], scores: [1] })));
  return { pipeline: pipelineMock };
});

import { IntentClassifier } from './IntentClassifier';

describe('IntentClassifier 초기화', () => {
  it('브라우저 환경에서 pipeline이 호출되어야 함', async () => {
    const classifier = new IntentClassifier();
    await classifier.initialize();

    const status = classifier.getStatus();
    expect(status.initialized).toBe(true);
    expect(status.engine).toBe('transformers.js');

    const { pipeline } = await import('@xenova/transformers');
    const calls = (pipeline as any).mock.calls;
    expect(calls).toEqual(
      expect.arrayContaining([
        ['zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli'],
        ['token-classification', 'Xenova/bert-base-NER'],
      ])
    );
  });
});
