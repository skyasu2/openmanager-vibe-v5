const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vnswjnltnhpsueosfhmw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8'
);

async function executeMigration() {
  console.log('🚀 server_metrics 테이블 생성 마이그레이션 실행...\n');
  
  try {
    // 마이그레이션 파일 읽기
    const migrationPath = './supabase/migrations/20250805_create_server_metrics.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📂 마이그레이션 파일 로드 완료');
    console.log(`📏 SQL 크기: ${migrationSQL.length} 문자`);
    
    // SQL을 여러 명령으로 분할 (DO 블록과 함수 정의를 고려)
    const sqlCommands = splitSQLCommands(migrationSQL);
    console.log(`🔧 총 ${sqlCommands.length}개의 SQL 명령 감지`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 각 명령을 순차적으로 실행
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i].trim();
      if (!command || command.startsWith('--') || command.startsWith('/*')) {
        continue; // 빈 줄이나 주석 건너뛰기
      }
      
      console.log(`\n📝 명령 ${i + 1}/${sqlCommands.length} 실행 중...`);
      console.log(`   명령 미리보기: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_command: command 
        });
        
        if (error) {
          // RPC 함수가 없다면 직접 실행 시도
          if (error.code === '42883') {
            console.log('   ⚠️  exec_sql RPC 함수가 없습니다. 대안 방법 시도...');
            await executeCommandDirectly(command);
            successCount++;
            console.log('   ✅ 성공');
          } else {
            throw error;
          }
        } else {
          successCount++;
          console.log('   ✅ 성공');
        }
        
        // API 제한 방지를 위한 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.log(`   ❌ 실패: ${error.message}`);
        
        // 중요하지 않은 에러는 계속 진행
        if (isIgnorableError(error)) {
          console.log('   ⚠️  무시 가능한 에러입니다. 계속 진행...');
        } else {
          console.log('   🚨 중요한 에러입니다. 확인이 필요합니다.');
        }
      }
    }
    
    console.log('\n📋 마이그레이션 실행 결과:');
    console.log(`✅ 성공: ${successCount}개 명령`);
    console.log(`❌ 실패: ${errorCount}개 명령`);
    
    // 테이블 생성 확인
    await verifyTableCreation();
    
  } catch (error) {
    console.error('💥 마이그레이션 실행 중 치명적 에러:', error);
  }
}

function splitSQLCommands(sql) {
  // SQL을 명령별로 분할 (세미콜론 기준, 단 함수 정의 내부는 제외)
  const commands = [];
  let currentCommand = '';
  let inFunction = false;
  let dollarQuoteCount = 0;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 주석이나 빈 줄 건너뛰기
    if (!trimmedLine || trimmedLine.startsWith('--')) {
      continue;
    }
    
    // Dollar-quoted 함수 시작/끝 감지
    if (trimmedLine.includes('$$')) {
      dollarQuoteCount += (trimmedLine.match(/\$\$/g) || []).length;
      inFunction = dollarQuoteCount % 2 !== 0;
    }
    
    currentCommand += line + '\n';
    
    // 명령 끝 감지 (세미콜론이 있고 함수 내부가 아닐 때)
    if (trimmedLine.endsWith(';') && !inFunction) {
      commands.push(currentCommand.trim());
      currentCommand = '';
    }
  }
  
  // 마지막 명령이 있다면 추가
  if (currentCommand.trim()) {
    commands.push(currentCommand.trim());
  }
  
  return commands;
}

async function executeCommandDirectly(command) {
  // 직접 SQL 실행을 위한 대안 방법들
  
  if (command.toUpperCase().startsWith('CREATE TABLE')) {
    // 테이블 생성
    const match = command.match(/CREATE TABLE[^(]+\(([^;]+)\);/is);
    if (match) {
      // Supabase 클라이언트로는 DDL 실행이 제한적이므로 RPC 필요
      throw new Error('DDL 명령은 RPC 함수가 필요합니다.');
    }
  } else if (command.toUpperCase().startsWith('INSERT INTO')) {
    // 데이터 삽입은 Supabase 클라이언트로 가능할 수 있음
    console.log('   📝 INSERT 명령 감지 - 대안 실행 시도 중...');
    // 복잡한 INSERT 파싱은 생략하고 RPC 필요하다고 표시
    throw new Error('복잡한 INSERT 명령은 RPC 함수가 필요합니다.');
  }
  
  throw new Error('이 명령은 직접 실행할 수 없습니다.');
}

function isIgnorableError(error) {
  const ignorableMessages = [
    'already exists',
    'relation already exists',
    'index already exists',
    'function already exists',
    'policy already exists'
  ];
  
  return ignorableMessages.some(msg => 
    error.message.toLowerCase().includes(msg)
  );
}

async function verifyTableCreation() {
  console.log('\n🔍 테이블 생성 확인...');
  
  try {
    const { count, error } = await supabase
      .from('server_metrics')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ server_metrics 테이블이 아직 생성되지 않았습니다.');
        console.log('   수동으로 Supabase Dashboard에서 마이그레이션을 실행해야 할 수 있습니다.');
      } else {
        console.log('⚠️  테이블 확인 중 에러:', error);
      }
    } else {
      console.log(`✅ server_metrics 테이블 생성 성공! (현재 ${count}개 레코드)`);
      
      // 샘플 데이터 조회
      const { data: sampleData, error: sampleError } = await supabase
        .from('server_metrics')
        .select('server_id, cpu, memory, disk, created_at')
        .limit(3);
      
      if (!sampleError && sampleData) {
        console.log('\n📊 샘플 데이터:');
        sampleData.forEach((record, index) => {
          console.log(`  ${index + 1}. Server: ${record.server_id}, CPU: ${record.cpu}%, Memory: ${record.memory}%, Disk: ${record.disk}%`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 테이블 확인 중 에러:', error);
  }
}

// 실행
executeMigration().then(() => {
  console.log('\n✅ 마이그레이션 실행 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 중 치명적 에러:', error);
  process.exit(1);
});