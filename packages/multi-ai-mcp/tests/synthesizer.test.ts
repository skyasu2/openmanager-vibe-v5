import { describe, it, expect } from 'vitest';
import { synthesizeResults } from '../src/synthesizer.js';
import type { AIResponse } from '../src/types.js';

describe('synthesizeResults', () => {
  const mockSuccessResponse: AIResponse = {
    provider: 'codex',
    response: 'Test response',
    responseTime: 100,
    success: true
  };

  const mockFailureResponse: AIResponse = {
    provider: 'gemini',
    response: '',
    responseTime: 50,
    success: false,
    error: 'Test error'
  };

  it('should handle no responses (NaN bug fix)', () => {
    const result = synthesizeResults('test query');

    expect(result.performance.successRate).toBe(0);
    expect(result.performance.successRate).not.toBeNaN();
  });

  it('should calculate success rate correctly with all successes', () => {
    const result = synthesizeResults(
      'test query',
      mockSuccessResponse,
      { ...mockSuccessResponse, provider: 'gemini' },
      { ...mockSuccessResponse, provider: 'qwen' }
    );

    expect(result.performance.successRate).toBe(1);
  });

  it('should calculate success rate correctly with partial success', () => {
    const result = synthesizeResults(
      'test query',
      mockSuccessResponse,
      mockFailureResponse,
      { ...mockSuccessResponse, provider: 'qwen' }
    );

    expect(result.performance.successRate).toBe(2 / 3);
  });

  it('should calculate success rate correctly with all failures', () => {
    const result = synthesizeResults(
      'test query',
      mockFailureResponse,
      { ...mockFailureResponse, provider: 'gemini' },
      { ...mockFailureResponse, provider: 'qwen' }
    );

    expect(result.performance.successRate).toBe(0);
  });

  it('should find consensus when 2+ AIs mention same topics', () => {
    const codex: AIResponse = {
      provider: 'codex',
      response: 'This is recommended for performance improvement',
      responseTime: 100,
      success: true
    };

    const gemini: AIResponse = {
      provider: 'gemini',
      response: 'I suggest improvement for better performance',
      responseTime: 120,
      success: true
    };

    const result = synthesizeResults('test query', codex, gemini);

    expect(result.synthesis.consensus.length).toBeGreaterThan(0);
  });

  it('should detect conflicts when AIs have different sentiments', () => {
    const codex: AIResponse = {
      provider: 'codex',
      response: 'This is recommended and positive',
      responseTime: 100,
      success: true
    };

    const gemini: AIResponse = {
      provider: 'gemini',
      response: 'Not recommend this, negative approach',
      responseTime: 120,
      success: true
    };

    const result = synthesizeResults('test query', codex, gemini);

    expect(result.synthesis.conflicts.length).toBeGreaterThan(0);
  });

  it('should generate appropriate recommendations', () => {
    const result = synthesizeResults('test query');
    expect(result.synthesis.recommendation).toContain('실패');

    const successResult = synthesizeResults(
      'test query',
      mockSuccessResponse,
      { ...mockSuccessResponse, provider: 'gemini' }
    );
    expect(successResult.synthesis.recommendation).toBeDefined();
  });
});
