const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function checkAllTables() {
  console.log('🔍 Supabase 데이터베이스 전체 테이블 검사...\n');
  
  // 가능한 테이블명들 (일반적인 패턴)
  const possibleTables = [
    // 서버 관련
    'server_metrics',
    'servers',
    'server_status',
    'system_metrics',
    'monitoring_data',
    'metrics',
    
    // 사용자 관련
    'users',
    'profiles',
    'user_profiles',
    
    // 인증 관련 (auth 스키마)
    'auth.users',
    'auth.sessions',
    
    // 일반적인 테이블들
    'todos',
    'tasks',
    'logs',
    'events',
    'notifications',
    
    // Supabase 기본 테이블들
    'buckets',
    'objects'
  ];
  
  const existingTables = [];
  const nonExistingTables = [];
  
  console.log('📊 테이블 존재 여부 확인 중...');
  
  for (const tableName of possibleTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        existingTables.push({ 
          name: tableName, 
          count: count || 0,
          status: '✅ 존재'
        });
        console.log(`  ✅ ${tableName}: ${count || 0}개 레코드`);
      } else if (error.code === '42P01') {
        nonExistingTables.push(tableName);
        console.log(`  ❌ ${tableName}: 존재하지 않음`);
      } else {
        console.log(`  ⚠️  ${tableName}: 권한 또는 기타 오류 (${error.code})`);
      }
    } catch (e) {
      nonExistingTables.push(tableName);
      console.log(`  ❌ ${tableName}: 접근 불가`);
    }
    
    // API 호출 제한을 위한 짧은 지연
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📋 검사 결과 요약:');
  console.log(`✅ 존재하는 테이블: ${existingTables.length}개`);
  console.log(`❌ 존재하지 않는 테이블: ${nonExistingTables.length}개`);
  
  if (existingTables.length > 0) {
    console.log('\n🗂️  존재하는 테이블 상세:');
    existingTables.forEach(table => {
      console.log(`  - ${table.name}: ${table.count}개 레코드`);
    });
  }
  
  // server_metrics가 없다면 대안 확인
  const hasServerMetrics = existingTables.some(t => t.name === 'server_metrics');
  if (!hasServerMetrics) {
    console.log('\n🚨 server_metrics 테이블이 없습니다!');
    console.log('   해결 방법:');
    console.log('   1. 데이터베이스 마이그레이션 실행');
    console.log('   2. 테이블 수동 생성');
    console.log('   3. 스키마 초기화');
    
    // 대안 테이블 제안
    const serverRelated = existingTables.filter(t => 
      t.name.includes('server') || 
      t.name.includes('metric') || 
      t.name.includes('monitor')
    );
    
    if (serverRelated.length > 0) {
      console.log('\n📊 서버 관련 대안 테이블:');
      serverRelated.forEach(table => {
        console.log(`  - ${table.name}: ${table.count}개 레코드`);
      });
    }
  }
  
  // 프로젝트에 마이그레이션 파일이 있는지 확인
  await checkMigrationFiles();
}

async function checkMigrationFiles() {
  console.log('\n🔍 마이그레이션 파일 확인...');
  
  const fs = require('fs');
  const path = require('path');
  
  const migrationPaths = [
    './supabase/migrations',
    './migrations',
    './database/migrations',
    './db/migrations'
  ];
  
  let foundMigrations = false;
  
  for (const migrationPath of migrationPaths) {
    try {
      if (fs.existsSync(migrationPath)) {
        const files = fs.readdirSync(migrationPath);
        if (files.length > 0) {
          console.log(`✅ 마이그레이션 파일 발견: ${migrationPath}`);
          console.log(`   파일 개수: ${files.length}개`);
          
          // server_metrics 관련 마이그레이션 찾기
          const serverMetricsMigrations = files.filter(file => 
            file.toLowerCase().includes('server') && 
            file.toLowerCase().includes('metric')
          );
          
          if (serverMetricsMigrations.length > 0) {
            console.log('   📊 server_metrics 관련 마이그레이션:');
            serverMetricsMigrations.forEach(file => {
              console.log(`     - ${file}`);
            });
          }
          
          foundMigrations = true;
        }
      }
    } catch (e) {
      // 디렉토리 접근 실패시 무시
    }
  }
  
  if (!foundMigrations) {
    console.log('❌ 마이그레이션 파일을 찾을 수 없습니다.');
    console.log('   supabase/migrations 디렉토리를 확인하세요.');
  }
}

// 실행
checkAllTables().then(() => {
  console.log('\n✅ 전체 테이블 검사 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 중 치명적 에러:', error);
  process.exit(1);
});