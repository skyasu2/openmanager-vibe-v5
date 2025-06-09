/**
 * 🗄️ Local Vector Database Service (레거시 호환성)
 *
 * ⚠️ DEPRECATED: PostgresVectorDB 사용 권장
 * 실제 PostgreSQL + pgvector 구현으로 대체됨
 */

import { postgresVectorDB } from './postgres-vector-db';

export class LocalVectorDB {
  async initialize() {
    console.log(
      '⚠️ LocalVectorDB는 더 이상 사용되지 않습니다. PostgresVectorDB를 사용하세요.'
    );
    // PostgresVectorDB 초기화
    await postgresVectorDB.initialize();
  }

  async store(id: string, vector: number[], metadata?: any) {
    // PostgresVectorDB로 위임
    return await postgresVectorDB.store(
      id,
      `Content for ${id}`,
      vector,
      metadata
    );
  }

  async search(query: number[], limit = 10) {
    try {
      // PostgresVectorDB로 위임
      const results = await postgresVectorDB.search(query, { topK: limit });
      return {
        status: 'success',
        results: results.map(r => ({
          id: r.id,
          vector: [],
          metadata: r.metadata,
          similarity: r.similarity,
        })),
        count: results.length,
      };
    } catch (error) {
      console.error('LocalVectorDB 검색 실패:', error);
      return {
        status: 'error',
        results: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus() {
    const healthCheck = await postgresVectorDB.healthCheck();
    const stats = await postgresVectorDB.getStats();

    return {
      status: healthCheck.status === 'healthy' ? 'active' : 'error',
      count: stats.total_documents,
      deprecated: true,
      replacement: 'PostgresVectorDB',
      details: healthCheck.details,
    };
  }

  async clear() {
    // PostgresVectorDB로 위임
    return await postgresVectorDB.clear();
  }
}

export const localVectorDB = new LocalVectorDB();
