#!/usr/bin/env node

/**
 * 🔍 벡터 데이터 최종 진단 스크립트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkVectorDataFinal() {
    console.log('🔍 벡터 데이터 최종 진단 시작...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. 테이블 존재 확인
        console.log('📊 1단계: 테이블 존재 확인...');
        const { data: tableData, error: tableError } = await supabase
            .from('command_vectors')
            .select('count(*)', { count: 'exact', head: true });

        if (tableError) {
            console.error('❌ 테이블 접근 실패:', tableError.message);
            return;
        }

        console.log(`✅ 테이블 존재, 총 ${tableData} 개 레코드`);

        // 2. 실제 데이터 조회
        console.log('\n📋 2단계: 실제 데이터 조회...');
        const { data: allData, error: dataError } = await supabase
            .from('command_vectors')
            .select('id, content, metadata, embedding')
            .limit(5);

        if (dataError) {
            console.error('❌ 데이터 조회 실패:', dataError.message);
            return;
        }

        console.log(`✅ ${allData.length}개 데이터 조회 성공:`);
        allData.forEach(item => {
            console.log(`   - ${item.id}: ${item.content.substring(0, 50)}...`);
            if (item.embedding) {
                if (Array.isArray(item.embedding)) {
                    console.log(`     임베딩: ${item.embedding.length}차원 배열`);
                    console.log(`     첫 5개: [${item.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
                } else if (typeof item.embedding === 'string') {
                    console.log(`     임베딩: 문자열 형태 (${item.embedding.length}자)`);
                    console.log(`     시작: ${item.embedding.substring(0, 50)}...`);
                } else {
                    console.log(`     임베딩: ${typeof item.embedding} 타입`);
                }
            } else {
                console.log(`     ❌ 임베딩 없음`);
            }
        });

        // 3. RPC 함수 존재 확인
        console.log('\n🔧 3단계: RPC 함수 존재 확인...');

        // 간단한 테스트 벡터로 함수 호출
        const testVector = Array.from({ length: 384 }, () => 0.1);

        const { data: rpcData, error: rpcError } = await supabase
            .rpc('search_all_commands', {
                query_embedding: testVector,
                match_count: 3
            });

        if (rpcError) {
            console.error('❌ RPC 함수 테스트 실패:', rpcError.message);
        } else {
            console.log(`✅ RPC 함수 정상 작동: ${rpcData.length}개 결과`);
            rpcData.forEach(result => {
                console.log(`   - ${result.id}: 유사도 ${result.similarity}`);
            });
        }

        // 4. 벡터 형식 문제 진단
        console.log('\n🔬 4단계: 벡터 형식 진단...');

        if (allData.length > 0 && allData[0].embedding) {
            const firstEmbedding = allData[0].embedding;

            console.log('벡터 형식 분석:');
            console.log(`   타입: ${typeof firstEmbedding}`);
            console.log(`   Array.isArray: ${Array.isArray(firstEmbedding)}`);

            if (typeof firstEmbedding === 'string') {
                console.log('   ⚠️ 문제 발견: 임베딩이 문자열로 저장됨');
                console.log('   해결책: 벡터를 올바른 형식으로 재저장 필요');

                try {
                    const parsed = JSON.parse(firstEmbedding);
                    console.log(`   파싱 시도: ${Array.isArray(parsed) ? '성공' : '실패'}`);
                    if (Array.isArray(parsed)) {
                        console.log(`   파싱된 차원: ${parsed.length}`);
                    }
                } catch (e) {
                    console.log('   JSON 파싱 실패:', e.message);
                }
            }
        }

        console.log('\n📋 진단 요약:');
        console.log(`   테이블: ${tableError ? '❌' : '✅'}`);
        console.log(`   데이터: ${dataError ? '❌' : '✅'} (${allData?.length || 0}개)`);
        console.log(`   RPC 함수: ${rpcError ? '❌' : '✅'}`);
        console.log(`   벡터 형식: ${allData?.[0]?.embedding && typeof allData[0].embedding === 'object' ? '✅' : '❌'}`);

    } catch (error) {
        console.error('❌ 진단 실패:', error.message);
    }
}

checkVectorDataFinal(); 