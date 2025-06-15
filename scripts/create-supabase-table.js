const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function createAutoReportsTable() {
  console.log('🚀 auto_reports 테이블 생성 시작...');
  
  try {
    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.auto_reports (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        report_id VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'performance', 'incident', 'security', 'custom')),
        title VARCHAR(255) NOT NULL,
        summary TEXT,
        content JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'archived')),
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        created_by VARCHAR(100) DEFAULT 'system',
        reviewed_by VARCHAR(100),
        reviewed_at TIMESTAMP WITH TIME ZONE
      );
    `;

    // 테이블 생성 실행
    const { data: createResult, error: createError } = await supabase
      .from('auto_reports')
      .select('*')
      .limit(1);

    if (createError && createError.code === '42P01') {
      // 테이블이 없으면 생성
      console.log('📋 테이블이 존재하지 않음. 생성 중...');
      
      // RPC를 통한 SQL 실행 (대안 방법)
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });
      
      if (error) {
        console.error('❌ 테이블 생성 실패:', error);
        
        // 직접 INSERT로 테스트
        console.log('🔄 대안 방법으로 테이블 존재 확인...');
        const { data: insertData, error: insertError } = await supabase
          .from('auto_reports')
          .insert({
            report_id: 'test_report_' + Date.now(),
            type: 'daily',
            title: '테스트 보고서',
            content: { test: true }
          });
          
        if (insertError) {
          console.error('❌ 테이블이 존재하지 않습니다:', insertError.message);
          return false;
        } else {
          console.log('✅ 테이블이 이미 존재합니다.');
          // 테스트 데이터 삭제
          await supabase
            .from('auto_reports')
            .delete()
            .eq('report_id', insertData[0].report_id);
        }
      } else {
        console.log('✅ 테이블 생성 성공:', data);
      }
    } else {
      console.log('✅ 테이블이 이미 존재합니다.');
    }

    // 샘플 데이터 삽입
    console.log('📝 샘플 데이터 삽입 중...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('auto_reports')
      .upsert([
        {
          report_id: 'sample_daily_001',
          type: 'daily',
          title: '일일 시스템 상태 보고서',
          summary: '모든 시스템이 정상 동작 중입니다.',
          content: {
            servers: { total: 20, online: 18, warning: 2 },
            performance: { avg_response: '145ms', uptime: '99.8%' }
          },
          priority: 'normal',
          tags: ['daily', 'system', 'status']
        },
        {
          report_id: 'sample_performance_001',
          type: 'performance',
          title: '성능 분석 보고서',
          summary: 'CPU 사용률이 평균보다 높습니다.',
          content: {
            cpu: { usage: 75, threshold: 70 },
            memory: { usage: 60, threshold: 80 },
            recommendations: ['스케일링 고려']
          },
          priority: 'high',
          tags: ['performance', 'cpu', 'monitoring']
        }
      ], { onConflict: 'report_id' });

    if (sampleError) {
      console.error('⚠️ 샘플 데이터 삽입 실패:', sampleError.message);
    } else {
      console.log('✅ 샘플 데이터 삽입 성공:', sampleData?.length || 0, '개');
    }

    // 테이블 확인
    const { data: checkData, error: checkError } = await supabase
      .from('auto_reports')
      .select('count(*)')
      .single();

    if (checkError) {
      console.error('❌ 테이블 확인 실패:', checkError.message);
      return false;
    } else {
      console.log('✅ 테이블 확인 성공. 총', checkData.count, '개 레코드');
      return true;
    }

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
    return false;
  }
}

// 스크립트 실행
if (require.main === module) {
  createAutoReportsTable()
    .then(success => {
      if (success) {
        console.log('🎉 auto_reports 테이블 설정 완료!');
        process.exit(0);
      } else {
        console.log('❌ 테이블 설정 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 스크립트 실행 오류:', error);
      process.exit(1);
    });
}

module.exports = { createAutoReportsTable }; 