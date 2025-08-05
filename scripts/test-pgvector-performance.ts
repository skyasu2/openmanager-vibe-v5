/**
 * 🚀 pgvector 성능 테스트 스크립트
 * 
 * 네이티브 pgvector vs 클라이언트 사이드 성능 비교
 */

import { postgresVectorDB } from '../src/services/ai/postgres-vector-db';
import { embeddingService } from '../src/services/ai/embedding-service';
import { getSupabaseRAGEngine } from '../src/services/ai/supabase-rag-engine';

async function runBenchmark() {
  console.log('🚀 pgvector 성능 벤치마크 시작...\n');

  try {
    // 1. 테스트 쿼리
    const testQueries = [
      '서버 상태 확인',
      'CPU 사용률이 높은 서버 찾기',
      '메모리 부족 경고',
      '네트워크 트래픽 분석',
      '데이터베이스 응답 시간'
    ];

    console.log('📊 테스트 쿼리:');
    testQueries.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
    console.log('');

    // 2. 통계 확인
    const stats = await postgresVectorDB.getStats();
    console.log(`📈 현재 벡터 DB 상태:`);
    console.log(`  - 총 문서: ${stats.total_documents}개`);
    console.log(`  - 카테고리: ${stats.total_categories}개`);
    console.log(`  - 평균 콘텐츠 길이: ${Math.round(stats.avg_content_length)}자\n`);

    // 3. 각 쿼리에 대한 벤치마크 실행
    const results = [];
    
    for (const query of testQueries) {
      console.log(`\n🔍 테스트: "${query}"`);
      
      // 임베딩 생성
      const startEmbed = Date.now();
      const embedding = await embeddingService.createEmbedding(query, {
        dimension: 384,
      });
      const embedTime = Date.now() - startEmbed;
      console.log(`  ⏱️  임베딩 생성: ${embedTime}ms`);

      // 벤치마크 실행
      const benchmark = await postgresVectorDB.benchmarkSearch(embedding, 5);
      
      console.log(`  📊 결과:`);
      console.log(`    - 네이티브 pgvector: ${benchmark.nativeAvgTime}ms`);
      console.log(`    - 클라이언트 사이드: ${benchmark.fallbackAvgTime}ms`);
      console.log(`    - 속도 향상: ${benchmark.speedup}x 🚀`);
      console.log(`    - 개선율: ${Math.round((1 - benchmark.nativeAvgTime / benchmark.fallbackAvgTime) * 100)}%`);

      results.push({
        query,
        embedTime,
        ...benchmark,
        improvement: Math.round((1 - benchmark.nativeAvgTime / benchmark.fallbackAvgTime) * 100)
      });
    }

    // 4. RAG 엔진 캐시 테스트
    console.log('\n\n🧠 RAG 엔진 캐시 성능 테스트:');
    const ragEngine = getSupabaseRAGEngine();
    
    for (const query of testQueries.slice(0, 2)) {
      console.log(`\n  📝 "${query}"`);
      
      // 첫 번째 호출 (캐시 미스)
      const start1 = Date.now();
      const result1 = await ragEngine.searchSimilar(query, {
        maxResults: 3,
        cached: true,
      });
      const time1 = Date.now() - start1;
      
      // 두 번째 호출 (캐시 히트)
      const start2 = Date.now();
      const result2 = await ragEngine.searchSimilar(query, {
        maxResults: 3,
        cached: true,
      });
      const time2 = Date.now() - start2;
      
      console.log(`    - 첫 번째 호출 (캐시 미스): ${time1}ms`);
      console.log(`    - 두 번째 호출 (캐시 히트): ${time2}ms`);
      console.log(`    - 캐시 속도 향상: ${Math.round(time1 / time2)}x`);
    }

    // 5. 카테고리별 통계
    console.log('\n\n📊 카테고리별 문서 분포:');
    const categoryStats = await postgresVectorDB.getCategoryStats();
    categoryStats.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat.document_count}개 문서`);
    });

    // 6. 종합 결과
    console.log('\n\n✅ 벤치마크 완료!');
    console.log('\n📊 종합 성능 개선:');
    
    const avgNative = results.reduce((sum, r) => sum + r.nativeAvgTime, 0) / results.length;
    const avgFallback = results.reduce((sum, r) => sum + r.fallbackAvgTime, 0) / results.length;
    const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
    
    console.log(`  - 평균 네이티브 pgvector: ${Math.round(avgNative)}ms`);
    console.log(`  - 평균 클라이언트 사이드: ${Math.round(avgFallback)}ms`);
    console.log(`  - 평균 속도 향상: ${avgSpeedup.toFixed(1)}x 🚀`);
    console.log(`  - 평균 개선율: ${Math.round((1 - avgNative / avgFallback) * 100)}%`);

    // 7. 권장사항
    console.log('\n💡 권장사항:');
    if (avgSpeedup > 10) {
      console.log('  ✅ pgvector 네이티브 검색이 매우 효율적입니다!');
    } else if (avgSpeedup > 5) {
      console.log('  ✅ 좋은 성능 개선이 확인되었습니다.');
    } else {
      console.log('  ⚠️  인덱스 재구축을 고려해보세요.');
    }
    
    if (stats.total_documents < 100) {
      console.log('  📊 문서가 적어 IVFFlat 인덱스의 효과가 제한적입니다.');
      console.log('     1000개 이상의 문서에서 최대 성능을 발휘합니다.');
    }

    if (avgNative > 50) {
      console.log('  🔧 응답 시간이 50ms를 초과합니다.');
      console.log('     캐시 설정 확인이나 쿼리 최적화를 고려하세요.');
    } else {
      console.log('  🚀 목표 성능(50ms 이하)을 달성했습니다!');
    }

  } catch (error) {
    console.error('❌ 벤치마크 실패:', error);
  }

  process.exit(0);
}

// 실행
runBenchmark();