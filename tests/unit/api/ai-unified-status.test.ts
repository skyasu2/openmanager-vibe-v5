import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the actual API route function
const mockGET = vi.fn();

// Mock the API route
vi.mock('@/app/api/ai/unified-query/route', () => ({
  GET: mockGET,
}));

// Mock the UnifiedAIEngineRouter
vi.mock('@/core/ai/engines/UnifiedAIEngineRouter', () => ({
  UnifiedAIEngineRouter: {
    getInstance: vi.fn(() => ({
      getStatus: vi.fn(() => ({
        mode: 'LOCAL',
        engines: {
          supabase: { status: 'active', priority: 50 },
          korean: { status: 'active', priority: 30 },
        },
        activeEngines: 2,
        totalEngines: 2,
      })),
    })),
  },
}));

describe('/api/ai/unified-query GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful response
    mockGET.mockResolvedValue(
      new Response(
        JSON.stringify({
          mode: 'LOCAL',
          engines: {
            supabase: { status: 'active', priority: 50 },
            korean: { status: 'active', priority: 30 },
          },
          activeEngines: 2,
          totalEngines: 2,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  });

  it('should return unified AI status', async () => {
    // Given
    const request = new Request('http://localhost:3000/api/ai/unified-query', {
      method: 'GET',
    });

    // When
    const response = await mockGET(request);
    const data = await response.json();

    // Then
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('mode', 'LOCAL');
    expect(data).toHaveProperty('engines');
    expect(data).toHaveProperty('activeEngines', 2);
    expect(data).toHaveProperty('totalEngines', 2);
  });

  it('should handle errors gracefully', async () => {
    // Given
    mockGET.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: '통합 AI 상태 조회 실패: Router error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const request = new Request('http://localhost:3000/api/ai/unified-query', {
      method: 'GET',
    });

    // When
    const response = await mockGET(request);
    const data = await response.json();

    // Then
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('통합 AI 상태 조회 실패');
  });
});
