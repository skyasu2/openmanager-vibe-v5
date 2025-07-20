/**
 * 🧪 SupabaseRAGEngine 단위 테스트
 * RAG 검색 및 벡터 임베딩 기능 테스트
 */

import { describe, it, expect, beforeAll, vi, afterAll } from 'vitest';
import { SupabaseRAGEngine } from '../supabase-rag-engine';

// Supabase 클라이언트 모킹
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        match: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [
                {
                  id: '1',
                  content: 'CPU 사용률 확인: top, htop, mpstat 명령어 사용',
                  metadata: {
                    source: 'linux-commands',
                    category: 'monitoring',
                    tags: ['cpu', 'performance'],
                    commands: ['top', 'htop', 'mpstat'],
                    priority: 'high'
                  },
                  similarity: 0.92
                },
                {
                  id: '2',
                  content: '메모리 상태 확인: free -m, vmstat 명령어로 메모리 사용량 모니터링',
                  metadata: {
                    source: 'linux-commands',
                    category: 'monitoring',
                    tags: ['memory', 'ram'],
                    commands: ['free -m', 'vmstat'],
                    priority: 'high'
                  },
                  similarity: 0.88
                }
              ],
              error: null
            }))
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    rpc: vi.fn((funcName) => {
      if (funcName === 'vector_search') {
        return Promise.resolve({
          data: [
            { id: '1', content: 'CPU monitoring', similarity: 0.9 },
            { id: '2', content: 'Memory monitoring', similarity: 0.85 }
          ],
          error: null
        });
      }
      return Promise.resolve({ data: null, error: null });
    })
  }))
}));

describe('SupabaseRAGEngine', () => {
  let ragEngine: SupabaseRAGEngine;

  beforeAll(async () => {
    ragEngine = new SupabaseRAGEngine();
    await ragEngine.initialize();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('초기화', () => {
    it('RAG 엔진이 성공적으로 초기화되어야 함', () => {
      expect(ragEngine).toBeDefined();
      expect(ragEngine.isReady()).toBe(true);
    });
  });

  describe('벡터 검색', () => {
    it('CPU 관련 질의에 대해 관련 문서를 검색해야 함', async () => {
      const query = 'CPU 사용률 확인 방법';
      
      const result = await ragEngine.search(query, {
        limit: 5,
        threshold: 0.7
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].content).toContain('CPU');
      expect(result.results[0].metadata.commands).toContain('top');
      expect(result.results[0].similarity).toBeGreaterThan(0.9);
    });

    it('메모리 관련 질의에 대해 관련 문서를 검색해야 함', async () => {
      const query = '메모리 사용량 확인';
      
      const result = await ragEngine.search(query, {
        limit: 5,
        threshold: 0.7
      });

      expect(result.success).toBe(true);
      expect(result.results.some(r => r.content.includes('메모리'))).toBe(true);
      expect(result.results.some(r => r.metadata.commands.includes('free -m'))).toBe(true);
    });

    it('임계값 이하의 결과는 필터링되어야 함', async () => {
      const query = '관련없는 질의';
      
      // Mock low similarity results
      vi.mocked(ragEngine['supabase'].rpc).mockResolvedValueOnce({
        data: [
          { id: '1', content: 'Unrelated content', similarity: 0.3 },
          { id: '2', content: 'Another unrelated', similarity: 0.2 }
        ],
        error: null
      });

      const result = await ragEngine.search(query, {
        limit: 5,
        threshold: 0.7
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('캐싱', () => {
    it('동일한 질의에 대해 캐시된 결과를 반환해야 함', async () => {
      const query = 'CPU 모니터링';
      
      // 첫 번째 검색
      const result1 = await ragEngine.search(query);
      expect(result1.cached).toBe(false);

      // 두 번째 검색 (캐시됨)
      const result2 = await ragEngine.search(query);
      expect(result2.cached).toBe(true);
      expect(result2.results).toEqual(result1.results);
    });

    it('캐시 만료 후 새로운 검색을 수행해야 함', async () => {
      const query = '캐시 테스트 질의';
      
      // 캐시 강제 만료
      ragEngine['queryCache'].clear();
      
      const result = await ragEngine.search(query);
      expect(result.cached).toBe(false);
    });
  });

  describe('한국어 처리', () => {
    it('한국어 형태소 분석이 적용되어야 함', async () => {
      const query = '서버의 CPU 사용률이 높습니다';
      
      // 형태소 분석 결과 확인
      const processed = await ragEngine['preprocessQuery'](query);
      
      expect(processed).toBeDefined();
      expect(processed).toContain('서버');
      expect(processed).toContain('CPU');
      expect(processed).toContain('사용률');
    });

    it('영어 질의도 처리 가능해야 함', async () => {
      const query = 'check server CPU usage';
      
      const result = await ragEngine.search(query);
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('에러 처리', () => {
    it('빈 질의에 대해 에러를 반환해야 함', async () => {
      const query = '';
      
      const result = await ragEngine.search(query);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('질의가 비어있습니다');
    });

    it('Supabase 에러 시 적절한 에러 메시지를 반환해야 함', async () => {
      const query = '에러 테스트';
      
      // Mock Supabase error
      vi.mocked(ragEngine['supabase'].rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await ragEngine.search(query);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('검색 중 오류가 발생했습니다');
    });
  });

  describe('성능 측정', () => {
    it('검색 처리 시간을 측정해야 함', async () => {
      const query = '성능 테스트 질의';
      
      const result = await ragEngine.search(query);
      
      expect(result.processingTime).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(1000); // 1초 이내
    });
  });

  describe('MCP 컨텍스트 통합', () => {
    it('MCP 컨텍스트가 포함된 검색 결과를 반환해야 함', async () => {
      const query = '현재 서버 상태';
      
      // Mock MCP context
      ragEngine['mcpEnabled'] = true;
      vi.spyOn(ragEngine as any, 'queryMCPFileSystem').mockResolvedValue({
        files: [
          { path: '/monitoring/cpu.md', content: 'CPU monitoring guide', type: 'file' }
        ],
        systemContext: { totalServers: 5 },
        relevantPaths: ['/monitoring']
      });

      const result = await ragEngine.search(query, {
        includeMCPContext: true
      });
      
      expect(result.mcpContext).toBeDefined();
      expect(result.mcpContext.files).toHaveLength(1);
      expect(result.mcpContext.systemContext.totalServers).toBe(5);
    });
  });
});