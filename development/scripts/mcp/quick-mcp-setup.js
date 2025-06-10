#!/usr/bin/env node
/**
 * MCP 완벽 설정 자동화 스크립트 (크로스 플랫폼)
 * 검증된 성공 사례 기반 (2025-06-09)
 * Node.js로 작성되어 Windows, Linux, macOS에서 모두 동작
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs').promises;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

// 색상 출력을 위한 ANSI 코드
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvironment() {
  colorLog('yellow', '\n🔍 환경 확인 중...');

  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    colorLog('green', `✅ Node.js: ${nodeVersion}`);
  } catch (error) {
    colorLog(
      'red',
      '❌ Node.js가 설치되지 않았습니다. Node.js 18+ 설치가 필요합니다.'
    );
    process.exit(1);
  }

  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    colorLog('green', `✅ npm: ${npmVersion}`);
  } catch (error) {
    colorLog('red', '❌ npm이 설치되지 않았습니다.');
    process.exit(1);
  }
}

async function createDirectories() {
  colorLog('yellow', '\n📁 디렉토리 구조 생성 중...');

  try {
    await fs.mkdir('.cursor', { recursive: true });
    colorLog('green', '✅ .cursor/ 디렉토리 생성 완료');

    await fs.mkdir('mcp-memory', { recursive: true });
    colorLog('green', '✅ mcp-memory/ 디렉토리 생성 완료');
  } catch (error) {
    colorLog('red', `❌ 디렉토리 생성 실패: ${error.message}`);
    process.exit(1);
  }
}

async function createMcpConfig() {
  colorLog('yellow', '\n⚙️ MCP 설정 파일 생성 중...');

  const mcpConfig = {
    mcpServers: {
      filesystem: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
        env: {
          NODE_OPTIONS: '--max-old-space-size=512',
        },
        description: '프로젝트 파일 시스템 접근',
        enabled: true,
      },
      memory: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        env: {
          MEMORY_STORE_PATH: './mcp-memory',
        },
        description: '지식 그래프 기반 메모리 시스템',
        enabled: true,
      },
      'duckduckgo-search': {
        command: 'npx',
        args: ['-y', 'duckduckgo-mcp-server'],
        env: {
          NODE_OPTIONS: '--max-old-space-size=256',
        },
        description: 'DuckDuckGo 웹 검색 (프라이버시 중심)',
        enabled: true,
      },
      'sequential-thinking': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        env: {
          THINKING_MODE: 'development',
          MAX_DEPTH: '10',
        },
        description: '고급 순차적 사고 처리',
        enabled: true,
      },
    },
  };

  try {
    const configJson = JSON.stringify(mcpConfig, null, 2);

    // .cursor/mcp.json 생성
    await fs.writeFile(path.join('.cursor', 'mcp.json'), configJson, 'utf8');
    colorLog('green', '✅ .cursor/mcp.json 생성 완료');

    // cursor.mcp.json 생성 (프로젝트 루트)
    await fs.writeFile('cursor.mcp.json', configJson, 'utf8');
    colorLog('green', '✅ cursor.mcp.json 생성 완료');
  } catch (error) {
    colorLog('red', `❌ MCP 설정 파일 생성 실패: ${error.message}`);
    process.exit(1);
  }
}

async function createCursorSettings() {
  colorLog('yellow', '\n⚙️ Cursor IDE 설정 파일 생성 중...');

  const cursorSettings = {
    'mcp.enabled': true,
    'mcp.servers': {},
    'workbench.sideBar.location': 'left',
    'editor.minimap.enabled': true,
    'editor.lineNumbers': 'on',
    'files.autoSave': 'afterDelay',
    'files.autoSaveDelay': 1000,
    'editor.formatOnSave': true,
    'editor.codeActionsOnSave': {
      'source.fixAll': 'explicit',
    },
  };

  try {
    const settingsJson = JSON.stringify(cursorSettings, null, 2);
    await fs.writeFile(
      path.join('.cursor', 'settings.json'),
      settingsJson,
      'utf8'
    );
    colorLog('green', '✅ .cursor/settings.json 생성 완료');
  } catch (error) {
    colorLog('red', `❌ Cursor 설정 파일 생성 실패: ${error.message}`);
    process.exit(1);
  }
}

async function cachePackages() {
  colorLog('yellow', '\n📦 MCP 서버 패키지 사전 캐시 중...');
  colorLog('cyan', '   이 과정은 첫 실행 시간을 단축시킵니다...');

  const packages = [
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-memory',
    'duckduckgo-mcp-server',
    '@modelcontextprotocol/server-sequential-thinking',
  ];

  for (const pkg of packages) {
    try {
      execSync(`npx -y ${pkg} --version`, { stdio: 'pipe' });
      colorLog('green', `✅ ${pkg.split('/').pop() || pkg} 서버 캐시 완료`);
    } catch (error) {
      colorLog(
        'yellow',
        `⚠️ ${pkg.split('/').pop() || pkg} 서버 캐시 실패 (첫 실행 시 다운로드됩니다)`
      );
    }
  }
}

function showCompletionMessage() {
  colorLog('green', '\n🎉 MCP 설정이 완료되었습니다!');
  console.log('');
  colorLog('cyan', '📂 생성된 파일들:');
  colorLog('white', '  ├── .cursor/mcp.json');
  colorLog('white', '  ├── .cursor/settings.json');
  colorLog('white', '  ├── cursor.mcp.json');
  colorLog('white', '  └── mcp-memory/');
  console.log('');
  colorLog('cyan', '🚀 다음 단계:');
  colorLog('yellow', '  1. Cursor IDE를 완전히 종료하세요');
  colorLog('yellow', '  2. Cursor IDE를 다시 시작하세요');
  colorLog('yellow', "  3. Cmd+Shift+P → 'MCP' 검색으로 패널 확인");
  colorLog('yellow', '  4. 모든 서버가 Active 상태인지 확인하세요');
  console.log('');
  colorLog('green', '✨ 성공하면 4개 MCP 서버가 모두 활성화됩니다!');
  colorLog('white', '   - filesystem (파일 접근)');
  colorLog('white', '   - memory (정보 저장)');
  colorLog('white', '   - duckduckgo-search (웹 검색)');
  colorLog('white', '   - sequential-thinking (고급 사고)');
  console.log('');
  colorLog(
    'cyan',
    '❓ 문제가 있다면 docs/MCP_완벽_설정_가이드.md를 확인하세요.'
  );
}

async function main() {
  try {
    colorLog('green', '🚀 MCP 완벽 설정을 시작합니다...');
    colorLog('yellow', '📌 검증된 성공 사례 기반으로 설정합니다.');

    await checkEnvironment();
    await createDirectories();
    await createMcpConfig();
    await createCursorSettings();
    await cachePackages();

    showCompletionMessage();
  } catch (error) {
    colorLog('red', `❌ 설정 중 오류가 발생했습니다: ${error.message}`);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkEnvironment,
  createDirectories,
  createMcpConfig,
  createCursorSettings,
  cachePackages,
};
