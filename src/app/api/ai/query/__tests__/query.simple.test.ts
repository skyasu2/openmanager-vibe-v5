/**
 * Simple test to verify basic API functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock all dependencies first
vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

vi.mock('@/lib/cache-helper', () => ({
  getCachedData: vi.fn(() => null),
  setCachedData: vi.fn(),
}));

vi.mock('@/lib/supabase/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('@/services/ai/SimplifiedQueryEngine', () => ({
  getSimplifiedQueryEngine: () => ({
    _initialize: vi.fn(() => Promise.resolve()), // Promise를 반환하도록 수정
    query: vi.fn(() => Promise.resolve({
      success: true,
      response: 'Test response',
      confidence: 0.9,
      engine: 'test',
      processingTime: 100,
      metadata: {},
      thinkingSteps: [],
    })),
    healthCheck: vi.fn(() => Promise.resolve({
      status: 'healthy',
      engines: { localRAG: true, googleAI: true, mcp: true },
    })),
  }),
}));

describe('Simple Query API Test', () => {
  it('should return 200 for valid query', async () => {
    // Import after mocks are set up
    const { POST } = await import('../route');
    
    const request = new NextRequest('http://localhost:3000/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Test query' }),
    });

    const response = await POST(request);
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.answer).toBe('Test response');
  });
});