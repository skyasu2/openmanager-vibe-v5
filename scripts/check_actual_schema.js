const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkActualSchema() {
  console.log('🔍 실제 PostgreSQL 스키마 직접 조회...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔄 실제 데이터로 구조 추정...');
    const { data: sampleData, error: dataError } = await supabase
      .from('server_metrics')
      .select('*')
      .limit(1);
      
    if (dataError) {
      console.log('❌ 샘플 데이터 조회 실패:', dataError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('✅ 실제 테이블 구조 (첫 번째 레코드 기준):');
      const record = sampleData[0];
      Object.keys(record).forEach(key => {
        const value = record[key];
        const type = typeof value === 'number' ? 'numeric' : typeof value;
        console.log(`   - ${key}: ${type} (예시: ${value})`);
      });
    } else {
      console.log('❌ 테이블이 비어있습니다');
    }

    // 테이블 전체 통계
    const { data: allData, error: allError } = await supabase
      .from('server_metrics')
      .select('*');
      
    if (!allError && allData) {
      console.log(`\n📊 테이블 통계: 총 ${allData.length}개 레코드`);
      console.log('📋 모든 레코드 구조:');
      allData.forEach((record, index) => {
        console.log(`   레코드 ${index + 1}:`, JSON.stringify(record, null, 2));
      });
    }

  } catch (err) {
    console.error('❌ 오류 발생:', err);
  }
}

checkActualSchema();