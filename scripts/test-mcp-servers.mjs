#!/usr/bin/env node

/**
 * MCP 서버 테스트 도구
 * Claude Code CLI를 통해 설정된 MCP 서버의 연결 상태를 확인합니다.
 *
 * 사용법: node scripts/test-mcp-servers.mjs
 */

import { spawn, execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// MCP 서버 목록 가져오기
function getMcpServers() {
  try {
    // claude mcp list 명령 실행
    const output = execSync('claude mcp list', { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    const servers = {};

    // 출력 파싱
    lines.forEach(line => {
      const match = line.match(/^(\S+):\s+(.+)$/);
      if (match) {
        const [, name, commandLine] = match;
        // 명령어와 인수 분리
        const parts = commandLine.trim().split(' ');
        servers[name] = {
          command: parts[0],
          args: parts.slice(1),
          env: {}, // CLI 출력에서는 환경변수 정보를 얻을 수 없음
        };
      }
    });

    return servers;
  } catch (error) {
    // Claude Code CLI가 없거나 MCP 서버가 설정되지 않은 경우
    console.error(
      `${colors.red}❌ MCP 서버 목록을 가져올 수 없습니다:${colors.reset}`,
      error.message
    );
    return null;
  }
}

// 환경변수 로드 (.env.local에서)
function loadEnvironmentVariables() {
  const envPath = join(__dirname, '../.env.local');
  const env = {};

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }

  return env;
}

// 개별 MCP 서버 테스트
async function testMcpServer(name, config, envVars) {
  return new Promise(resolve => {
    console.log(`\n${colors.blue}🔍 테스트 중: ${name}${colors.reset}`);
    console.log(`   명령어: ${config.command} ${config.args.join(' ')}`);

    // 필요한 환경변수 설정
    const serverEnv = { ...process.env };

    // 각 서버별로 필요한 환경변수 추가
    if (name === 'github' && envVars.GITHUB_TOKEN) {
      serverEnv.GITHUB_TOKEN = envVars.GITHUB_TOKEN;
    } else if (name === 'supabase') {
      if (envVars.SUPABASE_URL) serverEnv.SUPABASE_URL = envVars.SUPABASE_URL;
      if (envVars.SUPABASE_SERVICE_ROLE_KEY)
        serverEnv.SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
    } else if (name === 'tavily-mcp' && envVars.TAVILY_API_KEY) {
      serverEnv.TAVILY_API_KEY = envVars.TAVILY_API_KEY;
    }

    const startTime = Date.now();
    const timeout = setTimeout(() => {
      child.kill();
      const duration = Date.now() - startTime;
      console.log(
        `${colors.green}✅ ${name}: 정상 시작됨 (${duration}ms)${colors.reset}`
      );
      resolve({ name, status: 'success', duration });
    }, 3000);

    const child = spawn(config.command, config.args, {
      env: serverEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr.on('data', data => {
      stderr += data.toString();
    });

    child.on('error', error => {
      clearTimeout(timeout);
      console.log(
        `${colors.red}❌ ${name}: 시작 실패 - ${error.message}${colors.reset}`
      );
      resolve({ name, status: 'error', error: error.message });
    });

    child.on('exit', code => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;

      if (code !== 0 && duration < 3000) {
        console.log(
          `${colors.red}❌ ${name}: 비정상 종료 (코드: ${code})${colors.reset}`
        );
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
  console.log(`${colors.cyan}=== MCP 서버 연결 테스트 ===${colors.reset}`);
  console.log(
    `시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
  );
  console.log(`플랫폼: ${os.platform()} (${os.type()})`);

  // MCP 서버 목록 가져오기
  const servers = getMcpServers();

  if (!servers) {
    console.log(`\n${colors.yellow}💡 도움말:${colors.reset}`);
    console.log('1. Claude Code CLI가 설치되어 있는지 확인하세요');
    console.log('2. MCP 서버 설정 방법은 docs/MCP-GUIDE.md를 참조하세요');
    console.log('3. 설정 예시:');
    console.log(
      `   ${colors.cyan}claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .${colors.reset}`
    );
    return;
  }

  const serverNames = Object.keys(servers);

  if (serverNames.length === 0) {
    console.log(
      `${colors.yellow}⚠️  설정된 MCP 서버가 없습니다.${colors.reset}`
    );
    console.log(`\n${colors.yellow}💡 MCP 서버 추가 방법:${colors.reset}`);
    console.log('docs/MCP-GUIDE.md를 참조하여 MCP 서버를 설정하세요.');
    return;
  }

  console.log(`\n발견된 MCP 서버: ${serverNames.length}개`);
  console.log(serverNames.map(name => `  - ${name}`).join('\n'));

  // 환경변수 로드
  const envVars = loadEnvironmentVariables();
  console.log(`\n환경변수 로드: .env.local`);

  const results = [];

  // 순차적으로 테스트 (동시 실행 시 리소스 충돌 방지)
  for (const [name, config] of Object.entries(servers)) {
    const result = await testMcpServer(name, config, envVars);
    results.push(result);
  }

  // 결과 요약
  console.log(`\n${colors.cyan}=== 테스트 결과 요약 ===${colors.reset}`);

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status !== 'success').length;

  console.log(`✅ 성공: ${successful}개`);
  console.log(`❌ 실패: ${failed}개`);

  if (failed > 0) {
    console.log(`\n${colors.yellow}💡 실패한 서버 해결 방법:${colors.reset}`);
    console.log('1. 필요한 환경 변수가 .env.local에 설정되어 있는지 확인');
    console.log('2. Claude Code를 완전히 종료 후 재시작');
    console.log('3. 다음 명령으로 서버 재설정:');
    console.log(`   ${colors.cyan}claude mcp remove <서버명>${colors.reset}`);
    console.log(`   ${colors.cyan}claude mcp add <서버명> ...${colors.reset}`);
  } else {
    console.log(
      `\n${colors.green}🎉 모든 MCP 서버가 정상적으로 작동합니다!${colors.reset}`
    );
  }
}

// 실행
main().catch(error => {
  console.error(`${colors.red}치명적 오류:${colors.reset}`, error);
  process.exit(1);
});
