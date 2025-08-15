#!/usr/bin/env node

/**
 * Supabase PostgreSQL 스키마 전체 분석 도구
 * Database Administrator 전담 - 테이블, 인덱스, RLS 정책, 함수 등 종합 분석
 *
 * ✅ 리팩토링: 중복 코드 제거 - 통합 팩토리 사용
 */

// 통합 팩토리 사용 (중복 제거)
const { getScriptSupabase } = require('./src/lib/supabase-factory');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

// 팩토리를 통한 클라이언트 생성 (중복 환경변수 검증 제거)
const supabase = getScriptSupabase();

console.log('🚀 Supabase PostgreSQL 데이터베이스 스키마 종합 분석');
console.log('=' * 80);
console.log('분석 시간:', new Date().toLocaleString('ko-KR'));
console.log('프로젝트: OpenManager VIBE v5');
console.log('=' * 80);

async function executeQuery(query, description = '') {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.rpc('execute_sql', { query });
    const executeTime = Date.now() - startTime;

    if (error) {
      // RPC 함수가 없는 경우 직접 쿼리 실행 시도
      const { data: directData, error: directError } = await supabase
        .from('pg_tables')
        .select('*');

      if (directError) {
        console.error(`❌ ${description} 실패:`, directError.message);
        return null;
      }
      return directData;
    }

    console.log(`⚡ ${description} 실행 시간: ${executeTime}ms`);
    return data;
  } catch (error) {
    console.error(`❌ ${description} 오류:`, error.message);
    return null;
  }
}

async function analyzeSchemaOverview() {
  console.log('\n📊 1. 스키마 개요');
  console.log('-' * 60);

  try {
    // 테이블 수 확인
    const tableCount = await executeQuery(
      `
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `,
      '테이블 수 조회'
    );

    if (tableCount && tableCount.length > 0) {
      console.log(`📋 총 테이블 수: ${tableCount[0].table_count}개`);
    }

    // 테이블 목록
    const tables = await executeQuery(
      `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `,
      '테이블 목록 조회'
    );

    if (tables && tables.length > 0) {
      console.log('\n📋 테이블 목록:');
      tables.forEach((table) => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    }
  } catch (error) {
    console.error('❌ 스키마 개요 분석 실패:', error.message);
  }
}

async function analyzeTableDetails() {
  console.log('\n📊 2. 테이블 상세 정보');
  console.log('-' * 60);

  try {
    // 각 테이블의 컬럼 정보
    const columnInfo = await executeQuery(
      `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `,
      '컬럼 정보 조회'
    );

    if (columnInfo && columnInfo.length > 0) {
      // 테이블별로 그룹화
      const tableColumns = columnInfo.reduce((acc, col) => {
        if (!acc[col.table_name]) {
          acc[col.table_name] = [];
        }
        acc[col.table_name].push(col);
        return acc;
      }, {});

      console.log('\n🏗️ 테이블별 컬럼 구조:');
      Object.entries(tableColumns).forEach(([tableName, columns]) => {
        console.log(`\n  📋 ${tableName}:`);
        columns.forEach((col) => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default
            ? ` DEFAULT ${col.column_default}`
            : '';
          console.log(
            `    - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`
          );
        });
      });
    }
  } catch (error) {
    console.error('❌ 테이블 상세 정보 분석 실패:', error.message);
  }
}

async function analyzeIndexes() {
  console.log('\n📊 3. 인덱스 분석');
  console.log('-' * 60);

  try {
    const indexes = await executeQuery(
      `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `,
      '인덱스 정보 조회'
    );

    if (indexes && indexes.length > 0) {
      console.log('\n🔍 생성된 인덱스:');
      indexes.forEach((idx) => {
        console.log(`\n  📋 테이블: ${idx.tablename}`);
        console.log(`  🏷️ 인덱스명: ${idx.indexname}`);
        console.log(`  📝 정의: ${idx.indexdef}`);
      });

      console.log(`\n📊 총 인덱스 수: ${indexes.length}개`);
    } else {
      console.log('⚠️ 사용자 정의 인덱스가 없습니다.');
    }
  } catch (error) {
    console.error('❌ 인덱스 분석 실패:', error.message);
  }
}

