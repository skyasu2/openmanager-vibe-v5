#!/usr/bin/env node

/**
 * 🧪 Tavily MCP 설정 검증 스크립트
 * API 키 로드, 암호화/복호화, MCP 래퍼 확인
 */

const { loadTavilyApiKey, decrypt } = require('./tavily-key-loader.cjs');
const fs = require('fs');
const path = require('path');

console.log('=== 🧪 Tavily MCP 설정 검증 시작 ===\n');

// 1. API 키 로더 테스트
console.log('1️⃣ API 키 로더 테스트');
try {
  const apiKey = loadTavilyApiKey();
  if (apiKey) {
    console.log('✅ API 키 로드 성공');
    console.log(`   - 키 길이: ${apiKey.length}자`);
    console.log(`   - 키 형식: ${apiKey.startsWith('tvly-') ? 'Tavily 표준 형식' : '비표준 형식'}`);
  } else {
    console.log('❌ API 키 로드 실패');
  }
} catch (error) {
  console.log('❌ API 키 로더 오류:', error.message);
}

// 2. 암호화된 설정 파일 확인
console.log('\n2️⃣ 암호화된 설정 파일 확인');
const configPath = path.join(__dirname, '../config/tavily-encrypted.json');
if (fs.existsSync(configPath)) {
  console.log('✅ 설정 파일 존재:', configPath);
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('   - 버전:', config.version);
    console.log('   - 서비스:', config.service);
    console.log('   - 월 한도:', config.limits.monthly);
    console.log('   - 일 한도:', config.limits.daily);
    console.log('   - 기능:', Object.keys(config.features).join(', '));
  } catch (error) {
    console.log('❌ 설정 파일 파싱 오류:', error.message);
  }
} else {
  console.log('❌ 설정 파일 없음');
}

// 3. MCP 래퍼 파일 확인
console.log('\n3️⃣ MCP 래퍼 파일 확인');
const wrapperPath = path.join(__dirname, 'tavily-mcp-wrapper-simple.cjs');
if (fs.existsSync(wrapperPath)) {
  console.log('✅ 래퍼 파일 존재:', wrapperPath);
} else {
  console.log('❌ 래퍼 파일 없음');
}

// 4. Tavily MCP 패키지 확인
console.log('\n4️⃣ Tavily MCP 패키지 확인');
const tavilyMcpPath = path.join(__dirname, '../node_modules/tavily-mcp/build/index.js');
if (fs.existsSync(tavilyMcpPath)) {
  console.log('✅ Tavily MCP 패키지 설치됨');
  const packageJsonPath = path.join(__dirname, '../node_modules/tavily-mcp/package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('   - 버전:', pkg.version);
    console.log('   - 설명:', pkg.description);
  }
} else {
  console.log('❌ Tavily MCP 패키지 없음 - npm install tavily-mcp 필요');
}

// 5. MCP 설정 확인
console.log('\n5️⃣ MCP 설정 확인');
const mcpConfigPath = path.join(__dirname, '../.claude/mcp.json');
if (fs.existsSync(mcpConfigPath)) {
  const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
  if (mcpConfig.mcpServers && mcpConfig.mcpServers.tavily) {
    console.log('✅ Tavily가 MCP 설정에 포함됨');
    const tavilyConfig = mcpConfig.mcpServers.tavily;
    console.log('   - 명령어:', tavilyConfig.command);
    console.log('   - 인자:', tavilyConfig.args.join(' '));
  } else {
    console.log('❌ Tavily가 MCP 설정에 없음');
  }
} else {
  console.log('❌ MCP 설정 파일 없음');
}

// 6. 환경 변수 확인
console.log('\n6️⃣ 환경 변수 확인');
console.log('   - TAVILY_API_KEY:', process.env.TAVILY_API_KEY ? '✅ 설정됨' : '❌ 없음');
console.log('   - TAVILY_API_KEY_ENCRYPTED:', process.env.TAVILY_API_KEY_ENCRYPTED ? '✅ 설정됨' : '❌ 없음');

// 7. 최종 상태 요약
console.log('\n=== 📊 최종 상태 요약 ===');
const checks = {
  'API 키 로드': loadTavilyApiKey() !== null,
  '설정 파일': fs.existsSync(configPath),
  'MCP 래퍼': fs.existsSync(wrapperPath),
  'Tavily 패키지': fs.existsSync(tavilyMcpPath),
  'MCP 설정': fs.existsSync(mcpConfigPath) && JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8')).mcpServers?.tavily
};

const passedChecks = Object.values(checks).filter(v => v).length;
const totalChecks = Object.keys(checks).length;

console.log(`\n전체 ${totalChecks}개 중 ${passedChecks}개 통과`);
if (passedChecks === totalChecks) {
  console.log('\n✅ Tavily MCP 설정이 완료되었습니다!');
  console.log('📌 Claude Code를 재시작하면 Tavily 검색 기능을 사용할 수 있습니다.');
} else {
  console.log('\n⚠️ 일부 설정이 누락되었습니다:');
  Object.entries(checks).forEach(([name, passed]) => {
    if (!passed) console.log(`   - ${name}`);
  });
}

console.log('\n=== 🏁 검증 완료 ===');