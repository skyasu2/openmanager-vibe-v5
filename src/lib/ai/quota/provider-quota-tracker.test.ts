/**
 * Provider Quota Tracker Tests
 *
 * @version 1.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getProviderUsage,
  getQuotaStatus,
  PREEMPTIVE_THRESHOLDS,
  PROVIDER_QUOTAS,
  recordProviderUsage,
  resetProviderUsage,
  selectAvailableProvider,
} from './provider-quota-tracker';

// Mock Redis
vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn(() => null), // In-memory mode
  isRedisEnabled: vi.fn(() => false),
}));

describe('Provider Quota Tracker', () => {
  beforeEach(async () => {
    // Reset all providers before each test
    await resetProviderUsage('cerebras');
    await resetProviderUsage('groq');
    await resetProviderUsage('mistral');
    await resetProviderUsage('openrouter');
  });

  describe('getProviderUsage', () => {
    it('should return default usage for new provider', async () => {
      const usage = await getProviderUsage('cerebras');

      expect(usage.dailyTokens).toBe(0);
      expect(usage.minuteRequests).toBe(0);
      expect(usage.minuteTokens).toBe(0);
      expect(usage.date).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('recordProviderUsage', () => {
    it('should record token usage', async () => {
      await recordProviderUsage('cerebras', 1000);
      const usage = await getProviderUsage('cerebras');

      expect(usage.dailyTokens).toBe(1000);
      expect(usage.minuteRequests).toBe(1);
      expect(usage.minuteTokens).toBe(1000);
    });

    it('should accumulate multiple usages', async () => {
      await recordProviderUsage('cerebras', 500);
      await recordProviderUsage('cerebras', 300);
      await recordProviderUsage('cerebras', 200);

      const usage = await getProviderUsage('cerebras');

      expect(usage.dailyTokens).toBe(1000);
      expect(usage.minuteRequests).toBe(3);
      expect(usage.minuteTokens).toBe(1000);
    });
  });

  describe('getQuotaStatus', () => {
    it('should calculate usage rates correctly', async () => {
      // Use small amount (within minute limits too)
      const smallUsage = 1000; // 1K tokens
      await recordProviderUsage('cerebras', smallUsage);

      const status = await getQuotaStatus('cerebras');

      // Daily rate should be very small
      expect(status.dailyTokenUsageRate).toBeLessThan(0.01);
      // Minute rate should be within limits
      expect(status.minuteTokenUsageRate).toBeLessThan(0.5);
      expect(status.shouldPreemptiveFallback).toBe(false);
    });

    it('should trigger pre-emptive fallback at 80% daily usage', async () => {
      // Use 82% of daily limit
      const eightyTwoPercent = PROVIDER_QUOTAS.cerebras.dailyTokenLimit * 0.82;
      await recordProviderUsage('cerebras', eightyTwoPercent);

      const status = await getQuotaStatus('cerebras');

      expect(status.dailyTokenUsageRate).toBeGreaterThan(0.8);
      expect(status.shouldPreemptiveFallback).toBe(true);
    });

    it('should trigger pre-emptive fallback at 85% minute request usage', async () => {
      // Make 90% of minute requests
      const ninetyPercent = Math.ceil(
        PROVIDER_QUOTAS.cerebras.requestsPerMinute * 0.9
      );

      for (let i = 0; i < ninetyPercent; i++) {
        await recordProviderUsage('cerebras', 10);
      }

      const status = await getQuotaStatus('cerebras');

      expect(status.minuteRequestUsageRate).toBeGreaterThan(0.85);
      expect(status.shouldPreemptiveFallback).toBe(true);
      expect(status.recommendedWaitMs).toBeDefined();
    });
  });

  describe('selectAvailableProvider', () => {
    it('should select first available provider', async () => {
      const selection = await selectAvailableProvider([
        'cerebras',
        'mistral',
        'openrouter',
      ]);

      expect(selection).not.toBeNull();
      expect(selection?.provider).toBe('cerebras');
      expect(selection?.isPreemptiveFallback).toBe(false);
    });

    it('should skip provider at quota limit', async () => {
      // Exhaust cerebras (96% usage)
      const ninetySixPercent = PROVIDER_QUOTAS.cerebras.dailyTokenLimit * 0.96;
      await recordProviderUsage('cerebras', ninetySixPercent);

      const selection = await selectAvailableProvider([
        'cerebras',
        'mistral',
        'openrouter',
      ]);

      expect(selection).not.toBeNull();
      expect(selection?.provider).toBe('mistral');
    });

    it('should return null when all providers exhausted', async () => {
      // Exhaust all providers
      for (const provider of ['cerebras', 'mistral', 'openrouter'] as const) {
        const quota = PROVIDER_QUOTAS[provider];
        await recordProviderUsage(provider, quota.dailyTokenLimit * 0.96);
      }

      const selection = await selectAvailableProvider([
        'cerebras',
        'mistral',
        'openrouter',
      ]);

      expect(selection).toBeNull();
    });
  });

  describe('PROVIDER_QUOTAS', () => {
    it('should have correct quota values', () => {
      expect(PROVIDER_QUOTAS.cerebras.dailyTokenLimit).toBe(24_000_000);
      expect(PROVIDER_QUOTAS.groq.dailyTokenLimit).toBe(100_000);
      expect(PROVIDER_QUOTAS.mistral.dailyTokenLimit).toBe(1_000_000);
      expect(PROVIDER_QUOTAS.openrouter.dailyTokenLimit).toBe(10_000_000);
    });
  });

  describe('PREEMPTIVE_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(PREEMPTIVE_THRESHOLDS.dailyTokenThreshold).toBe(0.8);
      expect(PREEMPTIVE_THRESHOLDS.minuteRequestThreshold).toBe(0.85);
      expect(PREEMPTIVE_THRESHOLDS.minuteTokenThreshold).toBe(0.85);
    });
  });
});
