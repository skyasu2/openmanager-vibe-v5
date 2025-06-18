#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Everything MCP 서버만 제거하는 스크립트
 */

function removeEverythingMCP() {
  const cursorConfigDir = path.join(os.homedir(), '.cursor');
  const globalMcpPath = path.join(cursorConfigDir, 'mcp.json');

  console.log('🔍 Everything MCP 서버 제거 중...');

  try {
    // 전역 MCP 설정 확인
    if (fs.existsSync(globalMcpPath)) {
      const globalConfig = JSON.parse(fs.readFileSync(globalMcpPath, 'utf8'));

      if (globalConfig.mcpServers && globalConfig.mcpServers.everything) {
        console.log('📁 전역 설정에서 everything 서버 발견');
        delete globalConfig.mcpServers.everything;

        fs.writeFileSync(globalMcpPath, JSON.stringify(globalConfig, null, 2));
        console.log('✅ 전역 설정에서 everything 서버 제거됨');
      } else {
        console.log('ℹ️  전역 설정에 everything 서버 없음');
      }
    }

    // 프로젝트 로컬 MCP 설정 확인
    const localMcpPath = path.join(process.cwd(), 'cursor.mcp.json');
    if (fs.existsSync(localMcpPath)) {
      const localConfig = JSON.parse(fs.readFileSync(localMcpPath, 'utf8'));

      if (localConfig.mcpServers && localConfig.mcpServers.everything) {
        console.log('📁 로컬 설정에서 everything 서버 발견');
        delete localConfig.mcpServers.everything;

        fs.writeFileSync(localMcpPath, JSON.stringify(localConfig, null, 2));
        console.log('✅ 로컬 설정에서 everything 서버 제거됨');
      } else {
        console.log('ℹ️  로컬 설정에 everything 서버 없음');
      }
    }

    console.log('\n🎉 Everything MCP 서버 제거 완료!');
    console.log('💡 Cursor를 재시작하여 변경사항을 적용하세요.');
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  removeEverythingMCP();
}

module.exports = { removeEverythingMCP };
