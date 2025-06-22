#!/usr/bin/env node

/**
 * 🔧 RPC 함수 수정 후 테스트 스크립트 (디버깅 강화)
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// 환경변수 로드
config({ path: '.env.local' });

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 로컬 임베딩 생성 함수 (Supabase RAG Engine과 동일 - 384차원)
function generateLocalEmbedding(text) {
    // 텍스트 해시 생성
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수로 변환
    }

    // 384차원 벡터 생성 (효율적인 차원으로 통일)
    const embedding = new Array(384);
    const seed = Math.abs(hash);
    let rng = seed;

    // 선형 합동 생성기(LCG) 사용
    for (let i = 0; i < 384; i++) {
        rng = (rng * 1664525 + 1013904223) % Math.pow(2, 32);
        embedding[i] = (rng / Math.pow(2, 32)) * 2 - 1; // [-1, 1] 범위
    }

    // 벡터 정규화 (코사인 유사도 최적화)
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
}

async function testRPCFunctions() {
    console.log('🔧 RPC 함수 수정 후 테스트 시작...\n');

    // 1단계: 실제 데이터 확인
    console.log('🔍 1단계: 실제 저장된 데이터 확인...');
    try {
        const { data: allData, error: allError } = await supabase
            .from('command_vectors')
            .select('id, content, metadata, embedding')
            .limit(5);

        if (allError) {
            console.error('❌ 데이터 조회 실패:', allError.message);
            return;
        }

        console.log(`   ✅ 총 ${allData.length}개 데이터 발견`);
        allData.forEach(item => {
            console.log(`   📄 ${item.id}: ${item.content.substring(0, 50)}...`);
            console.log(`   📊 벡터 차원: ${item.embedding ? item.embedding.length : 'null'}`);
        });
        console.log('');

    } catch (error) {
        console.error('❌ 데이터 확인 실패:', error.message);
        return;
    }

    // 2단계: search_all_commands 테스트
    console.log('🔍 2단계: search_all_commands 함수 테스트...');
    const queries = ['top', 'docker', 'ls', 'ping'];

    for (const query of queries) {
        try {
            const { data, error } = await supabase.rpc('search_all_commands', {
                search_query: query
            });

            if (error) {
                console.log(`   ❌ "${query}" 검색 실패: ${error.message}`);
            } else {
                console.log(`   ✅ "${query}" 검색 성공: ${data.length}개 결과`);
                if (data.length > 0) {
                    data.forEach(item => {
                        console.log(`      📄 ${item.id}: ${item.content.substring(0, 30)}...`);
                    });
                }
            }
        } catch (error) {
            console.log(`   ❌ "${query}" 검색 오류: ${error.message}`);
        }
    }
    console.log('');

    // 3단계: search_similar_commands 테스트 (디버깅 강화)
    console.log('🔍 3단계: search_similar_commands 함수 테스트 (디버깅)...');

    const testQuery = 'list files';
    const queryEmbedding = generateLocalEmbedding(testQuery);
    console.log(`   📝 테스트 쿼리: "${testQuery}"`);
    console.log(`   📊 쿼리 벡터 차원: ${queryEmbedding.length}`);
    console.log(`   📊 쿼리 벡터 샘플: [${queryEmbedding.slice(0, 5).map(x => x.toFixed(4)).join(', ')}...]`);
    console.log('');

    const thresholds = [0, 0.1, 0.3, 0.5, 0.7];

    for (const threshold of thresholds) {
        try {
            const { data, error } = await supabase.rpc('search_similar_commands', {
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: 10
            });

            if (error) {
                console.log(`   ❌ 임계값 ${threshold}: ${error.message}`);
            } else {
                console.log(`   ✅ 임계값 ${threshold}: ${data.length}개 결과`);
                if (data.length > 0) {
                    data.forEach(item => {
                        console.log(`      📄 ${item.id}: 유사도 ${item.similarity.toFixed(4)} - ${item.content.substring(0, 30)}...`);
                    });
                }
            }
        } catch (error) {
            console.log(`   ❌ 임계값 ${threshold} 오류: ${error.message}`);
        }
    }

    console.log('\n🌐 4단계: API 엔드포인트 테스트...');
    console.log('📡 테스트 URL: http://localhost:3008/api/test-supabase-rag?query=top&threshold=0.1');
    console.log('   → 브라우저에서 확인하거나 curl로 테스트해보세요');

    console.log('\n🎉 RPC 함수 수정 후 테스트 완료!');
    console.log('   → 이제 벡터 검색이 정상 작동해야 합니다');
}

// 테스트 실행
testRPCFunctions().catch(console.error);
