const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function analyzeServerMetrics() {
  console.log('🔍 server_metrics 테이블 상세 분석...\n');
  
  try {
    // 1. 테이블 구조를 알아보기 위해 더미 데이터 삽입 시도
    console.log('📋 테이블 구조 분석을 위한 테스트 삽입...');
    
    const testData = {
      server_id: 'test-server-001',
      cpu: 75.5,
      memory: 80.2,
      disk: 65.8,
      network: 1024,
      created_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('server_metrics')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('❌ 테스트 데이터 삽입 실패:', insertError);
      console.log('   에러 세부사항:', insertError.details);
      console.log('   힌트:', insertError.hint);
      
      if (insertError.code === '42703') {
        console.log('   → 컬럼이 존재하지 않습니다. 테이블 구조를 확인해야 합니다.');
      } else if (insertError.code === '23505') {
        console.log('   → 중복 키 오류. 데이터가 이미 존재합니다.');
      } else if (insertError.code === '23502') {
        console.log('   → NOT NULL 제약 조건 위반. 필수 필드가 누락되었습니다.');
      }
      
      // 실패해도 다른 방법으로 구조 파악 시도
      await tryAlternativeStructureAnalysis();
      
    } else {
      console.log('✅ 테스트 데이터 삽입 성공!');
      console.log('   삽입된 데이터:', insertResult);
      
      // 삽입된 데이터로 구조 파악
      if (insertResult && insertResult.length > 0) {
        console.log('\n📊 테이블 구조 (삽입된 데이터 기준):');
        const record = insertResult[0];
        Object.keys(record).forEach(key => {
          const value = record[key];
          const type = typeof value;
          console.log(`  - ${key}: ${type} (값: ${value})`);
        });
      }
      
      // 테스트 데이터 정리
      if (insertResult && insertResult[0] && insertResult[0].id) {
        await supabase
          .from('server_metrics')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('✅ 테스트 데이터 정리 완료');
      }
    }
    
    // 2. 기존 데이터 확인
    await checkExistingData();
    
    // 3. 실제 사용할 수 있는 샘플 데이터 생성 제안
    await suggestSampleData();
    
  } catch (error) {
    console.error('💥 분석 중 예상치 못한 에러:', error);
  }
}

async function tryAlternativeStructureAnalysis() {
  console.log('\n🔄 대안 방법으로 테이블 구조 분석...');
  
  try {
    // 빈 select로 구조만 확인
    const { data, error } = await supabase
      .from('server_metrics')
      .select('*')
      .limit(0);
    
    if (error) {
      console.log('❌ 구조 확인 실패:', error);
    } else {
      console.log('✅ 테이블 구조 확인 성공 (빈 결과)');
      // 빈 결과지만 쿼리가 성공했다면 테이블이 존재함
    }
    
    // 다양한 필드 조합으로 시도
    const possibleFields = [
      'id',
      'server_id', 
      'cpu',
      'memory', 
      'disk',
      'network',
      'created_at',
      'updated_at',
      'timestamp',
      'status',
      'metadata'
    ];
    
    console.log('\n🔍 개별 필드 존재 여부 확인:');
    
    for (const field of possibleFields) {
      try {
        const { error } = await supabase
          .from('server_metrics')
          .select(field)
          .limit(1);
        
        if (!error) {
          console.log(`  ✅ ${field}: 존재`);
        } else if (error.code === '42703') {
          console.log(`  ❌ ${field}: 존재하지 않음`);
        } else {
          console.log(`  ⚠️  ${field}: 확인 불가 (${error.code})`);
        }
      } catch (e) {
        console.log(`  ❌ ${field}: 에러`);
      }
      
      // API 호출 제한 방지
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
  } catch (error) {
    console.error('💥 대안 분석 중 에러:', error);
  }
}

async function checkExistingData() {
  console.log('\n📊 기존 데이터 확인...');
  
  try {
    const { count, error: countError } = await supabase
      .from('server_metrics')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ 데이터 개수 확인 실패:', countError);
      return;
    }
    
    console.log(`📈 현재 데이터 개수: ${count}개`);
    
    if (count > 0) {
      // 최근 데이터 몇 개 조회
      const { data: recentData, error: dataError } = await supabase
        .from('server_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!dataError && recentData) {
        console.log('📋 최근 데이터:');
        recentData.forEach((record, index) => {
          console.log(`  ${index + 1}. ${JSON.stringify(record, null, 2)}`);
        });
      }
    } else {
      console.log('⚠️  데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('💥 기존 데이터 확인 중 에러:', error);
  }
}

async function suggestSampleData() {
  console.log('\n💡 샘플 데이터 생성 제안...');
  
  const sampleData = [
    {
      server_id: 'prod-web-01',
      cpu: 45.2,
      memory: 67.8,
      disk: 78.5,
      network: 1024000,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5분 전
    },
    {
      server_id: 'prod-web-02', 
      cpu: 52.1,
      memory: 71.3,
      disk: 65.2,
      network: 2048000,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10분 전
    },
    {
      server_id: 'prod-db-01',
      cpu: 78.9,
      memory: 85.4,
      disk: 45.7,
      network: 512000,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15분 전
    }
  ];
  
  console.log('📋 제안하는 샘플 데이터:');
  sampleData.forEach((data, index) => {
    console.log(`  ${index + 1}. ${JSON.stringify(data, null, 2)}`);
  });
  
  console.log('\n🚀 샘플 데이터 삽입을 원하시면 다음 명령을 실행하세요:');
  console.log('   node insert_sample_server_metrics.js');
}

// 실행
analyzeServerMetrics().then(() => {
  console.log('\n✅ server_metrics 테이블 분석 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 중 치명적 에러:', error);
  process.exit(1);
});