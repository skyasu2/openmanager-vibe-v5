const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function insertSampleData() {
  console.log('🚀 server_metrics 테이블에 샘플 데이터 삽입...\n');
  
  try {
    // 1. 테이블 구조 먼저 확인
    console.log('📋 테이블 구조 확인...');
    const { data: structureTest, error: structureError } = await supabase
      .from('server_metrics')
      .select('*')
      .limit(1);
    
    if (structureError && structureError.code === '42P01') {
      console.log('❌ server_metrics 테이블이 존재하지 않습니다!');
      return;
    }
    
    console.log('✅ server_metrics 테이블 확인 완료');
    
    // 2. 간단한 샘플 데이터부터 시작
    console.log('\n📊 기본 샘플 데이터 삽입...');
    
    const basicSamples = [
      {
        server_id: 'prod-web-01',
        cpu: 45.2,
        memory: 67.8,
        disk: 78.5,
        network: 1024000
      },
      {
        server_id: 'prod-web-02', 
        cpu: 52.1,
        memory: 71.3,
        disk: 65.2,
        network: 2048000
      },
      {
        server_id: 'prod-db-01',
        cpu: 78.9,
        memory: 85.4,
        disk: 45.7,
        network: 512000
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const sample of basicSamples) {
      try {
        const { data, error } = await supabase
          .from('server_metrics')
          .insert(sample)
          .select();
        
        if (error) {
          console.log(`❌ ${sample.server_id} 삽입 실패:`, error.message);
          
          // 에러 분석
          if (error.code === '42703') {
            console.log('   → 컬럼이 존재하지 않습니다. 테이블 구조 문제');
          } else if (error.code === '23502') {
            console.log('   → NOT NULL 제약 조건 위반. 필수 필드 누락');
          } else if (error.code === '23514') {
            console.log('   → CHECK 제약 조건 위반. 값 범위 문제');
          }
          
          errorCount++;
        } else {
          console.log(`✅ ${sample.server_id} 삽입 성공`);
          if (data && data.length > 0) {
            console.log(`   ID: ${data[0].id}, Created: ${data[0].created_at}`);
          }
          successCount++;
        }
        
      } catch (error) {
        console.log(`💥 ${sample.server_id} 삽입 중 예상치 못한 에러:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n📋 기본 데이터 삽입 결과: 성공 ${successCount}개, 실패 ${errorCount}개`);
    
    // 3. 성공한 경우에만 추가 데이터 삽입
    if (successCount > 0) {
      await insertAdditionalData();
    }
    
    // 4. 최종 결과 조회
    await checkFinalResults();
    
  } catch (error) {
    console.error('💥 샘플 데이터 삽입 중 치명적 에러:', error);
  }
}

async function insertAdditionalData() {
  console.log('\n🔄 추가 샘플 데이터 삽입...');
  
  try {
    // 더 다양한 서버 데이터
    const additionalSamples = [
      {
        server_id: 'dev-web-01',
        cpu: 25.4,
        memory: 42.8,
        disk: 35.2,
        network: 256000
      },
      {
        server_id: 'staging-db-01', 
        cpu: 55.7,
        memory: 68.3,
        disk: 58.9,
        network: 384000
      },
      {
        server_id: 'prod-cache-01',
        cpu: 18.2,
        memory: 35.6,
        disk: 12.8,
        network: 128000
      }
    ];
    
    const { data, error } = await supabase
      .from('server_metrics')
      .insert(additionalSamples)
      .select();
    
    if (error) {
      console.log('❌ 추가 데이터 삽입 실패:', error.message);
    } else {
      console.log(`✅ 추가 데이터 ${data.length}개 삽입 성공`);
    }
    
  } catch (error) {
    console.log('💥 추가 데이터 삽입 중 에러:', error);
  }
}

async function insertTimeSeriesData() {
  console.log('\n⏱️  시계열 데이터 생성 (prod-web-01, 최근 1시간)...');
  
  try {
    const timeSeriesData = [];
    const now = new Date();
    
    // 최근 1시간 동안 5분 간격으로 데이터 생성
    for (let i = 0; i < 12; i++) {
      const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
      
      timeSeriesData.push({
        server_id: 'prod-web-01',
        cpu: 45 + (Math.random() * 20 - 10), // 35-55% 범위
        memory: 68 + (Math.random() * 10 - 5), // 63-73% 범위
        disk: 78.5, // 고정
        network: 1000000 + Math.floor(Math.random() * 500000), // 1-1.5MB 범위
        created_at: timestamp.toISOString()
      });
    }
    
    const { data, error } = await supabase
      .from('server_metrics')
      .insert(timeSeriesData)
      .select();
    
    if (error) {
      console.log('❌ 시계열 데이터 삽입 실패:', error.message);
    } else {
      console.log(`✅ 시계열 데이터 ${data.length}개 삽입 성공`);
    }
    
  } catch (error) {
    console.log('💥 시계열 데이터 삽입 중 에러:', error);
  }
}

async function checkFinalResults() {
  console.log('\n📊 최종 결과 확인...');
  
  try {
    // 총 데이터 개수
    const { count, error: countError } = await supabase
      .from('server_metrics')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ 데이터 개수 확인 실패:', countError);
      return;
    }
    
    console.log(`📈 총 데이터 개수: ${count}개`);
    
    if (count > 0) {
      // 서버별 데이터 개수
      const { data: serverCounts, error: serverError } = await supabase
        .from('server_metrics')
        .select('server_id')
        .then(result => {
          if (result.error) throw result.error;
          
          const counts = {};
          result.data.forEach(row => {
            counts[row.server_id] = (counts[row.server_id] || 0) + 1;
          });
          
          return { data: counts, error: null };
        });
      
      if (!serverError) {
        console.log('\n📋 서버별 데이터 개수:');
        Object.entries(serverCounts).forEach(([serverId, count]) => {
          console.log(`  - ${serverId}: ${count}개`);
        });
      }
      
      // 최근 데이터 몇 개 조회
      const { data: recentData, error: recentError } = await supabase
        .from('server_metrics')
        .select('server_id, cpu, memory, disk, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!recentError && recentData) {
        console.log('\n📈 최근 데이터 5개:');
        recentData.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.server_id}: CPU ${record.cpu}%, Memory ${record.memory}%, Disk ${record.disk}%`);
          console.log(`     Created: ${record.created_at}`);
        });
      }
      
      // 시계열 데이터도 생성
      await insertTimeSeriesData();
    }
    
  } catch (error) {
    console.error('💥 최종 결과 확인 중 에러:', error);
  }
}

// 실행
insertSampleData().then(() => {
  console.log('\n✅ 샘플 데이터 삽입 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 중 치명적 에러:', error);
  process.exit(1);
});