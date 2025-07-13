#!/usr/bin/env node

/**
 * MCP 서버 테스트 도구
 * 모든 설정된 MCP 서버의 연결 상태를 확인합니다.
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// MCP 설정 로드
function loadMcpConfig() {
  try {
    const configPath = join(__dirname, '../.claude/mcp.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    return config.mcpServers || {};
  } catch (error) {
    console.error(`${colors.red}❌ MCP 설정 파일을 로드할 수 없습니다:${colors.reset}`, error.message);
    return {};
  }
}

// 개별 MCP 서버 테스트
async function testMcpServer(name, config) {
  return new Promise((resolve) => {
    console.log(`\n${colors.blue}🔍 테스트 중: ${name}${colors.reset}`);
    console.log(`   명령어: ${config.command} ${config.args.join(' ')}`);
    
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      child.kill();
      const duration = Date.now() - startTime;
      console.log(`${colors.green}✅ ${name}: 정상 시작됨 (${duration}ms)${colors.reset}`);
      resolve({ name, status: 'success', duration });
    }, 3000);

    const child = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`${colors.red}❌ ${name}: 시작 실패 - ${error.message}${colors.reset}`);
      resolve({ name, status: 'error', error: error.message });
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      if (code !== 0 && duration < 3000) {
        console.log(`${colors.red}❌ ${name}: 비정상 종료 (코드: ${code})${colors.reset}`);
        if (stderr) {
          console.log(`   에러: ${stderr.trim()}`);
        }
        resolve({ name, status: 'failed', code, stderr: stderr.trim() });
      }
    });

    // stdin 닫기 (stdio 대기 방지)
    child.stdin.end();
  });
}

// 메인 함수
async function main() {
  console.log(`${colors.blue}=== MCP 서버 연결 테스트 ===${colors.reset}`);
  console.log(`시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  
  const servers = loadMcpConfig();
  const serverNames = Object.keys(servers);
  
  if (serverNames.length === 0) {
    console.log(`${colors.yellow}⚠️  설정된 MCP 서버가 없습니다.${colors.reset}`);
    return;
  }

  console.log(`\n발견된 MCP 서버: ${serverNames.length}개`);
  console.log(serverNames.map(name => `  - ${name}`).join('\n'));

  const results = [];
  
  // 순차적으로 테스트 (동시 실행 시 리소스 충돌 방지)
  for (const [name, config] of Object.entries(servers)) {
    const result = await testMcpServer(name, config);
    results.push(result);
  }

  // 결과 요약
  console.log(`\n${colors.blue}=== 테스트 결과 요약 ===${colors.reset}`);
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status !== 'success').length;
  
  console.log(`✅ 성공: ${successful}개`);
  console.log(`❌ 실패: ${failed}개`);
  
  if (failed > 0) {
    console.log(`\n${colors.yellow}💡 실패한 서버 해결 방법:${colors.reset}`);
    console.log('1. 필요한 환경 변수가 설정되어 있는지 확인');
    console.log('2. 패키지가 올바르게 설치되어 있는지 확인');
    console.log('3. Claude Code를 재시작해보세요');
  }
}

// 실행
main().catch(error => {
  console.error(`${colors.red}치명적 오류:${colors.reset}`, error);
  process.exit(1);
});