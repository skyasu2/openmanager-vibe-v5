#!/usr/bin/env node

/**
 * MCP 서버 검증 스크립트
 * 모든 MCP 서버가 올바르게 설정되고 작동하는지 확인합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 프로젝트 루트 경로
const projectRoot = path.join(__dirname, '..');
const mcpConfigPath = path.join(projectRoot, '.claude', 'mcp.json');

// 색상 헬퍼 (간단한 대체)
const success = '✓';
const error = '✗';
const warning = '⚠';
const info = 'ℹ';

// MCP 설정 로드
function loadMcpConfig() {
  try {
    const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
    const config = JSON.parse(configContent);
    return config.mcpServers || {};
  } catch (err) {
    console.error(`${error} MCP 설정 파일을 읽을 수 없습니다:`, err.message);
    process.exit(1);
  }
}

// MCP 서버 테스트
async function testMcpServer(name, config) {
  return new Promise((resolve) => {
    console.log(`\n${info} ${name} 서버 테스트 중...`);
    
    // 타임아웃 설정 (5초)
    const timeout = setTimeout(() => {
      child.kill();
      resolve({ name, status: 'timeout', message: '5초 타임아웃' });
    }, 5000);

    // 환경 변수 설정
    const env = { ...process.env, ...config.env };
    
    // 프로세스 실행
    const child = spawn(config.command, config.args, {
      cwd: projectRoot,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ name, status: 'error', message: err.message });
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);
      
      // Filesystem 서버는 인자 없이 실행하면 사용법을 출력하고 종료
      if (name === 'filesystem' && stderr.includes('Usage:')) {
        resolve({ 
          name, 
          status: 'success', 
          message: '서버가 올바르게 설치되어 있습니다',
          note: 'Filesystem 서버는 디렉터리 인자가 필요합니다'
        });
      }
      // 다른 MCP 서버들은 stdio로 실행되므로 대기 상태
      else if (stdout.includes('running on stdio') || stdout.includes('MCP')) {
        child.kill();
        resolve({ name, status: 'success', message: '서버가 정상적으로 시작되었습니다' });
      }
      // 에러 코드로 종료
      else if (code !== 0) {
        resolve({ name, status: 'error', message: `종료 코드: ${code}\n${stderr}` });
      }
      // 정상 종료
      else {
        resolve({ name, status: 'success', message: '서버가 정상적으로 실행됩니다' });
      }
    });

    // 일부 서버는 즉시 stdio 모드로 실행되므로 잠시 후 확인
    setTimeout(() => {
      if (stdout.includes('running on stdio') || stdout.includes('MCP')) {
        clearTimeout(timeout);
        child.kill();
        resolve({ name, status: 'success', message: '서버가 정상적으로 시작되었습니다' });
      }
    }, 1000);
  });
}

// 특정 검증
function validateFilesystemConfig(config) {
  const issues = [];
  
  // args에 디렉터리가 포함되어 있는지 확인
  if (config.args.length < 2) {
    issues.push('Filesystem 서버는 args에 허용된 디렉터리를 포함해야 합니다');
  }
  
  // 환경 변수로만 설정했는지 확인
  if (config.env && config.env.ALLOWED_DIRECTORIES) {
    issues.push('ALLOWED_DIRECTORIES는 환경 변수가 아닌 args로 전달해야 합니다');
  }
  
  return issues;
}

// 메인 함수
async function main() {
  console.log('\n🔍 MCP 서버 검증 시작\n');
  
  // MCP 설정 로드
  const mcpServers = loadMcpConfig();
  const serverNames = Object.keys(mcpServers);
  
  if (serverNames.length === 0) {
    console.error(`${error} 설정된 MCP 서버가 없습니다`);
    process.exit(1);
  }
  
  console.log(`${info} ${serverNames.length}개의 MCP 서버를 발견했습니다`);
  
  // 각 서버 검증
  const results = [];
  
  for (const serverName of serverNames) {
    const serverConfig = mcpServers[serverName];
    
    // 특별 검증
    if (serverName === 'filesystem') {
      const issues = validateFilesystemConfig(serverConfig);
      if (issues.length > 0) {
        results.push({
          name: serverName,
          status: 'error',
          message: '설정 오류:\n' + issues.map(i => `  - ${i}`).join('\n')
        });
        continue;
      }
    }
    
    // 서버 테스트
    const result = await testMcpServer(serverName, serverConfig);
    results.push(result);
  }
  
  // 결과 출력
  console.log('\n📊 검증 결과\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    const statusIcon = result.status === 'success' ? success : 
                      result.status === 'timeout' ? warning : error;
    
    console.log(`${statusIcon} ${result.name}: ${result.message}`);
    if (result.note) {
      console.log(`  ${info} ${result.note}`);
    }
    
    if (result.status === 'success') successCount++;
    else errorCount++;
  });
  
  console.log(`\n📈 요약: ${successCount}개 성공, ${errorCount}개 실패`);
  
  // 권장사항
  if (errorCount > 0) {
    console.log('\n💡 권장사항:\n');
    console.log('1. 패키지가 설치되어 있는지 확인: npm ci');
    console.log('2. Node.js 버전 확인: node --version (v22+ 권장)');
    console.log('3. .mcp.json 파일 설정 확인');
    console.log('4. 환경 변수 설정 확인 (GitHub 토큰, API 키 등)');
  }
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// 실행
main().catch(console.error);