#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Supabase PostgreSQL 최적화 실행');
console.log('=' * 80);
console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
console.log('=' * 80);
console.log();

async function executeOptimization() {
  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'optimize-supabase-security.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // SQL을 세미콜론으로 분할 (주석 제거)
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.match(/^\/\*[\s\S]*?\*\/$/)) // 블록 주석 제거
      .filter(stmt => stmt !== '');
    
    console.log('📋 실행할 SQL 구문 수:', sqlStatements.length);
    console.log();
    
    let successCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    
    console.log('🔄 SQL 구문 실행 시작...');
    console.log('-'.repeat(60));
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      // 실행할 구문의 타입 파악
      let statementType = 'UNKNOWN';
      if (statement.toUpperCase().includes('ALTER TABLE') && statement.toUpperCase().includes('ENABLE ROW LEVEL SECURITY')) {
        statementType = 'RLS 활성화';
      } else if (statement.toUpperCase().includes('CREATE POLICY')) {
        statementType = 'RLS 정책 생성';
      } else if (statement.toUpperCase().includes('CREATE INDEX')) {
        statementType = '인덱스 생성';
      } else if (statement.toUpperCase().includes('CREATE EXTENSION')) {
        statementType = '확장 설치';
      } else if (statement.toUpperCase().includes('CREATE TABLE')) {
        statementType = '테이블 생성';
      } else if (statement.toUpperCase().includes('CREATE OR REPLACE FUNCTION')) {
        statementType = '함수 생성';
      } else if (statement.toUpperCase().includes('ALTER PUBLICATION')) {
        statementType = 'Realtime 설정';
      } else if (statement.toUpperCase().includes('ANALYZE')) {
        statementType = '통계 업데이트';
      } else if (statement.toUpperCase().includes('VACUUM')) {
        statementType = '테이블 정리';
      }
      
      try {
        // 각 구문을 개별 실행
        const { data, error } = await supabase.rpc('sql', {
          query: statement
        });
        
        if (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('already enabled') ||
              error.message.includes('duplicate key')) {
            console.log('⚠️  ' + (i + 1).toString().padStart(3, ' ') + '. ' + statementType + ': 이미 존재함 (스킵)');
            warningCount++;
          } else {
            console.log('❌ ' + (i + 1).toString().padStart(3, ' ') + '. ' + statementType + ': ' + error.message.substring(0, 100));
            errorCount++;
          }
        } else {
          console.log('✅ ' + (i + 1).toString().padStart(3, ' ') + '. ' + statementType + ': 성공');
          successCount++;
        }
      } catch (e) {
        console.log('💥 ' + (i + 1).toString().padStart(3, ' ') + '. ' + statementType + ': ' + e.message.substring(0, 100));
        errorCount++;
      }
      
      // API 호출 제한을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log();
    console.log('📊 실행 결과 요약');
    console.log('-'.repeat(60));
    console.log('✅ 성공: ' + successCount + '개');
    console.log('⚠️  경고(스킵): ' + warningCount + '개');
    console.log('❌ 실패: ' + errorCount + '개');
    console.log('📋 총 구문: ' + sqlStatements.length + '개');
    
    const successRate = ((successCount + warningCount) / sqlStatements.length * 100).toFixed(1);
    console.log('📈 성공률: ' + successRate + '%');
    
    console.log();
    console.log('🔍 최적화 후 상태 확인');
    console.log('-'.repeat(60));
    
    // RLS 정책 확인
    try {
      const { data: rlsCheck, error: rlsError } = await supabase.rpc('sql', {
        query: `
          SELECT 
            tablename, 
            rowsecurity,
            (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
          FROM pg_tables t
          WHERE schemaname = 'public' 
          AND tablename IN ('servers', 'server_metrics', 'users', 'alerts', 'system_events', 'ai_queries', 'performance_logs')
          ORDER BY tablename;
        `
      });
      
      if (!rlsError && rlsCheck) {
        console.log('🛡️  RLS 정책 상태:');
        rlsCheck.forEach(table => {
          const status = table.rowsecurity ? '✅ 활성화' : '❌ 비활성화';
          const policyCount = table.policy_count || 0;
          console.log('  - ' + table.tablename + ': ' + status + ' (' + policyCount + '개 정책)');
        });
      }
    } catch (e) {
      console.log('❌ RLS 상태 확인 실패:', e.message);
    }
    
    console.log();
    
    // 인덱스 확인
    try {
      const { data: indexCheck, error: indexError } = await supabase.rpc('sql', {
        query: `
          SELECT 
            tablename,
            count(*) as index_count
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename IN ('servers', 'server_metrics', 'users', 'alerts')
          GROUP BY tablename
          ORDER BY tablename;
        `
      });
      
      if (!indexError && indexCheck) {
        console.log('⚡ 인덱스 상태:');
        indexCheck.forEach(table => {
          console.log('  - ' + table.tablename + ': ' + table.index_count + '개 인덱스');
        });
      }
    } catch (e) {
      console.log('❌ 인덱스 확인 실패:', e.message);
    }
    
    console.log();
    
    // pgvector 확장 확인
    try {
      const { data: vectorCheck, error: vectorError } = await supabase.rpc('sql', {
        query: "SELECT name, installed_version FROM pg_available_extensions WHERE name = 'vector';"
      });
      
      if (!vectorError && vectorCheck && vectorCheck.length > 0) {
        const vector = vectorCheck[0];
        console.log('🧠 pgvector 확장: ' + (vector.installed_version ? '✅ 설치됨 (v' + vector.installed_version + ')' : '❌ 미설치'));
      } else {
        console.log('🧠 pgvector 확장: ❓ 확인 불가');
      }
    } catch (e) {
      console.log('❌ pgvector 확인 실패:', e.message);
    }
    
    console.log();
    console.log('🎯 최적화 완료 권장사항');
    console.log('-'.repeat(60));
    
    if (successRate >= 90) {
      console.log('🎉 최적화가 성공적으로 완료되었습니다!');
      console.log('📋 다음 단계:');
      console.log('  1. 애플리케이션에서 RLS 정책 테스트');
      console.log('  2. 쿼리 성능 모니터링 시작'); 
      console.log('  3. 정기적인 데이터 정리 스케줄 설정');
    } else if (successRate >= 70) {
      console.log('📈 대부분의 최적화가 완료되었습니다.');
      console.log('⚠️  일부 실패한 항목들을 수동으로 검토해주세요.');
    } else {
      console.log('⚠️  최적화 중 많은 오류가 발생했습니다.');
      console.log('🔧 데이터베이스 권한 및 연결 상태를 확인해주세요.');
    }
    
    console.log();
    console.log('=' * 80);
    console.log('✅ Supabase PostgreSQL 최적화 실행 완료');
    console.log('완료 시간:', new Date().toLocaleString('ko-KR'));
    console.log('=' * 80);
    
  } catch (err) {
    console.log('💥 최적화 실행 오류:', err.message);
    console.log(err.stack);
  }
}

// 실행
if (require.main === module) {
  executeOptimization().catch(console.error);
}

module.exports = { executeOptimization };