/**
 * 🗄️ Supabase Mock - AI 엔진 테스트를 위한 향상된 버전
 */

import { vi } from 'vitest';

// Mock 데이터
const mockVectorDocuments = [
  {
    id: 'test-doc-1',
    content: 'Test server monitoring documentation',
    metadata: { category: 'monitoring', type: 'server' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'test-doc-2',
    content: 'AI performance analysis guide',
    metadata: { category: 'ai', type: 'performance' },
    created_at: new Date().toISOString(),
  },
];

const mockStats = {
  total_documents: 2,
  total_categories: 2,
  last_updated: new Date().toISOString(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((tableName: string) => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn((count: number) => {
          // command_vectors 테이블 조회 시 특별 처리
          if (tableName === 'command_vectors') {
            if (count === 1) {
              return {
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockVectorDocuments[0],
                    error: null,
                  })
                ),
              };
            }
            return Promise.resolve({
              data: mockVectorDocuments.slice(0, count),
              error: null,
            });
          }

          // knowledge_base_stats 테이블 조회 시
          if (tableName === 'knowledge_base_stats') {
            return {
              single: vi.fn(() =>
                Promise.resolve({
                  data: mockStats,
                  error: null,
                })
              ),
            };
          }

          return mockQueryBuilder;
        }),
        single: vi.fn(() =>
          Promise.resolve({
            data:
              tableName === 'command_vectors'
                ? mockVectorDocuments[0]
                : mockStats,
            error: null,
          })
        ),
        // RPC 함수들 (pgvector 확장 기능)
        rpc: vi.fn((funcName: string, _params?: any) => {
          if (
            funcName === 'match_documents' ||
            funcName === 'similarity_search'
          ) {
            return Promise.resolve({
              data: mockVectorDocuments.map(doc => ({
                ...doc,
                similarity: 0.8,
              })),
              error: null,
            });
          }
          if (funcName === 'get_knowledge_stats') {
            return Promise.resolve({
              data: mockStats,
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        }),
      };

      return mockQueryBuilder;
    }),

    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },

    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },

    // RPC 직접 호출도 지원
    rpc: vi.fn((funcName: string, _params?: any) => {
      if (funcName === 'match_documents' || funcName === 'similarity_search') {
        return Promise.resolve({
          data: mockVectorDocuments.map(doc => ({
            ...doc,
            similarity: 0.8,
          })),
          error: null,
        });
      }
      if (funcName === 'get_knowledge_stats') {
        return Promise.resolve({
          data: mockStats,
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    }),
  })),
}));

// Mock 라이브러리 자체도 Export
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((tableName: string) => {
      if (tableName === 'command_vectors') {
        return {
          select: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: mockVectorDocuments,
                error: null,
              })
            ),
          })),
          rpc: vi.fn(() =>
            Promise.resolve({
              data: mockVectorDocuments.map(doc => ({
                ...doc,
                similarity: 0.8,
              })),
              error: null,
            })
          ),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn(() =>
          Promise.resolve({
            data: mockStats,
            error: null,
          })
        ),
        single: vi.fn(() =>
          Promise.resolve({
            data: mockStats,
            error: null,
          })
        ),
      };
    }),
    rpc: vi.fn((funcName: string) => {
      if (funcName === 'get_knowledge_stats') {
        return Promise.resolve({ data: mockStats, error: null });
      }
      return Promise.resolve({ data: [], error: null });
    }),
  },
}));
