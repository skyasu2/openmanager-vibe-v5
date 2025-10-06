import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, setConfig, config } from '../config';

describe('Configuration System', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('NaN Validation', () => {
    it('should throw error when maxAttempts is NaN', () => {
      process.env.MULTI_AI_MAX_RETRY_ATTEMPTS = 'invalid';

      expect(() => getConfig()).toThrow(
        'Invalid MULTI_AI_MAX_RETRY_ATTEMPTS: "invalid" is not a valid number'
      );
    });

    it('should throw error when backoffBase is NaN', () => {
      process.env.MULTI_AI_RETRY_BACKOFF_BASE = 'abc123';

      expect(() => getConfig()).toThrow(
        'Invalid MULTI_AI_RETRY_BACKOFF_BASE: "abc123" is not a valid number'
      );
    });

    it('should throw error when timeout is NaN', () => {
      process.env.MULTI_AI_CODEX_TIMEOUT_SIMPLE = 'not-a-number';

      expect(() => getConfig()).toThrow(
        'Invalid MULTI_AI_CODEX_TIMEOUT_SIMPLE: "not-a-number" is not a valid number'
      );
    });

    it('should use default value when env var is undefined', () => {
      delete process.env.MULTI_AI_MAX_RETRY_ATTEMPTS;
      delete process.env.MULTI_AI_RETRY_BACKOFF_BASE;

      const config = getConfig();

      expect(config.retry.maxAttempts).toBe(2); // default
      expect(config.retry.backoffBase).toBe(1000); // default
    });
  });

  describe('Range Validation', () => {
    it('should throw error when maxAttempts is out of range (too low)', () => {
      process.env.MULTI_AI_MAX_RETRY_ATTEMPTS = '0';

      expect(() => getConfig()).toThrow(
        'Invalid MULTI_AI_MAX_RETRY_ATTEMPTS: 0 is out of range [1, 10]'
      );
    });

    it('should throw error when maxAttempts is out of range (too high)', () => {
      process.env.MULTI_AI_MAX_RETRY_ATTEMPTS = '15';

      expect(() => getConfig()).toThrow(
        'Invalid MULTI_AI_MAX_RETRY_ATTEMPTS: 15 is out of range [1, 10]'
      );
    });

    it('should throw error when backoffBase is out of range (too low)', () => {
      process.env.MULTI_AI_RETRY_BACKOFF_BASE = '50';

      expect(() => getConfig()).toThrow(
        'Invalid MULTI_AI_RETRY_BACKOFF_BASE: 50 is out of range [100, 60000]'
      );
    });

    it('should throw error when backoffBase is out of range (too high)', () => {
      process.env.MULTI_AI_RETRY_BACKOFF_BASE = '100000';

      expect(() => getConfig()).toThrow(
        'Invalid MULTI_AI_RETRY_BACKOFF_BASE: 100000 is out of range [100, 60000]'
      );
    });

    it('should accept valid values within range', () => {
      process.env.MULTI_AI_MAX_RETRY_ATTEMPTS = '5';
      process.env.MULTI_AI_RETRY_BACKOFF_BASE = '2000';

      const config = getConfig();

      expect(config.retry.maxAttempts).toBe(5);
      expect(config.retry.backoffBase).toBe(2000);
    });
  });

  describe('Deep Merge', () => {
    it('should preserve existing retry properties when partially updating', () => {
      const initialBackoffBase = config.retry.backoffBase;

      // Partial update: only change maxAttempts
      setConfig({
        retry: {
          maxAttempts: 5,
        } as any, // Cast to avoid TypeScript error for partial object
      });

      expect(config.retry.maxAttempts).toBe(5); // Updated
      expect(config.retry.backoffBase).toBe(initialBackoffBase); // Preserved
    });

    it('should preserve existing mcp properties when partially updating', () => {
      const initialTimeout = config.mcp.requestTimeout;

      // Partial update: only change enableProgress
      setConfig({
        mcp: {
          enableProgress: false,
        } as any,
      });

      expect(config.mcp.enableProgress).toBe(false); // Updated
      expect(config.mcp.requestTimeout).toBe(initialTimeout); // Preserved
    });

    it('should preserve existing codex properties when partially updating', () => {
      const initialSimple = config.codex.simple;
      const initialMedium = config.codex.medium;

      // Partial update: only change complex timeout
      setConfig({
        codex: {
          complex: 150000,
        } as any,
      });

      expect(config.codex.complex).toBe(150000); // Updated
      expect(config.codex.simple).toBe(initialSimple); // Preserved
      expect(config.codex.medium).toBe(initialMedium); // Preserved
    });

    it('should handle multiple nested updates correctly', () => {
      const initialBackoffBase = config.retry.backoffBase;
      const initialTimeout = config.mcp.requestTimeout;

      setConfig({
        retry: {
          maxAttempts: 7,
        } as any,
        mcp: {
          enableProgress: false,
        } as any,
      });

      expect(config.retry.maxAttempts).toBe(7);
      expect(config.retry.backoffBase).toBe(initialBackoffBase); // Preserved
      expect(config.mcp.enableProgress).toBe(false);
      expect(config.mcp.requestTimeout).toBe(initialTimeout); // Preserved
    });

    it('should not affect other top-level properties', () => {
      const initialCwd = config.cwd;
      const initialMaxBuffer = config.maxBuffer;
      const initialGeminiSimple = config.gemini.simple;
      const initialQwenSimple = config.qwen.simple;

      setConfig({
        retry: {
          maxAttempts: 3,
        } as any,
      });

      expect(config.cwd).toBe(initialCwd);
      expect(config.maxBuffer).toBe(initialMaxBuffer);
      expect(config.gemini.simple).toBe(initialGeminiSimple);
      expect(config.qwen.simple).toBe(initialQwenSimple);
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly with valid environment variables', () => {
      process.env.MULTI_AI_MAX_RETRY_ATTEMPTS = '3';
      process.env.MULTI_AI_RETRY_BACKOFF_BASE = '1500';
      process.env.MULTI_AI_CODEX_TIMEOUT_SIMPLE = '20000';

      const config = getConfig();

      expect(config.retry.maxAttempts).toBe(3);
      expect(config.retry.backoffBase).toBe(1500);
      expect(config.codex.simple).toBe(20000);
    });

    it('should handle edge case values correctly', () => {
      process.env.MULTI_AI_MAX_RETRY_ATTEMPTS = '1'; // minimum
      process.env.MULTI_AI_RETRY_BACKOFF_BASE = '100'; // minimum

      const config = getConfig();

      expect(config.retry.maxAttempts).toBe(1);
      expect(config.retry.backoffBase).toBe(100);
    });

    it('should handle maximum allowed values correctly', () => {
      process.env.MULTI_AI_MAX_RETRY_ATTEMPTS = '10'; // maximum
      process.env.MULTI_AI_RETRY_BACKOFF_BASE = '60000'; // maximum

      const config = getConfig();

      expect(config.retry.maxAttempts).toBe(10);
      expect(config.retry.backoffBase).toBe(60000);
    });
  });
});
