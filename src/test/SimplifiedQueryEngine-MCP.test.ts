/**
 * 🧪 SimplifiedQueryEngine MCP 통합 테스트
 * Google AI 모드에서도 MCP 컨텍스트를 사용할 수 있는지 확인
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimplifiedQueryEngine, getSimplifiedQueryEngine } from '@/services/ai/SimplifiedQueryEngine';
import type {
  QueryRequest,
  QueryResponse,
} from '@/services/ai/SimplifiedQueryEngine';
import { getSupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import { QueryComplexityAnalyzer } from '@/services/ai/query-complexity-analyzer';
import * as cacheConfig from '@/config/free-tier-cache-config';

// Mock dependencies
vi.mock('@/services/ai/supabase-rag-engine');
vi.mock('@/services/mcp/CloudContextLoader');
vi.mock('@/services/ai/query-complexity-analyzer');
vi.mock('@/config/free-tier-cache-config');
vi.mock('@/lib/logger');

// Mock fetch globally
global.fetch = vi.fn();

describe('SimplifiedQueryEngine - MCP Integration', () => {
  let engine: SimplifiedQueryEngine;
  let mockRAGEngine: any;
  let mockContextLoader: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock RAG engine
    mockRAGEngine = {
      initialize: vi.fn().mockResolvedValue(undefined),
      searchSimilar: vi.fn().mockResolvedValue({
        results: [
          {
            content: 'MCP 관련 콘텐츠',
            similarity: 0.85,
            metadata: { category: 'mcp' },
          },
        ],
        totalResults: 1,
        cached: false,
      }),
      healthCheck: vi.fn().mockResolvedValue({
        status: 'healthy',
        vectorDB: true,
      }),
    };
    
    // Mock context loader
    mockContextLoader = {
      queryMCPContextForRAG: vi.fn().mockResolvedValue({
        files: [
          {
            path: '/src/services/mcp/context.ts',
            content: 'MCP 컨텍스트 파일 내용',
          },
        ],
        systemContext: {
          mcpEnabled: true,
          servers: ['filesystem', 'github'],
        },
      }),
      getIntegratedStatus: vi.fn().mockResolvedValue({
        mcpServer: { status: 'online' },
      }),
    };
    
    // Mock complexity analyzer
    vi.mocked(QueryComplexityAnalyzer.analyze).mockReturnValue({
      score: 60,
      category: 'medium',
      recommendation: 'google-ai',
      factors: {
        queryLength: 15,
        hasOperators: false,
        hasServerContext: true,
        technicalTerms: 2,
        multipleTopics: false,
      },
    });
    
    // Mock cache config
    vi.mocked(cacheConfig.createCacheKey).mockImplementation((prefix, key) => `${prefix}:${key}`);
    vi.mocked(cacheConfig.getTTL).mockReturnValue(900);
    vi.mocked(cacheConfig.validateDataSize).mockReturnValue(true);
    
    // Mock static methods
    vi.mocked(getSupabaseRAGEngine).mockReturnValue(mockRAGEngine);
    vi.mocked(CloudContextLoader.getInstance).mockReturnValue(mockContextLoader);
    
    // Mock fetch for Google AI
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Google AI 응답 with MCP 컨텍스트',
        confidence: 0.92,
        model: 'gemini-pro',
        tokensUsed: 150,
      }),
    } as Response);
    
    engine = new SimplifiedQueryEngine();
  });

  describe('Google AI 모드에서 MCP 컨텍스트 사용', () => {
    it('includeMCPContext 옵션이 true일 때 MCP를 사용해야 함', async () => {
      const request: QueryRequest = {
        query: '현재 서버 상태는 어떤가요?',
        mode: 'google-ai',
        options: {
          includeMCPContext: true,
        },
      };

      await engine.initialize();
      const response = await engine.query(request);
      
      // Wait for MCP context
      vi.advanceTimersByTime(100);

      expect(response.success).toBe(true);
      expect(response.metadata?.mcpUsed).toBe(true);
      expect(
        response.thinkingSteps.some(
          step => step.step.includes('MCP') || step.description?.includes('MCP')
        )
      ).toBe(true);
      expect(mockContextLoader.queryMCPContextForRAG).toHaveBeenCalledWith(
        '현재 서버 상태는 어떤가요?',
        expect.objectContaining({
          maxFiles: 3,
          includeSystemContext: true,
        })
      );
    });

    it('MCP 컨텍스트가 Google AI 응답에 포함되어야 함', async () => {
      const request: QueryRequest = {
        query: '서버 메트릭 확인 명령어는?',
        mode: 'google-ai',
        context: {
          servers: [
            {
              id: 'srv-001',
              name: 'web-server-01',
              status: 'warning',
              cpu: 85,
              memory: 78,
              disk: 45,
              network: 120,
            },
          ],
        },
        options: {
          includeMCPContext: true,
        },
      };

      await engine.initialize();
      const response = await engine.query(request);
      
      // Wait for async operations
      vi.advanceTimersByTime(100);

      expect(response.success).toBe(true);
      expect(response.engine).toBe('google-ai');
      expect(response.metadata?.mcpUsed).toBe(true);

      // MCP 단계가 thinkingSteps에 포함되어야 함
      const mcpStep = response.thinkingSteps.find(step =>
        step.step.includes('MCP') || step.description?.includes('MCP') || step.description?.includes('파일')
      );
      expect(mcpStep).toBeDefined();
      expect(mcpStep?.status).toBe('completed');
      
      // Google AI가 MCP 컨텍스트를 포함한 프롬프트를 받았는지 확인
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/google-ai/generate',
        expect.objectContaining({
          body: expect.stringContaining('MCP'),
        })
      );
    });

    it('includeMCPContext가 false일 때는 MCP를 사용하지 않아야 함', async () => {
      const request: QueryRequest = {
        query: '서버 상태 요약',
        mode: 'google-ai',
        options: {
          includeMCPContext: false,
        },
      };

      await engine.initialize();
      const response = await engine.query(request);

      expect(response.success).toBe(true);
      expect(response.metadata?.mcpUsed).toBe(false);
      expect(
        response.thinkingSteps.every(
          step =>
            !step.step.includes('MCP') && !step.description?.includes('MCP')
        )
      ).toBe(true);
      expect(mockContextLoader.queryMCPContextForRAG).not.toHaveBeenCalled();
    });

    it('MCP 오류 시에도 Google AI가 정상 작동해야 함', async () => {
      // MCP가 오류를 발생시키도록 설정
      mockContextLoader.queryMCPContextForRAG.mockRejectedValue(new Error('MCP Error'));

      const request: QueryRequest = {
        query: '서버 문제 진단',
        mode: 'google-ai',
        options: {
          includeMCPContext: true,
        },
      };

      await engine.initialize();
      const response = await engine.query(request);
      
      // Wait for async operations
      vi.advanceTimersByTime(100);

      // MCP 오류에도 불구하고 응답은 성공해야 함
      expect(response.success).toBe(true);
      expect(response.engine).toBe('google-ai');
      // MCP는 사용 시도했지만 실패
      const mcpFailedStep = response.thinkingSteps.find(
        step => step.status === 'failed' && (step.step.includes('MCP') || step.description?.includes('MCP'))
      );
      expect(mcpFailedStep).toBeDefined();
    });
  });

  describe('Local 모드와 Google AI 모드의 MCP 동작 차이', () => {
    it('Google AI 모드에서만 MCP가 사용되어야 함', async () => {
      const baseRequest: Omit<QueryRequest, 'mode'> = {
        query: 'CPU 사용률이 높은 서버 확인',
        options: {
          includeMCPContext: true,
        },
      };

      await engine.initialize();

      // Local 모드
      const localResponse = await engine.query({
        ...baseRequest,
        mode: 'local',
      });
      
      // Wait for async operations
      vi.advanceTimersByTime(100);

      // Google AI 모드
      const googleResponse = await engine.query({
        ...baseRequest,
        mode: 'google-ai',
      });
      
      // Wait for async operations
      vi.advanceTimersByTime(100);

      // Local 모드는 MCP를 사용하지 않음
      expect(localResponse.metadata?.mcpUsed).toBeFalsy();
      
      // Google AI 모드는 MCP를 사용함
      expect(googleResponse.metadata?.mcpUsed).toBe(true);

      // Local 모드는 MCP 단계가 없어야 함
      expect(
        localResponse.thinkingSteps.some(step =>
          step.step.includes('MCP') || step.description?.includes('MCP')
        )
      ).toBe(false);
      
      // Google AI 모드는 MCP 단계가 있어야 함
      expect(
        googleResponse.thinkingSteps.some(step =>
          step.step.includes('MCP') || step.description?.includes('MCP')
        )
      ).toBe(true);
      
      // MCP context loader가 Google AI 모드에서만 호출되었는지 확인
      expect(mockContextLoader.queryMCPContextForRAG).toHaveBeenCalledTimes(1);
    });
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
});
