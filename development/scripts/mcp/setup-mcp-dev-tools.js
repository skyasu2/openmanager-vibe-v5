#!/usr/bin/env node

/**
 * MCP 개발 도구 설정 스크립트
 * 
 * 이 스크립트는 Cursor AI를 위한 MCP 개발 도구들을 설정합니다.
 * - Magic MCP (UI 컴포넌트 생성)
 * - Browser Tools MCP (브라우저 디버깅)
 * - TypeScript 분석 도구
 * - Vercel 배포 도구
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const MCP_TOOLS = [
  {
    name: '@21st-dev/magic',
    description: 'AI 기반 UI 컴포넌트 생성',
    setup: async () => {
      console.log('💫 Magic MCP 설정 중...');
      console.log('📝 21st.dev에서 API 키를 발급받으세요: https://21st.dev/api-access');
      console.log('🔧 발급받은 키를 mcp-cursor.json의 API_KEY에 설정하세요');
    }
  },
  {
    name: '@agentdeskai/browser-tools-mcp',
    description: '브라우저 디버깅 및 모니터링',
    setup: async () => {
      console.log('🌐 Browser Tools MCP 설정 중...');
      console.log('🔗 Chrome 확장 프로그램을 설치하세요: https://github.com/AgentDeskAI/browser-tools-mcp');
      console.log('⚙️  브라우저 디버깅을 위해 개발자 도구에서 BrowserToolsMCP 패널을 확인하세요');
    }
  },
  {
    name: 'cursor-mcp-installer',
    description: 'MCP 서버 관리 도구',
    setup: async () => {
      console.log('🔧 Cursor MCP Installer 설정 완료');
      console.log('📦 이제 Cursor에서 다른 MCP 서버들을 쉽게 설치할 수 있습니다');
    }
  }
];

async function checkMcpConfig() {
  const mcpConfigPath = path.join(process.cwd(), 'mcp-cursor.json');
  
  if (!fs.existsSync(mcpConfigPath)) {
    console.error('❌ mcp-cursor.json 파일을 찾을 수 없습니다.');
    console.log('📁 현재 경로에 mcp-cursor.json 파일이 있는지 확인하세요.');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    console.log('✅ MCP 설정 파일 확인 완료');
    console.log(`📊 설정된 MCP 서버 개수: ${Object.keys(config.mcpServers || {}).length}`);
    return true;
  } catch (error) {
    console.error('❌ MCP 설정 파일 파싱 오류:', error.message);
    return false;
  }
}

async function installGlobalPackages() {
  console.log('📦 필요한 글로벌 패키지 설치 중...');
  
  const packages = [
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-duckduckgo-search',
    '@modelcontextprotocol/server-sequential-thinking'
  ];
  
  for (const pkg of packages) {
    try {
      console.log(`⏳ ${pkg} 설치 중...`);
      await execAsync(`npm install -g ${pkg}`);
      console.log(`✅ ${pkg} 설치 완료`);
    } catch (error) {
      console.warn(`⚠️  ${pkg} 설치 실패 (이미 설치되어 있을 수 있습니다)`);
    }
  }
}

async function setupDevEnvironment() {
  console.log('🔧 개발 환경 설정 중...');
  
  // .cursor 디렉토리 확인/생성
  const cursorDir = path.join(require('os').homedir(), '.cursor');
  if (!fs.existsSync(cursorDir)) {
    fs.mkdirSync(cursorDir, { recursive: true });
    console.log('📁 .cursor 디렉토리 생성 완료');
  }
  
  // 현재 프로젝트의 mcp-cursor.json을 ~/.cursor/mcp.json으로 복사
  const sourcePath = path.join(process.cwd(), 'mcp-cursor.json');
  const targetPath = path.join(cursorDir, 'mcp.json');
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log('✅ MCP 설정을 Cursor에 적용했습니다');
    console.log(`📁 설정 파일 위치: ${targetPath}`);
  }
}

async function displayUsageInstructions() {
  console.log('\n🎉 MCP 개발 도구 설정이 완료되었습니다!\n');
  
  console.log('📋 사용 방법:');
  console.log('1. Cursor를 재시작하세요');
  console.log('2. Agent 모드에서 다음 명령어들을 사용해보세요:');
  console.log('   • "/ui 모던한 버튼 컴포넌트 만들어줘" (Magic MCP)');
  console.log('   • "현재 페이지의 콘솔 로그를 확인해줘" (Browser Tools)');
  console.log('   • "TypeScript 파일들을 분석해줘" (파일시스템 MCP)');
  console.log('   • "프로젝트 구조를 분석해줘" (파일시스템 MCP)');
  
  console.log('\n🔧 추가 설정이 필요한 도구들:');
  for (const tool of MCP_TOOLS) {
    console.log(`\n📦 ${tool.name}:`);
    console.log(`   ${tool.description}`);
    await tool.setup();
  }
  
  console.log('\n🚀 개발을 시작하세요!');
  console.log('💡 문제가 발생하면 Cursor를 재시작하고 다시 시도해보세요.');
}

async function main() {
  console.log('🚀 OpenManager Vibe v5 MCP 개발 도구 설정 시작\n');
  
  // 설정 파일 확인
  const configValid = await checkMcpConfig();
  if (!configValid) {
    process.exit(1);
  }
  
  // 글로벌 패키지 설치
  await installGlobalPackages();
  
  // 개발 환경 설정
  await setupDevEnvironment();
  
  // 사용법 안내
  await displayUsageInstructions();
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 설정 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = { main }; 