const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSupabaseConfig() {
  console.log('🔧 Supabase 설정 및 연결 상태 확인...\n');

  // 환경변수 확인
  console.log('📋 환경변수 확인:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 없음'}`);

  // 연결 테스트
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. 기본 연결 테스트
    console.log('\n🔍 연결 테스트:');
    const startTime = Date.now();
    const { data, error, status } = await supabase
      .from('server_metrics')
      .select('count', { count: 'exact', head: true });
      
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.log(`   ❌ 연결 실패 (${responseTime}ms):`, error);
      return;
    }
    
    console.log(`   ✅ 연결 성공 (${responseTime}ms)`);
    console.log(`   📊 총 레코드: ${data?.count || 0}개`);

    // 2. 테이블 목록 확인
    console.log('\n📋 접근 가능한 테이블 확인:');
    const tables = ['server_metrics', 'servers', 'users', 'profiles'];
    
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (tableError) {
          console.log(`   ❌ ${table}: ${tableError.message}`);
        } else {
          console.log(`   ✅ ${table}: ${tableData?.count || 0}개 레코드`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: 접근 불가`);
      }
    }

    // 3. 권한 테스트
    console.log('\n🔐 권한 테스트:');
    
    // SELECT 권한
    try {
      const { data: selectData, error: selectError } = await supabase
        .from('server_metrics')
        .select('*')
        .limit(1);
        
      if (selectError) {
        console.log(`   ❌ SELECT 권한: ${selectError.message}`);
      } else {
        console.log(`   ✅ SELECT 권한: 정상`);
      }
    } catch (err) {
      console.log(`   ❌ SELECT 권한: 오류 발생`);
    }

    // INSERT 권한 (테스트 데이터로)
    try {
      const testData = {
        id: 'test-' + Date.now(),
        hostname: 'test-server',
        status: 'online',
        cpu_usage: 50.0,
        memory_usage: 60.0,
        disk_usage: 70.0,
        network_in: 100.0,
        network_out: 90.0,
        uptime: 3600,
        environment: 'test',
        role: 'test'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('server_metrics')
        .insert(testData)
        .select();
        
      if (insertError) {
        console.log(`   ❌ INSERT 권한: ${insertError.message}`);
      } else {
        console.log(`   ✅ INSERT 권한: 정상`);
        
        // 테스트 데이터 정리
        await supabase
          .from('server_metrics')
          .delete()
          .eq('id', testData.id);
        console.log(`   🧹 테스트 데이터 정리 완료`);
      }
    } catch (err) {
      console.log(`   ❌ INSERT 권한: 오류 발생`);
    }

    // 4. RLS 정책 확인
    console.log('\n🛡️ RLS 정책 확인:');
    
    // Anon 키로 연결해서 RLS 테스트
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    try {
      const { data: anonData, error: anonError } = await anonSupabase
        .from('server_metrics')
        .select('*')
        .limit(1);
        
      if (anonError) {
        console.log(`   ✅ RLS 활성화됨: 익명 접근 차단 (${anonError.message})`);
      } else {
        console.log(`   ⚠️ RLS 정책 확인 필요: 익명 접근 가능`);
      }
    } catch (err) {
      console.log(`   ✅ RLS 활성화됨: 익명 접근 차단`);
    }

    // 5. 무료 티어 사용량 추정
    console.log('\n💰 무료 티어 사용량 추정:');
    
    const { data: allTables } = await supabase
      .from('server_metrics')
      .select('*');
      
    if (allTables) {
      const dataSize = JSON.stringify(allTables).length;
      const estimatedSizeMB = (dataSize / (1024 * 1024)).toFixed(2);
      const usagePercentage = ((estimatedSizeMB / 500) * 100).toFixed(1);
      
      console.log(`   📊 데이터 크기 추정: ${estimatedSizeMB}MB`);
      console.log(`   📈 무료 티어 사용률: ${usagePercentage}% (500MB 중)`);
      
      if (usagePercentage > 80) {
        console.log(`   ⚠️ 사용량이 80%를 초과했습니다 - 데이터 정리 필요`);
      } else {
        console.log(`   ✅ 사용량이 안전한 수준입니다`);
      }
    }

  } catch (err) {
    console.error('❌ 설정 확인 오류:', err);
  }
}

checkSupabaseConfig();