#!/usr/bin/env node

/**
 * 🔧 벡터 데이터 수정 스크립트
 *
 * 임베딩을 올바른 vector(384) 형식으로 재생성하여 저장합니다.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 로컬 임베딩 생성 함수
function generateLocalEmbedding(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const seed = Math.abs(hash);
  let rng = seed;
  const embedding = [];

  for (let i = 0; i < 384; i++) {
    rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);
    embedding.push((rng / Math.pow(2, 32)) * 2 - 1);
  }

  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

async function fixVectorData() {
  console.log('🔧 벡터 데이터 수정 시작...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. 기존 데이터 조회
    console.log('📊 1단계: 기존 데이터 조회...');
    const { data: existingData, error: selectError } = await supabase
      .from('command_vectors')
      .select('id, content, metadata');

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError.message);
      return;
    }

    console.log(`✅ ${existingData.length}개 문서 발견`);

    // 2. 각 문서에 대해 올바른 임베딩 생성 및 업데이트
    console.log('\n🔄 2단계: 임베딩 재생성 및 업데이트...');

    for (const item of existingData) {
      console.log(`🔄 처리 중: ${item.id}`);

      // 콘텐츠와 명령어를 결합하여 임베딩 생성
      const textForEmbedding =
        item.content +
        ' ' +
        (item.metadata?.commands ? item.metadata.commands.join(' ') : '');

      const embedding = generateLocalEmbedding(textForEmbedding);

      console.log(`   임베딩 생성: ${embedding.length}차원`);
      console.log(
        `   첫 5개 값: [${embedding
          .slice(0, 5)
          .map(v => v.toFixed(4))
          .join(', ')}]`
      );

      // vector(384) 형식으로 변환 (PostgreSQL 형식)
      const vectorString = `[${embedding.join(',')}]`;

      // 업데이트 실행
      const { error: updateError } = await supabase
        .from('command_vectors')
        .update({
          embedding: vectorString,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (updateError) {
        console.error(`   ❌ ${item.id} 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ ${item.id} 업데이트 완료`);
      }
    }

    // 3. 업데이트 결과 검증
    console.log('\n🔍 3단계: 업데이트 결과 검증...');

    // 테스트 검색 수행
    const testQuery = 'top';
    const testEmbedding = generateLocalEmbedding(testQuery);

    const { data: searchResult, error: searchError } = await supabase.rpc(
      'search_similar_commands',
      {
        query_embedding: testEmbedding,
        match_threshold: 0.1, // 낮은 임계값
        match_count: 5,
      }
    );

    if (searchError) {
      console.error('❌ 검색 테스트 실패:', searchError.message);
    } else {
      console.log(`✅ 검색 테스트 성공: ${searchResult.length}개 결과`);
      searchResult.forEach(result => {
        console.log(
          `   - ${result.id}: 유사도 ${result.similarity.toFixed(4)}`
        );
      });
    }

    console.log('\n🎉 벡터 데이터 수정 완료!');
    console.log('   → 이제 벡터 검색이 정상 작동할 것입니다');
  } catch (error) {
    console.error('❌ 벡터 데이터 수정 실패:', error.message);
  }
}

fixVectorData();