async function analyzeConstraints() {
  console.log('\n📊 4. 제약조건 분석');
  console.log('-' * 60);

  try {
    const constraints = await executeQuery(
      `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_type
    `,
      '제약조건 정보 조회'
    );

    if (constraints && constraints.length > 0) {
      console.log('\n🔒 제약조건:');

      const constraintTypes = constraints.reduce((acc, constraint) => {
        if (!acc[constraint.constraint_type]) {
          acc[constraint.constraint_type] = [];
        }
        acc[constraint.constraint_type].push(constraint);
        return acc;
      }, {});

      Object.entries(constraintTypes).forEach(([type, items]) => {
        console.log(`\n  🏷️ ${type}:`);
        items.forEach((item) => {
          console.log(
            `    - ${item.table_name}.${item.column_name} (${item.constraint_name})`
          );
        });
      });
    } else {
      console.log('⚠️ 제약조건 정보를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('❌ 제약조건 분석 실패:', error.message);
  }
}

async function analyzeRLSPolicies() {
  console.log('\n📊 5. RLS (Row Level Security) 정책 분석');
  console.log('-' * 60);

  try {
    // RLS 활성화된 테이블 확인
    const rlsTables = await executeQuery(
      `
      SELECT 
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `,
      'RLS 활성화 테이블 조회'
    );

    if (rlsTables && rlsTables.length > 0) {
      const rlsEnabled = rlsTables.filter((table) => table.rowsecurity);

      console.log(`\n🔐 RLS 활성화된 테이블: ${rlsEnabled.length}개`);
      rlsEnabled.forEach((table) => {
        console.log(`  - ${table.tablename}`);
      });

      const rlsDisabled = rlsTables.filter((table) => !table.rowsecurity);
      if (rlsDisabled.length > 0) {
        console.log(`\n⚠️ RLS 비활성화된 테이블: ${rlsDisabled.length}개`);
        rlsDisabled.forEach((table) => {
          console.log(`  - ${table.tablename}`);
        });
      }
    } else {
      console.log('⚠️ 테이블 정보를 확인할 수 없습니다.');
    }
  } catch (error) {
    console.error('❌ RLS 정책 분석 실패:', error.message);
  }
}

async function analyzeExtensions() {
  console.log('\n📊 6. PostgreSQL 확장 프로그램');
  console.log('-' * 60);

  try {
    const extensions = await executeQuery(
      `
      SELECT 
        extname,
        extversion
      FROM pg_extension
      ORDER BY extname
    `,
      '설치된 확장 프로그램 조회'
    );

    if (extensions && extensions.length > 0) {
      console.log('\n🔌 설치된 확장 프로그램:');
      extensions.forEach((ext) => {
        console.log(`  - ${ext.extname} (버전: ${ext.extversion})`);
      });

      // 중요한 확장 프로그램 체크
      const importantExts = ['uuid-ossp', 'pgcrypto', 'vector', 'postgis'];
      const installedExts = extensions.map((ext) => ext.extname);

      console.log('\n🎯 주요 확장 프로그램 상태:');
      importantExts.forEach((extName) => {
        const isInstalled = installedExts.includes(extName);
        const status = isInstalled ? '✅ 설치됨' : '❌ 미설치';
        console.log(`  - ${extName}: ${status}`);
      });
    } else {
      console.log('⚠️ 확장 프로그램 정보를 확인할 수 없습니다.');
    }
  } catch (error) {
    console.error('❌ 확장 프로그램 분석 실패:', error.message);
  }
}

async function analyzeDataSizes() {
  console.log('\n📊 7. 데이터 크기 분석');
  console.log('-' * 60);

  try {
    // 각 테이블의 데이터 크기 (레코드 수 기반 추정)
    const tableQueries = [
      'servers',
      'server_metrics',
      'users',
      'alerts',
      'system_events',
      'ai_queries',
      'performance_logs',
      'notifications',
      'audit_logs',
    ];

    let totalRecords = 0;
    const tableStats = [];

    for (const tableName of tableQueries) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
          totalRecords += count;
          tableStats.push({ table: tableName, records: count });
        }
      } catch (err) {
        // 테이블이 없는 경우 무시
      }
    }

    if (tableStats.length > 0) {
      console.log('\n📈 테이블별 레코드 수:');
      tableStats
        .sort((a, b) => b.records - a.records)
        .forEach((stat) => {
          const sizeKB = (stat.records * 0.5).toFixed(1);
          console.log(
            `  - ${stat.table}: ${stat.records}개 레코드 (~${sizeKB}KB)`
          );
        });

      const totalSizeKB = (totalRecords * 0.5).toFixed(1);
      const totalSizeMB = (totalSizeKB / 1024).toFixed(2);
      const usagePercent = ((totalSizeMB / 500) * 100).toFixed(3);

      console.log(`\n📊 전체 요약:`);
      console.log(`  - 총 레코드 수: ${totalRecords}개`);
      console.log(`  - 추정 데이터 크기: ${totalSizeKB}KB (${totalSizeMB}MB)`);
      console.log(`  - 무료 티어 사용률: ${usagePercent}% (500MB 대비)`);
    }
  } catch (error) {
    console.error('❌ 데이터 크기 분석 실패:', error.message);
  }
}

async function generateRecommendations() {
  console.log('\n🎯 8. Database Administrator 권장사항');
  console.log('-' * 60);

  console.log('\n🔐 보안 관련:');
  console.log(
    '  1. RLS (Row Level Security) 정책을 모든 테이블에 활성화하세요'
  );
  console.log('  2. 민감한 데이터는 pgcrypto 확장을 사용하여 암호화하세요');
  console.log('  3. 정기적으로 감사 로그를 확인하세요');

  console.log('\n⚡ 성능 관련:');
  console.log('  1. 자주 검색되는 컬럼에 인덱스를 추가하세요');
  console.log('  2. VACUUM ANALYZE를 정기적으로 실행하세요');
  console.log('  3. 쿼리 성능을 EXPLAIN ANALYZE로 분석하세요');

  console.log('\n📊 모니터링 관련:');
  console.log(
    '  1. pg_stat_statements 확장을 활성화하여 쿼리 통계를 수집하세요'
  );
  console.log('  2. 연결 수와 활성 쿼리를 모니터링하세요');
  console.log('  3. 데이터베이스 크기를 주기적으로 확인하세요');

  console.log('\n🔧 최적화 관련:');
  console.log('  1. 사용하지 않는 인덱스는 제거하세요');
  console.log('  2. 큰 테이블은 파티셔닝을 고려하세요');
  console.log('  3. Connection pooling을 활용하세요');
}

async function main() {
  try {
    await analyzeSchemaOverview();
    await analyzeTableDetails();
    await analyzeIndexes();
    await analyzeConstraints();
    await analyzeRLSPolicies();
    await analyzeExtensions();
    await analyzeDataSizes();
    await generateRecommendations();

    console.log('\n✅ Supabase PostgreSQL 스키마 분석 완료!');
    console.log('=' * 80);
  } catch (error) {
    console.error('❌ 스키마 분석 중 오류:', error);
    process.exit(1);
  }
}

main();
