#!/usr/bin/env node

/**
 * 🔍 Supabase 연결 및 벡터 테이블 상태 확인
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
    console.log('🔍 Supabase 연결 테스트 시작...\n');

    // 환경변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase 환경변수가 설정되지 않았습니다');
        console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
        console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ 설정됨' : '❌ 없음');
        process.exit(1);
    }

    console.log('✅ 환경변수 확인 완료');
    console.log('   URL:', supabaseUrl);
    console.log('   Key:', supabaseKey.substring(0, 20) + '...\n');

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. 기본 연결 테스트 (간소화)
        console.log('🔗 기본 연결 테스트...');
        console.log('✅ Supabase 클라이언트 생성 성공\n');

        // 2. command_vectors 테이블 확인
        console.log('📊 command_vectors 테이블 확인...');
        const { data: tableData, error: tableError } = await supabase
            .from('command_vectors')
            .select('*', { count: 'exact', head: true });

        if (tableError) {
            console.log('❌ command_vectors 테이블 없음:', tableError.message);
            console.log('   → SQL 스크립트 실행이 필요합니다');
            console.log('   → infra/database/sql/setup-vector-database.sql 참조\n');
        } else {
            console.log('✅ command_vectors 테이블 존재');
            console.log('   레코드 수:', tableData?.length || 0);
            console.log('   전체 개수:', tableData?.count || 0, '\n');
        }

        // 3. pgvector 확장 확인
        console.log('🧩 pgvector 확장 확인...');
        const { data: extensionData, error: extensionError } = await supabase
            .rpc('check_extension', { extension_name: 'vector' });

        if (extensionError) {
            console.log('⚠️ pgvector 확장 상태 확인 불가:', extensionError.message);
        } else {
            console.log('✅ pgvector 확장 상태:', extensionData ? '활성화됨' : '비활성화됨');
        }

        // 4. 샘플 벡터 검색 테스트
        console.log('\n🔍 샘플 벡터 검색 테스트...');
        try {
            const { data: searchData, error: searchError } = await supabase
                .rpc('search_similar_commands', {
                    query_embedding: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
                    match_threshold: 0.7,
                    match_count: 3
                });

            if (searchError) {
                console.log('❌ 벡터 검색 함수 없음:', searchError.message);
                console.log('   → RPC 함수 생성이 필요합니다');
            } else {
                console.log('✅ 벡터 검색 함수 정상 작동');
                console.log('   검색 결과:', searchData?.length || 0, '개');
            }
        } catch (err) {
            console.log('⚠️ 벡터 검색 테스트 실패:', err.message);
        }

        console.log('\n🎉 Supabase 연결 테스트 완료!');

        // 권장사항 출력
        console.log('\n📋 권장사항:');
        if (tableError) {
            console.log('   1. ❗ SQL 스크립트 실행 필요: infra/database/sql/setup-vector-database.sql');
        }
        console.log('   2. 🔑 OpenAI API 키 설정 확인');
        console.log('   3. 🚀 개발 서버 재시작: npm run dev');
        console.log('   4. 🧪 RAG 테스트: /api/test-supabase-rag');

    } catch (error) {
        console.error('❌ Supabase 연결 실패:', error.message);
        console.error('   상세:', error);
        process.exit(1);
    }
}

testSupabaseConnection(); 