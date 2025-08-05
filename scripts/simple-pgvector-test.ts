/**
 * 🚀 간단한 pgvector 성능 테스트
 */

import { supabase } from '../src/lib/supabase';

async function testPgvector() {
  console.log('🚀 간단한 pgvector 성능 테스트\n');

  try {
    // 1. 기존 문서에서 임베딩 가져오기
    const { data: sampleDoc, error: docError } = await supabase
      .from('command_vectors')
      .select('id, embedding')
      .eq('id', 'doc_server_status_1')
      .single();

    if (docError || !sampleDoc) {
      console.error('샘플 문서를 찾을 수 없습니다');
      return;
    }

    console.log('✅ 샘플 문서 발견:', sampleDoc.id);

    // 2. 네이티브 pgvector 검색 테스트
    console.log('\n📊 네이티브 pgvector 검색 테스트:');
    const startNative = Date.now();
    
    const { data: nativeResults, error: nativeError } = await supabase
      .rpc('search_similar_vectors', {
        query_embedding: sampleDoc.embedding,
        similarity_threshold: 0.3,
        max_results: 5
      });

    const nativeTime = Date.now() - startNative;

    if (nativeError) {
      console.error('네이티브 검색 오류:', nativeError);
    } else {
      console.log(`  - 실행 시간: ${nativeTime}ms`);
      console.log(`  - 결과 수: ${nativeResults?.length || 0}개`);
      
      if (nativeResults && nativeResults.length > 0) {
        console.log('\n  상위 3개 결과:');
        nativeResults.slice(0, 3).forEach((result: any, idx: number) => {
          console.log(`    ${idx + 1}. ${result.id} (유사도: ${result.similarity.toFixed(3)})`);
        });
      }
    }

    // 3. 직접 SQL로 검색 테스트
    console.log('\n\n📊 직접 SQL 검색 테스트:');
    const startDirect = Date.now();
    
    const { data: directResults, error: directError } = await supabase
      .from('command_vectors')
      .select('id, content, metadata')
      .limit(100);

    const directTime = Date.now() - startDirect;

    if (directError) {
      console.error('직접 검색 오류:', directError);
    } else {
      console.log(`  - 실행 시간: ${directTime}ms`);
      console.log(`  - 결과 수: ${directResults?.length || 0}개`);
    }

    // 4. 성능 비교
    console.log('\n\n📈 성능 비교:');
    console.log(`  - 네이티브 pgvector: ${nativeTime}ms`);
    console.log(`  - 직접 SQL 검색: ${directTime}ms`);
    
    if (nativeTime > 0 && directTime > 0) {
      const speedup = directTime / nativeTime;
      console.log(`  - 속도 향상: ${speedup.toFixed(1)}x ${speedup > 1 ? '🚀' : ''}`);
    }

    // 5. 인덱스 정보 확인
    console.log('\n\n🔍 인덱스 정보:');
    const { data: indexes, error: indexError } = await supabase
      .rpc('get_indexes', {
        table_name: 'command_vectors'
      })
      .catch(() => ({ data: null, error: 'Function not available' }));

    if (indexes && !indexError) {
      indexes.forEach((idx: any) => {
        console.log(`  - ${idx.indexname}`);
      });
    } else {
      console.log('  - 인덱스 정보를 가져올 수 없습니다');
    }

    // 6. 총 문서 수 확인
    const { count } = await supabase
      .from('command_vectors')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 총 문서 수: ${count}개`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

// 실행
testPgvector()
  .then(() => process.exit(0));