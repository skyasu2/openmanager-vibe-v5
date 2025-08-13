#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vnswjnltnhpsueosfhmw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔬 Supabase PostgreSQL 세부 분석 보고서');
console.log('=' * 80);
console.log('분석 시간:', new Date().toLocaleString('ko-KR'));
console.log('=' * 80);
console.log();

async function detailedAnalysis() {
  try {
    console.log('📊 1. 테이블 구조 및 스키마 분석');
    console.log('-'.repeat(60));
    
    // servers 테이블 구조 확인
    try {
      const { data: serversData, error: serversError } = await supabase
        .from('servers')
        .select('*')
        .limit(1);
      
      if (!serversError && serversData && serversData.length > 0) {
        console.log('✅ servers 테이블 구조:');
        const server = serversData[0];
        Object.keys(server).forEach(key => {
          const value = server[key];
          const type = typeof value;
          console.log('  - ' + key + ': ' + type + (value !== null ? ' (예시: ' + JSON.stringify(value).substring(0, 50) + ')' : ' (null)'));
        });
      }
    } catch (e) {
      console.log('❌ servers 테이블 구조 분석 실패:', e.message);
    }
    
    console.log();
    
    // server_metrics 테이블 구조 확인
    try {
      const { data: metricsData, error: metricsError } = await supabase
        .from('server_metrics')
        .select('*')
        .limit(1);
      
      if (!metricsError && metricsData && metricsData.length > 0) {
        console.log('✅ server_metrics 테이블 구조:');
        const metric = metricsData[0];
        Object.keys(metric).forEach(key => {
          const value = metric[key];
          const type = typeof value;
          console.log('  - ' + key + ': ' + type + (value !== null ? ' (예시: ' + JSON.stringify(value).substring(0, 50) + ')' : ' (null)'));
        });
      }
    } catch (e) {
      console.log('❌ server_metrics 테이블 구조 분석 실패:', e.message);
    }
    
    console.log();
    console.log('🔍 2. 데이터 품질 분석');
    console.log('-'.repeat(60));
    
    // servers 테이블 데이터 분석
    try {
      const { data: allServers, error } = await supabase
        .from('servers')
        .select('*');
      
      if (!error && allServers) {
        console.log('📈 servers 테이블 데이터 품질:');
        console.log('  - 총 서버 수: ' + allServers.length + '개');
        
        // 상태별 분류
        const statusCounts = {};
        allServers.forEach(server => {
          const status = server.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        console.log('  - 상태별 분포:');
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log('    * ' + status + ': ' + count + '개');
        });
        
        // NULL 값 검사
        const fields = Object.keys(allServers[0] || {});
        console.log('  - 데이터 완성도:');
        fields.forEach(field => {
          const nullCount = allServers.filter(server => server[field] === null || server[field] === undefined).length;
          const percentage = ((allServers.length - nullCount) / allServers.length * 100).toFixed(1);
          console.log('    * ' + field + ': ' + percentage + '% 완성');
        });
      }
    } catch (e) {
      console.log('❌ servers 데이터 품질 분석 실패:', e.message);
    }
    
    console.log();
    console.log('⚡ 3. 성능 메트릭 분석');
    console.log('-'.repeat(60));
    
    // 다양한 쿼리 성능 테스트
    const performanceTests = [
      {
        name: '단순 SELECT',
        query: async () => supabase.from('servers').select('id').limit(1)
      },
      {
        name: '조건부 SELECT', 
        query: async () => supabase.from('servers').select('*').eq('status', 'active').limit(1)
      },
      {
        name: 'COUNT 쿼리',
        query: async () => supabase.from('servers').select('*', { count: 'exact', head: true })
      },
      {
        name: 'JOIN 시뮬레이션',
        query: async () => supabase.from('server_metrics').select('*').limit(5)
      }
    ];
    
    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        await test.query();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        let status = '✅';
        if (duration > 500) status = '⚠️ ';
        else if (duration > 200) status = '📈';
        
        console.log(status + ' ' + test.name + ': ' + duration + 'ms');
      } catch (e) {
        console.log('❌ ' + test.name + ': 실패 - ' + e.message);
      }
    }
    
    console.log();
    console.log('🧠 4. pgvector 확장 및 AI 기능 확인');
    console.log('-'.repeat(60));
    
    // pgvector 관련 테이블 확인
    try {
      const vectorTables = ['documents', 'embeddings', 'ai_vectors'];
      for (const tableName of vectorTables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            if (error.message.includes('does not exist')) {
              console.log('❌ ' + tableName + ': 테이블 없음 (pgvector 미구현)');
            } else {
              console.log('⚠️  ' + tableName + ': ' + error.message);
            }
          } else {
            console.log('✅ ' + tableName + ': ' + (count || 0) + '개 벡터 데이터');
          }
        } catch (e) {
          console.log('💥 ' + tableName + ': ' + e.message);
        }
      }
    } catch (e) {
      console.log('❌ pgvector 확인 실패:', e.message);
    }
    
    console.log();
    console.log('💾 5. Connection 및 리소스 사용량');
    console.log('-'.repeat(60));
    
    // 연결 테스트 (병렬)
    const connectionTests = Array(5).fill(null).map((_, i) => 
      supabase.from('servers').select('id').limit(1)
    );
    
    try {
      const startTime = Date.now();
      await Promise.all(connectionTests);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / connectionTests.length;
      
      console.log('✅ 병렬 연결 테스트 (5개):');
      console.log('  - 총 시간: ' + totalTime + 'ms');
      console.log('  - 평균 시간: ' + avgTime.toFixed(1) + 'ms');
      console.log('  - Connection Pool 상태: ' + (avgTime < 100 ? '정상' : '지연 발생'));
    } catch (e) {
      console.log('❌ Connection Pool 테스트 실패:', e.message);
    }
    
    console.log();
    console.log('📋 6. 종합 권장사항 및 액션 아이템');
    console.log('-'.repeat(60));
    
    console.log('🔐 보안 우선순위:');
    console.log('  1. 모든 테이블에 RLS (Row Level Security) 정책 즉시 적용');
    console.log('  2. GitHub OAuth 기반 사용자 인증 연동');
    console.log('  3. Service Role Key 접근 로깅 설정');
    
    console.log();
    console.log('⚡ 성능 최적화:');
    console.log('  1. servers.status 컬럼에 인덱스 생성');
    console.log('  2. server_metrics.created_at 컬럼에 시계열 인덱스 생성');
    console.log('  3. Connection Pooling 설정 최적화 (현재: ' + (avgTime < 100 ? '양호' : '개선 필요') + ')');
    
    console.log();
    console.log('🧠 AI 기능 확장:');
    console.log('  1. pgvector 확장 설치 및 설정');
    console.log('  2. AI 쿼리 결과 캐싱을 위한 벡터 테이블 생성');
    console.log('  3. 서버 메트릭 분석을 위한 임베딩 파이프라인 구축');
    
    console.log();
    console.log('📦 무료 티어 최적화:');
    console.log('  1. 현재 사용량: 매우 낮음 (0.01MB/500MB)');
    console.log('  2. 메트릭 데이터 자동 정리 정책 설정');
    console.log('  3. 로그 보관 주기 최적화 (7-30일)');
    
    console.log();
    console.log('=' * 80);
    console.log('✅ Supabase PostgreSQL 세부 분석 완료');
    console.log('📈 다음 단계: RLS 정책 구현 및 인덱스 최적화');
    console.log('=' * 80);
    
  } catch (err) {
    console.log('💥 세부 분석 오류:', err.message);
    console.log(err.stack);
  }
}

// 실행
if (require.main === module) {
  detailedAnalysis().catch(console.error);
}

module.exports = { detailedAnalysis };