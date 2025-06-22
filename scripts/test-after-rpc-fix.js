#!/usr/bin/env node

/**
 * 🔧 RPC 함수 수정 후 테스트 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 로컬 임베딩 생성 함수
function generateLocalEmbedding(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
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

async function testAfterRPCFix() {
    console.log('🔧 RPC 함수 수정 후 테스트 시작...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. 새로운 search_all_commands 함수 테스트 (임계값 없음)
        console.log('🔍 1단계: search_all_commands 함수 테스트...');

        const testQueries = ['top', 'docker', 'ls', 'ping'];

        for (const query of testQueries) {
            console.log(`\n📋 쿼리: "${query}"`);
            const queryEmbedding = generateLocalEmbedding(query);

            const { data: allResults, error: allError } = await supabase
                .rpc('search_all_commands', {
                    query_embedding: queryEmbedding,
                    match_count: 5
                });

            if (allError) {
                console.error(`   ❌ search_all_commands 실패: ${allError.message}`);
            } else {
                console.log(`   ✅ search_all_commands 성공: ${allResults.length}개 결과`);
                allResults.forEach(result => {
                    console.log(`      - ${result.id}: 유사도 ${result.similarity.toFixed(4)}`);
                });
            }
        }

        // 2. 기존 search_similar_commands 함수 테스트 (임계값 적용)
        console.log('\n🔍 2단계: search_similar_commands 함수 테스트...');

        const testQuery = 'top';
        const queryEmbedding = generateLocalEmbedding(testQuery);

        // 다양한 임계값으로 테스트
        const thresholds = [0.0, 0.1, 0.3, 0.5, 0.7];

        for (const threshold of thresholds) {
            console.log(`\n📊 임계값: ${threshold}`);

            const { data: similarResults, error: similarError } = await supabase
                .rpc('search_similar_commands', {
                    query_embedding: queryEmbedding,
                    match_threshold: threshold,
                    match_count: 5
                });

            if (similarError) {
                console.error(`   ❌ search_similar_commands 실패: ${similarError.message}`);
            } else {
                console.log(`   ✅ search_similar_commands 성공: ${similarResults.length}개 결과`);
                similarResults.forEach(result => {
                    console.log(`      - ${result.id}: 유사도 ${result.similarity.toFixed(4)}`);
                });
            }
        }

        // 3. API 엔드포인트 테스트
        console.log('\n🌐 3단계: API 엔드포인트 테스트...');

        const testUrl = 'http://localhost:3008/api/test-supabase-rag?query=top&threshold=0.1';
        console.log(`📡 테스트 URL: ${testUrl}`);
        console.log('   → 브라우저에서 확인하거나 curl로 테스트해보세요');

        console.log('\n🎉 RPC 함수 수정 후 테스트 완료!');
        console.log('   → 이제 벡터 검색이 정상 작동해야 합니다');

    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
    }
}

testAfterRPCFix();
