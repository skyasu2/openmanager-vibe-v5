const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function analyzeCurrentPerformance() {
  console.log('⚡ 현재 데이터베이스 성능 분석...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. 기본 성능 테스트
    console.log('1️⃣ 기본 쿼리 성능 테스트:');
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('server_metrics')
      .select('*')
      .limit(10);
    const queryTime = Date.now() - startTime;
    
    if (error) {
      console.log('❌ 쿼리 실패:', error);
      return;
    }
    
    console.log(`   ✅ 전체 조회 (LIMIT 10): ${queryTime}ms`);

    // 2. 필터링 성능 테스트
    const filterStart = Date.now();
    const { data: filteredData, error: filterError } = await supabase
      .from('server_metrics')
      .select('*')
      .eq('status', 'online');
    const filterTime = Date.now() - filterStart;
    
    if (!filterError) {
      console.log(`   ✅ 상태 필터링: ${filterTime}ms (${filteredData.length}개 결과)`);
    }

    // 3. 환경별 그룹핑 테스트
    const groupStart = Date.now();
    const { data: envData, error: envError } = await supabase
      .from('server_metrics')
      .select('environment')
      .neq('environment', null);
    const groupTime = Date.now() - groupStart;
    
    if (!envError) {
      const envCounts = envData.reduce((acc, item) => {
        acc[item.environment] = (acc[item.environment] || 0) + 1;
        return acc;
      }, {});
      console.log(`   ✅ 환경별 분류: ${groupTime}ms`);
      console.log('      분류 결과:', envCounts);
    }

    // 4. 높은 CPU 사용률 서버 찾기
    const highCpuStart = Date.now();
    const { data: highCpuData, error: highCpuError } = await supabase
      .from('server_metrics')
      .select('*')
      .gt('cpu_usage', 70);
    const highCpuTime = Date.now() - highCpuStart;
    
    if (!highCpuError) {
      console.log(`   ✅ 높은 CPU 사용률 검색 (>70%): ${highCpuTime}ms (${highCpuData.length}개 발견)`);
      highCpuData.forEach(server => {
        console.log(`      - ${server.hostname}: CPU ${server.cpu_usage}%`);
      });
    }

    // 5. 임계 상황 서버 찾기
    const criticalStart = Date.now();
    const { data: criticalData, error: criticalError } = await supabase
      .from('server_metrics')
      .select('*')
      .or('status.eq.critical,cpu_usage.gt.80,memory_usage.gt.85,disk_usage.gt.90');
    const criticalTime = Date.now() - criticalStart;
    
    if (!criticalError) {
      console.log(`   ✅ 임계 상황 검색: ${criticalTime}ms (${criticalData.length}개 발견)`);
      criticalData.forEach(server => {
        console.log(`      - ${server.hostname}: ${server.status}, CPU ${server.cpu_usage}%, MEM ${server.memory_usage}%, DISK ${server.disk_usage}%`);
      });
    }

    // 6. 시간 기반 정렬 테스트
    const timeStart = Date.now();
    const { data: timeData, error: timeError } = await supabase
      .from('server_metrics')
      .select('*')
      .order('last_updated', { ascending: false });
    const timeOrderTime = Date.now() - timeStart;
    
    if (!timeError) {
      console.log(`   ✅ 시간순 정렬: ${timeOrderTime}ms`);
      console.log(`      최신: ${timeData[0]?.last_updated}`);
      console.log(`      최오래: ${timeData[timeData.length - 1]?.last_updated}`);
    }

    // 7. 전체 성능 요약
    console.log('\n📊 성능 분석 요약:');
    console.log(`   🚀 평균 응답 시간: ${((queryTime + filterTime + groupTime + highCpuTime + criticalTime + timeOrderTime) / 6).toFixed(1)}ms`);
    
    if (queryTime > 100) {
      console.log('   ⚠️  기본 쿼리가 100ms를 초과했습니다 - 인덱스 필요');
    } else {
      console.log('   ✅ 기본 쿼리 성능이 양호합니다');
    }

    // 8. 인덱스 권장사항
    console.log('\n🎯 인덱스 최적화 권장사항:');
    console.log('   1. status 컬럼 인덱스 (필터링 최적화)');
    console.log('   2. cpu_usage, memory_usage, disk_usage 복합 인덱스 (임계값 검색)');
    console.log('   3. last_updated 컬럼 인덱스 (시간순 정렬)');
    console.log('   4. environment 컬럼 인덱스 (환경별 분류)');
    console.log('   5. hostname 컬럼 인덱스 (서버별 조회)');

  } catch (err) {
    console.error('❌ 성능 분석 오류:', err);
  }
}

analyzeCurrentPerformance();