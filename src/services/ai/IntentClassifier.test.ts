import { describe, it, expect, vi } from 'vitest';

const pipelineMock = vi.fn(async () =>
  vi.fn(async () => ({ labels: ['test'], scores: [1] }))
);
vi.mock('@xenova/transformers', () => ({ pipeline: pipelineMock }));
(globalThis as any).pipelineMock = pipelineMock;

import { IntentClassifier } from './IntentClassifier';

describe('IntentClassifier 초기화', () => {
  it('브라우저 환경에서 pipeline이 호출되어야 함', async () => {
    const classifier = new IntentClassifier();
    await classifier.initialize();

    const status = classifier.getStatus();
    expect(status.initialized).toBe(true);
    expect(status.engine).toBe('transformers.js');

    const calls = pipelineMock.mock.calls;
    expect(calls).toEqual(
      expect.arrayContaining([
        ['zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli'],
        ['token-classification', 'Xenova/bert-base-NER'],
      ])
    );
  });
});
