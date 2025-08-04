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

// Supabase - 조건부 Mock (환경변수에 따라)
const shouldMockSupabase = process.env.FORCE_MOCK_SUPABASE === 'true' || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                          process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-supabase.test';

if (shouldMockSupabase) {
  console.log('🎭 Supabase Mock 활성화됨');
  
  vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
      from: vi.fn((tableName: string) => {
        const createMockResponse = (data: unknown) => ({
          data,
          error: null,
          status: 200,
          statusText: 'OK',
          count: null,
        });

        const mockQueryBuilder = {
          select: vi.fn().mockImplementation(() => {
            const selectQueryBuilder = {
              ...mockQueryBuilder,
              then: vi.fn((callback) => {
                let result;
                if (tableName === 'command_vectors') {
                  result = createMockResponse(mockVectorDocuments);
                } else if (tableName === 'knowledge_base_stats') {
                  result = createMockResponse([mockStats]);
                } else {
                  result = createMockResponse([]);
                }
                return Promise.resolve(result).then(callback);
              }),
              single: vi.fn(() =>
                Promise.resolve(
                  tableName === 'command_vectors'
                    ? createMockResponse(mockVectorDocuments[0])
                    : createMockResponse(mockStats)
                )
              ),
            };
            return selectQueryBuilder;
          }),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          like: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          contains: vi.fn().mockReturnThis(),
          limit: vi.fn((count: number) => {
            if (tableName === 'command_vectors') {
              if (count === 1) {
                return {
                  single: vi.fn(() =>
                    Promise.resolve(createMockResponse(mockVectorDocuments[0]))
                  ),
                  then: vi.fn((callback) =>
                    Promise.resolve(
                      createMockResponse([mockVectorDocuments[0]])
                    ).then(callback)
                  ),
                };
              }
              return Promise.resolve(
                createMockResponse(mockVectorDocuments.slice(0, count))
              );
            }

            if (tableName === 'knowledge_base_stats') {
              return {
                single: vi.fn(() =>
                  Promise.resolve(createMockResponse(mockStats))
                ),
                then: vi.fn((callback) =>
                  Promise.resolve(createMockResponse([mockStats])).then(callback)
                ),
              };
            }

            return Promise.resolve(createMockResponse([]));
          }),
          single: vi.fn(() =>
            Promise.resolve(
              tableName === 'command_vectors'
                ? createMockResponse(mockVectorDocuments[0])
                : createMockResponse(mockStats)
            )
          ),
          then: vi.fn((callback) => {
            const result =
              tableName === 'command_vectors'
                ? createMockResponse(mockVectorDocuments)
                : createMockResponse([mockStats]);
            return Promise.resolve(result).then(callback);
          }),
          rpc: vi.fn((funcName: string, _params?: unknown) => {
            if (
              funcName === 'match_documents' ||
              funcName === 'similarity_search'
            ) {
              return Promise.resolve(
                createMockResponse(
                  mockVectorDocuments.map((doc) => ({
                    ...doc,
                    similarity: 0.8,
                  }))
                )
              );
            }
            if (funcName === 'get_knowledge_stats') {
              return Promise.resolve(createMockResponse(mockStats));
            }
            return Promise.resolve(createMockResponse([]));
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

      rpc: vi.fn((funcName: string, _params?: unknown) => {
        const createMockResponse = (data: unknown) => ({
          data,
          error: null,
          status: 200,
          statusText: 'OK',
          count: null,
        });

        if (funcName === 'match_documents' || funcName === 'similarity_search') {
          return Promise.resolve(
            createMockResponse(
              mockVectorDocuments.map((doc) => ({
                ...doc,
                similarity: 0.8,
              }))
            )
          );
        }
        if (funcName === 'get_knowledge_stats') {
          return Promise.resolve(createMockResponse(mockStats));
        }
        return Promise.resolve(createMockResponse([]));
      }),
    })),
  }));

  // Mock 라이브러리 자체도 Export
  vi.mock('@/lib/supabase', () => ({
    supabase: {
      from: vi.fn((tableName: string) => {
        const createMockResponse = (data: unknown) => ({
          data,
          error: null,
          status: 200,
          statusText: 'OK',
          count: null,
        });

        const mockQueryBuilder = {
          select: vi.fn().mockImplementation(() => ({
            ...mockQueryBuilder,
            then: vi.fn((callback) => {
              let result;
              if (tableName === 'command_vectors') {
                result = createMockResponse(mockVectorDocuments);
              } else if (tableName === 'knowledge_base_stats') {
                result = createMockResponse([mockStats]);
              } else {
                result = createMockResponse([]);
              }
              return Promise.resolve(result).then(callback);
            }),
            single: vi.fn(() =>
              Promise.resolve(
                tableName === 'command_vectors'
                  ? createMockResponse(mockVectorDocuments[0])
                  : createMockResponse(mockStats)
              )
            ),
          })),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          like: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          contains: vi.fn().mockReturnThis(),
          limit: vi.fn((count: number) => {
            if (tableName === 'command_vectors') {
              if (count === 1) {
                return {
                  single: vi.fn(() =>
                    Promise.resolve(createMockResponse(mockVectorDocuments[0]))
                  ),
                  then: vi.fn((callback) =>
                    Promise.resolve(
                      createMockResponse([mockVectorDocuments[0]])
                    ).then(callback)
                  ),
                };
              }
              return Promise.resolve(
                createMockResponse(mockVectorDocuments.slice(0, count))
              );
            }

            if (tableName === 'knowledge_base_stats') {
              return {
                single: vi.fn(() =>
                  Promise.resolve(createMockResponse(mockStats))
                ),
                then: vi.fn((callback) =>
                  Promise.resolve(createMockResponse([mockStats])).then(callback)
                ),
              };
            }

            return Promise.resolve(createMockResponse([]));
          }),
          single: vi.fn(() =>
            Promise.resolve(
              tableName === 'command_vectors'
                ? createMockResponse(mockVectorDocuments[0])
                : createMockResponse(mockStats)
            )
          ),
          then: vi.fn((callback) => {
            const result =
              tableName === 'command_vectors'
                ? createMockResponse(mockVectorDocuments)
                : createMockResponse([mockStats]);
            return Promise.resolve(result).then(callback);
          }),
          rpc: vi.fn((funcName: string, _params?: unknown) => {
            if (
              funcName === 'match_documents' ||
              funcName === 'similarity_search'
            ) {
              return Promise.resolve(
                createMockResponse(
                  mockVectorDocuments.map((doc) => ({
                    ...doc,
                    similarity: 0.8,
                  }))
                )
              );
            }
            if (funcName === 'get_knowledge_stats') {
              return Promise.resolve(createMockResponse(mockStats));
            }
            return Promise.resolve(createMockResponse([]));
          }),
        };

        return mockQueryBuilder;
      }),
      rpc: vi.fn((funcName: string, _params?: unknown) => {
        const createMockResponse = (data: unknown) => ({
          data,
          error: null,
          status: 200,
          statusText: 'OK',
          count: null,
        });

        if (funcName === 'match_documents' || funcName === 'similarity_search') {
          return Promise.resolve(
            createMockResponse(
              mockVectorDocuments.map((doc) => ({
                ...doc,
                similarity: 0.8,
              }))
            )
          );
        }
        if (funcName === 'get_knowledge_stats') {
          return Promise.resolve(createMockResponse(mockStats));
        }
        return Promise.resolve(createMockResponse([]));
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
    },
  }));
} else {
  console.log('🌐 실제 Supabase 서비스 사용 중');
}