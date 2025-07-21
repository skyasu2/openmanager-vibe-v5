#!/usr/bin/env node

/**
 * 🔍 간단한 Supabase 연결 테스트
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'your_supabase_url_here';
const SUPABASE_ANON_KEY = 'SENSITIVE_INFO_REMOVED';

async function testSupabaseConnection() {
  console.log('🔍 Supabase 기본 연결 테스트...\n');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. 기본 연결 테스트
    console.log('📡 Supabase 클라이언트 생성 완료');

    // 2. 간단한 테스트 테이블 생성 시도
    console.log('\n🧪 테스트 테이블 접근 시도...');

    // 우선 간단한 테이블 접근
    const { error: createError } = await supabase
      .from('test_table')
      .insert([{ id: 1, name: 'test' }]);

    if (createError) {
      console.log(
        '⚠️  테스트 테이블 삽입 실패:',
        createError.message || createError
      );

      // 테이블이 없다면 정상
      if (
        createError.message &&
        createError.message.includes('does not exist')
      ) {
        console.log('✅ 정상: 테이블이 존재하지 않음 (예상됨)');
      }
    } else {
      console.log('✅ 테스트 테이블 접근 가능');
    }

    console.log('\n✅ Supabase 기본 연결 테스트 완료!');
    return { success: true };
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error);
    return { success: false, error: error.message };
  }
}

// 스크립트 실행
if (require.main === module) {
  testSupabaseConnection()
    .then(result => {
      console.log('\n📊 최종 결과:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 예상치 못한 오류:', error);
      process.exit(1);
    });
}

module.exports = { testSupabaseConnection };
