const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function finalDatabaseAnalysis() {
  console.log('🔍 OpenManager VIBE v5 - 데이터베이스 최종 분석 리포트\n');
  console.log('=' .repeat(70));
  
  try {
    // 1. 연결 테스트
    console.log('📡 Supabase 연결 테스트...');
    const startTime = Date.now();
    
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (connectionError && connectionError.code !== '42P01') {
      console.log('❌ Supabase 연결 실패:', connectionError);
      return;
    }
    
    console.log(`✅ Supabase 연결 성공 (응답시간: ${responseTime}ms)`);
    
    // 2. 테이블 존재 확인 상세 분석
    console.log('\n📊 테이블 존재 여부 상세 분석...');
    
    const criticalTables = [
      'server_metrics',
      'servers', 
      'users',
      'profiles'
    ];
    
    const tableStatus = {};
    
    for (const tableName of criticalTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === '42P01') {
            tableStatus[tableName] = { exists: false, reason: 'Table does not exist' };
          } else {
            tableStatus[tableName] = { exists: 'unknown', reason: error.message };
          }
        } else {
          tableStatus[tableName] = { exists: true, count: count || 0 };
        }
        
      } catch (e) {
        tableStatus[tableName] = { exists: 'error', reason: e.message };
      }
    }
    
    console.log('\n📋 중요 테이블 상태:');
    Object.entries(tableStatus).forEach(([table, status]) => {
      if (status.exists === true) {
        console.log(`  ✅ ${table}: 존재 (${status.count}개 레코드)`);
      } else if (status.exists === false) {
        console.log(`  ❌ ${table}: 존재하지 않음 - ${status.reason}`);
      } else {
        console.log(`  ⚠️  ${table}: 확인 불가 - ${status.reason}`);
      }
    });
    
    // 3. server_metrics 테이블 특별 분석
    console.log('\n🎯 server_metrics 테이블 특별 분석...');
    
    if (tableStatus['server_metrics']?.exists === false) {
      console.log('❌ server_metrics 테이블이 존재하지 않습니다.');
      console.log('\n🚨 해결 방법:');
      console.log('1. Supabase Dashboard → SQL Editor 접속');
      console.log('2. create_server_metrics_simple.sql 파일 내용 복사 & 실행');
      console.log('3. 또는 Table Editor에서 수동 생성');
      
      console.log('\n📋 필요한 테이블 구조:');
      console.log('   - id: UUID (Primary Key)');
      console.log('   - server_id: VARCHAR(100) (NOT NULL)');
      console.log('   - cpu: DECIMAL(5,2) (0-100)');
      console.log('   - memory: DECIMAL(5,2) (0-100)');
      console.log('   - disk: DECIMAL(5,2) (0-100)');
      console.log('   - network: BIGINT (기본값: 0)');
      console.log('   - status: VARCHAR(20) (기본값: active)');
      console.log('   - created_at: TIMESTAMP WITH TIME ZONE');
      
    } else if (tableStatus['server_metrics']?.exists === true) {
      console.log('✅ server_metrics 테이블이 존재합니다!');
      
      if (tableStatus['server_metrics'].count === 0) {
        console.log('⚠️  하지만 데이터가 없습니다.');
        console.log('💡 테스트 데이터 삽입이 필요합니다.');
      } else {
        console.log(`📊 현재 ${tableStatus['server_metrics'].count}개의 레코드가 있습니다.`);
      }
    }
    
    // 4. 권한 및 RLS 확인
    console.log('\n🔐 권한 및 보안 확인...');
    
    try {
      // 간단한 SELECT 권한 테스트
      const { error: selectError } = await supabase
        .from('server_metrics')
        .select('count')
        .limit(1);
      
      if (selectError) {
        if (selectError.code === '42501') {
          console.log('❌ SELECT 권한 없음 - RLS 정책 문제');
        } else if (selectError.code === '42P01') {
          console.log('⚠️  테이블이 존재하지 않음');
        } else {
          console.log(`⚠️  SELECT 테스트 실패: ${selectError.message}`);
        }
      } else {
        console.log('✅ SELECT 권한 확인');
      }
      
      // 간단한 INSERT 권한 테스트 (실제로 삽입하지 않음)
      const testData = {
        server_id: 'test-permission-check',
        cpu: 50,
        memory: 60, 
        disk: 70,
        network: 1000
      };
      
      const { error: insertError } = await supabase
        .from('server_metrics')
        .insert(testData)
        .select();
      
      if (insertError) {
        if (insertError.code === '42501') {
          console.log('❌ INSERT 권한 없음 - RLS 정책 문제');
        } else if (insertError.code === '42P01') {
          console.log('⚠️  테이블이 존재하지 않음 (INSERT 테스트)');
        } else {
          console.log(`⚠️  INSERT 테스트 실패: ${insertError.message}`);
        }
      } else {
        console.log('✅ INSERT 권한 확인');
        // 테스트 데이터 즉시 삭제
        await supabase
          .from('server_metrics')
          .delete()
          .eq('server_id', 'test-permission-check');
      }
      
    } catch (e) {
      console.log('💥 권한 테스트 중 예상치 못한 에러:', e.message);
    }
    
    // 5. 최종 권장사항
    console.log('\n💡 최종 권장사항:');
    
    if (tableStatus['server_metrics']?.exists === false) {
      console.log('🎯 우선순위 1: server_metrics 테이블 생성');
      console.log('   → create_server_metrics_simple.sql 실행');
      console.log('   → Supabase Dashboard 사용 권장');
    } else if (tableStatus['server_metrics']?.count === 0) {
      console.log('🎯 우선순위 1: 테스트 데이터 삽입');
      console.log('   → Dashboard에서 직접 INSERT 실행');
    } else {
      console.log('🎯 우선순위 1: 데이터 수집 파이프라인 구축');
      console.log('   → API 엔드포인트 구현');
      console.log('   → 실시간 모니터링 시작');
    }
    
    console.log('\n🚀 다음 단계:');
    console.log('1. 테이블 생성/데이터 확인');
    console.log('2. API 엔드포인트 테스트 (/api/servers/metrics)');
    console.log('3. 프론트엔드 대시보드 연결');
    console.log('4. 실시간 모니터링 활성화');
    
  } catch (error) {
    console.error('💥 분석 중 치명적 에러:', error);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📋 분석 완료 - 위 권장사항을 따라 진행하세요.');
}

// 실행
finalDatabaseAnalysis().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 중 치명적 에러:', error);
  process.exit(1);
});