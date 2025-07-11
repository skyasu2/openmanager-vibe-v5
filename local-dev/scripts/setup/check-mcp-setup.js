#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 MCP 설정 확인\n');

// 설정 파일들 확인
const configs = [
  { file: '.cursor/mcp.json', desc: 'Cursor MCP 설정' },
  { file: 'mcp.dev.json', desc: '개발환경 MCP 설정' },
  { file: 'mcp-cursor.json', desc: 'Cursor 통합 설정' }
];

configs.forEach(({ file, desc }) => {
  try {
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const servers = Object.keys(config.mcpServers || {});
    console.log(`✅ ${desc} (${file})`);
    console.log(`   서버 개수: ${servers.length}`);
    console.log(`   서버 목록: ${servers.join(', ')}\n`);
  } catch (error) {
    console.log(`❌ ${desc} (${file}) - ${error.message}\n`);
  }
});

// 로컬 MCP 서버 확인
console.log('🌐 로컬 MCP 서버 상태:');
console.log('   HTTP 엔드포인트: http://localhost:3100/health');
console.log('   상태 확인: http://localhost:3100/status');

console.log('\n🎯 Cursor AI MCP 연결 방법:');
console.log('1. Cursor를 완전히 종료');
console.log('2. Cursor 재시작');
console.log('3. Ctrl+Shift+P → "MCP: Restart MCP Servers"');
console.log('4. 상태바에서 MCP 연결 상태 확인');
console.log('5. 채팅에서 @openmanager-local 사용');

console.log('\n💡 설정 완료!'); 