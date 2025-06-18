#!/usr/bin/env node

/**
 * 🔧 Cursor MCP 설정 자동 수정 스크립트
 * Cursor가 요구하는 정확한 형식으로 MCP 설정을 수정합니다.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Cursor MCP 설정 문제 해결 스크립트 v2.1');
console.log('===============================================\n');

// 설정 파일 경로들
const globalMcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');
const projectMcpPath = path.join(process.cwd(), '.cursor', 'mcp.json');
const conflictingPaths = [
  path.join(process.cwd(), 'cursor.mcp.json'),
  path.join(process.cwd(), 'mcp.json'),
  path.join(process.cwd(), 'mcp-cursor.json'),
];

function checkAndCreateDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 디렉토리 생성: ${dir}`);
  }
}

function fixGlobalConfig() {
  console.log('1️⃣ 글로벌 MCP 설정 확인 중...');

  try {
    checkAndCreateDir(globalMcpPath);

    if (!fs.existsSync(globalMcpPath)) {
      console.log('   글로벌 MCP 설정 파일이 없습니다. 생성 중...');
      fs.writeFileSync(
        globalMcpPath,
        JSON.stringify({ mcpServers: {} }, null, 2)
      );
      console.log('✅ 글로벌 MCP 설정 파일 생성 완료');
      return;
    }

    const globalConfig = fs.readFileSync(globalMcpPath, 'utf8');

    if (globalConfig.trim() === '') {
      console.log('   빈 글로벌 설정 파일 발견. 수정 중...');
      fs.writeFileSync(
        globalMcpPath,
        JSON.stringify({ mcpServers: {} }, null, 2)
      );
      console.log('✅ 글로벌 MCP 설정 파일 수정 완료');
      return;
    }

    try {
      const parsed = JSON.parse(globalConfig);
      if (!parsed.mcpServers) {
        parsed.mcpServers = {};
        fs.writeFileSync(globalMcpPath, JSON.stringify(parsed, null, 2));
        console.log('✅ 글로벌 MCP 설정 구조 수정 완료');
      } else {
        console.log('✅ 글로벌 MCP 설정 정상');
      }
    } catch (error) {
      console.log('   잘못된 JSON 형식 발견. 수정 중...');
      fs.writeFileSync(
        globalMcpPath,
        JSON.stringify({ mcpServers: {} }, null, 2)
      );
      console.log('✅ 글로벌 MCP 설정 파일 재생성 완료');
    }
  } catch (error) {
    console.error('❌ 글로벌 설정 처리 중 오류:', error.message);
  }
}

function cleanupConflictingConfigs() {
  console.log('\n2️⃣ 충돌하는 MCP 설정 파일 정리 중...');

  // backups 디렉토리 생성
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log('✅ backups 디렉토리 생성');
  }

  conflictingPaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(
        backupsDir,
        `${path.basename(filePath)}.backup`
      );
      try {
        fs.renameSync(filePath, backupPath);
        console.log(
          `✅ 백업 완료: ${path.basename(filePath)} → backups/${path.basename(backupPath)}`
        );
      } catch (error) {
        console.log(
          `⚠️  백업 실패: ${path.basename(filePath)} - ${error.message}`
        );
      }
    }
  });
}

function ensureProjectConfig() {
  console.log('\n3️⃣ 프로젝트 MCP 설정 확인 중...');

  checkAndCreateDir(projectMcpPath);

  if (!fs.existsSync(projectMcpPath)) {
    console.log('   .cursor/mcp.json 파일이 없습니다. 기본 설정 생성 중...');

    const defaultConfig = {
      mcpServers: {
        'openmanager-local': {
          command: 'node',
          args: ['./mcp-server/server.js'],
          env: {
            NODE_ENV: 'development',
            PORT: '3100',
          },
          description: 'OpenManager 로컬 MCP 서버',
          enabled: true,
        },
        filesystem: {
          command: 'npx',
          args: [
            '-y',
            '@modelcontextprotocol/server-filesystem',
            process.cwd().replace(/\\/g, '/'),
          ],
          description: '로컬 파일 시스템 접근',
          enabled: true,
        },

        'duckduckgo-search': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-duckduckgo-search'],
          description: '웹 검색 기능',
          enabled: true,
        },
        'sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
          description: '단계별 사고 지원',
          enabled: true,
        },
        'shadcn-ui': {
          command: 'npx',
          args: ['-y', '@heilgar/shadcn-ui-mcp-server'],
          description: 'Shadcn/UI 컴포넌트 문서',
          enabled: true,
        },
        'cursor-mcp-installer': {
          command: 'npx',
          args: ['-y', '@sirmichael/cursor-mcp-installer'],
          description: 'MCP 서버 설치 관리',
          enabled: true,
        },
      },
    };

    fs.writeFileSync(projectMcpPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ 기본 MCP 설정 파일 생성 완료');
    return true;
  }

  return validateProjectConfig();
}

function validateProjectConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(projectMcpPath, 'utf8'));

    if (!config.mcpServers) {
      console.log('❌ mcpServers 필드가 없습니다.');
      return false;
    }

    let hasEnabledField = true;
    Object.keys(config.mcpServers).forEach(serverName => {
      const server = config.mcpServers[serverName];
      if (!server.hasOwnProperty('enabled')) {
        console.log(`⚠️  ${serverName} 서버에 enabled 필드가 없습니다.`);
        server.enabled = true;
        hasEnabledField = false;
      }
    });

    if (!hasEnabledField) {
      fs.writeFileSync(projectMcpPath, JSON.stringify(config, null, 2));
      console.log('✅ enabled 필드 추가 완료');
    }

    console.log(
      `✅ 프로젝트 MCP 설정 검증 완료 (${Object.keys(config.mcpServers).length}개 서버)`
    );
    return true;
  } catch (error) {
    console.error('❌ 프로젝트 설정 검증 중 오류:', error.message);
    return false;
  }
}

function showServerStatus() {
  console.log('\n4️⃣ MCP 서버 현황:');
  console.log('====================');

  try {
    const config = JSON.parse(fs.readFileSync(projectMcpPath, 'utf8'));
    const servers = config.mcpServers;

    Object.keys(servers).forEach(name => {
      const server = servers[name];
      const status = server.enabled ? '🟢 활성' : '🔴 비활성';
      const description = server.description || '설명 없음';
      console.log(`${status} ${name}: ${description}`);
    });

    console.log(`\n📍 설정 파일 위치: ${projectMcpPath}`);
  } catch (error) {
    console.log('❌ 서버 현황을 불러올 수 없습니다.');
  }
}

function showNextSteps() {
  console.log('\n5️⃣ 다음 단계:');
  console.log('===============');
  console.log('1. Cursor를 완전히 재시작하세요');
  console.log('2. Cmd/Ctrl+Shift+P → "MCP" 검색하여 서버 상태 확인');
  console.log('3. 문제가 계속되면 다음 명령어를 실행하세요:');
  console.log('   npm run cursor:restart');
  console.log('\n📋 TypeScript 개발 도구:');
  console.log('   npm run mcp:typescript  # TypeScript MCP 도구 안내');
  console.log('   npm run mcp:list        # 서버 목록 확인');
}

// 메인 실행
async function main() {
  fixGlobalConfig();
  cleanupConflictingConfigs();

  if (ensureProjectConfig()) {
    showServerStatus();
  }

  showNextSteps();
  console.log('\n🎉 MCP 설정 정리 완료!');
}

main().catch(console.error);

module.exports = {
  fixGlobalConfig,
  cleanupConflictingConfigs,
  ensureProjectConfig,
  validateProjectConfig,
  showServerStatus,
  showNextSteps,
};
