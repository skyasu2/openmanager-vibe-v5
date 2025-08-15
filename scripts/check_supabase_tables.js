const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function checkTables() {
  try {
    console.log('🔍 Supabase 데이터베이스 분석 시작...\n');
    
    // 1. 테이블 목록 조회
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
        
    if (tablesError) {
      console.log('❌ 테이블 목록 조회 에러:', tablesError);
      return;
    }
    
    console.log('✅ Public 스키마의 테이블 목록:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // server_metrics 테이블 확인
    const hasServerMetrics = tables.some(table => table.table_name === 'server_metrics');
    console.log(`\n📊 server_metrics 테이블 존재: ${hasServerMetrics ? '✅ 있음' : '❌ 없음'}`);
    
    if (!hasServerMetrics) {
      console.log('\n🚨 server_metrics 테이블이 존재하지 않습니다!');
      console.log('   마이그레이션 실행이 필요합니다.');
      
      // 다른 관련 테이블들도 확인
      const serverRelatedTables = tables.filter(table => 
        table.table_name.includes('server') || 
        table.table_name.includes('metric') ||
        table.table_name.includes('monitor')
      );
      
      if (serverRelatedTables.length > 0) {
        console.log('\n📋 서버 관련 테이블들:');
        serverRelatedTables.forEach(table => console.log(`  - ${table.table_name}`));
      }
      
      return;
    }
    
    // 테이블이 있다면 구조 확인
    await checkServerMetricsTable();
    
  } catch (error) {
    console.error('💥 예상치 못한 에러:', error);
  }
}

async function checkServerMetricsTable() {
  try {
    console.log('\n📋 server_metrics 테이블 구조 분석...');
    
    // 테이블 구조 조회
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'server_metrics')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.log('❌ 테이블 구조 조회 실패:', columnsError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ 테이블 구조:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        if (col.column_default) {
          console.log(`    기본값: ${col.column_default}`);
        }
      });
    }
    
    // 데이터 개수 확인
    console.log('\n📊 데이터 개수 확인...');
    const { count, error: countError } = await supabase
      .from('server_metrics')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ 데이터 개수 조회 실패:', countError);
    } else {
      console.log(`✅ server_metrics 테이블 데이터 개수: ${count}개`);
      
      if (count === 0) {
        console.log('🚨 테이블에 데이터가 없습니다!');
        console.log('   가능한 원인:');
        console.log('   1. 데이터 수집 서비스가 실행되지 않음');
        console.log('   2. API 엔드포인트 연결 문제');
        console.log('   3. 인증/권한 문제');
        console.log('   4. 초기 데이터 삽입이 필요');
      } else {
        // 최근 데이터 조회
        await checkRecentData();
      }
    }
    
    // 인덱스 정보 확인
    await checkIndexes();
    
  } catch (error) {
    console.error('💥 server_metrics 테이블 분석 중 에러:', error);
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
        console.log(`  ${index + 1}. ID: ${record.id}, Server: ${record.server_id}, Created: ${record.created_at}`);
        if (record.cpu !== undefined) console.log(`     CPU: ${record.cpu}%`);
        if (record.memory !== undefined) console.log(`     Memory: ${record.memory}%`);
        if (record.disk !== undefined) console.log(`     Disk: ${record.disk}%`);
      });
      
      // 데이터 업데이트 빈도 확인
      if (recentData.length >= 2) {
        const latest = new Date(recentData[0].created_at);
        const previous = new Date(recentData[1].created_at);
        const diffMinutes = (latest - previous) / (1000 * 60);
        console.log(`\n⏱️  최근 데이터 업데이트 간격: ${diffMinutes.toFixed(1)}분`);
      }
    } else {
      console.log('❌ 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('💥 최근 데이터 조회 중 에러:', error);
  }
}

async function checkIndexes() {
  try {
    console.log('\n🔍 인덱스 정보 확인...');
    
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'server_metrics');
    
    if (indexError) {
      console.log('❌ 인덱스 정보 조회 실패:', indexError);
      return;
    }
    
    if (indexes && indexes.length > 0) {
      console.log('✅ 인덱스 목록:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
        console.log(`    정의: ${idx.indexdef}`);
      });
    } else {
      console.log('⚠️  인덱스가 없습니다. 성능 최적화가 필요할 수 있습니다.');
    }
    
  } catch (error) {
    console.error('💥 인덱스 확인 중 에러:', error);
  }
}

// 실행
checkTables().then(() => {
  console.log('\n✅ 분석 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 중 치명적 에러:', error);
  process.exit(1);
});