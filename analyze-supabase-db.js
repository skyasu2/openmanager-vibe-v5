#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU';

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Supabase PostgreSQL 데이터베이스 종합 분석 보고서');
console.log('=' * 80);
console.log('분석 시간:', new Date().toLocaleString('ko-KR'));
console.log('프로젝트: OpenManager VIBE v5');
console.log('=' * 80);
console.log();

async function analyzeDatabase() {
  try {
    console.log('📋 1. 테이블 존재 및 레코드 수 확인');
    console.log('-'.repeat(60));
    
    const knownTables = [
      'servers',
      'server_metrics', 
      'users',
      'alerts',
      'system_events',
      'ai_queries',
      'performance_logs'
    ];
    
    let totalRecords = 0;
    const existingTables = [];
    
    for (const tableName of knownTables) {
      try {
        const { data, error, count } = await supabaseService
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log('❌ ' + tableName + ': 테이블이 존재하지 않음');
          } else {
            console.log('⚠️  ' + tableName + ': ' + error.message);
          }
        } else {
          const recordCount = count || 0;
          totalRecords += recordCount;
          existingTables.push({ name: tableName, count: recordCount });
          console.log('✅ ' + tableName + ': ' + recordCount + '개 레코드');
        }
      } catch (e) {
        console.log('💥 ' + tableName + ': ' + e.message);
      }
      
      // 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log();
    console.log('📊 2. 데이터베이스 사용량 분석');
    console.log('-'.repeat(60));
    console.log('발견된 테이블 수: ' + existingTables.length + '개');
    console.log('총 레코드 수: ' + totalRecords.toLocaleString() + '개');
    
    // 예상 용량 계산 (평균 레코드 크기 추정)
    const estimatedSize = totalRecords * 0.5; // KB 단위 (평균 500바이트/레코드)
    const sizeInMB = estimatedSize / 1024;
    const freetierUsage = (sizeInMB / 500) * 100; // 500MB 대비 사용률
    
    console.log('추정 데이터 크기: ' + estimatedSize.toFixed(1) + 'KB (' + sizeInMB.toFixed(2) + 'MB)');
    console.log('무료 티어 사용률: ' + freetierUsage.toFixed(2) + '% (500MB 대비)');
    
    if (freetierUsage > 80) {
      console.log('⚠️  주의: 무료 티어 한계 근접');
    } else if (freetierUsage > 50) {
      console.log('📈 사용량 증가 추세 모니터링 필요');
    } else {
      console.log('✅ 무료 티어 여유 공간 충분');
    }
    
    console.log();
    console.log('🔐 3. RLS (Row Level Security) 정책 확인');
    console.log('-'.repeat(60));
    
    for (const table of existingTables) {
      try {
        const { data: anonData, error: anonError } = await supabaseAnon
          .from(table.name)
          .select('*', { head: true });
          
        if (anonError) {
          if (anonError.message.includes('RLS') || anonError.message.includes('policy')) {
            console.log('🛡️  ' + table.name + ': RLS 정책 활성화됨 (보안 정책 적용)');
          } else {
            console.log('⚠️  ' + table.name + ': ' + anonError.message);
          }
        } else {
          console.log('🔓 ' + table.name + ': RLS 미설정 (공개 접근 가능) - 보안 검토 필요');
        }
      } catch (e) {
        console.log('💥 ' + table.name + ' RLS 확인 오류: ' + e.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log();
    console.log('🚀 4. 성능 분석');
    console.log('-'.repeat(60));
    
    // 응답 시간 측정
    const startTime = Date.now();
    try {
      const { data, error } = await supabaseService
        .from('servers')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      console.log('기본 쿼리 응답 시간: ' + responseTime + 'ms');
      
      if (responseTime < 100) {
        console.log('✅ 우수한 응답 속도');
      } else if (responseTime < 300) {
        console.log('📈 양호한 응답 속도');
      } else {
        console.log('⚠️  느린 응답 속도 - 최적화 필요');
      }
    } catch (e) {
      console.log('💥 성능 테스트 실패: ' + e.message);
    }
    
    console.log();
    console.log('🎯 5. 최적화 권장사항');
    console.log('-'.repeat(60));
    
    if (freetierUsage > 50) {
      console.log('📦 스토리지 최적화:');
      console.log('  - 오래된 메트릭 데이터 정리');
      console.log('  - 로그 데이터 보관 주기 설정');
      console.log('  - 인덱스 최적화로 성능 향상');
    }
    
    console.log('🔐 보안 강화:');
    existingTables.forEach(table => {
      console.log('  - ' + table.name + ' 테이블에 RLS 정책 적용 검토');
    });
    
    console.log('⚡ 성능 최적화:');
    console.log('  - 자주 사용하는 쿼리에 인덱스 추가');
    console.log('  - pgvector 확장 활용 검토');
    console.log('  - Connection Pooling 최적화');
    
    console.log();
    console.log('=' * 80);
    console.log('✅ Supabase PostgreSQL 데이터베이스 분석 완료');
    console.log('=' * 80);
    
  } catch (err) {
    console.log('💥 전체 분석 오류: ' + err.message);
    console.log(err.stack);
  }
}

// 실행
if (require.main === module) {
  analyzeDatabase().catch(console.error);
}

module.exports = { analyzeDatabase };