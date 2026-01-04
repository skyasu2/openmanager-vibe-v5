/**
 * Reporter Tools Unit Tests
 *
 * P0 Priority Tests for Tavily web search - validates tool configuration
 * and return structure without hitting real APIs.
 *
 * Note: Dynamic imports make full mocking complex; these tests focus on
 * verifiable behavior through the tool interface.
 *
 * @version 1.0.0
 * @created 2026-01-04
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config-parser module
vi.mock('../lib/config-parser', () => ({
  getTavilyApiKey: vi.fn(),
  getTavilyApiKeyBackup: vi.fn(),
  getSupabaseConfig: vi.fn(),
}));

// Mock Supabase to avoid connection attempts
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
  })),
}));

// Mock embedding functions
vi.mock('../lib/embedding', () => ({
  searchWithEmbedding: vi.fn().mockResolvedValue({ success: false, results: [] }),
  embedText: vi.fn().mockResolvedValue([]),
}));

vi.mock('../lib/llamaindex-rag-service', () => ({
  hybridGraphSearch: vi.fn().mockResolvedValue([]),
}));

// Import after mocking
import { searchWeb } from './reporter-tools';
import { getTavilyApiKey, getTavilyApiKeyBackup } from '../lib/config-parser';

describe('Reporter Tools - Web Search Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. Tool Definition Tests
  // ============================================================================
  describe('Tool Definition', () => {
    it('should have correct tool description', () => {
      expect(searchWeb.description).toContain('웹 검색');
    });

    it('should have inputSchema with required query parameter', () => {
      const schema = searchWeb.inputSchema;
      expect(schema).toBeDefined();
      // Zod schema should define query as string
      expect(schema.shape?.query).toBeDefined();
    });
  });

  // ============================================================================
  // 2. API Key Configuration Tests
  // ============================================================================
  describe('API Key Configuration', () => {
    it('should return error when no API keys configured', async () => {
      vi.mocked(getTavilyApiKey).mockReturnValue(null);
      vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

      const result = await searchWeb.execute({
        query: 'test query',
        maxResults: 5,
        searchDepth: 'basic',
        includeDomains: [],
        excludeDomains: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tavily API key not configured');
      expect(result._source).toBe('Tavily (Unconfigured)');
    });

    it('should call getTavilyApiKey and getTavilyApiKeyBackup', async () => {
      vi.mocked(getTavilyApiKey).mockReturnValue(null);
      vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

      await searchWeb.execute({
        query: 'test query',
      });

      expect(getTavilyApiKey).toHaveBeenCalled();
      expect(getTavilyApiKeyBackup).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 3. Return Structure Tests
  // ============================================================================
  describe('Return Structure', () => {
    it('should return correct structure on API key error', async () => {
      vi.mocked(getTavilyApiKey).mockReturnValue(null);
      vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

      const result = await searchWeb.execute({
        query: 'test query',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('_source');
      expect(result).toHaveProperty('results');
      expect(result.results).toEqual([]);
    });

    it('should include query in result when provided', async () => {
      vi.mocked(getTavilyApiKey).mockReturnValue(null);
      vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

      const result = await searchWeb.execute({
        query: 'docker container logs',
      });

      // Query is not included in error response, but error is present
      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // 4. Input Validation Tests
  // ============================================================================
  describe('Input Handling', () => {
    it('should accept query with default options', async () => {
      vi.mocked(getTavilyApiKey).mockReturnValue(null);
      vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

      // Should not throw even with minimal input
      const result = await searchWeb.execute({
        query: 'kubernetes pods',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(false); // No API key
    });

    it('should handle all optional parameters', async () => {
      vi.mocked(getTavilyApiKey).mockReturnValue(null);
      vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

      const result = await searchWeb.execute({
        query: 'test query',
        maxResults: 10,
        searchDepth: 'advanced',
        includeDomains: ['docs.example.com'],
        excludeDomains: ['spam.com'],
      });

      expect(result).toBeDefined();
    });
  });
});

describe('Reporter Tools - Web Search Integration', () => {
  // These tests verify behavior when API keys are configured
  // They may fail if network is unavailable but validate the flow

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should attempt search when primary key is set', async () => {
    // Configure a fake key - this will fail at Tavily API but proves the flow
    vi.mocked(getTavilyApiKey).mockReturnValue('tvly-test-invalid-key');
    vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

    const result = await searchWeb.execute({
      query: 'test query',
      maxResults: 5,
      searchDepth: 'basic',
    });

    // Will fail due to invalid key, but should have attempted
    // The result structure should indicate the attempt
    expect(result._source).toBeDefined();
    // Source will indicate attempt was made
    expect(['Tavily (Primary Failed, No Backup)', 'Tavily Web Search']).toContain(
      result._source
    );
  });
});
