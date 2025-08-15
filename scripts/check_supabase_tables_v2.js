const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function checkServerMetrics() {
  try {
    console.log('🔍 server_metrics 테이블 직접 확인...\n');
    
    // 1. server_metrics 테이블에 직접 접근 시도
    console.log('📊 데이터 개수 확인...');
    const { count, error: countError } = await supabase
      .from('server_metrics')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      if (countError.code === '42P01') {
        console.log('❌ server_metrics 테이블이 존재하지 않습니다!');
        console.log('   에러 코드: 42P01 (relation does not exist)');
        console.log('   테이블 생성 또는 마이그레이션이 필요합니다.\n');
        
        // 다른 테이블들 확인
        await checkExistingTables();
        return;
      } else {
        console.log('❌ 데이터 개수 조회 실패:', countError);
        return;
      }
    }
    
    console.log(`✅ server_metrics 테이블 데이터 개수: ${count}개`);
    
    if (count === 0) {
      console.log('\n🚨 테이블은 존재하지만 데이터가 없습니다!');
      console.log('   가능한 원인:');
      console.log('   1. 데이터 수집 서비스가 실행되지 않음');
      console.log('   2. API 엔드포인트 연결 문제');
      console.log('   3. 인증/권한 문제');
      console.log('   4. 초기 데이터 삽입이 필요');
      
      // 테이블 구조만 확인
      await checkTableStructure();
    } else {
      console.log('\n✅ 데이터가 존재합니다!');
      await checkRecentData();
      await checkTableStructure();
    }
    
  } catch (error) {
    console.error('💥 예상치 못한 에러:', error);
  }
}

async function checkExistingTables() {
  try {
    console.log('🔍 다른 테이블들 확인...');
    
    // 일반적인 테이블들 직접 확인
    const tablesToCheck = [
      'servers',
      'users', 
      'profiles',
      'server_status',
      'system_metrics',
      'monitoring_data',
      'auth.users'
    ];
    
    const existingTables = [];
    
    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          existingTables.push({ name: tableName, count });
        }
      } catch (e) {
        // 테이블이 없으면 무시
      }
    }
    
    if (existingTables.length > 0) {
      console.log('✅ 존재하는 테이블들:');
      existingTables.forEach(table => {
        console.log(`  - ${table.name}: ${table.count}개 레코드`);
      });
    } else {
      console.log('❌ 확인된 테이블이 없습니다.');
      console.log('   데이터베이스가 초기화되지 않았을 수 있습니다.');
    }
    
  } catch (error) {
    console.error('💥 기존 테이블 확인 중 에러:', error);
  }
}

async function checkTableStructure() {
  try {
    console.log('\n📋 테이블 구조 확인 (단일 레코드 조회)...');
    
    const { data, error } = await supabase
      .from('server_metrics')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ 테이블 구조 확인 실패:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ 테이블 필드 구조 (첫 번째 레코드 기준):');
      const record = data[0];
      Object.keys(record).forEach(key => {
        const value = record[key];
        const type = typeof value;
        console.log(`  - ${key}: ${type} (예시: ${value})`);
      });
    } else {
      console.log('⚠️  데이터가 없어서 정확한 구조를 확인할 수 없습니다.');
    }
    
  } catch (error) {
    console.error('💥 테이블 구조 확인 중 에러:', error);
  }
}

async function checkRecentData() {
  try {
    console.log('\n📈 최근 데이터 조회...');
    
    const { data: recentData, error: dataError } = await supabase
      .from('server_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (dataError) {
      console.log('❌ 최근 데이터 조회 실패:', dataError);
      return;
    }
    
    if (recentData && recentData.length > 0) {
      console.log('✅ 최근 데이터 5개:');
      recentData.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id || 'N/A'}`);
        if (record.server_id) console.log(`     Server: ${record.server_id}`);
        if (record.created_at) console.log(`     Created: ${record.created_at}`);
        if (record.cpu !== undefined) console.log(`     CPU: ${record.cpu}%`);
        if (record.memory !== undefined) console.log(`     Memory: ${record.memory}%`);
        if (record.disk !== undefined) console.log(`     Disk: ${record.disk}%`);
        console.log('');
      });
      
      // 데이터 업데이트 빈도 확인
      if (recentData.length >= 2 && recentData[0].created_at && recentData[1].created_at) {
        const latest = new Date(recentData[0].created_at);
        const previous = new Date(recentData[1].created_at);
        const diffMinutes = (latest - previous) / (1000 * 60);
        console.log(`⏱️  최근 데이터 업데이트 간격: ${diffMinutes.toFixed(1)}분`);
      }
    }
    
  } catch (error) {
    console.error('💥 최근 데이터 조회 중 에러:', error);
  }
}

// 실행
checkServerMetrics().then(() => {
  console.log('\n✅ 분석 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 중 치명적 에러:', error);
  process.exit(1);
});