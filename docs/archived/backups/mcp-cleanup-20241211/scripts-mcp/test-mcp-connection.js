#!/usr/bin/env node

/**
 * MCP 연결 테스트 스크립트
 * Cursor AI MCP 개발도구 연결 상태를 확인합니다
 */

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🔧 MCP 연결 테스트 시작\n');

// 1. 로컬 MCP 서버 테스트
console.log('1️⃣ 로컬 MCP 서버 테스트');
exec('curl -f http://localhost:3100/health', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ 로컬 MCP 서버 연결 실패');
    console.log('💡 서버를 시작하세요: npm run server:start:mcp');
  } else {
    console.log('✅ 로컬 MCP 서버 정상 동작');
    try {
      const healthData = JSON.parse(stdout);
      console.log(`   - 상태: ${healthData.status}`);
      console.log(`   - 포트: ${healthData.port}`);
      console.log(`   - 업타임: ${Math.round(healthData.uptime)}초`);
    } catch (e) {
      console.log('   - 응답 데이터:', stdout);
    }
  }
});

// 2. MCP 패키지들 테스트
console.log('\n2️⃣ MCP 패키지 설치 상태 테스트');

const testPackages = [
  '@modelcontextprotocol/server-filesystem',
  '@modelcontextprotocol/server-duckduckgo-search', 
  '@modelcontextprotocol/server-sequential-thinking'
];

testPackages.forEach((pkg, index) => {
  console.log(`\n${index + 1}. ${pkg} 테스트 중...`);
  
  const child = spawn('npx.cmd', ['-y', pkg, '--help'], {
    stdio: 'pipe',
    timeout: 10000
  });
  
  let hasOutput = false;
  
  child.stdout.on('data', (data) => {
    hasOutput = true;
    console.log(`   ✅ ${pkg} 설치됨`);
  });
  
  child.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('help') || output.includes('usage') || output.includes('options')) {
      hasOutput = true;
      console.log(`   ✅ ${pkg} 설치됨`);
    }
  });
  
  child.on('close', (code) => {
    if (!hasOutput) {
      if (code === 0) {
        console.log(`   ✅ ${pkg} 설치됨`);
      } else {
        console.log(`   ❌ ${pkg} 설치 실패 또는 오류 (코드: ${code})`);
      }
    }
  });
  
  child.on('error', (error) => {
    console.log(`   ❌ ${pkg} 실행 오류: ${error.message}`);
  });
});

// 3. 설정 파일 검증
console.log('\n3️⃣ MCP 설정 파일 검증');

const configFiles = [
  '.cursor/mcp.json',
  'mcp.dev.json', 
  'mcp-cursor.json'
];

configFiles.forEach(file => {
  try {
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`✅ ${file} - 유효한 JSON`);
    console.log(`   - 서버 수: ${Object.keys(config.mcpServers || {}).length}`);
    console.log(`   - 서버 목록: ${Object.keys(config.mcpServers || {}).join(', ')}`);
  } catch (error) {
    console.log(`❌ ${file} - ${error.message}`);
  }
});

// 4. Cursor MCP 연결 가이드 출력
setTimeout(() => {
  console.log('\n🎯 Cursor AI MCP 연결 가이드:');
  console.log('1. Cursor를 재시작하세요');
  console.log('2. Ctrl+Shift+P → "MCP: Restart MCP Servers" 실행');
  console.log('3. 하단 상태바에서 MCP 연결 상태 확인');
  console.log('4. 채팅에서 @openmanager-local, @filesystem 등 사용 가능');
  console.log('\n📁 설정 파일 위치:');
  console.log(`   - 로컬: ${path.resolve('.cursor/mcp.json')}`);
  console.log(`   - 개발: ${path.resolve('mcp.dev.json')}`);
  console.log(`   - 커서: ${path.resolve('mcp-cursor.json')}`);
  console.log('\n💡 문제 해결:');
  console.log('   - 로컬 서버가 안 되면: npm run server:restart:mcp');
  console.log('   - 패키지 오류면: npx -y [패키지명] 수동 실행');
  console.log('   - 설정 오류면: JSON 문법 확인');
}, 5000);

console.log('\n⏳ 테스트 진행 중... (5초 후 가이드 출력)\n'); 