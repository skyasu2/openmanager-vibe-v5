import { describe, expect, it } from 'vitest';
import {
  AI_PROVIDERS,
  getDefaultProviderStatus,
  getProviderConfig,
} from './ai-providers';

describe('ai-providers', () => {
  describe('AI_PROVIDERS', () => {
    it('should have exactly 3 providers', () => {
      expect(AI_PROVIDERS).toHaveLength(3);
    });

    it('should have Cerebras as Primary', () => {
      const cerebras = AI_PROVIDERS.find((p) => p.name === 'Cerebras');
      expect(cerebras).toBeDefined();
      expect(cerebras?.role).toBe('Primary');
    });

    it('should have Groq as NLQ Agent', () => {
      const groq = AI_PROVIDERS.find((p) => p.name === 'Groq');
      expect(groq).toBeDefined();
      expect(groq?.role).toBe('NLQ Agent');
    });

    it('should have Mistral as Verifier', () => {
      const mistral = AI_PROVIDERS.find((p) => p.name === 'Mistral');
      expect(mistral).toBeDefined();
      expect(mistral?.role).toBe('Verifier');
    });

    it('all providers should have required fields', () => {
      for (const provider of AI_PROVIDERS) {
        expect(provider.name).toBeTruthy();
        expect(provider.role).toBeTruthy();
        expect(provider.model).toBeTruthy();
        expect(provider.description).toBeTruthy();
        expect(provider.color).toMatch(/^bg-\w+-\d+$/);
      }
    });
  });

  describe('getProviderConfig', () => {
    it('should find provider by exact name', () => {
      const config = getProviderConfig('Cerebras');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Cerebras');
    });

    it('should find provider case-insensitively', () => {
      expect(getProviderConfig('cerebras')?.name).toBe('Cerebras');
      expect(getProviderConfig('GROQ')?.name).toBe('Groq');
      expect(getProviderConfig('MiStRaL')?.name).toBe('Mistral');
    });

    it('should return undefined for unknown provider', () => {
      expect(getProviderConfig('Unknown')).toBeUndefined();
      expect(getProviderConfig('Gemini')).toBeUndefined();
    });
  });

  describe('getDefaultProviderStatus', () => {
    it('should return status array with same length as AI_PROVIDERS', () => {
      const statuses = getDefaultProviderStatus();
      expect(statuses).toHaveLength(AI_PROVIDERS.length);
    });

    it('should set all providers to active status', () => {
      const statuses = getDefaultProviderStatus();
      for (const status of statuses) {
        expect(status.status).toBe('active');
      }
    });

    it('should include name, role, color from config', () => {
      const statuses = getDefaultProviderStatus();
      for (let i = 0; i < statuses.length; i++) {
        expect(statuses[i].name).toBe(AI_PROVIDERS[i].name);
        expect(statuses[i].role).toBe(AI_PROVIDERS[i].role);
        expect(statuses[i].color).toBe(AI_PROVIDERS[i].color);
      }
    });

    it('should return new array on each call (immutable)', () => {
      const statuses1 = getDefaultProviderStatus();
      const statuses2 = getDefaultProviderStatus();
      expect(statuses1).not.toBe(statuses2);
      expect(statuses1).toEqual(statuses2);
    });
  });
});
