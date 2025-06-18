#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import os from 'os';

const CONFIG_FILE = './cursor.mcp.json';
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.cursor', 'mcp.json');

console.log('🔧 MCP Cursor 연결 도구');
console.log('=' + '='.repeat(40));

// 1. 로컬 설정 확인
function checkLocalConfig() {
  console.log('\n📋 1. 로컬 MCP 설정 확인...');

  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ cursor.mcp.json 파일이 없습니다!');
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const serverCount = Object.keys(config.mcpServers || {}).length;
    console.log(`✅ ${serverCount}개의 MCP 서버 설정 발견`);

    // 각 서버 상태 표시
    Object.entries(config.mcpServers || {}).forEach(([name, server]) => {
      const status = server.enabled ? '🟢 활성화' : '🔴 비활성화';
      console.log(`   ${status} ${name}: ${server.description || 'N/A'}`);
    });

    return true;
  } catch (error) {
    console.error('❌ 설정 파일 파싱 오류:', error.message);
    return false;
  }
}

// 2. 글로벌 설정 확인/수정
function checkGlobalConfig() {
  console.log('\n🌍 2. 글로벌 MCP 설정 확인...');

  const globalDir = path.dirname(GLOBAL_CONFIG_PATH);
  if (!fs.existsSync(globalDir)) {
    console.log('📁 .cursor 디렉토리 생성 중...');
    fs.mkdirSync(globalDir, { recursive: true });
  }

  if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
    console.log('📝 글로벌 설정 파일 생성 중...');
    fs.writeFileSync(
      GLOBAL_CONFIG_PATH,
      JSON.stringify({ mcpServers: {} }, null, 2)
    );
  } else {
    try {
      const globalConfig = JSON.parse(
        fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf8')
      );
      if (!globalConfig.mcpServers) {
        console.log('🔧 글로벌 설정 수정 중...');
        globalConfig.mcpServers = {};
        fs.writeFileSync(
          GLOBAL_CONFIG_PATH,
          JSON.stringify(globalConfig, null, 2)
        );
      }
    } catch (error) {
      console.log('🔧 손상된 글로벌 설정 수정 중...');
      fs.writeFileSync(
        GLOBAL_CONFIG_PATH,
        JSON.stringify({ mcpServers: {} }, null, 2)
      );
    }
  }

  console.log('✅ 글로벌 설정 정상');
}

// 3. 로컬 MCP 서버 시작
async function startLocalServer() {
  console.log('\n🚀 3. 로컬 MCP 서버 시작...');

  if (!fs.existsSync('./mcp-server/server.js')) {
    console.log('⚠️  로컬 MCP 서버 파일이 없습니다. 건너뜁니다.');
    return null;
  }

  try {
    // 먼저 기존 프로세스 확인
    try {
      const response = execSync('curl -s http://localhost:3100/health', {
        timeout: 2000,
      });
      console.log('✅ 로컬 MCP 서버가 이미 실행 중입니다.');
      return null;
    } catch {
      // 서버가 실행되지 않음, 시작
    }

    console.log('📦 로컬 MCP 서버 시작 중...');
    const serverProcess = spawn('node', ['./mcp-server/server.js'], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    // 로그 처리
    serverProcess.stdout.on('data', data => {
      console.log(`[MCP] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', data => {
      console.error(`[MCP Error] ${data.toString().trim()}`);
    });

    // 프로세스 분리
    serverProcess.unref();

    // 잠시 대기 후 상태 확인
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const response = execSync('curl -s http://localhost:3100/health', {
        timeout: 5000,
      });
      console.log('✅ 로컬 MCP 서버가 성공적으로 시작되었습니다.');
      console.log('🌐 Health check: http://localhost:3100/health');
    } catch {
      console.log('⚠️  서버 시작 확인이 어렵습니다. 수동으로 확인해주세요.');
    }

    return serverProcess;
  } catch (error) {
    console.error('❌ 로컬 서버 시작 실패:', error.message);
    return null;
  }
}

// 4. NPM 패키지 확인
function checkNpmPackages() {
  console.log('\n📦 4. 필요한 NPM 패키지 확인...');

  const packages = [
    '@modelcontextprotocol/server-filesystem',
    'duckduckgo-mcp-server',
    '@modelcontextprotocol/server-sequential-thinking',
    '@heilgar/shadcn-ui-mcp-server',
  ];

  packages.forEach(pkg => {
    try {
      execSync(`npm list ${pkg}`, { stdio: 'ignore' });
      console.log(`✅ ${pkg} 설치됨`);
    } catch {
      console.log(`⚠️  ${pkg} 누락됨 - 필요시 자동 설치됩니다.`);
    }
  });
}

// 5. Cursor 연결 가이드
function showConnectionGuide() {
  console.log('\n🎯 5. Cursor 연결 가이드');
  console.log('=' + '='.repeat(30));

  console.log('\n다음 단계를 따라 Cursor에서 MCP를 활성화하세요:');
  console.log('\n1️⃣  Cursor 재시작');
  console.log('   - Cursor를 완전히 종료하고 다시 시작하세요');

  console.log('\n2️⃣  MCP 상태 확인');
  console.log('   - Cursor 하단 상태바에서 MCP 아이콘 확인');
  console.log('   - 아이콘 클릭하여 연결된 서버 목록 확인');

  console.log('\n3️⃣  MCP 기능 테스트');
  console.log('   - 채팅에서 다음 명령어 시도:');
  console.log('     • @filesystem 프로젝트 파일 구조 분석해줘');
  console.log('     • @duckduckgo-search Next.js 최신 업데이트 검색해줘');
  console.log('     • @sequential-thinking 복잡한 문제 단계별 분석');
  console.log('     • @shadcn-ui Button 컴포넌트 문서 보여줘');

  console.log('\n4️⃣  로컬 서버 확인');
  console.log('   - http://localhost:3100/health 접속하여 상태 확인');

  console.log('\n5️⃣  문제 해결');
  console.log('   - 연결 안 될 경우: npm run cursor:fix 실행');
  console.log('   - 로그 확인: npm run mcp:logs');
}

// 6. 빠른 테스트
async function quickTest() {
  console.log('\n🧪 6. 빠른 연결 테스트...');

  // 로컬 서버 테스트
  try {
    const response = execSync('curl -s http://localhost:3100/health', {
      timeout: 3000,
    });
    const health = JSON.parse(response.toString());
    console.log(`✅ 로컬 MCP 서버: ${health.status} (포트: ${health.port})`);
  } catch {
    console.log('⚠️  로컬 MCP 서버 연결 실패');
  }

  // 설정 파일 검증
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const enabledCount = Object.values(config.mcpServers || {}).filter(
      server => server.enabled
    ).length;
    console.log(`✅ 활성화된 MCP 서버: ${enabledCount}개`);
  } catch {
    console.log('❌ 설정 파일 읽기 실패');
  }
}

// 메인 실행
async function main() {
  try {
    const configOk = checkLocalConfig();
    if (!configOk) {
      console.log('\n❌ 설정 확인 실패. 먼저 설정을 수정하세요.');
      return;
    }

    checkGlobalConfig();
    await startLocalServer();
    checkNpmPackages();
    await quickTest();
    showConnectionGuide();

    console.log('\n🎉 MCP 연결 준비 완료!');
    console.log('Cursor를 재시작하여 MCP 기능을 사용하세요.');
  } catch (error) {
    console.error('\n❌ 연결 과정 중 오류:', error.message);
    console.log('\n🔧 문제 해결:');
    console.log('1. npm run cursor:fix 실행');
    console.log('2. Cursor 재시작');
    console.log('3. 다시 시도');
  }
}

main();
