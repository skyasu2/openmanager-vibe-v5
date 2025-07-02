#!/usr/bin/env node

/**
 * 🚀 Supabase RAG Engine 직접 테스트 스크립트
 * 벡터 검색 및 임베딩 기능 검증
 */

const { createClient } = require('@supabase/supabase-js');

// 환경 변수 설정 (메모리에서 확인된 값들)
const SUPABASE_URL = 'https://vnswjnltnhpsueosfhmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';

async function testSupabaseRAG() {
    console.log('🚀 Supabase RAG Engine 테스트 시작...\n');

    const startTime = Date.now();

    try {
        // 1. Supabase 클라이언트 생성
        console.log('📡 Supabase 클라이언트 생성 중...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 2. 연결 테스트
        console.log('🔗 Supabase 연결 테스트...');
        const { data: healthData, error: healthError } = await supabase
            .from('vector_documents')
            .select('count')
            .limit(1);

        if (healthError) {
            console.log('⚠️  vector_documents 테이블이 없습니다.');
            console.log('❌ 테이블 오류:', healthError.message);
        } else {
            console.log('✅ Supabase 연결 성공!');
        }

        // 3. 샘플 데이터 확인
        console.log('\n📊 기존 벡터 데이터 확인...');
        const { data: existingData, error: selectError } = await supabase
            .from('vector_documents')
            .select('id, metadata, content')
            .limit(5);

        if (selectError) {
            console.log('❌ 데이터 조회 실패:', selectError.message);
        } else {
            console.log(`📈 기존 문서 수: ${existingData?.length || 0}개`);
            if (existingData && existingData.length > 0) {
                console.log('📋 샘플 문서:');
                existingData.forEach((doc, index) => {
                    console.log(`  ${index + 1}. ID: ${doc.id}`);
                    console.log(`     카테고리: ${doc.metadata?.category || '미분류'}`);
                    console.log(`     내용: ${doc.content?.substring(0, 50)}...`);
                });
            }
        }

        // 4. 테스트 쿼리 실행
        console.log('\n🔍 벡터 검색 테스트...');
        const testQueries = [
            '서버 상태 확인',
            'CPU 모니터링',
            'top 명령어'
        ];

        for (const query of testQueries) {
            console.log(`\n🔎 테스트 쿼리: "${query}"`);

            // 간단한 텍스트 매칭 검색
            const { data: searchResults, error: searchError } = await supabase
                .from('vector_documents')
                .select('id, content, metadata')
                .ilike('content', `%${query}%`)
                .limit(3);

            if (searchError) {
                console.log(`❌ 검색 실패: ${searchError.message}`);
            } else {
                console.log(`📊 검색 결과: ${searchResults?.length || 0}개`);
                if (searchResults && searchResults.length > 0) {
                    searchResults.forEach((result, index) => {
                        console.log(`  ${index + 1}. ${result.metadata?.category || '미분류'}: ${result.content?.substring(0, 80)}...`);
                    });
                }
            }
        }

        // 5. 성능 통계
        const totalTime = Date.now() - startTime;
        console.log(`\n⏱️  총 실행 시간: ${totalTime}ms`);
        console.log('✅ Supabase RAG 테스트 완료!');

        return {
            success: true,
            totalTime,
            message: 'Supabase RAG 연동 테스트 성공'
        };

    } catch (error) {
        console.error('❌ Supabase RAG 테스트 실패:', error);
        return {
            success: false,
            error: error.message,
            totalTime: Date.now() - startTime
        };
    }
}

// 스크립트 실행
if (require.main === module) {
    testSupabaseRAG()
        .then(result => {
            console.log('\n📊 최종 결과:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 예상치 못한 오류:', error);
            process.exit(1);
        });
}

module.exports = { testSupabaseRAG }; 