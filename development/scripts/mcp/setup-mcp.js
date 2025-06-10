#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * OpenManager Vibe v5 - MCP 자동 설정 스크립트
 * 프로젝트를 어디서 클론하더라도 Cursor MCP를 자동 구성
 */

const PROJECT_NAME = 'openmanager-vibe-v5';

// 현재 프로젝트 경로 감지
const currentPath = process.cwd();
const projectPath = path.resolve(currentPath);

// Cursor 설정 디렉토리 경로 감지
function getCursorConfigPath() {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  switch (platform) {
    case 'win32':
      return path.join(homeDir, '.cursor');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'Cursor');
    case 'linux':
      return path.join(homeDir, '.config', 'cursor');
    default:
      throw new Error(`지원하지 않는 운영체제: ${platform}`);
  }
}

// MCP 설정 템플릿 읽기 및 경로 치환
function generateMcpConfig() {
  const templatePath = path.join(projectPath, 'mcp.json.template');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error('mcp.json.template 파일을 찾을 수 없습니다.');
  }
  
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Windows 경로를 forward slash로 변환
  const normalizedPath = projectPath.replace(/\\/g, '/');
  template = template.replace(/{{PROJECT_PATH}}/g, normalizedPath);
  
  return JSON.parse(template);
}

// MCP 설정 적용
function applyMcpConfig() {
  try {
    console.log('🔧 OpenManager MCP 설정을 시작합니다...\n');
    
    // 1. 프로젝트 경로 확인
    console.log(`📁 프로젝트 경로: ${projectPath}`);
    
    // 2. Cursor 설정 디렉토리 확인
    const cursorConfigDir = getCursorConfigPath();
    console.log(`🎯 Cursor 설정 경로: ${cursorConfigDir}`);
    
    if (!fs.existsSync(cursorConfigDir)) {
      fs.mkdirSync(cursorConfigDir, { recursive: true });
      console.log(`✅ Cursor 설정 디렉토리 생성됨`);
    }
    
    // 3. MCP 설정 생성
    const mcpConfig = generateMcpConfig();
    const mcpConfigPath = path.join(cursorConfigDir, 'mcp.json');
    
    // 4. 기존 설정 백업
    if (fs.existsSync(mcpConfigPath)) {
      const backupPath = path.join(cursorConfigDir, `mcp.json.backup.${Date.now()}`);
      fs.copyFileSync(mcpConfigPath, backupPath);
      console.log(`💾 기존 설정 백업: ${backupPath}`);
    }
    
    // 5. 새 설정 적용
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    console.log(`✅ MCP 설정 적용 완료: ${mcpConfigPath}\n`);
    
    // 6. 설정 내용 출력
    console.log('📋 적용된 MCP 서버:');
    Object.keys(mcpConfig.mcpServers).forEach(serverName => {
      console.log(`  - ${serverName}: ${mcpConfig.mcpServers[serverName].command} ${mcpConfig.mcpServers[serverName].args.join(' ')}`);
    });
    
    console.log('\n🎉 MCP 설정이 완료되었습니다!');
    console.log('🔄 Cursor를 재시작하여 새 설정을 적용하세요.');
    
  } catch (error) {
    console.error('❌ MCP 설정 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 필수 패키지 확인
function checkRequiredPackages() {
  const requiredPackages = [
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-github'
  ];
  
  console.log('📦 필수 MCP 패키지 확인 중...');
  
  requiredPackages.forEach(pkg => {
    try {
      require.resolve(pkg);
      console.log(`  ✅ ${pkg}`);
    } catch (e) {
      console.log(`  ⚠️  ${pkg} - npm install -g ${pkg} 실행 필요`);
    }
  });
  
  console.log('');
}

// 메인 실행
if (require.main === module) {
  console.log('🚀 OpenManager Vibe v5 - MCP 자동 설정\n');
  checkRequiredPackages();
  applyMcpConfig();
}

module.exports = { generateMcpConfig, getCursorConfigPath }; 