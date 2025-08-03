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
      const createMockResponse = (data: unknown) => ({
        data,
        error: null,
        status: 200,
        statusText: 'OK',
        count: null,
      });

      const mockQueryBuilder = {
        select: vi.fn().mockImplementation(() => {
          // 기본적으로 select()는 query builder를 반환하고, 실행은 나중에
          const selectQueryBuilder = {
            ...mockQueryBuilder,
            // 체인 끝에서 실행될 때 Promise 반환
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
          // command_vectors 테이블 조회 시 특별 처리
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

          // knowledge_base_stats 테이블 조회 시
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

          // 기본값 (빈 promise로 반환)
          return Promise.resolve(createMockResponse([]));
        }),
        single: vi.fn(() =>
          Promise.resolve(
            tableName === 'command_vectors'
              ? createMockResponse(mockVectorDocuments[0])
              : createMockResponse(mockStats)
          )
        ),
        // then 메서드 추가 (Promise-like 동작을 위해)
        then: vi.fn((callback) => {
          const result =
            tableName === 'command_vectors'
              ? createMockResponse(mockVectorDocuments)
              : createMockResponse([mockStats]);
          return Promise.resolve(result).then(callback);
        }),
        // RPC 함수들 (pgvector 확장 기능)
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

    // RPC 직접 호출도 지원
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

// Mock 라이브러리 자체도 Export - 전체 메서드 체인 지원
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
        select: vi.fn().mockImplementation(() => {
          // 기본적으로 select()는 query builder를 반환하고, 실행은 나중에
          const selectQueryBuilder = {
            ...mockQueryBuilder,
            // 체인 끝에서 실행될 때 Promise 반환
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
