#!/usr/bin/env node

/**
 * Supabase 테이블 간단 분석 도구
 * Database Administrator 전담 - 실제 테이블에 직접 접근하여 정보 수집
 *
 * ✅ 리팩토링: 중복 코드 제거 - 통합 팩토리 사용
 */

// 통합 팩토리 사용 (중복 제거)
const { getScriptSupabase } = require('./src/lib/supabase-factory');

require('dotenv').config({ path: '.env.local' });

// 팩토리를 통한 클라이언트 생성 (중복 환경변수 검증 제거)
const supabase = getScriptSupabase();

console.log('🚀 Supabase 테이블 목록 및 기본 정보');
console.log('=' * 60);
console.log('분석 시간:', new Date().toLocaleString('ko-KR'));

// 알려진 테이블들 (OpenManager VIBE v5)
const knownTables = [
  'servers',
  'server_metrics',
  'users',
  'alerts',
  'system_events',
  'ai_queries',
  'performance_logs',
  'notifications',
  'audit_logs',
  'configurations',
  'dashboard_widgets',
  'user_preferences',
];

async function analyzeTable(tableName) {
  console.log(`\n📊 테이블: ${tableName}`);
  console.log('-'.repeat(40));

  try {
    // 1. 레코드 수 확인
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(
        `❌ 테이블이 존재하지 않거나 접근 불가: ${countError.message}`
      );
      return false;
    }

    console.log(`📈 레코드 수: ${count}개`);

    // 2. 첫 번째 레코드로 컬럼 구조 파악 (데이터가 있는 경우)
    if (count > 0) {
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
        .single();

      if (!sampleError && sampleData) {
        console.log('🏗️ 컬럼 구조 (첫 번째 레코드 기준):');

        Object.entries(sampleData).forEach(([key, value]) => {
          const type = typeof value;
          const sample =
            value !== null
              ? type === 'string' && value.length > 50
                ? `"${value.substring(0, 50)}..."`
                : JSON.stringify(value)
              : 'null';

          console.log(`  - ${key}: ${type} (예: ${sample})`);
        });
      }
    } else {
      // 3. 데이터가 없는 경우 스키마 정보를 다른 방법으로 시도
      console.log('📋 빈 테이블 - 스키마 정보를 확인합니다...');

      try {
        // 빈 쿼리로 컬럼 정보 확인 시도
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        if (!error) {
          console.log('✅ 테이블이 존재하지만 데이터가 없습니다');
        }
      } catch (err) {
        console.log(`⚠️ 스키마 정보 확인 불가: ${err.message}`);
      }
    }

    // 4. 최근 데이터 확인 (created_at, updated_at 등이 있는 경우)
    const timeColumns = [
      'created_at',
      'updated_at',
      'last_updated',
      'timestamp',
    ];

    for (const timeCol of timeColumns) {
      try {
        const { data: recentData, error: recentError } = await supabase
          .from(tableName)
          .select(`${timeCol}`)
          .order(timeCol, { ascending: false })
          .limit(1)
          .single();

        if (!recentError && recentData && recentData[timeCol]) {
          console.log(`⏰ 최근 ${timeCol}: ${recentData[timeCol]}`);
          break; // 하나라도 성공하면 중단
        }
      } catch (err) {
        // 해당 컬럼이 없으면 무시하고 계속
      }
    }

    return true;
  } catch (error) {
    console.log(`❌ 오류: ${error.message}`);
    return false;
  }
}

async function checkPostgresExtensions() {
  console.log('\n🔌 PostgreSQL 확장 프로그램 확인');
  console.log('-'.repeat(40));

  // 일반적인 확장 프로그램들 확인
  const extensions = ['uuid-ossp', 'pgcrypto', 'vector'];

  for (const ext of extensions) {
    try {
      // 실제로 사용해보는 방식으로 확인
      let testQuery;
      switch (ext) {
        case 'uuid-ossp':
          testQuery = 'SELECT uuid_generate_v4()';
          break;
        case 'pgcrypto':
          testQuery = 'SELECT gen_random_uuid()';
          break;
        case 'vector':
          // pgvector 테스트는 복잡하므로 스킵
          continue;
        default:
          continue;
      }

      const { error } = await supabase.rpc('execute_sql', { query: testQuery });

      if (!error) {
        console.log(`✅ ${ext}: 사용 가능`);
      } else {
        console.log(`❌ ${ext}: 사용 불가 (${error.message})`);
      }
    } catch (err) {
      console.log(`⚠️ ${ext}: 확인 불가`);
    }
  }
}

async function analyzeDatabaseInfo() {
  console.log('\n💾 데이터베이스 기본 정보');
  console.log('-'.repeat(40));

  try {
    // 연결 테스트
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('servers')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (!error) {
      console.log(`⚡ 연결 응답 시간: ${responseTime}ms`);
      console.log(`✅ 데이터베이스 연결 상태: 정상`);
    } else {
      console.log(`❌ 연결 테스트 실패: ${error.message}`);
    }
  } catch (err) {
    console.log(`❌ 데이터베이스 정보 확인 실패: ${err.message}`);
  }
}

async function main() {
  await analyzeDatabaseInfo();

  console.log('\n📋 테이블 분석 시작');
  console.log('=' * 60);

  let existingTables = 0;
  let totalRecords = 0;

  for (const tableName of knownTables) {
    const exists = await analyzeTable(tableName);
    if (exists) {
      existingTables++;

      // 레코드 수 계산
      try {
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        totalRecords += count || 0;
      } catch (err) {
        // 무시
      }
    }

    // 테이블 간 구분선
    console.log('');
  }

  await checkPostgresExtensions();

  console.log('\n📊 전체 요약');
  console.log('=' * 60);
  console.log(`🏠 발견된 테이블: ${existingTables}개`);
  console.log(`📈 총 레코드 수: ${totalRecords}개`);
  console.log(`💾 추정 데이터 크기: ${(totalRecords * 0.5).toFixed(1)}KB`);
  console.log(
    `🆓 무료 티어 사용률: ${(((totalRecords * 0.5) / (500 * 1024)) * 100).toFixed(3)}% (500MB 대비)`
  );

  console.log('\n🎯 Database Administrator 권장사항:');
  console.log('1. 🔐 RLS (Row Level Security) 정책 설정 검토');
  console.log('2. 📈 자주 사용하는 쿼리에 인덱스 추가');
  console.log('3. 🧹 정기적인 VACUUM ANALYZE 실행');
  console.log('4. 📊 pgvector 확장 활용 검토 (AI/ML 용도)');
  console.log('5. ⚡ Connection Pooling 최적화');

  console.log('\n✅ Supabase PostgreSQL 분석 완료!');
}

main().catch((err) => {
  console.error('❌ 분석 중 오류:', err);
  process.exit(1);
});
