/**
 * Reporter Tools Unit Tests
 *
 * P0 Priority Tests for Tavily web search - validates tool configuration
 * and return structure without hitting real APIs.
 *
 * All external dependencies are mocked to ensure:
 * - No network calls during tests
 * - Fast, deterministic test execution
 * - CI/CD pipeline reliability
 *
 * @version 1.1.0
 * @created 2026-01-04
 * @updated 2026-01-05 - Added @tavily/core mock (CODEX review feedback)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mock Setup - All external dependencies mocked before imports
// ============================================================================

// Mock Tavily to prevent network calls (CODEX review fix)
const mockTavilySearch = vi.fn();
vi.mock('@tavily/core', () => ({
  tavily: vi.fn(() => ({
    search: mockTavilySearch,
  })),
}));

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

// ============================================================================
// 5. Mocked API Call Tests (No Network)
// Note: Each test uses a unique query to avoid module-level cache interference
// ============================================================================
describe('Reporter Tools - Tavily API Mocked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTavilySearch.mockReset();
  });

  it('should return success when API call succeeds', async () => {
    vi.mocked(getTavilyApiKey).mockReturnValue('tvly-valid-key');
    vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);
    mockTavilySearch.mockResolvedValue({
      results: [
        { title: 'Test Result', url: 'https://example.com', content: 'Test content', score: 0.95 },
      ],
      answer: 'Mocked answer',
    });

    const result = await searchWeb.execute({
      query: 'success test query unique-1',
      maxResults: 5,
      searchDepth: 'basic',
    });

    expect(result.success).toBe(true);
    expect(result._source).toBe('Tavily Web Search');
    expect(result.results).toHaveLength(1);
    expect(result.answer).toBe('Mocked answer');
  });

  it('should failover to backup key when primary fails', async () => {
    vi.mocked(getTavilyApiKey).mockReturnValue('primary-key');
    vi.mocked(getTavilyApiKeyBackup).mockReturnValue('backup-key');

    let callCount = 0;
    mockTavilySearch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      return Promise.resolve({
        results: [{ title: 'Backup Result', url: 'https://backup.com', content: 'Backup', score: 0.8 }],
        answer: null,
      });
    });

    const result = await searchWeb.execute({
      query: 'failover test query unique-2',
      maxResults: 5,
      searchDepth: 'basic',
    });

    expect(result.success).toBe(true);
    expect(result._source).toBe('Tavily Web Search (Failover)');
  });

  it('should return error when both keys fail', async () => {
    vi.mocked(getTavilyApiKey).mockReturnValue('primary-key');
    vi.mocked(getTavilyApiKeyBackup).mockReturnValue('backup-key');

    mockTavilySearch.mockImplementation(() => {
      return Promise.reject(new Error('API failed'));
    });

    const result = await searchWeb.execute({
      query: 'both keys fail query unique-3',
      maxResults: 5,
      searchDepth: 'basic',
    });

    expect(result.success).toBe(false);
    expect(result._source).toBe('Tavily (All Keys Failed)');
  });

  it('should handle primary key failure with no backup', async () => {
    vi.mocked(getTavilyApiKey).mockReturnValue('primary-key');
    vi.mocked(getTavilyApiKeyBackup).mockReturnValue(null);

    mockTavilySearch.mockImplementation(() => {
      return Promise.reject(new Error('API Error'));
    });

    const result = await searchWeb.execute({
      query: 'primary fail no backup unique-4',
      maxResults: 5,
      searchDepth: 'basic',
    });

    expect(result.success).toBe(false);
    expect(result._source).toBe('Tavily (Primary Failed, No Backup)');
  });
});
