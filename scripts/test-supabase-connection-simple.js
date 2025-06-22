#!/usr/bin/env node

/**
 * 🔍 간단한 Supabase 연결 테스트
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function simpleSupabaseTest() {
    console.log('🔍 Supabase 간단 테스트 시작...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('✅ 환경변수:', {
        url: supabaseUrl ? '설정됨' : '없음',
        key: supabaseKey ? '설정됨' : '없음'
    });

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료\n');

    try {
        // command_vectors 테이블 확인
        console.log('📊 command_vectors 테이블 확인...');
        const { data: tableData, error: tableError } = await supabase
            .from('command_vectors')
            .select('*', { count: 'exact', head: true });

        if (tableError) {
            console.log('❌ command_vectors 테이블 없음');
            console.log('   에러 코드:', tableError.code);
            console.log('   메시지:', tableError.message);
            console.log('\n🔧 해결 방법:');
            console.log('   1. Supabase Dashboard에 접속');
            console.log('   2. SQL Editor에서 다음 스크립트 실행:');
            console.log('      → infra/database/sql/setup-vector-database.sql');
            console.log('   3. 또는 아래 명령어 실행:');
            console.log('      → node scripts/create-vector-table.js\n');
            return false;
        } else {
            console.log('✅ command_vectors 테이블 존재');
            console.log('   레코드 수:', tableData?.count || 0);
            return true;
        }

    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
        return false;
    }
}

simpleSupabaseTest().then(success => {
    if (success) {
        console.log('🎉 Supabase 벡터 DB 준비 완료!');
        console.log('   → 이제 RAG 시스템을 테스트할 수 있습니다');
        console.log('   → /api/test-supabase-rag 접속');
    } else {
        console.log('⚠️  벡터 테이블 설정이 필요합니다');
    }
}); 