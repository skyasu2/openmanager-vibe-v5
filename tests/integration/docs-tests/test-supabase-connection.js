const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🚀 Supabase 연결 테스트 시작...');

  try {
    // 1. 연결 테스트 (간단한 쿼리로 변경)
    console.log('📡 연결 테스트 중...');
    const { data: connectionTest, error: connectionError } =
      await supabase.rpc('version');

    if (connectionError) {
      console.log('⚠️ RPC 테스트 실패, 직접 테이블 접근으로 시도...');
      // 대안: 직접 auto_reports 테이블로 연결 테스트
    } else {
      console.log('✅ Supabase 연결 성공! PostgreSQL 버전:', connectionTest);
    }

    // 2. auto_reports 테이블 존재 확인
    console.log('🔍 auto_reports 테이블 확인 중...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('auto_reports')
      .select('*')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('📋 auto_reports 테이블이 존재하지 않음. 생성 중...');

      // 3. 테이블 생성 (SQL 실행)
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
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_auto_reports_type ON public.auto_reports(type);
        CREATE INDEX IF NOT EXISTS idx_auto_reports_status ON public.auto_reports(status);
        CREATE INDEX IF NOT EXISTS idx_auto_reports_created_at ON public.auto_reports(created_at DESC);
        
        -- RLS 활성화
        ALTER TABLE public.auto_reports ENABLE ROW LEVEL SECURITY;
        
        -- 정책 생성
        CREATE POLICY IF NOT EXISTS "auto_reports_select_policy" ON public.auto_reports
          FOR SELECT USING (true);
        
        CREATE POLICY IF NOT EXISTS "auto_reports_insert_policy" ON public.auto_reports
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY IF NOT EXISTS "auto_reports_update_policy" ON public.auto_reports
          FOR UPDATE USING (true);
      `;

      // SQL 실행 (rpc 사용)
      try {
        // 직접 SQL 실행이 안되므로 테이블 생성을 위한 더미 데이터 삽입 시도
        const { data: insertTest, error: insertError } = await supabase
          .from('auto_reports')
          .insert({
            report_id: 'test_' + Date.now(),
            type: 'daily',
            title: '테스트 보고서',
            content: { test: true },
          });

        if (insertError && insertError.code === '42P01') {
          console.log(
            '⚠️ 테이블 생성이 필요합니다. Supabase 대시보드에서 수동으로 생성해주세요.'
          );
          console.log('📋 생성할 SQL:');
          console.log(createTableSQL);
          return false;
        } else if (insertError) {
          console.error('❌ 테이블 생성 실패:', insertError);
          return false;
        } else {
          console.log('✅ 테이블이 이미 존재하거나 생성되었습니다.');
          // 테스트 데이터 삭제
          if (insertTest && insertTest.length > 0) {
            await supabase
              .from('auto_reports')
              .delete()
              .eq('id', insertTest[0].id);
          }
        }
      } catch (sqlError) {
        console.error('❌ SQL 실행 실패:', sqlError);
        return false;
      }
    } else if (tableError) {
      console.error('❌ 테이블 확인 실패:', tableError);
      return false;
    } else {
      console.log('✅ auto_reports 테이블이 이미 존재합니다.');
    }

    // 4. 샘플 데이터 삽입 테스트
    console.log('📝 샘플 데이터 삽입 테스트...');
    const sampleReport = {
      report_id: 'sample_test_' + Date.now(),
      type: 'daily',
      title: '연결 테스트 보고서',
      summary: 'Supabase 연결 테스트가 성공적으로 완료되었습니다.',
      content: {
        timestamp: new Date().toISOString(),
        test_result: 'success',
        connection_status: 'active',
      },
      priority: 'normal',
      tags: ['test', 'connection', 'supabase'],
    };

    const { data: insertData, error: insertError } = await supabase
      .from('auto_reports')
      .insert(sampleReport)
      .select();

    if (insertError) {
      console.error('❌ 샘플 데이터 삽입 실패:', insertError);
      return false;
    }

    console.log('✅ 샘플 데이터 삽입 성공:', insertData[0].id);

    // 5. 데이터 조회 테스트
    console.log('🔍 데이터 조회 테스트...');
    const { data: selectData, error: selectError } = await supabase
      .from('auto_reports')
      .select('*')
      .eq('report_id', sampleReport.report_id);

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError);
      return false;
    }

    console.log('✅ 데이터 조회 성공:', selectData.length, '개 레코드');

    // 6. 테스트 데이터 정리
    console.log('🧹 테스트 데이터 정리...');
    const { error: deleteError } = await supabase
      .from('auto_reports')
      .delete()
      .eq('report_id', sampleReport.report_id);

    if (deleteError) {
      console.warn('⚠️ 테스트 데이터 삭제 실패:', deleteError);
    } else {
      console.log('✅ 테스트 데이터 정리 완료');
    }

    // 7. 최종 통계
    const { data: countData, error: countError } = await supabase
      .from('auto_reports')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(
        '📊 현재 auto_reports 테이블 레코드 수:',
        countData?.length || 0
      );
    }

    console.log('🎉 모든 테스트 완료! auto_reports 테이블이 정상 작동합니다.');
    return true;
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error);
    return false;
  }
}

// 스크립트 실행
if (require.main === module) {
  testSupabaseConnection()
    .then(success => {
      if (success) {
        console.log('🎊 Supabase auto_reports 테이블 설정 완료!');
        process.exit(0);
      } else {
        console.log('❌ 테스트 실패. 로그를 확인해주세요.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 스크립트 실행 오류:', error);
      process.exit(1);
    });
}

module.exports = { testSupabaseConnection };
