'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';

const supabase = createClient(supabaseUrl, supabaseKey);

export default function TestSupabasePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('🚀 Supabase 연결 테스트 시작...');
      
      // 1. auto_reports 테이블 확인
      addLog('🔍 auto_reports 테이블 확인 중...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('auto_reports')
        .select('*')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') {
        addLog('📋 auto_reports 테이블이 존재하지 않음');
        addLog('⚠️ 테이블을 수동으로 생성해야 합니다.');
        
        return false;
      } else if (tableError) {
        addLog(`❌ 테이블 확인 실패: ${tableError.message}`);
        return false;
      } else {
        addLog('✅ auto_reports 테이블이 존재합니다!');
      }
      
      // 2. 샘플 데이터 삽입 테스트
      addLog('📝 샘플 데이터 삽입 테스트...');
      const sampleReport = {
        report_id: 'web_test_' + Date.now(),
        type: 'daily',
        title: '웹 연결 테스트 보고서',
        summary: 'Next.js 앱에서 Supabase 연결 테스트',
        content: {
          timestamp: new Date().toISOString(),
          test_result: 'success',
          source: 'nextjs_web_app'
        },
        priority: 'normal',
        tags: ['test', 'web', 'nextjs']
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('auto_reports')
        .insert(sampleReport)
        .select();
      
      if (insertError) {
        addLog(`❌ 샘플 데이터 삽입 실패: ${insertError.message}`);
        return false;
      }
      
      addLog(`✅ 샘플 데이터 삽입 성공: ${insertData[0].id}`);
      
      // 3. 데이터 조회 테스트
      addLog('🔍 데이터 조회 테스트...');
      const { data: selectData, error: selectError } = await supabase
        .from('auto_reports')
        .select('*')
        .eq('report_id', sampleReport.report_id);
      
      if (selectError) {
        addLog(`❌ 데이터 조회 실패: ${selectError.message}`);
        return false;
      }
      
      addLog(`✅ 데이터 조회 성공: ${selectData.length}개 레코드`);
      
      // 4. 테스트 데이터 정리
      addLog('🧹 테스트 데이터 정리...');
      const { error: deleteError } = await supabase
        .from('auto_reports')
        .delete()
        .eq('report_id', sampleReport.report_id);
      
      if (deleteError) {
        addLog(`⚠️ 테스트 데이터 삭제 실패: ${deleteError.message}`);
      } else {
        addLog('✅ 테스트 데이터 정리 완료');
      }
      
      // 5. 전체 레코드 수 확인
      const { count, error: countError } = await supabase
        .from('auto_reports')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        addLog(`📊 현재 auto_reports 테이블 레코드 수: ${count}개`);
      }
      
      addLog('🎉 모든 테스트 완료! auto_reports 테이블이 정상 작동합니다.');
      return true;
      
    } catch (error: any) {
      addLog(`💥 예상치 못한 오류: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createTableSQL = `-- 🤖 AI 자동 보고서 테이블 생성
-- OpenManager Vibe v5 - Auto Reports System

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
CREATE INDEX IF NOT EXISTS idx_auto_reports_priority ON public.auto_reports(priority);
CREATE INDEX IF NOT EXISTS idx_auto_reports_created_at ON public.auto_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_reports_report_id ON public.auto_reports(report_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.auto_reports ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 모든 사용자가 읽기 가능
CREATE POLICY IF NOT EXISTS "auto_reports_select_policy" ON public.auto_reports
    FOR SELECT USING (true);

-- 기본 정책: 인증된 사용자만 삽입 가능
CREATE POLICY IF NOT EXISTS "auto_reports_insert_policy" ON public.auto_reports
    FOR INSERT WITH CHECK (true);

-- 기본 정책: 인증된 사용자만 업데이트 가능
CREATE POLICY IF NOT EXISTS "auto_reports_update_policy" ON public.auto_reports
    FOR UPDATE USING (true);

-- 권한 설정
GRANT SELECT, INSERT, UPDATE ON public.auto_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auto_reports TO authenticated;

-- 샘플 데이터 삽입
INSERT INTO public.auto_reports (report_id, type, title, summary, content, priority, tags) VALUES
('sample_daily_001', 'daily', '일일 시스템 상태 보고서', '모든 시스템이 정상 동작 중입니다.', 
 '{"servers": {"total": 20, "online": 18, "warning": 2}, "performance": {"avg_response": "145ms", "uptime": "99.8%"}}',
 'normal', ARRAY['daily', 'system', 'status']),
('sample_performance_001', 'performance', '성능 분석 보고서', 'CPU 사용률이 평균보다 높습니다.',
 '{"cpu": {"usage": 75, "threshold": 70}, "memory": {"usage": 60, "threshold": 80}, "recommendations": ["스케일링 고려"]}',
 'high', ARRAY['performance', 'cpu', 'monitoring'])
ON CONFLICT (report_id) DO NOTHING;`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Supabase auto_reports 테이블 테스트
          </h1>
          
          <div className="space-y-6">
            {/* 테스트 버튼 */}
            <div className="flex gap-4">
              <button
                onClick={testConnection}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isLoading ? '테스트 중...' : '🚀 연결 테스트 시작'}
              </button>
            </div>
            
            {/* 로그 출력 */}
            {logs.length > 0 && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            )}
            
            {/* SQL 스크립트 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📋 테이블 생성 SQL (Supabase 대시보드에서 실행)
              </h2>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{createTableSQL}</pre>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📝 실행 방법:</h3>
                <ol className="list-decimal list-inside text-blue-800 space-y-1">
                  <li>Supabase 대시보드 → SQL Editor로 이동</li>
                  <li>위의 SQL 스크립트를 복사하여 붙여넣기</li>
                  <li>"Run" 버튼 클릭하여 실행</li>
                  <li>이 페이지에서 "연결 테스트 시작" 버튼 클릭</li>
                </ol>
              </div>
            </div>
            
            {/* 연결 정보 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">🔗 연결 정보:</h3>
              <div className="text-yellow-800 space-y-1">
                <div><strong>URL:</strong> {supabaseUrl}</div>
                <div><strong>프로젝트:</strong> vnswjnltnhpsueosfhmw</div>
                <div><strong>리전:</strong> ap-southeast-1 (싱가포르)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
