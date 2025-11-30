/**
 * 🚀 RAG 벡터 검색 성능 벤치마크 API
 *
 * pgvector 네이티브 vs 클라이언트 사이드 성능 비교
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { embeddingService } from '@/services/ai/embedding-service';
import { PostgresVectorDB } from '@/services/ai/postgres-vector-db';
import { getSupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import debug from '@/utils/debug';

// Interface for PostgreSQL index information
interface PgIndex {
  indexname: string;
  indexdef?: string;
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const postgresVectorDB = new PostgresVectorDB(supabase);
    const searchParams = request.nextUrl.searchParams;
    const testQuery = searchParams.get('query') || '서버 상태 확인';
    const iterations = parseInt(searchParams.get('iterations') || '10', 10);

    debug.log(`🚀 벤치마크 시작: "${testQuery}" (${iterations}회 반복)`);

    // 1. 테스트용 임베딩 생성
    const startEmbedding = Date.now();
    const queryEmbedding = await embeddingService.createEmbedding(testQuery, {
      dimension: 384,
    });
    const embeddingTime = Date.now() - startEmbedding;

    // 2. pgvector 성능 벤치마크
    const benchmarkResult = await postgresVectorDB.benchmarkSearch(
      queryEmbedding,
      iterations
    );

    // 3. RAG 엔진 캐시 성능 테스트
    const ragEngine = getSupabaseRAGEngine();
    const cacheTests = [];

    // 첫 번째 호출 (캐시 미스)
    const firstCallStart = Date.now();
    const _firstResult = await ragEngine.searchSimilar(testQuery, {
      maxResults: 5,
      cached: true,
    });
    const firstCallTime = Date.now() - firstCallStart;
    cacheTests.push({ call: 1, time: firstCallTime, cached: false });

    // 두 번째 호출 (캐시 히트)
    const secondCallStart = Date.now();
    const secondResult = await ragEngine.searchSimilar(testQuery, {
      maxResults: 5,
      cached: true,
    });
    cacheTests.push({
      call: 2,
      time: Date.now() - secondCallStart,
      cached: secondResult.cached,
    });

    // 4. 통계 수집
    const stats = await postgresVectorDB.getStats();
    const categoryStats = await postgresVectorDB.getCategoryStats();

    // 5. 인덱스 정보 확인
    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'command_vectors');

    const response = {
      benchmark: {
        query: testQuery,
        iterations,
        embeddingTime: `${embeddingTime}ms`,
        results: {
          native: {
            avgTime: `${benchmarkResult.nativeAvgTime}ms`,
            description: 'pgvector 네이티브 코사인 유사도 검색',
          },
          fallback: {
            avgTime: `${benchmarkResult.fallbackAvgTime}ms`,
            description: '클라이언트 사이드 코사인 유사도 계산',
          },
          speedup: `${benchmarkResult.speedup}x`,
          improvement: `${Math.round((1 - benchmarkResult.nativeAvgTime / benchmarkResult.fallbackAvgTime) * 100)}%`,
        },
      },
      cachePerformance: {
        tests: cacheTests,
        cacheSpeedup: cacheTests[1]?.cached
          ? `${Math.round((cacheTests[0]?.time ?? 0) / (cacheTests[1]?.time ?? 1))}x`
          : 'N/A',
      },
      statistics: {
        totalDocuments: stats.total_documents,
        totalCategories: categoryStats.length,
        categories: categoryStats,
        tableSize: '32KB', // 고정값 (실제로는 쿼리 필요)
      },
      optimizations: {
        indexes: indexes?.map((idx: PgIndex) => idx.indexname) || [],
        cacheSettings: {
          embeddingCacheSize: 500,
          searchCacheSize: 100,
          ttl: '30분',
        },
        pgvectorVersion: '0.8.0',
      },
      recommendations: generateRecommendations(benchmarkResult, stats),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Benchmark-Time': `${Date.now() - startEmbedding}ms`,
      },
    });
  } catch (error) {
    debug.error('❌ 벤치마크 실패:', error);
    return NextResponse.json(
      {
        error: '벤치마크 실행 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
});

/**
 * 성능 개선 권장사항 생성
 */
function generateRecommendations(
  benchmark: { speedup: number; nativeAvgTime: number },
  stats: { total_documents: number }
): string[] {
  const recommendations: string[] = [];

  if (benchmark.speedup > 5) {
    recommendations.push(
      `✅ pgvector 네이티브 검색이 ${benchmark.speedup}배 빠릅니다. 현재 설정이 최적화되어 있습니다.`
    );
  } else {
    recommendations.push(
      '⚠️ 성능 향상이 예상보다 낮습니다. 인덱스 재구축을 고려하세요.'
    );
  }

  if (stats.total_documents < 100) {
    recommendations.push(
      '📊 현재 문서 수가 적어 IVFFlat 인덱스의 효과가 제한적입니다. 1000개 이상에서 최대 성능을 발휘합니다.'
    );
  }

  if (benchmark.nativeAvgTime > 50) {
    recommendations.push(
      '🔧 응답 시간이 50ms를 초과합니다. 캐시 설정을 확인하거나 쿼리 최적화를 고려하세요.'
    );
  } else {
    recommendations.push(
      `🚀 평균 응답 시간 ${benchmark.nativeAvgTime}ms로 목표 성능(50ms 이하)을 달성했습니다.`
    );
  }

  recommendations.push(
    '💡 추가 최적화: HNSW 인덱스 고려 (pgvector 0.5.0+), 배치 검색 구현, 비동기 임베딩 생성'
  );

  return recommendations;
}
