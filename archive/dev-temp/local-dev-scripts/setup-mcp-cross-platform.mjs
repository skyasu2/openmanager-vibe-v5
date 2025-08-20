#!/usr/bin/env node

/**
 * 🛠️ MCP 크로스 플랫폼 설정 스크립트
 * PowerShell 스크립트를 대체하는 Node.js 기반 크로스 플랫폼 스크립트
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 컬러 출력 유틸리티
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description, options = {}) {
  try {
    colorLog('blue', `🔄 ${description}...`);
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: path.join(__dirname, '../..'),
      ...options,
    });
    colorLog('green', `✅ ${description} 완료`);
    return { success: true, output: result?.toString() };
  } catch (error) {
    colorLog('red', `❌ ${description} 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function getPlatform() {
  const args = process.argv.slice(2);
  const platformIndex = args.indexOf('--platform');
  if (platformIndex !== -1 && args[platformIndex + 1]) {
    return args[platformIndex + 1];
  }
  return process.platform;
}

function setupMCPServers() {
  colorLog('cyan', '📦 MCP 서버 패키지 설치...');

  const packages = [
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-memory',
    '@modelcontextprotocol/server-duckduckgo-search',
    '@modelcontextprotocol/server-sequential-thinking',
  ];

  for (const pkg of packages) {
    const result = executeCommand(`npm install -g ${pkg}`, `${pkg} 설치`);
    if (!result.success) {
      colorLog('yellow', `⚠️ ${pkg} 글로벌 설치 실패, 로컬 설치 시도...`);
      executeCommand(`npm install ${pkg}`, `${pkg} 로컬 설치`);
    }
  }
}

function createMCPConfig() {
  colorLog('cyan', '⚙️ MCP 설정 파일 생성...');

  const configPath = path.join(__dirname, '../../cursor.mcp.json');
  const config = {
    mcpServers: {
      filesystem: {
        command: 'npx',
        args: [
          '-y',
          '@modelcontextprotocol/server-filesystem',
          '/d:/cursor/openmanager-vibe-v5',
        ],
      },
      memory: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
      },
      'duckduckgo-search': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-duckduckgo-search'],
      },
      'sequential-thinking': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      },
      // "openmanager-local": { // gemini-cli-bridge MCP 지원 중단
      //     "command": "node",
      //     "args": ["./mcp-servers/gemini-cli-bridge/src/index.js"],
      //     "cwd": "/d:/cursor/openmanager-vibe-v5"
      // }
    },
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    colorLog('green', '✅ MCP 설정 파일 생성 완료');
    return true;
  } catch (error) {
    colorLog('red', `❌ MCP 설정 파일 생성 실패: ${error.message}`);
    return false;
  }
}

function validateMCPSetup() {
  colorLog('cyan', '🔍 MCP 설정 검증...');

  const configPath = path.join(__dirname, '../../cursor.mcp.json');
  if (!fs.existsSync(configPath)) {
    colorLog('red', '❌ MCP 설정 파일이 없습니다');
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    colorLog('green', '✅ MCP 설정 파일 유효');
    colorLog(
      'blue',
      `📊 설정된 서버 수: ${Object.keys(config.mcpServers || {}).length}`
    );
    return true;
  } catch (error) {
    colorLog('red', `❌ MCP 설정 파일 파싱 실패: ${error.message}`);
    return false;
  }
}

async function main() {
  const platform = getPlatform();
  colorLog('cyan', `🚀 MCP 크로스 플랫폼 설정 시작 (플랫폼: ${platform})...\n`);

  // 1. MCP 서버 패키지 설치
  setupMCPServers();

  // 2. MCP 설정 파일 생성
  if (!createMCPConfig()) {
    process.exit(1);
  }

  // 3. 설정 검증
  if (!validateMCPSetup()) {
    process.exit(1);
  }

  // 4. 로컬 MCP 서버 시작
  const serverResult = executeCommand(
    'npm run mcp:local:start',
    '로컬 MCP 서버 시작',
    { silent: true }
  );
  if (serverResult.success) {
    colorLog('green', '✅ 로컬 MCP 서버 시작 완료');
  } else {
    colorLog(
      'yellow',
      '⚠️ 로컬 MCP 서버 시작 실패 (백그라운드에서 실행 중일 수 있음)'
    );
  }

  colorLog('green', '\n🎉 MCP 설정 완료!');
  colorLog('blue', '📝 다음 단계:');
  colorLog('blue', '  1. Cursor IDE 재시작');
  colorLog('blue', '  2. Cmd/Ctrl+Shift+P → "MCP" 검색하여 서버 상태 확인');
  colorLog('blue', '  3. npm run mcp:cursor:status로 상태 점검');
}

main().catch(error => {
  colorLog('red', `❌ MCP 설정 실패: ${error.message}`);
  process.exit(1);
});
