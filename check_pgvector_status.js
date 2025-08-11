const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkPgvectorStatus() {
  console.log('🧠 pgvector 벡터 DB 상태 확인...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. pgvector 확장 설치 확인
    console.log('1️⃣ pgvector 확장 상태 확인:');
    
    const { data: extensions, error: extError } = await supabase.rpc('get_extensions');
    
    if (extError) {
      console.log('   ⚠️ 확장 정보 조회 실패 - 대안 방법 시도');
    } else {
      console.log('   ✅ PostgreSQL 확장 정보 조회 성공');
    }

    // 2. knowledge_base 테이블 확인
    console.log('\n2️⃣ knowledge_base 테이블 확인:');
    
    const { data: kbData, error: kbError } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });
      
    if (kbError) {
      console.log(`   ❌ knowledge_base 테이블 없음: ${kbError.message}`);
    } else {
      console.log(`   ✅ knowledge_base 테이블 존재 (${kbData?.count || 0}개 레코드)`);
    }

    // 3. incident_reports 테이블의 embedding 컬럼 확인
    console.log('\n3️⃣ incident_reports 테이블 embedding 확인:');
    
    try {
      const { data: incidentData, error: incidentError } = await supabase
        .from('incident_reports')
        .select('id, embedding, embedding_model', { count: 'exact', head: true });
        
      if (incidentError) {
        console.log(`   ❌ incident_reports 테이블 또는 embedding 컬럼 없음: ${incidentError.message}`);
      } else {
        console.log(`   ✅ incident_reports 테이블 존재 (${incidentData?.count || 0}개 레코드)`);
      }
    } catch (err) {
      console.log('   ❌ incident_reports 테이블 접근 실패');
    }

    // 4. embedding_stats 뷰 확인
    console.log('\n4️⃣ embedding_stats 뷰 확인:');
    
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('embedding_stats')
        .select('*');
        
      if (statsError) {
        console.log(`   ❌ embedding_stats 뷰 없음: ${statsError.message}`);
      } else {
        console.log('   ✅ embedding_stats 뷰 데이터:');
        statsData.forEach(stat => {
          console.log(`      ${stat.table_name}: ${stat.records_with_embedding}/${stat.total_records} (${stat.embedding_coverage_percent}%) - ${stat.estimated_embedding_size}`);
        });
      }
    } catch (err) {
      console.log('   ❌ embedding_stats 뷰 접근 실패');
    }

    // 5. 벡터 검색 함수 테스트
    console.log('\n5️⃣ 벡터 검색 함수 테스트:');
    
    try {
      // 더미 벡터로 함수 존재 여부만 확인
      const dummyVector = Array(384).fill(0.1);
      
      const { data: hybridResult, error: hybridError } = await supabase.rpc(
        'hybrid_search',
        {
          query_embedding: dummyVector,
          query_text: 'test',
          match_count: 1
        }
      );
      
      if (hybridError) {
        console.log(`   ❌ hybrid_search 함수 없음 또는 오류: ${hybridError.message}`);
      } else {
        console.log('   ✅ hybrid_search 함수 정상 작동');
      }
      
      const { data: similarResult, error: similarError } = await supabase.rpc(
        'search_similar_incidents',
        {
          query_embedding: dummyVector,
          match_count: 1
        }
      );
      
      if (similarError) {
        console.log(`   ❌ search_similar_incidents 함수 없음 또는 오류: ${similarError.message}`);
      } else {
        console.log('   ✅ search_similar_incidents 함수 정상 작동');
      }
      
    } catch (err) {
      console.log('   ❌ 벡터 검색 함수 테스트 실패');
    }

    // 6. 테스트 벡터 삽입 및 검색
    console.log('\n6️⃣ 벡터 성능 테스트:');
    
    if (kbError) {
      console.log('   ⏭️ knowledge_base 테이블이 없어 성능 테스트 건너뜀');
    } else {
      try {
        // 테스트 벡터 데이터 삽입
        const testVector = Array(384).fill(0).map(() => Math.random() - 0.5);
        const testId = 'test-' + Date.now();
        
        const insertStart = Date.now();
        const { data: insertResult, error: insertError } = await supabase
          .from('knowledge_base')
          .insert({
            id: testId,
            content: 'Test content for vector search performance',
            metadata: { test: true },
            embedding: testVector,
            category: 'test'
          })
          .select();
          
        const insertTime = Date.now() - insertStart;
        
        if (insertError) {
          console.log(`   ❌ 벡터 삽입 실패: ${insertError.message}`);
        } else {
          console.log(`   ✅ 벡터 삽입 성공 (${insertTime}ms)`);
          
          // 유사도 검색 테스트
          const searchStart = Date.now();
          const { data: searchResult, error: searchError } = await supabase.rpc(
            'hybrid_search',
            {
              query_embedding: testVector,
              query_text: 'test content',
              match_count: 5
            }
          );
          const searchTime = Date.now() - searchStart;
          
          if (searchError) {
            console.log(`   ❌ 벡터 검색 실패: ${searchError.message}`);
          } else {
            console.log(`   ✅ 벡터 검색 성공 (${searchTime}ms, ${searchResult.length}개 결과)`);
            if (searchResult.length > 0) {
              console.log(`      최고 유사도: ${(searchResult[0].similarity * 100).toFixed(1)}%`);
            }
          }
          
          // 테스트 데이터 정리
          await supabase
            .from('knowledge_base')
            .delete()
            .eq('id', testId);
          console.log('   🧹 테스트 벡터 데이터 정리 완료');
        }
        
      } catch (err) {
        console.log('   ❌ 벡터 성능 테스트 오류:', err.message);
      }
    }

    // 7. 벡터 DB 권장사항
    console.log('\n🎯 pgvector 최적화 권장사항:');
    
    if (kbError) {
      console.log('   1. ⚠️ knowledge_base 테이블 생성 필요');
      console.log('   2. ⚠️ 마이그레이션 파일 실행 필요: 20250127_enable_pgvector.sql');
    } else {
      console.log('   1. ✅ 기본 벡터 DB 설정 완료');
      console.log('   2. 📊 AI 기능을 위한 임베딩 데이터 준비');
      console.log('   3. 🔍 벡터 검색 성능 모니터링');
    }
    
    console.log('   4. 💡 384차원 벡터 사용으로 무료 티어 최적화');
    console.log('   5. 🧹 cleanup_old_embeddings() 함수로 정기 정리');

  } catch (err) {
    console.error('❌ pgvector 상태 확인 오류:', err);
  }
}

checkPgvectorStatus();